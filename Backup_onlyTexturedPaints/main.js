var currentSelectedSlot = 0;
var lastEstimateSummary = null;
const ESTIMATE_CATEGORY_LABELS = {
    paint: 'Paint',
    tiles: 'Tiles',
    marble: 'Marble',
    texture: 'Wallpaper / Texture',
    art: 'Art / Decor'
};

// --- DATA DEFINITIONS (INDUSTRY PALETTE) ---
const industryPalette = [
    { name: "Obsidian Mist", hex: "#3A3F44", family: "Neutral", type: "Matte Paint", smooth: 0.1 },
    { name: "Arctic Willow", hex: "#D1D9D0", family: "Earthy", type: "Satin Paint", smooth: 0.4 },
    { name: "Midnight Ember", hex: "#432C2C", family: "Vibrant", type: "High Gloss", smooth: 0.9 },
    { name: "Desert Mirage", hex: "#D4A373", family: "Earthy", type: "Matte Paint", smooth: 0.15 },
    { name: "Sage Sanctuary", hex: "#8A9A5B", family: "Earthy", type: "Matte Paint", smooth: 0.15 },
    { name: "Celestial Slate", hex: "#4E5D6C", family: "Neutral", type: "Satin Paint", smooth: 0.35 },
    { name: "Petal Whisper", hex: "#F4E1E1", family: "Pastel", type: "Matte Paint", smooth: 0.1 },
    { name: "Copper Harvest", hex: "#B87333", family: "Metallic", type: "Metallic Silk", smooth: 0.85 },
    { name: "Indigo Haze", hex: "#2E4057", family: "Vibrant", type: "Eggshell", smooth: 0.25 },
    { name: "Linen Cloud", hex: "#F5F5DC", family: "Pastel", type: "Satin Paint", smooth: 0.4 },
    { name: "Emerald Odyssey", hex: "#046307", family: "Vibrant", type: "High Gloss", smooth: 0.9 },
    { name: "Ivory Parchment", hex: "#FEFBF3", family: "Neutral", type: "Matte Paint", smooth: 0.1 },
    { name: "Dusty Sienna", hex: "#A0522D", family: "Earthy", type: "Satin Paint", smooth: 0.45 },
    { name: "Silver Storm", hex: "#B2BEB5", family: "Metallic", type: "Brushed Steel", smooth: 0.75 },
    { name: "Azure Drift", hex: "#007FFF", family: "Vibrant", type: "High Gloss", smooth: 0.95 },
    { name: "Champagne Silk", hex: "#F7E7CE", family: "Metallic", type: "Pearl Essence", smooth: 0.8 },
    { name: "Smoked Walnut", hex: "#5D4037", family: "Wood Stain", type: "Oil Based", smooth: 0.5 },
    { name: "Golden Oak", hex: "#BC8F8F", family: "Wood Stain", type: "Varnish", smooth: 0.65 },
    { name: "Raw Teak", hex: "#8B5A2B", family: "Wood Stain", type: "Semi-Gloss", smooth: 0.55 },
    { name: "Ebony Stain", hex: "#282828", family: "Wood Stain", type: "Deep Matte", smooth: 0.2 },
    { name: "Burnished Bronze", hex: "#8C7853", family: "Metallic", type: "Antique Metal", smooth: 0.6 },
    { name: "Alabaster Breath", hex: "#F2F0E6", family: "Neutral", type: "Flat White", smooth: 0.05 },
    { name: "Classic Greige", hex: "#BDB7AB", family: "Neutral", type: "Eggshell", smooth: 0.22 },
    { name: "Urban Charcoal", hex: "#363636", family: "Neutral", type: "Matte Paint", smooth: 0.12 },
    { name: "Nordic Navy", hex: "#2C3E50", family: "Vibrant", type: "Satin Paint", smooth: 0.42 },
    { name: "Terracotta Hearth", hex: "#BF6D4E", family: "Earthy", type: "Matte Paint", smooth: 0.1 },
    { name: "Crisp Linen", hex: "#FAF9F6", family: "Neutral", type: "Eggshell", smooth: 0.25 },
    { name: "Misty Moss", hex: "#96A088", family: "Earthy", type: "Satin Paint", smooth: 0.38 },
    { name: "Royal Amethyst", hex: "#4B0082", family: "Vibrant", type: "High Gloss", smooth: 0.88 },
    { name: "Soft Pewter", hex: "#91A3B0", family: "Neutral", type: "Satin Paint", smooth: 0.4 },
    { name: "Rose Clay", hex: "#BC8F8F", family: "Pastel", type: "Matte Paint", smooth: 0.15 },
    { name: "Deep Bordeaux", hex: "#4C1C24", family: "Vibrant", type: "Semi-Gloss", smooth: 0.6 },
    { name: "Weathered Barn", hex: "#7B3F00", family: "Wood Stain", type: "Matte Stain", smooth: 0.18 },
    { name: "Arctic Frost", hex: "#E0E4E5", family: "Neutral", type: "High Gloss", smooth: 0.92 },
    { name: "Mustard Seed", hex: "#E3A857", family: "Vibrant", type: "Satin Paint", smooth: 0.4 },
    { name: "Pale Eucalyptus", hex: "#B2BEB5", family: "Earthy", type: "Eggshell", smooth: 0.28 },
    { name: "Gunmetal Industrial", hex: "#2A3439", family: "Metallic", type: "Anodized", smooth: 0.7 },
    { name: "Vanilla Cream", hex: "#F3E5AB", family: "Pastel", type: "Satin Paint", smooth: 0.45 },
    { name: "Stormy Pacific", hex: "#4A646C", family: "Vibrant", type: "Matte Paint", smooth: 0.15 },
    { name: "Toasted Almond", hex: "#D2B48C", family: "Neutral", type: "Satin Paint", smooth: 0.35 },
    { name: "Oxblood Velvet", hex: "#800020", family: "Vibrant", type: "Matte Paint", smooth: 0.08 },
    { name: "Nickel Plate", hex: "#A5A9A0", family: "Metallic", type: "Polished", smooth: 0.82 },
    { name: "Cherry Mahogany", hex: "#4B2D26", family: "Wood Stain", type: "High Gloss", smooth: 0.9 },
    { name: "Dusty Lavender", hex: "#AC92B3", family: "Pastel", type: "Eggshell", smooth: 0.22 },
    { name: "Oatmeal Cookie", hex: "#DECDBE", family: "Neutral", type: "Matte Paint", smooth: 0.1 },
    { name: "Marine Teal", hex: "#008080", family: "Vibrant", type: "Satin Paint", smooth: 0.4 },
    { name: "Iron Ore", hex: "#3F3F3F", family: "Neutral", type: "Matte Paint", smooth: 0.1 },
    { name: "Blush Silk", hex: "#FFD1DC", family: "Pastel", type: "Pearl Essence", smooth: 0.75 },
    { name: "Golden Honey", hex: "#D4AF37", family: "Metallic", type: "Metallic Silk", smooth: 0.8 },
    { name: "Dark Cedar", hex: "#3E2723", family: "Wood Stain", type: "Oil Based", smooth: 0.45 }
];

const textureLibrary = [
    { name: "Blue Gold Marble", url: "img/textures/blue-gold-marble.jpg" },
    { name: "Black Marble", url: "img/textures/black-marble.jpg" },
    { name: "Gray Marble", url: "img/textures/gray-marble.jpg" },
    { name: "Luxurious Marble", url: "img/textures/luxurious-marble.jpg" },
    { name: "Luxury Marble", url: "img/textures/luxury-marble.jpg" },
    { name: "Marble Tile", url: "img/textures/marble-tile.jpg" },
    { name: "Rock Texture", url: "img/textures/rock-texture.jpg" },
    { name: "Beige Marble", url: "img/textures/beige-marble.jpg" },
    { name: "White Marble", url: "img/textures/white-marble.jpg" }
];

// --- UI NAVIGATION ---
function switchLibrary(type) {
    const paintSec = document.getElementById('section-paints');
    const texSec = document.getElementById('section-textures');
    const paintBtn = document.getElementById('btn-show-paints');
    const texBtn = document.getElementById('btn-show-textures');

    if (type === 'paints') {
        paintSec.style.display = 'block';
        texSec.style.display = 'none';
        paintBtn.classList.add('active');
        texBtn.classList.remove('active');
    } else {
        paintSec.style.display = 'none';
        texSec.style.display = 'block';
        texBtn.classList.add('active');
        paintBtn.classList.remove('active');
    }
}

function loadDefaultKitchen() {
    postToUnity({ action: 'LoadDefaultModel' });
}

// --- COLOR SHADES & INITIALIZATION ---
function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
}

function rgbToHex(r, g, b) {
    const toHex = (v) => v.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Generate 6 tonal variations for a base color (from light to deep)
function generateShades(baseHex, count = 6) {
    const { r, g, b } = hexToRgb(baseHex);
    const shades = [];
    for (let i = 0; i < count; i++) {
        // t from 0.75 (lighter) down to 0.25 (deeper) for architectural tone steps
        const t = 0.75 - (i * (0.5 / Math.max(count - 1, 1)));
        const mixWith = t >= 0.5 ? 255 : 0;
        const factor = t >= 0.5 ? (t - 0.5) * 2 : (0.5 - t) * 2;
        const mix = (channel) => {
            const value = Math.round(channel * (1 - factor) + mixWith * factor);
            return Math.min(255, Math.max(0, value));
        };
        shades.push(rgbToHex(mix(r), mix(g), mix(b)));
    }
    return shades;
}

function initLibrary() {
    // Colors: industry-grade palette with 6 shades each
    const pGrid = document.getElementById('paint-grid');
    industryPalette.forEach(color => {
        const shades = generateShades(color.hex, 6);
        const card = createShadeCard(color, shades);
        pGrid.appendChild(card);
    });

    // Textures
    const tGrid = document.getElementById('texture-grid');
    textureLibrary.forEach(tex => {
        const card = createCard(tex.name, tex.url, () => applyTexture(tex.url), false);
        tGrid.appendChild(card);
    });
}

function createCard(name, value, action, isColor) {
    const card = document.createElement('div');
    card.className = 'paint-card';
    card.setAttribute('data-name', name.toLowerCase());
    card.onclick = action;

    const display = isColor
        ? `<div class="swatch" style="background: ${value}"></div>`
        : `<img src="${value}" class="swatch" style="object-fit:cover;">`;

    card.innerHTML = `${display}<span class="paint-info">${name}</span>`;
    return card;
}

// Card layout for industry colors with 6 shade chips
function createShadeCard(color, shades) {
    const card = document.createElement('div');
    card.className = 'paint-card';
    card.setAttribute('data-name', color.name.toLowerCase());

    const mainSwatch = document.createElement('div');
    mainSwatch.className = 'swatch';
    mainSwatch.style.background = color.hex;
    mainSwatch.title = `${color.name} (${color.family} Â· ${color.type})`;
    mainSwatch.onclick = () => applyColor(color.hex, `${color.name} Â· Base`);

    const shadeRow = document.createElement('div');
    shadeRow.className = 'shade-row';

    shades.forEach((shadeHex, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'shade-dot';
        dot.style.background = shadeHex;
        dot.title = `${color.name} Â· Shade ${index + 1}`;
        dot.onclick = (e) => {
            e.stopPropagation();
            applyColor(shadeHex, `${color.name} Â· Shade ${index + 1}`);
        };
        shadeRow.appendChild(dot);
    });

    const info = document.createElement('span');
    info.className = 'paint-info';
    info.textContent = color.name;

    card.appendChild(mainSwatch);
    card.appendChild(shadeRow);
    card.appendChild(info);

    return card;
}

// --- BRIDGE FUNCTIONS (TO UNITY) ---
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const overlay = document.getElementById('import-overlay');
    const primary = document.getElementById('import-primary-text');
    const secondary = document.getElementById('import-secondary-text');
    if (primary) primary.textContent = 'Importing 3D model';
    if (secondary) secondary.textContent = 'Processing geometry and materials\u2026';
    if (overlay) overlay.style.display = 'flex';
    const blobUrl = URL.createObjectURL(file);
    postToUnity({ action: 'LoadGLBFromUrl', payload: blobUrl });
    setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
}

function handleTextureUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const overlay = document.getElementById('import-overlay');
    const primary = document.getElementById('import-primary-text');
    const secondary = document.getElementById('import-secondary-text');
    if (primary) primary.textContent = 'Updating texture';
    if (secondary) secondary.textContent = 'Uploading and applying high-resolution map\u2026';
    if (overlay) overlay.style.display = 'flex';
    const blobUrl = URL.createObjectURL(file);
    postToUnity({ action: 'SetMaterialTexture', payload: `${currentSelectedSlot}|${blobUrl}` });
    setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        const ov = document.getElementById('import-overlay');
        if (ov) ov.style.display = 'none';
    }, 15000);
}

function updateActiveColor(hex, label) {
    const wrapper = document.getElementById('active-color-wrapper');
    const swatch = document.getElementById('active-color-swatch');
    const nameEl = document.getElementById('active-color-name');
    const hexEl = document.getElementById('active-color-hex');
    if (!wrapper || !swatch || !nameEl || !hexEl) return;

    wrapper.style.display = 'flex';
    swatch.style.background = hex;
    nameEl.textContent = label || 'Color';
    hexEl.textContent = hex.toUpperCase();
}

function applyColor(hex, label) {
    postToUnity({ action: 'SetMaterialColor', payload: `${currentSelectedSlot}|${hex}` });
    updateActiveColor(hex, label);
}

function clearActiveColor() {
    const wrapper = document.getElementById('active-color-wrapper');
    const nameEl = document.getElementById('active-color-name');
    const hexEl = document.getElementById('active-color-hex');
    if (!wrapper || !nameEl || !hexEl) return;
    wrapper.style.display = 'none';
    nameEl.textContent = 'â€”';
    hexEl.textContent = 'â€”';
}

function applyTexture(url) {
    postToUnity({ action: 'SetMaterialTexture', payload: `${currentSelectedSlot}|${url}` });
}

function resetObject() {
    postToUnity({ action: 'RestoreOriginals' });
    clearActiveColor();
    resetMatPropSliders();
}

// --- EVENTS (FROM UNITY) ---
window.dispatchUnityEvent = function (type, data, matCount) {
    if (type === "ObjectSelected") {
        document.getElementById('import-overlay').style.display = 'none';

        const isSelected = data && data.length > 0;
        document.getElementById("selected-name").innerText = isSelected ? data.toUpperCase() : 'NONE SELECTED';
        const selectionHint = document.getElementById('selection-hint');
        if (selectionHint) selectionHint.style.display = isSelected ? 'block' : 'none';
        setupMaterialSlots(parseInt(matCount));

        // Show / hide material property sliders
        const matProps = document.getElementById('mat-props-section');
        if (matProps) matProps.style.display = isSelected ? 'block' : 'none';

        if (isSelected) {
            resetMatPropSliders();
        } else {
            // Full inspector reset on deselect (Escape / click void)
            clearActiveColor();
        }
    }
};


function resetMatPropSliders() {
    const defaults = {
        'slider-tiling': { value: 1, display: '1.0x', labelId: 'val-tiling' },
        'slider-roughness': { value: 0.5, display: '0.50', labelId: 'val-roughness' },
        'slider-metallic': { value: 0, display: '0.00', labelId: 'val-metallic' }
    };
    Object.entries(defaults).forEach(([id, def]) => {
        const slider = document.getElementById(id);
        const label = document.getElementById(def.labelId);
        if (slider) slider.value = def.value;
        if (label) label.textContent = def.display;
    });
}

function setupMaterialSlots(count) {
    const container = document.getElementById('slot-container');
    const section = document.getElementById('material-section');
    container.innerHTML = '';
    currentSelectedSlot = 0;

    if (count > 1) {
        section.style.display = 'block';
        for (let i = 0; i < count; i++) {
            const btn = document.createElement('button');
            btn.className = `slot-btn ${i === 0 ? 'active' : ''}`;
            btn.innerText = `Slot ${i + 1}`;
            btn.onclick = (e) => {
                document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentSelectedSlot = i;
            };
            container.appendChild(btn);
        }
    } else {
        section.style.display = 'none';
    }
}

// --- SEARCH ---
function filterPaints() {
    let input = document.getElementById('paintSearch').value.toLowerCase();
    let cards = document.querySelectorAll('#paint-grid .paint-card');
    cards.forEach(card => card.style.display = card.getAttribute('data-name').includes(input) ? "block" : "none");
}

function filterTextures() {
    let input = document.getElementById('textureSearch').value.toLowerCase();
    let cards = document.querySelectorAll('#texture-grid .paint-card');
    cards.forEach(card => card.style.display = card.getAttribute('data-name').includes(input) ? "block" : "none");
}

// --- UNITY STARTUP ---
// PostMessage bridge to Unity iframe with handshake/ACK
let unityIsReady = false;
let unityMessageQueue = [];

function getUnityIframe() {
    return document.getElementById('unity-iframe');
}

function postToUnity(message) {
    if (!unityIsReady) {
        unityMessageQueue.push(message);
        return;
    }
    const iframe = getUnityIframe();
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.focus();
    iframe.contentWindow.postMessage({ type: 'FromParent', ...message }, '*');
}

// Listen for messages from Unity (iframe)
window.addEventListener('message', (e) => {
    const msg = e.data || {};
    if (msg && msg.type === 'FromUnity') {
        if (msg.action === 'UnityLoadingProgress') {
            const progress = Math.max(0, Math.min(1, Number(msg.progress || 0)));
            const fill = document.getElementById('boot-progress-fill');
            const label = document.getElementById('boot-progress-label');
            if (fill) fill.style.width = `${Math.round(progress * 100)}%`;
            if (label) label.textContent = `Loading ${Math.round(progress * 100)}%`;
        }
        if (msg.action === 'UnityReady') {
            unityIsReady = true;
            const boot = document.getElementById('boot-overlay');
            if (boot) boot.style.display = 'none';
            const iframe = getUnityIframe();
            if (iframe && iframe.contentWindow) iframe.contentWindow.focus();
            // Flush queued messages
            while (unityMessageQueue.length > 0) {
                postToUnity(unityMessageQueue.shift());
            }
        }
        // Forward Unity events into existing handler
        if (msg.action === 'ObjectSelected') {
            window.dispatchUnityEvent(msg.action, msg.payload, msg.matCount);
        }
    }
});
// --- COST ESTIMATOR (INR) ---
function formatINR(value) {
    try {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value);
    } catch (e) {
        const v = Math.round(value);
        return 'Rs. ' + v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
}

function computeEstimateLine(category, qty, unit, rate) {
    let materialCost = 0;
    let extraCost = 0;
    let effectiveQtyDesc = '';
    let extraLabel = '';

    if (category === 'paint') {
        const coats = 2;
        const materialQty = qty * coats;
        materialCost = materialQty * rate;
        extraCost = materialCost * 0.20;
        extraLabel = 'Labor (20% of material)';
        effectiveQtyDesc = `${materialQty.toFixed(2)} ${unit} (area x ${coats} coats)`;
    } else if (category === 'tiles') {
        const effectiveArea = qty * 1.10;
        materialCost = effectiveArea * rate;
        extraCost = materialCost * 0.05;
        extraLabel = 'Grout / Adhesive (~5%)';
        effectiveQtyDesc = `${effectiveArea.toFixed(2)} ${unit} (includes 10% wastage)`;
    } else if (category === 'marble') {
        const effectiveArea = qty * 1.15;
        materialCost = effectiveArea * rate;
        extraCost = materialCost * 0.08;
        extraLabel = 'Polishing (~8%)';
        effectiveQtyDesc = `${effectiveArea.toFixed(2)} ${unit} (includes 15% wastage)`;
    } else if (category === 'texture') {
        const areaSqFt = unit === 'sq.m' ? qty * 10.7639 : qty;
        const rolls = Math.ceil(areaSqFt / 50);
        materialCost = rolls * rate;
        effectiveQtyDesc = `${rolls} roll(s) for approx ${areaSqFt.toFixed(1)} sq.ft`;
    } else {
        materialCost = qty * rate;
        effectiveQtyDesc = `${qty} ${unit === 'piece' ? 'piece(s)' : unit}`;
    }

    return {
        materialCost,
        extraCost,
        total: materialCost + extraCost,
        extraLabel,
        effectiveQtyDesc
    };
}

function addEstimateLine(prefill) {
    const linesRoot = document.getElementById('est-lines');
    if (!linesRoot) return;

    const line = document.createElement('div');
    line.className = 'est-line';
    line.innerHTML = `
        <div class="est-line-grid">
            <input type="text" class="est-input est-item" placeholder="Item / Area" value="${prefill?.item || ''}">
            <select class="est-select est-category">
                <option value="paint">Paint</option>
                <option value="tiles">Tiles</option>
                <option value="marble">Marble</option>
                <option value="texture">Wallpaper / Texture</option>
                <option value="art">Art / Decor</option>
            </select>
            <input type="number" min="0" step="0.01" class="est-input est-qty" placeholder="Qty / Area" value="${prefill?.qty || ''}">
            <select class="est-select est-unit">
                <option value="sq.ft">sq.ft</option>
                <option value="sq.m">sq.m</option>
                <option value="piece">piece</option>
            </select>
            <input type="number" min="0" step="1" class="est-input est-rate" placeholder="Rate" value="${prefill?.rate || ''}">
            <button type="button" class="est-remove" title="Remove item">Remove</button>
        </div>
    `;

    const removeBtn = line.querySelector('.est-remove');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            line.remove();
            if (!linesRoot.querySelector('.est-line')) addEstimateLine();
        });
    }

    const categorySelect = line.querySelector('.est-category');
    const unitSelect = line.querySelector('.est-unit');
    if (categorySelect && prefill?.category) categorySelect.value = prefill.category;
    if (unitSelect && prefill?.unit) unitSelect.value = prefill.unit;
    linesRoot.appendChild(line);
}

function initEstimator() {
    const linesRoot = document.getElementById('est-lines');
    if (!linesRoot || linesRoot.children.length > 0) return;
    addEstimateLine();
}

function runEstimate() {
    const out = document.getElementById('est-result');
    const lineNodes = Array.from(document.querySelectorAll('#est-lines .est-line'));
    if (!out || lineNodes.length === 0) return;

    const lines = [];
    let grandTotal = 0;

    for (const node of lineNodes) {
        const item = (node.querySelector('.est-item')?.value || '').trim();
        const category = node.querySelector('.est-category')?.value || 'paint';
        const qty = parseFloat(node.querySelector('.est-qty')?.value || '');
        const unit = node.querySelector('.est-unit')?.value || 'sq.ft';
        const rate = parseFloat(node.querySelector('.est-rate')?.value || '');

        if (Number.isNaN(qty) || qty <= 0 || Number.isNaN(rate) || rate <= 0) continue;

        const costs = computeEstimateLine(category, qty, unit, rate);
        grandTotal += costs.total;
        lines.push({
            itemLabel: item || 'Untitled item',
            category,
            categoryLabel: ESTIMATE_CATEGORY_LABELS[category] || category,
            qty,
            unit,
            rate,
            ...costs
        });
    }

    if (lines.length === 0) {
        out.textContent = 'Enter valid quantity and rate in at least one product row.';
        lastEstimateSummary = null;
        return;
    }

    let activeColorName = null;
    let activeColorHex = null;
    const nameEl = document.getElementById('active-color-name');
    const hexEl = document.getElementById('active-color-hex');
    if (nameEl && hexEl && nameEl.textContent && nameEl.textContent !== '—' && hexEl.textContent && hexEl.textContent !== '—') {
        activeColorName = nameEl.textContent;
        activeColorHex = hexEl.textContent;
    }

    lastEstimateSummary = {
        lines,
        total: grandTotal,
        activeColorName,
        activeColorHex
    };

    let html = `<div><strong>${lines.length} product estimate</strong></div>`;
    lines.forEach((line, index) => {
        html += `<div class="est-result-line"><strong>${index + 1}. ${line.itemLabel}</strong> (${line.categoryLabel})</div>`;
        html += `<div class="est-result-sub">Effective quantity: ${line.effectiveQtyDesc}</div>`;
        html += `<div class="est-result-sub">Material: ${formatINR(line.materialCost)}</div>`;
        if (line.extraCost > 0 && line.extraLabel) {
            html += `<div class="est-result-sub">${line.extraLabel}: ${formatINR(line.extraCost)}</div>`;
        }
    });
    html += `<div class="est-grand-total"><strong>Grand Total: ${formatINR(grandTotal)}</strong></div>`;
    out.innerHTML = html;
}

function exportEstimatePdf() {
    if (!lastEstimateSummary) {
        runEstimate();
        if (!lastEstimateSummary) return;
    }

    const s = lastEstimateSummary;
    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`<!DOCTYPE html><html><head><title>PainterPro Estimate</title>
        <style>
            body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:32px;color:#111;background:#f7f5f1;}
            h1{font-size:22px;margin:0 0 4px;}
            h2{font-size:13px;margin:0 0 16px;color:#555;text-transform:uppercase;letter-spacing:1.5px;}
            .meta{margin:0 0 18px;font-size:12px;color:#555;}
            .meta div{margin:2px 0;}
            table{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px;}
            th,td{padding:8px 10px;border-bottom:1px solid #ddd;text-align:left;}
            th{text-transform:uppercase;font-size:11px;letter-spacing:1px;color:#555;background:#f0ede6;}
            tfoot td{border-top:1px solid #ccc;font-weight:600;}
            .right{text-align:right;}
        </style>
    </head><body>`);

    win.document.write('<h1>PainterPro Studio</h1>');
    win.document.write('<h2>Cost Estimate</h2>');
    win.document.write('<div class="meta">');
    win.document.write(`<div>Date: ${new Date().toLocaleDateString('en-IN')}</div>`);
    if (s.activeColorName && s.activeColorHex) {
        win.document.write(`<div>Current Finish: ${s.activeColorName} (${s.activeColorHex})</div>`);
    }
    win.document.write('</div>');

    win.document.write(`<table><thead><tr>
        <th>Description</th>
        <th class="right">Qty</th>
        <th>Unit</th>
        <th class="right">Rate</th>
        <th class="right">Amount</th>
    </tr></thead><tbody>`);

    s.lines.forEach((line) => {
        win.document.write(`<tr>
            <td>${line.categoryLabel} - ${line.itemLabel}</td>
            <td class="right">${line.qty}</td>
            <td>${line.unit}</td>
            <td class="right">${formatINR(line.rate)}</td>
            <td class="right">${formatINR(line.materialCost)}</td>
        </tr>`);
        if (line.extraCost > 0 && line.extraLabel) {
            win.document.write(`<tr>
                <td>${line.extraLabel}</td>
                <td class="right">-</td>
                <td></td>
                <td class="right"></td>
                <td class="right">${formatINR(line.extraCost)}</td>
            </tr>`);
        }
    });

    win.document.write(`</tbody><tfoot><tr>
        <td colspan="4" class="right">Grand Total</td>
        <td class="right">${formatINR(s.total)}</td>
    </tr></tfoot></table>`);

    win.document.write('</body></html>');
    win.document.close();
    win.focus();
    win.print();
}

function copyEstimateToClipboard() {
    if (!lastEstimateSummary) {
        runEstimate();
        if (!lastEstimateSummary) return;
    }

    const s = lastEstimateSummary;
    const lines = [];
    lines.push('PainterPro Estimate');
    if (s.activeColorName && s.activeColorHex) {
        lines.push(`Current Finish: ${s.activeColorName} (${s.activeColorHex})`);
    }
    s.lines.forEach((line, index) => {
        lines.push(`${index + 1}. ${line.itemLabel} (${line.categoryLabel})`);
        lines.push(`   Qty: ${line.qty} ${line.unit}, Rate: ${formatINR(line.rate)}`);
        lines.push(`   Material: ${formatINR(line.materialCost)}`);
        if (line.extraCost > 0 && line.extraLabel) {
            lines.push(`   ${line.extraLabel}: ${formatINR(line.extraCost)}`);
        }
    });
    lines.push(`Grand Total: ${formatINR(s.total)}`);

    const text = lines.join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => { });
        return;
    }

    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch (e) { }
    document.body.removeChild(ta);
}

function toggleEstimator() {
    const modal = document.getElementById('estimator-modal');
    if (!modal) return;
    modal.style.display = (modal.style.display === 'none' || modal.style.display === '') ? 'flex' : 'none';
}
// --- THEME SWITCHING ---
function toggleTheme() {
    const themeAttr = document.documentElement.getAttribute("data-theme");
    const newTheme = themeAttr === "light" ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", newTheme);
    document.body.setAttribute("data-theme", newTheme);
    localStorage.setItem("painter_pro_theme", newTheme);
}

// Ensure theme is applied on boot
(function initTheme() {
    const saved = localStorage.getItem("painter_pro_theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);
    document.body.setAttribute("data-theme", saved);

    const toggle = document.getElementById("theme-toggle");
    if (toggle) toggle.checked = (saved === "light");
})();

// --- HELP MODAL ---
function toggleHelp() {
    const modal = document.getElementById('help-modal');
    if (modal) {
        modal.style.display = (modal.style.display === 'none' || modal.style.display === '') ? 'flex' : 'none';
    }
}

// --- MATERIAL PROPERTY SLIDERS ---
function onTilingChange(value) {
    const v = parseFloat(value);
    document.getElementById('val-tiling').textContent = v.toFixed(1) + 'x';
    postToUnity({ action: 'SetTiling', payload: `${currentSelectedSlot}|${v}` });
}

function onRoughnessChange(value) {
    const v = parseFloat(value);
    document.getElementById('val-roughness').textContent = v.toFixed(2);
    postToUnity({ action: 'SetRoughness', payload: `${currentSelectedSlot}|${v}` });
}

function onMetallicChange(value) {
    const v = parseFloat(value);
    document.getElementById('val-metallic').textContent = v.toFixed(2);
    postToUnity({ action: 'SetMetallic', payload: `${currentSelectedSlot}|${v}` });
}

// --- 4K DOWNLOAD ---
// Sends CaptureScreenshot to Unity -> Unity renders at 4x -> jslib DownloadFile -> browser saves PNG
function download4K() {
    const btn = document.getElementById('btn-download-4k');

    if (btn) {
        // Use standard Unicode for Hourglass (⌛)
        btn.innerHTML = '&#8987;';
        btn.disabled = true;

        // Re-enable after 6s (enough time for Unity to capture + encode)
        setTimeout(() => {
            // Use standard Unicode for Camera (📷)
            btn.innerHTML = '&#128247;';
            btn.disabled = false;
        }, 6000);
    }

    postToUnity({ action: 'CaptureScreenshot' });
}
initLibrary();
initEstimator();

