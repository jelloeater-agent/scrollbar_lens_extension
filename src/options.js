const DEFAULTS = {
    width: 180,
    hoverDelay: 60,
    hideDelay: 150,
};

const fields = ['width', 'hoverDelay', 'hideDelay'];

// Populate UI from storage
async function loadOptions() {
    const stored = await browser.storage.sync.get(DEFAULTS);
    for (const key of fields) {
        const input = document.getElementById(key);
        const display = document.getElementById(`${key}-value`);
        input.value = stored[key] ?? DEFAULTS[key];
        updateDisplay(key);
    }
}

// Update the displayed value next to the slider
function updateDisplay(key) {
    const input = document.getElementById(key);
    const display = document.getElementById(`${key}-value`);
    const suffix = key === 'width' ? 'px' : 'ms';
    display.textContent = `${input.value}${suffix}`;
}

// Save current values to storage
async function saveOptions() {
    const data = {};
    for (const key of fields) {
        data[key] = Number(document.getElementById(key).value);
    }
    await browser.storage.sync.set(data);
    showStatus('Options saved', 'saved');
}

// Reset to defaults
async function resetOptions() {
    await browser.storage.sync.set(DEFAULTS);
    for (const key of fields) {
        document.getElementById(key).value = DEFAULTS[key];
        updateDisplay(key);
    }
    showStatus('Reset to defaults', 'saved');
}

function showStatus(msg, type) {
    const el = document.getElementById('status');
    el.textContent = msg;
    el.className = type;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => { el.textContent = ''; el.className = ''; }, 2500);
}

// Wire up live display updates
for (const key of fields) {
    document.getElementById(key).addEventListener('input', () => updateDisplay(key));
}

document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('reset').addEventListener('click', resetOptions);

document.addEventListener('DOMContentLoaded', loadOptions);