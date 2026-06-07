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

// ============================================================
// COLOR STATE — la fuente de verdad del color actual
// ============================================================
let activeColor = { h: 235, s: 64, v: 95 };

// ============================================================
// PICKER 1: Rueda (solo controla el Hue via ángulo)
// ============================================================
const wheelPicker = new iro.ColorPicker('#pickerWheel', {
    width: 200,
    color: "#5865F2",
    borderWidth: 2,
    borderColor: "#1e1f22",
    layout: [
        {
            component: iro.ui.Wheel,
            options: {
                wheelLightness: false
            }
        }
    ]
});

// ============================================================
// PICKER 2: Deslizadores (saturación = claro, value = oscuro)
// ============================================================
const sliderPicker = new iro.ColorPicker('#pickerSliders', {
    width: 200,
    color: "#5865F2",
    borderWidth: 2,
    borderColor: "#1e1f22",
    layout: [
        {
            component: iro.ui.Slider,
            options: {
                sliderType: 'saturation' // Más claro / pastel
            }
        },
        {
            component: iro.ui.Slider,
            options: {
                sliderType: 'value' // Más oscuro / brillo
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

colorModal.addEventListener('click', (e) => {
    if (e.target === colorModal) {
        closeModal();
    }
});

// ============================================================
// FUNCIONES DE UI
// ============================================================
function updateColorDynamic(hexColor) {
    if (/^#[0-9A-F]{6}$/i.test(hexColor)) {
        document.getElementById('previewUsername').style.color = hexColor;
        document.getElementById('previewUsernameModal').style.color = hexColor;
        colorPickerTrigger.style.backgroundColor = hexColor;
    }
}

// Calcula el HEX a partir de activeColor y actualiza solo el texto + preview
function refreshPreview() {
    const c = new iro.Color({ h: activeColor.h, s: activeColor.s, v: activeColor.v });
    const hex = c.hexString.toUpperCase();
    hexInput.value = hex.replace('#', '');
    updateColorDynamic(hex);
}

// Para inicialización y cambios desde el input HEX / reset
function setFullColor(hexString) {
    const c = new iro.Color(hexString);
    activeColor = { h: c.hsv.h, s: c.hsv.s, v: c.hsv.v };
    wheelPicker.color.hexString = hexString;
    sliderPicker.color.set({ h: activeColor.h, s: activeColor.s, v: activeColor.v });
    refreshPreview();
}

// Inicializar
setFullColor('#5865F2');

// ============================================================
// EVENTOS — REGLA DE ORO: durante arrastre, NUNCA tocar el otro picker
// ============================================================

// --- RUEDA ---
// Durante arrastre: actualizar activeColor.h y sincronizar el tono (hue) de los deslizadores en tiempo real
// (los degradados cambian al instante, pero los tiradores de los deslizadores no se mueven ya que mantenemos su s/v intactos)
wheelPicker.on('input:change', (color) => {
    activeColor.h = color.hsv.h;
    sliderPicker.color.set({ h: activeColor.h, s: activeColor.s, v: activeColor.v });
    refreshPreview();
});

// --- DESLIZADORES ---
// Durante arrastre: solo actualizar s/v en activeColor y actualizar la vista previa (la rueda no se mueve)
sliderPicker.on('input:change', (color) => {
    activeColor.s = color.hsv.s;
    activeColor.v = color.hsv.v;
    refreshPreview();
});
// Al soltar: no necesitamos tocar la rueda (la rueda no depende de s/v visualmente)

// --- INPUT HEX ---
hexInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/[^0-9A-F]/ig, '').toUpperCase();
    if (val.length > 6) val = val.substring(0, 6);
    e.target.value = val;
    if (val.length === 6) {
        setFullColor('#' + val);
    }
});

// ============================================================
// ACCIONES: Copiar, Guardar, Restablecer
// ============================================================
btnCopyHex.addEventListener('click', async () => {
    const hexToCopy = '#' + hexInput.value.toUpperCase();
    try {
        await navigator.clipboard.writeText(hexToCopy);
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
    if (!button) return;
    if (isLoading) {
        button.classList.add('loading');
    } else {
        button.classList.remove('loading');
    }
}

btnSave.addEventListener('click', async () => {
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
        showStatus('Error de conexión con el servidor.', true);
    } finally {
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
            setFullColor('#5865F2');
        } else {
            showStatus(data.error || 'Error al eliminar el color.', true);
        }
    } catch (err) {
        showStatus('Error de conexión con el servidor.', true);
    } finally {
        toggleLoading(btnRemove, false);
    }
});
