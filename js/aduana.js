// La Inteligencia de Aduana, lógica del Modal y las decisiones del Soberano. Importa las funciones de api.js.
import { apiService } from './api.js';

export const aduanaModule = {
    abrirDetalle(user) {
        document.getElementById('view-foto-perfil').src = user.foto_perfil_url || '';
        document.getElementById('view-cedula-f').src = user.cedula_frontal_url || '';
        document.getElementById('view-cedula-t').src = user.cedula_trasera_url || '';

        // Guardamos temporalmente los datos en el botón
        const btnAprobar = document.getElementById('btn-aprobar-final');
        const btnRechazar = document.getElementById('btn-rechazar-final');

        btnAprobar.onclick = () => this.ejecutarAprobacion(user);
        btnRechazar.onclick = () => this.ejecutarRechazo(user.id);
        
        document.getElementById('modal-review').style.display = 'flex';
    },

    async ejecutarAprobacion(user) {
        if(!confirm(`¿Aprobar a ${user.full_name}?`)) return;
        
        const { error } = await apiService.crearPerfil({
            id: user.id,
            full_name: user.full_name,
            phone: user.phone,
            balance_prepago: 0
        });

        if (!error) {
            await apiService.eliminarDeAduana(user.id);
            alert("Usuario aprobado con éxito.");
            location.reload(); // Forma rápida de refrescar en modo modular inicial
        }
    },

    async ejecutarRechazo(id) {
        if(!confirm("¿Rechazar definitivamente?")) return;
        const { error } = await apiService.eliminarDeAduana(id);
        if(!error) location.reload();
    }
};
