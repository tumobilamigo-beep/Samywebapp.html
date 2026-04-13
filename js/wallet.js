// js/wallet.js

import { _supabase } from './api.js';
import { telegramUtils } from './utils.js';

export const walletModule = {

    // ─── DB ───────────────────────────────────────────────────────

    // Saldo del cliente desde profiles
    async getSaldoCliente(chatId) {
        const { data, error } = await _supabase
            .from('profiles')
            .select('balance_prepago')
            .eq('id', Number(chatId))
            .maybeSingle();

        if (error) throw error;
        return data?.balance_prepago || 0;
    },

    // Saldo del conductor desde la vista
    async getSaldoConductor(chatId) {
        const { data, error } = await _supabase
            .from('vw_user_balances')
            .select('saldo_bolsa_actual, bolsa_personal_cashback')
            .eq('id', Number(chatId))
            .maybeSingle();

        if (error) throw error;
        return {
            bolsa:    data?.saldo_bolsa_actual       || 0,
            cashback: data?.bolsa_personal_cashback  || 0
        };
    },

    // Historial de depósitos del conductor
    async getDepositosConductor(chatId, limite = 10) {
        const { data, error } = await _supabase
            .from('wallet_deposits')
            .select('monto, fecha_deposito')
            .eq('driver_id', Number(chatId))
            .order('fecha_deposito', { ascending: false })
            .limit(limite);

        if (error) throw error;
        return data || [];
    },

    // Historial de servicios (movimientos)
    async getHistorialServicios(chatId, role, limite = 10) {
        const campo = role === 'conductor' ? 'driver_id' : 'client_id';

        const { data, error } = await _supabase
            .from('services')
            .select('valor_movimiento, ajuste_personal, ajuste_empresa, created_at, status_servicio')
            .eq(campo, Number(chatId))
            .order('created_at', { ascending: false })
            .limit(limite);

        if (error) throw error;
        return data || [];
    },

    // ─── UI ───────────────────────────────────────────────────────

    async iniciarWallet(chatId, role) {
        try {
            telegramUtils.setLoading(true);

            if (role === 'conductor' || role === 'ambos') {
                await this._renderWalletConductor(chatId);
            } else {
                await this._renderWalletCliente(chatId);
            }

        } catch (error) {
            telegramUtils.showError('Error al cargar billetera: ' + error.message);
        } finally {
            telegramUtils.setLoading(false);
        }
    },

    // ─── UI PRIVADO ───────────────────────────────────────────────

    async _renderWalletCliente(chatId) {
        const saldo     = await this.getSaldoCliente(chatId);
        const servicios = await this.getHistorialServicios(chatId, 'cliente');

        document.getElementById('screen-wallet').innerHTML = `
            <div class="wallet-card">
                <p style="opacity:0.7; font-size:14px;">Saldo Disponible</p>
                <h1 style="font-size:42px; margin:10px 0;">
                    ${telegramUtils.formatCOP(saldo)}
                </h1>
                <i class="fas fa-wallet" style="opacity:0.2; font-size:50px;"></i>
            </div>

            <div style="margin-top:20px;">
                <p style="font-weight:700; font-size:13px; margin-bottom:10px;">
                    <i class="fas fa-clock-rotate-left"></i> Historial de servicios
                </p>
                ${servicios.length === 0
                    ? `<p style="text-align:center; color:#94a3b8; font-size:13px;">
                        Sin movimientos aún.
                       </p>`
                    : servicios.map(s => `
                        <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:15px;">
                            <div>
                                <p style="margin:0; font-size:12px; color:#64748b;">
                                    ${telegramUtils.formatDate(s.created_at)}
                                </p>
                                <p style="margin:4px 0 0; font-size:11px; color:#94a3b8;">
                                    ${s.status_servicio}
                                </p>
                            </div>
                            <span style="font-weight:800; color:var(--danger);">
                                -${telegramUtils.formatCOP(s.valor_movimiento)}
                            </span>
                        </div>
                    `).join('')
                }
            </div>
        `;
    },

    async _renderWalletConductor(chatId) {
        const { bolsa, cashback } = await this.getSaldoConductor(chatId);
        const depositos            = await this.getDepositosConductor(chatId);
        const servicios            = await this.getHistorialServicios(chatId, 'conductor');

        document.getElementById('screen-wallet').innerHTML = `
            <!-- Bolsa principal -->
            <div class="wallet-card">
                <p style="opacity:0.7; font-size:14px;">Bolsa del Conductor</p>
                <h1 style="font-size:42px; margin:10px 0;">
                    ${telegramUtils.formatCOP(bolsa)}
                </h1>
                <p style="opacity:0.7; font-size:12px; margin:0;">
                    Depósitos - 15% comisión empresa
                </p>
            </div>

            <!-- Cashback personal -->
            <div class="card" style="margin-top:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <p style="margin:0; font-size:12px; color:#64748b;">Cashback Personal</p>
                    <p style="margin:4px 0 0; font-weight:800; color:var(--success); font-size:18px;">
                        ${telegramUtils.formatCOP(cashback)}
                    </p>
                </div>
                <i class="fas fa-piggy-bank fa-2x" style="color:var(--success); opacity:0.4;"></i>
            </div>

            <!-- Historial depósitos -->
            <div style="margin-top:20px;">
                <p style="font-weight:700; font-size:13px; margin-bottom:10px;">
                    <i class="fas fa-money-bill-transfer"></i> Depósitos recibidos
                </p>
                ${depositos.length === 0
                    ? `<p style="text-align:center; color:#94a3b8; font-size:13px;">
                        Sin depósitos aún.
                       </p>`
                    : depositos.map(d => `
                        <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:15px;">
                            <p style="margin:0; font-size:12px; color:#64748b;">
                                ${telegramUtils.formatDate(d.fecha_deposito)}
                            </p>
                            <span style="font-weight:800; color:var(--success);">
                                +${telegramUtils.formatCOP(d.monto)}
                            </span>
                        </div>
                    `).join('')
                }
            </div>

            <!-- Historial servicios -->
            <div style="margin-top:20px;">
                <p style="font-weight:700; font-size:13px; margin-bottom:10px;">
                    <i class="fas fa-route"></i> Servicios realizados
                </p>
                ${servicios.length === 0
                    ? `<p style="text-align:center; color:#94a3b8; font-size:13px;">
                        Sin servicios aún.
                       </p>`
                    : servicios.map(s => `
                        <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:15px;">
                            <div>
                                <p style="margin:0; font-size:12px; color:#64748b;">
                                    ${telegramUtils.formatDate(s.created_at)}
                                </p>
                                <p style="margin:4px 0 0; font-size:11px; color:#94a3b8;">
                                    Comisión empresa: ${telegramUtils.formatCOP(s.ajuste_empresa)}
                                </p>
                            </div>
                            <span style="font-weight:800; color:var(--success);">
                                +${telegramUtils.formatCOP(s.valor_movimiento)}
                            </span>
                        </div>
                    `).join('')
                }
            </div>
        `;
    }
};
