console.log('Script cargado.');
// Obtener parámetros de la URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const username = urlParams.get('username') || 'Usuario';
const avatar = urlParams.get('avatar') || 'https://cdn.discordapp.com/embed/avatars/0.png';

// Actualizar UI - Perfil y Vista Previa en Vivo (Principal y Modal)
document.getElementById('username').textContent = username;
document.getElementById('avatar').src = avatar;
document.getElementById('previewUsername').textContent = username;
document.getElementById('previewAvatar').src = avatar;
document.getElementById('previewUsernameModal').textContent = username;
document.getElementById('previewAvatarModal').src = avatar;

const hexInput = document.getElementById('hexInput');
const btnSave = document.getElementById('btnSave');
const btnRemove = document.getElementById('btnRemove');
const btnCopyHex = document.getElementById('btnCopyHex');
const statusDiv = document.getElementById('status');

// Elementos del Modal y Trigger
const colorPickerTrigger = document.getElementById('colorPickerTrigger');
const colorModal = document.getElementById('colorModal');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnConfirmColor = document.getElementById('btnConfirmColor');

// Inicializar iro.js Color Picker
const colorPicker = new iro.ColorPicker('#colorPickerInline', {
    width: 200,
    color: "#5865F2",
    borderWidth: 2,
    borderColor: "#1e1f22",
    layout: [
        {
            component: iro.ui.Wheel,
        },
        {
            component: iro.ui.Slider,
            options: {
                sliderType: 'value'
            }
        }
    ]
});

let statusTimeout;

// Función para abrir/cerrar modal
function openModal() {
    colorModal.classList.add('open');
}

function closeModal() {
    colorModal.classList.remove('open');
}

colorPickerTrigger.addEventListener('click', openModal);
btnCloseModal.addEventListener('click', closeModal);
btnConfirmColor.addEventListener('click', closeModal);

// Cerrar al hacer clic fuera del contenido del modal
colorModal.addEventListener('click', (e) => {
    if (e.target === colorModal) {
        closeModal();
    }
});

// Función para actualizar colores dinámicamente en la UI
function updateColorDynamic(hexColor) {
    if (/^#[0-9A-F]{6}$/i.test(hexColor)) {
        // Vista previa del nombre (Principal)
        document.getElementById('previewUsername').style.color = hexColor;
        // Vista previa del nombre (Modal)
        document.getElementById('previewUsernameModal').style.color = hexColor;
        // Actualizar el color de fondo del botón gatillo (circulito)
        colorPickerTrigger.style.backgroundColor = hexColor;
    }
}

// Inicializar color
const initialColor = colorPicker.color.hexString;
updateColorDynamic(initialColor);
hexInput.value = initialColor.replace('#', '').toUpperCase();

// Sincronizar desde el selector de color iro.js
colorPicker.on('color:change', (color) => {
    const val = color.hexString.toUpperCase();
    hexInput.value = val.replace('#', '');
    updateColorDynamic(val);
});

// Sincronizar desde el input de texto hexadecimal
hexInput.addEventListener('input', (e) => {
    // Limpiar caracteres no válidos de HEX
    let val = e.target.value.replace(/[^0-9A-F]/ig, '').toUpperCase();
    
    // Limitar a 6 caracteres
    if (val.length > 6) {
        val = val.substring(0, 6);
    }
    
    e.target.value = val;

    if (val.length === 6) {
        const fullHex = '#' + val;
        colorPicker.color.hexString = fullHex;
        updateColorDynamic(fullHex);
    }
});

// Copiar código HEX al portapapeles
btnCopyHex.addEventListener('click', async () => {
    const hexToCopy = '#' + hexInput.value.toUpperCase();
    try {
        await navigator.clipboard.writeText(hexToCopy);
        
        // Feedback visual temporal en el botón
        const originalSVG = btnCopyHex.innerHTML;
        btnCopyHex.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="#23a55a" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        btnCopyHex.title = '¡Copiado!';
        
        setTimeout(() => {
            btnCopyHex.innerHTML = originalSVG;
            btnCopyHex.title = 'Copiar HEX';
        }, 2000);
    } catch (err) {
        showStatus('Error al copiar al portapapeles', true);
    }
});

function showStatus(msg, isError = false) {
    clearTimeout(statusTimeout);
    
    statusDiv.textContent = msg;
    statusDiv.className = isError ? 'error show' : 'success show';
    
    statusTimeout = setTimeout(() => {
        statusDiv.classList.remove('show');
    }, 4000);
}

function toggleLoading(button, isLoading) {
    console.log('toggleLoading:', button ? button.id : 'null', isLoading);
    if (!button) return;
    if (isLoading) {
        button.classList.add('loading');
    } else {
        button.classList.remove('loading');
    }
}

btnSave.addEventListener('click', async () => {
    console.log('btnSave clicked');
    if (!token) return showStatus('Error: Faltan credenciales de seguridad.', true);

    const color = '#' + hexInput.value;
    if (!/^#[0-9A-F]{6}$/i.test(color)) return showStatus('Error: Código HEX inválido.', true);

    toggleLoading(btnSave, true);
    try {
        const res = await fetch('https://remir.onrender.com/api/set-color', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, color })
        });
        const data = await res.json();

        if (res.ok && !data.error) {
            showStatus('¡Color actualizado con éxito! Puedes cerrar esta ventana.');
        } else {
            showStatus(data.error || 'Error al guardar el color.', true);
        }
    } catch (err) {
        console.error('Fetch error:', err);
        showStatus('Error de conexión con el servidor.', true);
    } finally {
        console.log('Stopping loading state inside finally');
        toggleLoading(btnSave, false);
    }
});

btnRemove.addEventListener('click', async () => {
    if (!token) return showStatus('Error: Faltan credenciales de seguridad.', true);

    toggleLoading(btnRemove, true);
    try {
        const res = await fetch('https://remir.onrender.com/api/remove-color', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        const data = await res.json();

        if (res.ok && !data.error) {
            showStatus('Color eliminado. Volviste a la normalidad.');
            // Volver al color base por defecto
            colorPicker.color.hexString = '#5865F2';
            hexInput.value = '5865F2';
            updateColorDynamic('#5865F2');
        } else {
            showStatus(data.error || 'Error al eliminar el color.', true);
        }
    } catch (err) {
        showStatus('Error de conexión con el servidor.', true);
    } finally {
        toggleLoading(btnRemove, false);
    }
});
