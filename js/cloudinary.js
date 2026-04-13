// js/cloudinary.js

import { telegramUtils } from './utils.js';

const CLOUD_NAME    = 'dluwuj6wg';
const UPLOAD_PRESET = 'samy_docs';
const UPLOAD_URL    = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export const cloudinaryModule = {

    // ─── CLOUDINARY API ───────────────────────────────────────────

    async subirImagen(file, folder = 'samy') {
        if (!file) throw new Error('No se seleccionó archivo.');

        const formData = new FormData();
        formData.append('file',          file);
        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('folder',        folder);

        const response = await fetch(UPLOAD_URL, {
            method: 'POST',
            body:   formData
        });

        if (!response.ok) throw new Error('Error al subir imagen a Cloudinary.');
        const data = await response.json();
        return data.secure_url;
    },

    async subirFotosRegistro(fotoPerfil, cedulaFrontal, cedulaTrasera) {
        const [fotoPerfilUrl, cedulaFrontalUrl, cedulaTraseraUrl] = await Promise.all([
            fotoPerfil    ? this.subirImagen(fotoPerfil,    'samy/perfiles') : Promise.resolve(null),
            cedulaFrontal ? this.subirImagen(cedulaFrontal, 'samy/cedulas')  : Promise.resolve(null),
            cedulaTrasera ? this.subirImagen(cedulaTrasera, 'samy/cedulas')  : Promise.resolve(null)
        ]);
        return { fotoPerfilUrl, cedulaFrontalUrl, cedulaTraseraUrl };
    },

    // ─── UI ───────────────────────────────────────────────────────

    // Renderiza el formulario completo en screen-register
    renderFormulario() {
        document.getElementById('screen-register').innerHTML = `
            <div id="form-registro" style="display:none;">
                <div style="text-align:center; margin-bottom:25px;">
                    <i class="fas fa-id-card fa-3x" style="color:var(--primary);"></i>
                    <h2>Registro de Acceso</h2>
                    <p style="color:#64748b; font-size:13px;">
                        Completa tus datos para que el Soberano autorice tu ingreso.
                    </p>
                </div>

                <input type="text"   id="regName" placeholder="Nombre Completo">
                <input type="number" id="regDoc"  placeholder="Número de Documento">

                ${this._cardFoto('input-foto-perfil',  'preview-perfil',   'user',        'FOTO DE PERFIL',  '80px',  '80px',  '50%')}
                ${this._cardFoto('input-cedula-f',     'preview-cedula-f', 'environment', 'CÉDULA — FRENTE', '100%', '120px', '8px')}
                ${this._cardFoto('input-cedula-t',     'preview-cedula-t', 'environment', 'CÉDULA — REVERSO','100%', '120px', '8px')}

                <button id="btnSolicitar" class="btn-main" style="margin-top:15px;"
                        onclick="window.enviarAduana()">
                    <i class="fas fa-paper-plane"></i> Solicitar Ingreso
                </button>

                <p id="msg-feedback" style="font-size:13px; margin-top:15px; display:none;
                   text-align:center;"></p>
            </div>

            <div id="aduana-msg" style="display:none; text-align:center; margin-top:50px;">
                <i class="fas fa-passport fa-4x" 
                   style="color:var(--primary); margin-bottom:20px;"></i>
                <h2>Identidad en Validación</h2>
                <p style="color:#64748b;">
                    Tus datos están en la Aduana. El Soberano revisará tu perfil pronto.
                </p>
                <p id="msg-feedback-espera" style="font-size:13px; margin-top:20px; 
                   display:none;"></p>
            </div>
        `;

        // Vincula los eventos de previsualización después de inyectar el HTML
        this._bindPreviews();
    },

    // Renderiza el mensaje de espera directamente (usuario ya en aduana)
    renderEspera() {
        document.getElementById('screen-register').innerHTML = `
            <div id="aduana-msg" style="text-align:center; margin-top:50px;">
                <i class="fas fa-passport fa-4x"
                   style="color:var(--primary); margin-bottom:20px;"></i>
                <h2>Identidad en Validación</h2>
                <p style="color:#64748b;">
                    Tus datos están en la Aduana. El Soberano revisará tu perfil pronto.
                </p>
            </div>
        `;
    },

    // ─── UI PRIVADO ───────────────────────────────────────────────

    _cardFoto(inputId, previewId, capture, label, w, h, radius) {
        return `
            <div class="card" style="padding:15px; margin-top:5px;">
                <p style="margin:0 0 8px; font-size:12px; font-weight:700; color:var(--primary);">
                    <i class="fas fa-camera"></i> ${label}
                </p>
                <input type="file" id="${inputId}" accept="image/*" capture="${capture}"
                       style="display:none;">
                <img id="${previewId}" style="display:none; width:${w}; height:${h};
                     border-radius:${radius}; object-fit:cover; margin-bottom:8px;">
                <button onclick="document.getElementById('${inputId}').click()"
                    style="background:none; border:1px dashed var(--primary); color:var(--primary);
                    padding:8px 16px; border-radius:8px; cursor:pointer; width:100%; font-size:13px;">
                    <i class="fas fa-upload"></i> Seleccionar foto
                </button>
            </div>
        `;
    },

    _bindPreviews() {
        const pares = [
            ['input-foto-perfil', 'preview-perfil'],
            ['input-cedula-f',    'preview-cedula-f'],
            ['input-cedula-t',    'preview-cedula-t']
        ];

        pares.forEach(([inputId, previewId]) => {
            const input   = document.getElementById(inputId);
            const preview = document.getElementById(previewId);
            if (!input || !preview) return;

            input.addEventListener('change', () => {
                const file = input.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.src           = e.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            });
        });
    }
};
