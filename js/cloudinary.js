// js/cloudinary.js

const CLOUD_NAME   = 'dluwuj6wg';
const UPLOAD_PRESET = 'samy_docs';
const UPLOAD_URL   = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export const cloudinaryModule = {

    // Sube una imagen y devuelve la URL segura
    async subirImagen(file, folder = 'samy') {
        if (!file) throw new Error('No se seleccionó archivo.');

        const formData = new FormData();
        formData.append('file',           file);
        formData.append('upload_preset',  UPLOAD_PRESET);
        formData.append('folder',         folder);

        const response = await fetch(UPLOAD_URL, {
            method: 'POST',
            body:   formData
        });

        if (!response.ok) throw new Error('Error al subir imagen a Cloudinary.');

        const data = await response.json();
        return data.secure_url;
    },

    // Sube las tres fotos del registro en paralelo
    async subirFotosRegistro(fotoPerfil, cedulaFrontal, cedulaTrasera) {
        const promesas = [
            fotoPerfil    ? this.subirImagen(fotoPerfil,    'samy/perfiles')  : Promise.resolve(null),
            cedulaFrontal ? this.subirImagen(cedulaFrontal, 'samy/cedulas')   : Promise.resolve(null),
            cedulaTrasera ? this.subirImagen(cedulaTrasera, 'samy/cedulas')   : Promise.resolve(null)
        ];

        const [fotoPerfilUrl, cedulaFrontalUrl, cedulaTraseraUrl] = await Promise.all(promesas);
        return { fotoPerfilUrl, cedulaFrontalUrl, cedulaTraseraUrl };
    },

    // Previsualiza una imagen antes de subirla
    previsualizarImagen(inputEl, imgEl) {
        const file = inputEl.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            imgEl.src          = e.target.result;
            imgEl.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
};
