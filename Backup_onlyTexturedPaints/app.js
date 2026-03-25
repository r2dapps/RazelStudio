// Razel Studio: Finish Pro
// Step 2: App Shell Workspace & JSLib Bridge Updates

window.activeColor = null;
window.activeProduct = null;
window.currentObjectName = null;
window.currentSelectedSlot = 0;

window.activeSmoothness = 0;
window.activeMetallic = 0;
window.activeTiling = 1.0;

const finishEffects = [
    { label: "Flat Matte", smooth: 0.05, metal: 0.0 },
    { label: "Eggshell / Satin", smooth: 0.35, metal: 0.0 },
    { label: "Polished Gloss", smooth: 0.85, metal: 0.1 },
    { label: "Metallic Sheen", smooth: 0.6, metal: 0.8 }
];

const tilingScales = [
    { label: "Micro", value: 2.0 },
    { label: "Standard", value: 1.0 },
    { label: "Large", value: 0.5 },
    { label: "Jumbo", value: 0.25 }
];

document.addEventListener('DOMContentLoaded', () => {
    setupUIEvents();
    setupUnityBridge();
    initCatalog();
});

function setupUnityBridge() {
    // Listen for Unity events sent from the iframe
    window.addEventListener('message', (e) => {
        const msg = e.data || {};

        if (msg.type === 'FromUnity') {
            if (msg.action === 'UnityReady') {
                showInstructions();
            } else if (msg.action === 'SceneLoaded') {
                hideBootLoader();
            } else if (msg.action === 'ObjectSelected') {
                handleObjectSelected(msg);
            } else if (msg.action === 'TextureApplied') {
                hideProcessingOverlay();
            } else if (msg.action === 'Process4KScreenshot') {
                window.generateBrandedExport(msg.payload);
            }
        }
    });

    // Simulated progress bar filler for visuals until UnityReady is received
    simulateBootProgress();
}

function simulateBootProgress() {
    const progressBarFill = document.getElementById('progress-bar-fill');
    let progress = 0;

    const interval = setInterval(() => {
        progress += (0.95 - progress) * 0.1;
        progressBarFill.style.width = (progress * 100) + "%";
        progressBarFill.dataset.intervalId = interval;
    }, 100);
}

function hideBootLoader() {
    const bootLoader = document.getElementById('boot-loader');
    const rootContainer = document.getElementById('root');
    const progressBarFill = document.getElementById('progress-bar-fill');

    const intervalId = progressBarFill.dataset.intervalId;
    if (intervalId) clearInterval(parseInt(intervalId));

    progressBarFill.style.width = "100%";

    setTimeout(() => {
        bootLoader.style.opacity = '0';
        bootLoader.style.transition = 'opacity 0.6s ease';

        setTimeout(() => {
            bootLoader.classList.add('hidden');
            rootContainer.classList.add('loaded');
        }, 600);
    }, 200);
}

function showInstructions() {
    const instructionsModal = document.getElementById('instructions-modal');
    setTimeout(() => {
        instructionsModal.classList.remove('hidden');
    }, 800);
}

function setupUIEvents() {
    const instructionsModal = document.getElementById('instructions-modal');
    const closeInstructionsBtn = document.getElementById('close-instructions');
    
    if (closeInstructionsBtn && instructionsModal) {
        closeInstructionsBtn.addEventListener('click', () => {
            instructionsModal.classList.add('hidden');
        });
        
        instructionsModal.addEventListener('click', (e) => {
            if (e.target === instructionsModal) {
                instructionsModal.classList.add('hidden');
            }
        });
    }

    const btnCloseInspector = document.getElementById('btn-close-inspector');
    if (btnCloseInspector) {
        btnCloseInspector.addEventListener('click', () => {
            const inspectorSidebar = document.getElementById('inspector-sidebar');
            if (inspectorSidebar) inspectorSidebar.classList.add('panel-closed');
            const escHint = document.getElementById('esc-hint');
            if (escHint) escHint.classList.add('hidden');
            postToUnity('ForceDeselect', '');
        });
    }

    // Mobile Bottom Tab Interactions Placeholder
    const navCatalog = document.getElementById('nav-catalog');
    const navInspector = document.getElementById('nav-inspector');
    const bottomSheet = document.getElementById('bottom-sheet');

    if (navCatalog && navInspector) {
        navCatalog.addEventListener('click', () => {
            navCatalog.classList.add('active');
            navInspector.classList.remove('active');
            bottomSheet.classList.add('open');
            // Populate sheet with catalog (Will be dynamically done in Step 3)
        });
        navInspector.addEventListener('click', () => {
            navInspector.classList.add('active');
            navCatalog.classList.remove('active');
            bottomSheet.classList.add('open');
            // Populate sheet with Inspector props
        });
    }
}

// -------------------------------------------------------------
// JSLib Communication Bridge (Supporting legacy jslib functions)
// -------------------------------------------------------------
function postToUnity(action, payload) {
    const iframe = document.getElementById('unity-iframe');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.postMessage({ type: 'FromParent', action, payload }, '*');
    } else {
        console.warn("Unity iframe not ready or missing.");
    }
}
function applySaaSFinish() {
    if (!window.activeProduct) return;

    // 1. Fetch attributes from the active product and UI state
    const params = window.activeProduct.rendering.parameters; // 
    const textureFolder = params.textureId || 'Default'; // 
    const hexColor = window.activeColor || '#FFFFFF'; // 

    // 2. Fetch curated PBR state
    const smoothness = window.activeSmoothness;
    const metallic = window.activeMetallic;

    // 3. Fetch Tiling and Normal Strength from JSON 
    let tiling = window.activeTiling; // 
    const normalStr = params.normalStrength || 1.0; // NEW: Added for depth 

    // 4. Standardize all values to 2 decimals for the pipe-protocol 
    const smoothStr = parseFloat(smoothness).toFixed(2); // 
    const metalStr = parseFloat(metallic).toFixed(2); // 
    
    // Tiling payload value calculated as (value / 10) to match engine scaling
    const normalizedTiling = parseFloat(tiling) / 10.0;
    const tilingStr = normalizedTiling.toFixed(2); // 
    
    const normStr = parseFloat(normalStr).toFixed(2); // NEW 
    const slot = window.currentSelectedSlot || 0;

    // 5. Updated SaaS Protocol Mapping: Added 7th parameter (normStr) 
    // Final Format: Slot|Path|Hex|Smooth|Metal|Tiling|NormalStrength
    const payload = `${slot}|StreamingAssets/TexturedPaints/${textureFolder}|${hexColor}|${smoothStr}|${metalStr}|${tilingStr}|${normStr}`;

    console.log("SaaS Production Payload:", payload); // 

    // 6. Show processing overlay and dispatch to Unity 
    const overlay = document.getElementById('import-overlay'); // 
    if (overlay) overlay.style.display = 'flex'; // 

    postToUnity('ApplySaaSFinish', payload); // 
}

// Handler for ObjectSelected triggered by Unity JSLib
function handleObjectSelected(msg) {
    console.log("Object Selected in Unity:", msg?.payload, "| matCount:", msg?.matCount);

    const inspectorSidebar = document.getElementById('inspector-sidebar');

    if (!msg.payload || msg.payload === "" || msg.matCount === 0) {
        document.getElementById('inspector-empty').classList.remove('hidden');
        document.getElementById('inspector-populated').classList.add('hidden');
        window.activeColor = null;
        window.activeProduct = null;
        window.currentObjectName = null;
        document.querySelectorAll('.catalog-item').forEach(el => el.classList.remove('active-item'));
        if (inspectorSidebar) inspectorSidebar.classList.add('panel-closed');
        const escHint = document.getElementById('esc-hint');
        if (escHint) escHint.classList.add('hidden');
        return;
    }

    if (inspectorSidebar) inspectorSidebar.classList.remove('panel-closed');
    const escHint = document.getElementById('esc-hint');
    if (escHint) escHint.classList.remove('hidden');
    document.getElementById('inspector-empty').classList.add('hidden');
    document.getElementById('inspector-populated').classList.remove('hidden');

    if (msg.payload !== window.currentObjectName) {
        window.activeColor = null;
        document.querySelectorAll('.active-chip').forEach(c => c.classList.remove('active-chip'));
        window.currentObjectName = msg.payload;
    }

    // Use 'msg.payload' for the name and 'msg.matCount' for slots
    document.getElementById('insp-title').innerText = msg.payload || 'Selected Wall';

    // Render dynamic Material Slot Selector
    const matSection = document.getElementById('material-section');
    const slotContainer = document.getElementById('slot-buttons');
    slotContainer.innerHTML = '';


    // Correctly access the matCount from the Unity message
    const matCount = msg.matCount || 1;
    if (matCount > 0) {
        matSection.classList.remove('hidden');

        const matPropsSection = document.getElementById('mat-props-section');
        if (matPropsSection) matPropsSection.classList.remove('hidden');

        if (window.currentSelectedSlot === undefined || window.currentSelectedSlot >= matCount) {
            window.currentSelectedSlot = 0;
        }

        for (let i = 0; i < matCount; i++) {
            const btn = document.createElement('button');
            btn.className = 'slot-btn';
            btn.innerText = `Slot ${i + 1}`;

            if (i === window.currentSelectedSlot) {
                btn.classList.add('active-slot');
            }

            btn.onclick = () => {
                document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('active-slot'));
                btn.classList.add('active-slot');
                window.currentSelectedSlot = i;
                console.log("Selected Slot:", window.currentSelectedSlot);

                // Triggers an update to Unity for the newly selected slot if a product is queued
                if (window.activeProduct) {
                    applySaaSFinish();
                }
            };
            slotContainer.appendChild(btn);
        }
    } else {
        matSection.classList.add('hidden');
    }
}

function hideProcessingOverlay() {
    const overlay = document.getElementById('import-overlay');
    if (overlay) overlay.style.display = 'none';
}

// Reusable Legacy API equivalents encapsulating postToUnity
window.restoreOriginals = function () {
    postToUnity('RestoreOriginals', '');
    window.activeColor = null;
    window.activeProduct = null;
    window.currentObjectName = null;
    document.querySelectorAll('.active-chip').forEach(c => c.classList.remove('active-chip'));
    document.querySelectorAll('.catalog-item').forEach(el => el.classList.remove('active-item'));
    const inspTitle = document.getElementById('insp-title');
    if (inspTitle) {
        inspTitle.innerText = "Restored Base Mesh";
        document.getElementById('insp-type').innerText = "Original State";
    }

    window.activeTiling = 1.0;
    window.activeSmoothness = 0;
    window.activeMetallic = 0;
    document.querySelectorAll('.btn-effect').forEach(b => b.classList.remove('active-effect'));

    const inspectorSidebar = document.getElementById('inspector-sidebar');
    if (inspectorSidebar) inspectorSidebar.classList.add('panel-closed');
    
    const escHint = document.getElementById('esc-hint');
    if (escHint) escHint.classList.add('hidden');
};

window.SetMaterialColor = function (hexStr) {
    postToUnity('SetMaterialColor', hexStr);
};

window.SetMaterialTexture = function (textureId) {
    const overlay = document.getElementById('import-overlay');
    if (overlay) overlay.style.display = 'flex';
    postToUnity('SetMaterialTexture', textureId);
};

window.SetTiling = function (value) {
    postToUnity('SetTiling', value);
};

window.SetRoughness = function (value) {
    postToUnity('SetRoughness', value);
};

window.SetMetallic = function (value) {
    postToUnity('SetMetallic', value);
};

// -------------------------------------------------------------
// Step 3 & 4: JSON Driven Catalog & Inspector Business Logic
// -------------------------------------------------------------
window.activeProduct = null;
window.activeColor = null;
window.currentSelectedSlot = 0;

function calculateCost(coveragePerUnit, basePrice) {
    if (!coveragePerUnit || coveragePerUnit <= 0) return 0;
    // Estimate for 100 sq.ft
    return (100 / coveragePerUnit) * basePrice;
}

function selectProduct(product) {
    window.activeProduct = product;
    document.getElementById('inspector-empty').classList.add('hidden');
    document.getElementById('inspector-populated').classList.remove('hidden');

    // Product Overview
    document.getElementById('insp-title').innerText = product.name;
    document.getElementById('insp-type').innerText = product.productType;

    // Shade Palette Rendering
    const paletteContainer = document.getElementById('insp-palette');
    paletteContainer.innerHTML = '';

    if (product.rendering && product.rendering.colorData && product.rendering.colorData.shadePalette) {
        product.rendering.colorData.shadePalette.forEach(shade => {
            const chip = document.createElement('div');
            chip.className = 'color-chip';
            chip.style.backgroundColor = shade.hex;
            chip.title = shade.label;

            if (window.activeColor === shade.hex) {
                chip.classList.add('active-chip');
            }

            chip.onclick = () => {
                if (chip.classList.contains('active-chip')) {
                    chip.classList.remove('active-chip');
                    window.activeColor = null;
                } else {
                    document.querySelectorAll('.color-chip').forEach(c => c.classList.remove('active-chip'));
                    chip.classList.add('active-chip');
                    window.activeColor = shade.hex;
                }
                console.log("Analytics - Switched Color:", window.activeColor);

                // Dispatch updated bridge string
                applySaaSFinish();
            };
            paletteContainer.appendChild(chip);
        });
    }

    // Material Effects Mapping
    const effectContainer = document.getElementById('effect-buttons');
    if (effectContainer) {
        effectContainer.innerHTML = '';
        
        // Auto-set initial properties from catalog payload
        if (product.rendering && product.rendering.parameters) {
            window.activeSmoothness = product.rendering.parameters.smoothness || 0;
            window.activeMetallic = product.rendering.parameters.metallic || 0;
        }

        // Generate discrete buttons
        finishEffects.forEach((effect) => {
            const btn = document.createElement('button');
            btn.className = 'btn-effect';
            btn.innerText = effect.label;
            
            // Predict if we hover over an exact preset based on catalog data
            if (Math.abs(window.activeSmoothness - effect.smooth) < 0.1 && 
                Math.abs(window.activeMetallic - effect.metal) < 0.1 ) {
                btn.classList.add('active-effect');
                
                // Perfect lock the underlying state to the rigid preset so no weird rounding issues happen
                window.activeSmoothness = effect.smooth;
                window.activeMetallic = effect.metal;
            }
            
            btn.onclick = () => {
                document.querySelectorAll('#effect-buttons .btn-effect').forEach(b => b.classList.remove('active-effect'));
                btn.classList.add('active-effect');
                
                window.activeSmoothness = effect.smooth;
                window.activeMetallic = effect.metal;
                applySaaSFinish();
            };
            effectContainer.appendChild(btn);
        });
    }

    // Tiling Scale Options
    const tilingContainer = document.getElementById('tiling-buttons');
    if (tilingContainer) {
        tilingContainer.innerHTML = '';
        if (product.rendering && product.rendering.parameters) {
            window.activeTiling = product.rendering.parameters.textureTiling || 1.0;
        }

        tilingScales.forEach((scale) => {
            const btn = document.createElement('button');
            btn.className = 'btn-effect';
            btn.innerText = scale.label;

            if (Math.abs(window.activeTiling - scale.value) < 0.1) {
                btn.classList.add('active-effect');
                window.activeTiling = scale.value;
            }

            btn.onclick = () => {
                document.querySelectorAll('#tiling-buttons .btn-effect').forEach(b => b.classList.remove('active-effect'));
                btn.classList.add('active-effect');
                window.activeTiling = scale.value;
                applySaaSFinish();
            };
            tilingContainer.appendChild(btn);
        });
    }

    // Variants Dropdown & Pricing Logic
    const variantSelect = document.getElementById('insp-variant-select');
    variantSelect.innerHTML = '';

    if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant, index) => {
            const opt = document.createElement('option');
            opt.value = index;
            opt.innerText = `${variant.label} (${variant.sku})`;
            variantSelect.appendChild(opt);
        });

        variantSelect.onchange = () => {
            const selectedVariant = product.variants[variantSelect.value];
            updateCost(selectedVariant);
        };
        updateCost(product.variants[0]);
    }

    // Designer Insights Layer
    if (product.analytics) {
        document.getElementById('insp-views').innerText = `👁 ${product.analytics.viewCount || 0} Views`;
        document.getElementById('insp-selects').innerText = `✔ ${product.analytics.selectionCount || 0} Selections`;
    }
}

function updateCost(variant) {
    const costValueEl = document.getElementById('insp-cost');
    if (variant && variant.pricing) {
        const est = calculateCost(variant.pricing.coveragePerUnit, variant.pricing.basePrice);
        // Display formatted INR (₹)
        const formatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(est);
        costValueEl.innerText = formatted;
    } else {
        costValueEl.innerText = '₹0';
    }
}

async function initCatalog() {
    const catalogList = document.getElementById('catalog-list');
    const bottomSheetContent = document.getElementById('sheet-content'); // For mobile rendering later

    // Clear hardcoded initial skeletons from HTML
    catalogList.innerHTML = '';

    // Append loading skeletons to UI iteratively
    for (let i = 0; i < 5; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'catalog-item skeleton-icon';
        catalogList.appendChild(skeleton);
    }

    try {
        const response = await fetch('DemoCatalog.json');
        if (!response.ok) throw new Error("Network response was not ok");
        const catalogData = await response.json();

        // Remove skeletons
        catalogList.innerHTML = '';

        // Map products
        catalogData.products.forEach(product => {
            const textureId = product.rendering.parameters.textureId;
            const imgPath = `webGLDemo/StreamingAssets/TexturedPaints/${textureId}/Preview.png`;

            const itemDiv = document.createElement('div');
            // Give it skeleton-icon initially so it shimmers before the image loads
            itemDiv.className = 'catalog-item skeleton-icon';

            // Build the CSS tooltip
            const tooltip = document.createElement('span');
            tooltip.className = 'tooltip-text';
            tooltip.innerText = product.name;
            itemDiv.appendChild(tooltip);

            // Preload the thumbnail image
            const imgParams = new Image();
            imgParams.onload = () => {
                itemDiv.classList.remove('skeleton-icon');
                itemDiv.style.backgroundImage = `url('${imgPath}')`;
            };
            imgParams.onerror = () => {
                // If it fails to load the file, remove animation and assign a color fallback
                itemDiv.classList.remove('skeleton-icon');
                itemDiv.style.backgroundColor = product.rendering.colorData.hex || '#333';
            };
            imgParams.src = imgPath;

            // Register Click Event
            itemDiv.onclick = () => {
                console.log("Selected Product:", product.productId);

                // Highlight active item visually
                document.querySelectorAll('.catalog-item').forEach(el => el.classList.remove('active-item'));
                itemDiv.classList.add('active-item');

                selectProduct(product);

                // Push standard data down the pipe
                applySaaSFinish();
            };

            // Append to DOM
            catalogList.appendChild(itemDiv);
        });

    } catch (error) {
        console.error("Failed to fetch DemoCatalog.json", error);
        catalogList.innerHTML = '<div class="placeholder-text">Failed to load catalog. Ensure server is running.</div>';
    }
}

// Mobile App Setup and Sliders
function bindSliders() {
    const tilingSlider = document.getElementById('slider-tiling');
    if (tilingSlider) {
        tilingSlider.addEventListener('input', function() {
            document.getElementById('val-tiling').innerText = parseFloat(this.value).toFixed(1) + 'x';
            if(typeof window.applySaaSFinish === 'function') window.applySaaSFinish();
        });
    }

    const smoothSlider = document.getElementById('insp-smoothness');
    if (smoothSlider) smoothSlider.addEventListener('input', window.applySaaSFinish);

    const metallicSlider = document.getElementById('insp-metallic');
    if (metallicSlider) metallicSlider.addEventListener('input', window.applySaaSFinish);
}

function initMobileUI() {
    const btnCat = document.getElementById('nav-catalog');
    const btnInsp = document.getElementById('nav-inspector');
    const sheet = document.getElementById('bottom-sheet');
    const sheetContent = document.getElementById('sheet-content');

    const catSidebar = document.getElementById('catalog-sidebar');
    const inspSidebar = document.getElementById('inspector-sidebar');
    
    let isSheetOpen = false;

    function openSheet(type) {
        sheet.classList.remove('hidden');
        void sheet.offsetWidth; // Reflow to trigger CSS transition
        sheet.classList.add('open');
        isSheetOpen = true;

        if (type === 'catalog') {
            if(btnCat) btnCat.classList.add('active');
            if(btnInsp) btnInsp.classList.remove('active');
            sheetContent.innerHTML = '';
            const cList = document.getElementById('catalog-list');
            if (cList) {
                // Style fix for horizontal layout in mobile if needed, but flex vertical is fine
                cList.style.flexDirection = 'row';
                cList.style.overflowX = 'auto';
                cList.style.gap = '16px';
                sheetContent.appendChild(cList);
            }
        } else {
            if(btnInsp) btnInsp.classList.add('active');
            if(btnCat) btnCat.classList.remove('active');
            sheetContent.innerHTML = '';
            const iContent = document.getElementById('inspector-content');
            if (iContent) sheetContent.appendChild(iContent);
        }
    }

    function closeSheet() {
        sheet.classList.remove('open');
        isSheetOpen = false;
        setTimeout(() => { 
            sheet.classList.add('hidden'); 
            
            // Return to parents for desktop resizing safety
            const cList = document.getElementById('catalog-list');
            if (cList && catSidebar) {
                cList.style.flexDirection = 'column';
                cList.style.overflowX = 'visible';
                catSidebar.appendChild(cList);
            }
            const iContent = document.getElementById('inspector-content');
            if (iContent && inspSidebar) {
                inspSidebar.appendChild(iContent);
            }
        }, 400); // Wait for CSS transform
    }

    if (btnCat && btnInsp) {
        btnCat.addEventListener('click', () => {
            if (isSheetOpen && btnCat.classList.contains('active')) { closeSheet(); return; }
            openSheet('catalog');
        });

        btnInsp.addEventListener('click', () => {
            if (isSheetOpen && btnInsp.classList.contains('active')) { closeSheet(); return; }
            openSheet('inspector');
        });

        const handle = document.querySelector('.sheet-handle');
        if (handle) handle.addEventListener('click', closeSheet);
    }
}

// Global expose and initialization
window.applySaaSFinish = applySaaSFinish;
document.addEventListener('DOMContentLoaded', () => {
    bindSliders();
    initMobileUI();

    const btn4k = document.getElementById('btn-4k-export');
    if (btn4k) {
        btn4k.onclick = () => {
            const overlay = document.getElementById('processing-overlay');
            if (overlay) {
                const textNode = overlay.querySelector('.processing-text');
                if (textNode) textNode.innerText = "Rendering 4K...";
                overlay.style.display = 'flex';
            }
            postToUnity('CaptureScreenshot', '');
        };
    }

    const btnInfo = document.getElementById('btn-info');
    if (btnInfo) {
        btnInfo.onclick = () => {
            const modal = document.getElementById('instructions-modal');
            if (modal) modal.classList.remove('hidden');
        };
    }
});

// Phase 4: Business Intelligence (Cart Array)
window.estimateCart = [];

window.addToEstimate = function(fromHeader = false) {
    if (!window.activeProduct || !window.activeProduct.variants || window.activeProduct.variants.length === 0) {
        if (!fromHeader) alert("Please select a material finish from the catalog first.");
        return;
    }

    const variantSelect = document.getElementById('insp-variant-select');
    const selectedVariantIndex = parseInt(variantSelect.value) || 0;
    const activeHex = window.activeColor || null;

    // Deduplication check
    const existingItem = window.estimateCart.find(i => 
        i.product.name === window.activeProduct.name && 
        i.variantIndex === selectedVariantIndex && 
        i.activeColor === activeHex
    );

    if (existingItem) {
        existingItem.qty += 100;
    } else {
        const smooth = window.activeSmoothness.toString();
        const metal = window.activeMetallic.toString();
        const tiling = window.activeTiling.toFixed(1) + 'x';

        const cartItem = {
            id: Date.now(),
            product: window.activeProduct,
            activeColor: activeHex,
            variantIndex: selectedVariantIndex,
            qty: 100, // default 100 sq.ft
            specs: { smooth, metal, tiling }
        };

        window.estimateCart.push(cartItem);
    }
    
    const modal = document.getElementById('estimator-modal');
    if (modal) {
        modal.classList.remove('hidden');
        window.renderCart();
    }
};

window.renderCart = function() {
    const container = document.getElementById('estimate-cart-container');
    const emptyMsg = document.getElementById('estimate-empty');
    const grandTotalEl = document.getElementById('estimate-grand-total');

    if (!container) return;

    if (window.estimateCart.length === 0) {
        container.innerHTML = '';
        emptyMsg.classList.remove('hidden');
        grandTotalEl.classList.add('hidden');
        return;
    }

    emptyMsg.classList.add('hidden');
    grandTotalEl.classList.remove('hidden');
    container.innerHTML = '';

    let grandTotal = 0;
    const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });

    window.estimateCart.forEach((item) => {
        const variant = item.product.variants[item.variantIndex];
        const rowRate = variant.pricing.basePrice / variant.pricing.coveragePerUnit;
        const rowTotal = rowRate * item.qty;
        grandTotal += rowTotal;

        const hexColorStr = item.activeColor ? item.activeColor : "Original";
        const swatchBg = item.activeColor ? item.activeColor : "#FFFFFF";

        let variantOptionsHtml = '';
        item.product.variants.forEach((v, vIndex) => {
            variantOptionsHtml += `<option value="${vIndex}" ${vIndex === item.variantIndex ? 'selected' : ''}>${v.label} (${v.sku})</option>`;
        });

        const rowHtml = `
            <div class="property-group" style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px; border: 1px solid rgba(200, 176, 138, 0.2); margin-bottom: 16px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <div style="font-family: var(--font-heading); color: var(--accent-gold); font-size: 1.1rem; margin-bottom: 4px;">
                            ${item.product.name}
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">
                            <span style="display:inline-block; width:10px; height:10px; background:${swatchBg}; border-radius:50%; vertical-align:middle; border:1px solid rgba(255,255,255,0.2);"></span> Tint: ${hexColorStr}
                        </div>
                    </div>
                    <button onclick="window.removeCartItem(${item.id})" style="background:transparent; border:none; color:#FF5555; cursor:pointer; font-size:1.2rem; outline:none;">&times;</button>
                </div>
                
                <div style="display:flex; gap: 12px; margin-top: 16px;">
                    <div style="flex:1;">
                        <label style="font-size:0.75rem; color:var(--text-secondary); display:block; margin-bottom:4px;">Quantity (Sq.Ft)</label>
                        <input type="number" value="${item.qty}" min="1" class="saas-dropdown" style="padding:6px; font-size:0.85rem;" onchange="window.updateCartQty(${item.id}, this.value)">
                    </div>
                    <div style="flex:2;">
                        <label style="font-size:0.75rem; color:var(--text-secondary); display:block; margin-bottom:4px;">Variant SKU</label>
                        <select class="saas-dropdown" style="padding:6px; font-size:0.85rem;" onchange="window.updateCartVariant(${item.id}, this.value)">
                            ${variantOptionsHtml}
                        </select>
                    </div>
                </div>
                
                <div style="margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px; text-align:right;">
                    <span style="font-size:0.8rem; color:var(--text-secondary); margin-right:8px;">Row Total:</span>
                    <strong style="color:#fff; font-size:1.1rem;">${formatter.format(rowTotal)}</strong>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', rowHtml);
    });

    grandTotalEl.innerText = `Grand Total: ${formatter.format(grandTotal)}`;
};

window.updateCartQty = function(id, newQty) {
    const item = window.estimateCart.find(i => i.id === id);
    if (item) {
        item.qty = parseFloat(newQty) || 0;
        window.renderCart();
    }
};

window.updateCartVariant = function(id, newIndex) {
    const item = window.estimateCart.find(i => i.id === id);
    if (item) {
        item.variantIndex = parseInt(newIndex);
        window.renderCart();
    }
};

window.removeCartItem = function(id) {
    window.estimateCart = window.estimateCart.filter(i => i.id !== id);
    window.renderCart();
};

window.toggleEstimator = function() {
    const modal = document.getElementById('estimator-modal');
    if (!modal) return;
    if (modal.classList.contains('hidden')) {
        if (window.activeProduct && window.activeProduct.variants && window.activeProduct.variants.length > 0) {
            window.addToEstimate(true); // Auto-push if actively inspecting
        } else {
            modal.classList.remove('hidden');
            window.renderCart();
        }
    } else {
        modal.classList.add('hidden');
    }
};

window.exportEstimatePdf = function() {
    if (window.estimateCart.length === 0) {
        alert("Your estimate cart is empty.");
        return;
    }

    const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
    const estimateId = "RS-" + Math.floor(Math.random() * 1000000);
    const dateStr = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    let rowsHtml = '';
    let grandTotal = 0;

    window.estimateCart.forEach(item => {
        const variant = item.product.variants[item.variantIndex];
        const ratePerSqFt = variant.pricing.basePrice / variant.pricing.coveragePerUnit;
        const rowTotal = ratePerSqFt * item.qty;
        grandTotal += rowTotal;

        const hexColor = item.activeColor || "#FFFFFF";

        rowsHtml += `
            <tr>
                <td>
                    <div style="display:flex; align-items:center;">
                        <span style="display: inline-block; width: 16px; height: 16px; border-radius: 50%; border: 1px solid #ccc; background-color: ${hexColor}; margin-right: 8px; vertical-align: middle;"></span>
                        <strong style="display:block;">${item.product.name}</strong>
                    </div>
                    <div style="font-size:11px; color:#666; margin-top:4px;">
                        PBR: Smooth ${item.specs.smooth} | Metal ${item.specs.metal} | Tiling ${item.specs.tiling}
                    </div>
                </td>
                <td>${variant.sku}</td>
                <td class="money">${item.qty}</td>
                <td class="money">${formatter.format(ratePerSqFt)}</td>
                <td class="money" style="color:#C8B08A;">${formatter.format(rowTotal)}</td>
            </tr>
        `;
    });

    const printWindow = window.open('', '', 'width=900,height=1000');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Quotation - ${estimateId}</title>
            <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@300;400;500&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
            <style>
                @media print {
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .pdf-container { box-shadow: none !important; margin: 0 !important; padding: 20px !important; }
                }
                body {
                    font-family: 'Inter', sans-serif;
                    background: #F9F9FB;
                    color: #161920;
                    margin: 0; padding: 40px;
                }
                .pdf-container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: #FFFFFF;
                    padding: 50px;
                    border-radius: 4px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .pdf-header {
                    display: flex; justify-content: space-between; align-items: flex-start;
                    border-bottom: 2px solid #C8B08A; padding-bottom: 20px; margin-bottom: 40px;
                }
                .brand-title { font-family: 'Fraunces', serif; font-size: 28px; color: #161920; letter-spacing: 1px; margin: 0 0 8px 0; }
                .doc-type { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #C8B08A; font-weight: 500; margin: 0; }
                .meta-details { text-align: right; font-size: 13px; color: #666; justify-content: flex-end;}
                .meta-details div { margin-bottom: 4px; }

                .financial-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                .financial-table th { 
                    text-align: left; padding: 16px 12px; font-size: 12px; text-transform: uppercase; 
                    letter-spacing: 1px; color: #666; border-bottom: 1px solid #E0E0E0; font-weight: 500;
                }
                .financial-table td { padding: 20px 12px; font-size: 14px; border-bottom: 1px solid #F0F0F0; color: #161920; }
                .financial-table td.money { text-align: right; font-family: 'Inter', sans-serif; font-weight: 500; }
                .financial-table th.money { text-align: right; }

                .total-row { background: #F9F9FB; }
                .total-row td { border-bottom: none; font-weight: 600; font-size: 16px; color: #161920; }
                .total-row td:first-child { text-align: right; padding-right: 24px; }
                
                .footer { text-align: center; margin-top: 60px; font-size: 11px; color: #A0A0A0; border-top: 1px solid #E0E0E0; padding-top: 20px; }
            </style>
        </head>
        <body>
            <div class="pdf-container">
                <div class="pdf-header">
                    <div>
                        <h1 class="brand-title">Razel Studio</h1>
                        <p class="doc-type">Official Quotation</p>
                    </div>
                    <div class="meta-details">
                        <div><strong>Date:</strong> ${dateStr}</div>
                        <div><strong>Estimate ID:</strong> ${estimateId}</div>
                    </div>
                </div>

                <table class="financial-table">
                    <thead>
                        <tr>
                            <th>Item Description</th>
                            <th>Variant SKU</th>
                            <th class="money">Qty (Sq.Ft)</th>
                            <th class="money">Rate</th>
                            <th class="money">Total Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                        <tr class="total-row">
                            <td colspan="4">Net Estimate Amount:</td>
                            <td class="money">${formatter.format(grandTotal)}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="footer">
                    This is an electronically generated estimate directly from the Razel Studio architectural rendering engine.<br>
                    Pricing is indicative and subject to final site inspection.
                </div>
            </div>
            
            <script>
                // Auto-print when fonts fully load
                setTimeout(() => { window.print(); }, 1200);
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
};

// Phase 5: Multi-Item Branded 4K Canvas Compositor
window.generateBrandedExport = async function(imageUrl) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.src = imageUrl;
    
    img.onload = () => {
        // Inherit 4K Resolution
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw native WebGL engine output
        ctx.drawImage(img, 0, 0);

        // Build data array dynamically
        const legendItems = [];
        if (window.estimateCart && window.estimateCart.length > 0) {
            window.estimateCart.forEach(item => {
                const variant = item.product.variants[item.variantIndex];
                legendItems.push({
                    name: item.product.name,
                    sku: variant.sku,
                    colorHex: item.activeColor || "transparent",
                    smooth: item.specs.smooth,
                    metal: item.specs.metal,
                    tiling: item.specs.tiling
                });
            });
        } else {
            // Fallback for single item if cart is purely empty
            const productName = window.activeProduct ? window.activeProduct.name : "Unspecified Architectural Finish";
            const activeHex = window.activeColor || "transparent"; 
            
            const smooth = window.activeSmoothness.toString();
            const metal = window.activeMetallic.toString();
            const tiling = window.activeTiling.toFixed(1) + 'x';
            
            legendItems.push({
                name: productName,
                sku: "N/A",
                colorHex: activeHex,
                smooth, metal, tiling
            });
        }
        
        const padding = 60;
        const rectWidth = 600;
        const itemHeight = 90;
        const headerHeight = 100;

        // Dynamic height based on legend line count
        const rectHeight = headerHeight + (legendItems.length * itemHeight) + 40;
        const rectX = canvas.width - rectWidth - padding;
        const rectY = canvas.height - rectHeight - padding;
        
        // Black transparent box backdrop
        ctx.fillStyle = 'rgba(20, 20, 24, 0.85)';
        ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
        
        // Gold border stroke
        ctx.strokeStyle = '#C8B08A';
        ctx.lineWidth = 4;
        ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.textBaseline = 'top';

        // Header Title
        ctx.font = 'bold 36px Fraunces, serif'; 
        ctx.fillText("Razel Studio", rectX + 40, rectY + 40);
        
        ctx.beginPath();
        ctx.moveTo(rectX + 40, rectY + headerHeight);
        ctx.lineTo(rectX + rectWidth - 40, rectY + headerHeight);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();

        let currentY = rectY + headerHeight + 30;

        // Iterative Render
        legendItems.forEach(item => {
            // Swatch dot
            ctx.beginPath();
            ctx.arc(rectX + 60, currentY + 16, 16, 0, 2 * Math.PI);
            ctx.fillStyle = item.colorHex;
            ctx.fill();
            ctx.strokeStyle = '#CCCCCC';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Name / SKU 
            ctx.fillStyle = '#C8B08A';
            ctx.font = 'normal 28px Fraunces, serif';
            ctx.fillText(`${item.name} (${item.sku})`, rectX + 90, currentY - 2);
            
            // Parametric Print
            ctx.fillStyle = '#E0E0E0';
            ctx.font = 'normal 18px Inter, sans-serif';
            ctx.fillText(`PBR specs: Smooth ${item.smooth}  |  Metal ${item.metal}  |  Tiling ${item.tiling}`, rectX + 90, currentY + 38);
            
            currentY += itemHeight;
        });
        
        // Force PNG Download
        const finalDataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = finalDataUrl;
        link.download = 'Razel_Studio_Multi_SpecSheet.png';
        link.click();
        
        // Clear RAM
        window.URL.revokeObjectURL(imageUrl);
        
        const overlay = document.getElementById('processing-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            const textNode = overlay.querySelector('.processing-text');
            if (textNode) textNode.innerText = "Processing Finish..."; // Reset text
        }
    };
    
    img.onerror = () => {
        console.error("Failed to load 4K screenshot onto HTML5 Canvas.");
        const overlay = document.getElementById('processing-overlay');
        if (overlay) overlay.style.display = 'none';
    };
};
