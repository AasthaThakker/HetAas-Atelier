// Global variables
let allProducts = [];
let cart = [];
let content = {};              // Loaded from content.json (single source of truth for copy)

// Escape untrusted/dynamic values before injecting into innerHTML (XSS defense-in-depth)
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Customizer Options Data (defaults; overridden by content.json when present)
let customizerData = {
    bases: [
        { id: 'bookmark', name: 'Bookmark', price: 100, emoji: '🔖', category: 'Bookmarks' },
        { id: 'coaster', name: 'Coaster', price: 250, emoji: '🍵', category: 'Coasters' },
        { id: 'keychain', name: 'Butterfly Keychain', price: 180, emoji: '🦋', category: 'Keychains' },
        { id: 'earrings', name: 'Earrings', price: 120, emoji: '💎', category: 'Earrings' },
        { id: 'thali', name: 'Pooja Thali', price: 1800, emoji: '🪔', category: 'Thali' },
        { id: 'decor-plate', name: 'Decor Plate (8-inch)', price: 800, emoji: '🏺', category: 'Decor' }
    ],
    colors: [
        { id: 'blue', name: 'Blue Tint', emoji: '🔹' },
        { id: 'white', name: 'White Swirl', emoji: '🐚' },
        { id: 'transparent', name: 'Transparent Clear', emoji: '💧' },
        { id: 'pink', name: 'Pink Tint', emoji: '🌸' },
        { id: 'green', name: 'Green Tint', emoji: '🍃' },
        { id: 'yellow', name: 'Yellow Tint', emoji: '💛' },
        { id: 'copper', name: 'Copper Sheen', emoji: '🪵' },
        { id: 'metal', name: 'Metal Shimmer', emoji: '🪙' }
    ],
    inclusions: [
        { id: 'gold-foil', name: 'Gold Foil', emoji: '✨' },
        { id: 'silver-foil', name: 'Silver Foil', emoji: '❄' },
        { id: 'pink-foil', name: 'Pink Foil', emoji: '💖' },
        { id: 'rose', name: 'Dried Rose', emoji: '🌹' },
        { id: 'marigold', name: 'Dried Marigold', emoji: '🌼' },
        { id: 'sticker', name: 'Aesthetic Sticker', emoji: '🏷️' },
        { id: 'pressed-flower', name: 'Pressed Flower', emoji: '🥀' },
        { id: 'none', name: 'None', emoji: '🚫' }
    ]
};

// Current Customizer Selections
let customSelections = {
    base: customizerData.bases[0],
    color: customizerData.colors[0],
    inclusion: customizerData.inclusions[0],
    addSticker: false,
    text: ''
};

// Dynamic SVG Placeholder Generator for missing product images
function getSvgPlaceholder(productName, category) {
    let icon = '✨';
    let color = '#fdf0f0'; // Default pink padded frame color
    
    if (category === 'Earrings') { icon = '💎'; }
    else if (category === 'Coasters') { icon = '🍵'; }
    else if (category === 'Bookmarks') { icon = '🔖'; }
    else if (category === 'Decor') { icon = '🏺'; }
    else if (category === 'Spiritual') { icon = '🕉️'; }
    else if (category === 'Thali') { icon = '🪔'; }
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
        <defs>
            <radialGradient id="grad-${category.replace(/\s+/g, '')}" cx="50%" cy="50%" r="50%">
                <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#fdf0f0;stop-opacity:1" />
            </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad-${category.replace(/\s+/g, '')})"/>
        <path d="M 50,50 Q 150,30 250,50 Q 270,150 250,250 Q 150,270 50,250 Q 30,150 50,50 Z" fill="none" stroke="#c89a90" stroke-width="2" stroke-dasharray="5,5" opacity="0.3"/>
        <text x="35" y="55" font-size="20" opacity="0.5">✨</text>
        <text x="245" y="65" font-size="16" opacity="0.5">🌸</text>
        <text x="45" y="245" font-size="18" opacity="0.5">🌸</text>
        <text x="245" y="245" font-size="22" opacity="0.5">✨</text>
        <circle cx="150" cy="125" r="45" fill="#ffffff" stroke="#c89a90" stroke-width="1.5" style="filter: drop-shadow(0px 6px 10px rgba(200,154,144,0.15))"/>
        <text x="150" y="140" font-size="44" text-anchor="middle">${icon}</text>
        <text x="150" y="205" font-family="'Playfair Display', Georgia, serif" font-size="17" font-weight="600" fill="#4a3e3d" text-anchor="middle">${productName}</text>
        <text x="150" y="224" font-family="'Quicksand', sans-serif" font-size="10" fill="#a39594" font-weight="700" letter-spacing="1.5" text-anchor="middle">${category.toUpperCase()}</text>
    </svg>`;
    
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Global Image Error Handler
window.handleImageError = function(imgElement, productName, category) {
    const name = productName || imgElement.getAttribute('data-name') || '';
    const cat = category || imgElement.getAttribute('data-category') || '';
    imgElement.src = getSvgPlaceholder(name, cat);
    imgElement.dataset.fallbackApplied = '1'; // Prevent infinite loops
    imgElement.onerror = null;
};

// Delegated (capture-phase) image error handling so no inline onerror attributes are
// needed (keeps a strict Content-Security-Policy possible). `error` does not bubble,
// so we listen in the capture phase on the document.
document.addEventListener('error', function (e) {
    const el = e.target;
    if (el && el.tagName === 'IMG' && el.dataset && el.dataset.fallback === 'product' && el.dataset.fallbackApplied !== '1') {
        window.handleImageError(el, el.dataset.name || '', el.dataset.category || '');
    }
}, true);

// ==========================================
// LOAD & DISPLAY PRODUCTS
// ==========================================

async function loadProducts() {
    await loadContent();

    try {
        const response = await fetch('products.json', { cache: 'no-cache' });
        if (!response.ok) throw new Error('Fetch failed');
        const data = await response.json();
        allProducts = (data.products || []).sort((a, b) => b.id - a.id);
    } catch (error) {
        // fetch() is blocked over file:// (double-click). Fall back to the generated data.js.
        if (window.__HETAAS_PRODUCTS__ && Array.isArray(window.__HETAAS_PRODUCTS__.products)) {
            console.info('Using local data.js fallback for products (opened via file://).');
            allProducts = window.__HETAAS_PRODUCTS__.products.slice().sort((a, b) => b.id - a.id);
        } else {
            console.warn('Unable to load products.json. Products will appear once you are back online.', error);
            allProducts = [];
        }
    }

    applyContent();
    buildCategoryFilters();
    displayProducts(allProducts);
    setupCategoryFilters();
    initCart();
    initCustomizer();
    initUIHandlers();
    injectProductJsonLd();
    initPwa();
    initAnalytics();
}

function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = '<p class="error">No creations to show right now. Please check back soon! 🌸</p>';
        return;
    }

    // Always sort so newest products (higher IDs) appear first at top
    const sortedProducts = [...products].sort((a, b) => b.id - a.id);

    sortedProducts.forEach((product, index) => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        // Cap the stagger: only the first few cards ease in sequentially, the
        // rest appear almost immediately so fast scrollers never hit a blank grid.
        productCard.style.animationDelay = `${Math.min(index, 6) * 0.04}s`;
        
        let featureTagHtml = '';
        if (product.bestseller) {
            featureTagHtml = `<div class="product-tag bestseller-tag">🔥 Bestseller</div>`;
        } else if (product.customizable) {
            featureTagHtml = `<div class="product-tag custom-tag">✨ Customizable</div>`;
        } else if (product.category === 'Spiritual' || product.category === 'Thali' || product.id >= 50) {
            featureTagHtml = `<div class="product-tag bestseller-tag">🔥 Bestseller</div>`;
        }
        
        const safeName = escapeHtml(product.name);
        const safeCat = escapeHtml(product.category);
        productCard.innerHTML = `
            <div class="product-image" data-action="quickview" data-id="${product.id}">
                ${featureTagHtml}
                <img src="${escapeHtml(product.image)}" alt="${safeName}" loading="lazy" decoding="async" width="400" height="400" data-fallback="product" data-name="${safeName}" data-category="${safeCat}">
                <div class="category-badge">${safeCat}</div>
            </div>
            <div class="product-info">
                <h3 data-action="quickview" data-id="${product.id}">${safeName}</h3>
                <p class="description">${escapeHtml(product.description)}</p>
                <div class="product-footer">
                    <span class="price">₹${escapeHtml(product.price)}</span>
                    <button data-action="${product.customizable ? 'quickview' : 'add'}" data-id="${product.id}" class="add-cart-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        ${product.customizable ? 'Customize ✨' : 'Add Basket'}
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(productCard);
    });
}

// Event delegation for dynamically-rendered controls (CSP-safe: no inline handlers).
function setupDelegation() {
    const grid = document.getElementById('productsGrid');
    if (grid && !grid.dataset.bound) {
        grid.dataset.bound = '1';
        grid.addEventListener('click', (e) => {
            const el = e.target.closest('[data-action]');
            if (!el || !grid.contains(el)) return;
            const id = Number(el.dataset.id);
            if (el.dataset.action === 'quickview') openQuickView(id);
            else if (el.dataset.action === 'add') addToCartById(id);
        });
    }

    const cartContainer = document.getElementById('cartItemsContainer');
    if (cartContainer && !cartContainer.dataset.bound) {
        cartContainer.dataset.bound = '1';
        cartContainer.addEventListener('click', (e) => {
            const el = e.target.closest('[data-action]');
            if (!el || !cartContainer.contains(el)) return;
            if (el.dataset.action === 'shop') {
                const overlay = document.getElementById('cartDrawerOverlay');
                if (overlay) overlay.classList.remove('open');
                document.body.style.overflow = '';
                const products = document.getElementById('products');
                if (products) products.scrollIntoView({ behavior: 'smooth' });
                return;
            }
            const index = Number(el.dataset.index);
            if (el.dataset.action === 'qty') changeCartQty(index, Number(el.dataset.change));
            else if (el.dataset.action === 'remove') removeCartItem(index);
        });
    }

    const modalBody = document.getElementById('modalBodyContent');
    if (modalBody && !modalBody.dataset.bound) {
        modalBody.dataset.bound = '1';
        modalBody.addEventListener('click', (e) => {
            const el = e.target.closest('.related-card[data-action="quickview"]');
            if (!el || !modalBody.contains(el)) return;
            openQuickView(Number(el.dataset.id));
            const modalContainer = modalBody.closest('.modal-container');
            if (modalContainer) modalContainer.scrollTop = 0;
        });
    }

    const searchList = document.getElementById('searchResultsList');
    if (searchList && !searchList.dataset.bound) {
        searchList.dataset.bound = '1';
        searchList.addEventListener('click', (e) => {
            const el = e.target.closest('[data-action="quickview"]');
            if (!el || !searchList.contains(el)) return;
            const searchOverlay = document.getElementById('searchOverlay');
            if (searchOverlay) searchOverlay.classList.remove('open');
            openQuickView(Number(el.dataset.id));
        });
    }
}

// Category filter button binds
function setupCategoryFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const category = btn.getAttribute('data-filter');
            if (category === 'all') {
                displayProducts(allProducts);
            } else {
                const filtered = allProducts.filter(p => p.category === category);
                displayProducts(filtered);
            }
        });
    });
}

// ==========================================
// CART STATE MANAGEMENT
// ==========================================

function initCart() {
    const savedCart = localStorage.getItem('hetaas_cart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (e) {
            cart = [];
        }
    }
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('hetaas_cart', JSON.stringify(cart));
    updateCartUI();
}

function getCartTotalQuantity() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function addToCartById(productId, qty = 1, customName = '') {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    // Check combined limit of 15 items
    const currentTotal = getCartTotalQuantity();
    if (currentTotal + qty > 15) {
        showToast('Combined basket limit reached! You can only order up to 15 items. 🌸', '⚠️');
        return;
    }
    
    const existingItem = cart.find(item => item.product.id === productId && !item.isCustom && (item.customName || '') === (customName || ''));
    if (existingItem) {
        existingItem.quantity += qty;
    } else {
        cart.push({
            product: product,
            quantity: qty,
            isCustom: false,
            customName: customName || null,
            customization: null
        });
    }
    
    saveCart();
    showToast(`Added "${product.name}"${customName ? ` (${customName})` : ''} to basket! 🌸`);
    triggerCartBounce();
}

window.addToCartById = addToCartById; // Expose globally

function updateCartUI() {
    const cartCountBadge = document.getElementById('cartBadgeCount');
    const floatCartBadge = document.getElementById('floatingCartBadgeCount');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartTotalDisplay = document.getElementById('cartTotal');
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountBadge.textContent = totalItems;
    floatCartBadge.textContent = totalItems;
    
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-message">
                <span>🧺</span>
                <p>Your basket is empty!</p>
                <p style="font-size: 0.8rem;">Discover handmade resin treasures &mdash; there's something for everyone. 🌸</p>
                <button class="empty-cart-cta" data-action="shop">Shop the Collection</button>
            </div>
        `;
        cartTotalDisplay.textContent = '₹0';
        return;
    }
    
    let subtotal = 0;
    
    cart.forEach((item, index) => {
        const itemTotal = item.product.price * item.quantity;
        subtotal += itemTotal;
        
        const cartItemEl = document.createElement('div');
        cartItemEl.className = 'cart-item';
        
        // Image setup
        let imageHtml = '';
        if (item.isCustom) {
            imageHtml = `<img class="cart-item-img" src="${escapeHtml(item.product.image)}" alt="Customized item">`;
        } else {
            imageHtml = `<img class="cart-item-img" src="${escapeHtml(item.product.image)}" alt="${escapeHtml(item.product.name)}" data-fallback="product" data-name="${escapeHtml(item.product.name)}" data-category="${escapeHtml(item.product.category)}">`;
        }

        // Customization details text representation
        let customDetailsHtml = '';
        if (item.isCustom && item.customization) {
            customDetailsHtml = `
                <div class="cart-item-customization">
                    Tint: ${escapeHtml(item.customization.color)}<br>
                    Accents: ${escapeHtml(item.customization.inclusion)}
                    ${item.customization.text ? `<br>Sticker: "${escapeHtml(item.customization.text)}" (+₹90)` : ''}
                </div>
            `;
        } else if (item.customName) {
            customDetailsHtml = `
                <div class="cart-item-customization">
                    Custom Name: "${escapeHtml(item.customName)}"
                </div>
            `;
        }
        
        cartItemEl.innerHTML = `
            ${imageHtml}
            <div class="cart-item-details">
                <h4>${escapeHtml(item.product.name)}</h4>
                ${customDetailsHtml}
                <div class="cart-item-price">₹${escapeHtml(item.product.price)}</div>
                <div class="cart-item-qty">
                    <button data-action="qty" data-index="${index}" data-change="-1" aria-label="Decrease quantity">-</button>
                    <span>${item.quantity}</span>
                    <button data-action="qty" data-index="${index}" data-change="1" aria-label="Increase quantity">+</button>
                </div>
            </div>
            <button class="remove-cart-item" data-action="remove" data-index="${index}" aria-label="Remove item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        `;
        
        cartItemsContainer.appendChild(cartItemEl);
    });
    
    cartTotalDisplay.textContent = `₹${subtotal}`;
}

function changeCartQty(index, change) {
    if (cart[index]) {
        // Check combined limit of 15 items if increasing quantity
        if (change > 0) {
            const currentTotal = getCartTotalQuantity();
            if (currentTotal + change > 15) {
                showToast('Combined basket limit reached! You can only order up to 15 items. 🌸', '⚠️');
                return;
            }
        }
        
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        saveCart();
    }
}
window.changeCartQty = changeCartQty;

function removeCartItem(index) {
    if (cart[index]) {
        showToast(`Removed "${cart[index].product.name}" from basket`);
        cart.splice(index, 1);
        saveCart();
    }
}
window.removeCartItem = removeCartItem;

function triggerCartBounce() {
    const btn = document.getElementById('floatingCartBtn');
    btn.classList.add('bounce');
    setTimeout(() => {
        btn.classList.remove('bounce');
    }, 600);
}

// ==========================================
// CUSTOMIZER LOGIC
// ==========================================

function initCustomizer() {
    // Re-sync default selections to the (possibly content-overridden) option lists
    if (customizerData.bases && customizerData.bases[0]) customSelections.base = customizerData.bases[0];
    if (customizerData.colors && customizerData.colors[0]) customSelections.color = customizerData.colors[0];
    if (customizerData.inclusions && customizerData.inclusions[0]) customSelections.inclusion = customizerData.inclusions[0];
    renderCustomizerOptions();
    
    // Add sticker checkbox listener
    const stickerCheckbox = document.getElementById('addStickerCheckbox');
    const txtInput = document.getElementById('customText');
    
    stickerCheckbox.addEventListener('change', (e) => {
        customSelections.addSticker = e.target.checked;
        if (customSelections.addSticker) {
            txtInput.disabled = false;
            txtInput.focus();
        } else {
            txtInput.disabled = true;
            txtInput.value = '';
            customSelections.text = '';
        }
        updateCustomizerPreview();
    });
    
    // Custom Text listener
    txtInput.addEventListener('input', (e) => {
        customSelections.text = e.target.value.trim();
        updateCustomizerPreview();
    });
    
    // Add custom to basket button trigger
    const addBtn = document.getElementById('addCustomBtn');
    addBtn.addEventListener('click', addCustomItemToCart);
    
    updateCustomizerPreview();
}

function renderCustomizerOptions() {
    // 1. Base Shape Items
    const baseGrid = document.getElementById('baseItemGrid');
    baseGrid.innerHTML = '';
    customizerData.bases.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = `option-card ${idx === 0 ? 'selected' : ''}`;
        card.onclick = () => selectCustomizerOption('base', item, card);
        card.innerHTML = `
            <span class="option-emoji">${item.emoji}</span>
            <span class="option-name">${item.name}</span>
            <span class="option-price">₹${item.price}</span>
        `;
        baseGrid.appendChild(card);
    });

    // 2. Color Tint Options
    const colorGrid = document.getElementById('bgStyleGrid');
    colorGrid.innerHTML = '';
    customizerData.colors.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = `option-card ${idx === 0 ? 'selected' : ''}`;
        card.onclick = () => selectCustomizerOption('color', item, card);
        card.innerHTML = `
            <span class="option-emoji">${item.emoji}</span>
            <span class="option-name">${item.name}</span>
            <span class="option-price">Free</span>
        `;
        colorGrid.appendChild(card);
    });

    // 3. Dried Floral Inclusions
    const incGrid = document.getElementById('inclusionsGrid');
    incGrid.innerHTML = '';
    customizerData.inclusions.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = `option-card ${idx === 0 ? 'selected' : ''}`;
        card.onclick = () => selectCustomizerOption('inclusion', item, card);
        card.innerHTML = `
            <span class="option-emoji">${item.emoji}</span>
            <span class="option-name">${item.name}</span>
            <span class="option-price"></span>
        `;
        incGrid.appendChild(card);
    });
}

function selectCustomizerOption(type, option, cardElement) {
    const siblings = cardElement.parentNode.querySelectorAll('.option-card');
    siblings.forEach(s => s.classList.remove('selected'));
    
    cardElement.classList.add('selected');
    customSelections[type] = option;
    
    updateCustomizerPreview();
}

function calculateCustomizerPrice() {
    let price = customSelections.base.price;
    // Add metallic name sticker fee (+₹90)
    if (customSelections.addSticker) {
        price += 90;
    }
    return price;
}

function updateCustomizerPreview() {
    const detailList = document.getElementById('previewDetailList');
    const priceDisplay = document.getElementById('customPrice');
    const currentPrice = calculateCustomizerPrice();
    
    priceDisplay.textContent = `₹${currentPrice}`;
    
    detailList.innerHTML = `
        <div class="preview-item">
            <span class="preview-label">Base Shape:</span>
            <span class="preview-val">${customSelections.base.emoji} ${customSelections.base.name} (₹${customSelections.base.price})</span>
        </div>
        <div class="preview-item">
            <span class="preview-label">Background Tint:</span>
            <span class="preview-val">${customSelections.color.emoji} ${customSelections.color.name}</span>
        </div>
        <div class="preview-item">
            <span class="preview-label">Dried Florals/Foil:</span>
            <span class="preview-val">${customSelections.inclusion.emoji} ${customSelections.inclusion.name}</span>
        </div>
        <div class="preview-item">
            <span class="preview-label">Name Sticker:</span>
            <span class="preview-val">
                ${customSelections.addSticker
                    ? `Golden Metallic Lettering (+₹90) ${customSelections.text ? `"${escapeHtml(customSelections.text)}"` : ''}`
                    : 'None'}
            </span>
        </div>
    `;
}

function addCustomItemToCart() {
    const price = calculateCustomizerPrice();
    const name = `Custom Resin ${customSelections.base.name}`;
    
    if (customSelections.addSticker && !customSelections.text) {
        showToast('Please type a name/initial for the metallic sticker!', '⚠️');
        document.getElementById('customText').focus();
        return;
    }
    
    // Check combined limit of 15 items
    const currentTotal = getCartTotalQuantity();
    if (currentTotal + 1 > 15) {
        showToast('Combined basket limit reached! You can only order up to 15 items. 🌸', '⚠️');
        return;
    }
    
    const placeholderUrl = getSvgPlaceholder(name, customSelections.base.category);
    
    const customProductObj = {
        id: `custom-${Date.now()}`,
        name: name,
        price: price,
        category: customSelections.base.category,
        image: placeholderUrl,
        description: `Bespoke resin creation. Tint color: ${customSelections.color.name}, Accents: ${customSelections.inclusion.name}.`
    };
    
    cart.push({
        product: customProductObj,
        quantity: 1,
        isCustom: true,
        customization: {
            color: customSelections.color.name,
            inclusion: customSelections.inclusion.name,
            sticker: customSelections.addSticker,
            text: customSelections.text
        }
    });
    
    saveCart();
    showToast(`Added custom ${customSelections.base.name} to basket! 🌸`);
    triggerCartBounce();
    
    // Reset Customizer fields
    document.getElementById('addStickerCheckbox').checked = false;
    const txtInput = document.getElementById('customText');
    txtInput.value = '';
    txtInput.disabled = true;
    
    customSelections.addSticker = false;
    customSelections.text = '';
    
    const siblingCards = document.querySelectorAll('.customizer-steps .option-card');
    siblingCards.forEach(card => card.classList.remove('selected'));
    
    renderCustomizerOptions(); 
    updateCustomizerPreview();
}

// ==========================================
// PRODUCT QUICK VIEW MODAL
// ==========================================

function getResinCareTips(category) {
    if (category === 'Earrings') {
        return {
            dimensions: 'Size: Approx 1.5 - 2 inches length. Light as a feather!',
            care: 'Keep in dry jewelry pouch. Avoid direct contact with alcohol-based perfumes.'
        };
    } else if (category === 'Coasters') {
        return {
            dimensions: 'Size: Single coaster (Approx 4x4 inches). Slender profile.',
            care: 'Do not place hot pots/pans directly off the stove. Wipe clean with a damp microfiber cloth.'
        };
    } else if (category === 'Bookmarks') {
        return {
            dimensions: 'Size: 5.5 x 1 inch. Includes decorative tassel.',
            care: 'Avoid bending or loading under heavy objects. Keep out of extreme heat.'
        };
    } else if (category === 'Thali') {
        return {
            dimensions: 'Size: Approx 8 - 10 inches scalloped handcrafted Pooja Thali.',
            care: 'Wipe gently with a soft microfiber cloth. Do not place direct open flame directly on the resin surface.'
        };
    } else if (category === 'Spiritual') {
        return {
            dimensions: 'Size: 9 cm (Length) x 8.5 cm (Width) handcrafted resin stand idol.',
            care: 'Dust gently with a dry or slightly damp microfiber cloth. Keep in a sacred, clean space.'
        };
    } else {
        return {
            dimensions: 'Size: Handcrafted sizing details vary per creation.',
            care: 'Hand wash only in cool water with mild soap. Do not scrub with wire. No microwave.'
        };
    }
}

function openQuickView(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const modalBody = document.getElementById('modalBodyContent');
    const careSpecs = getResinCareTips(product.category);
    
    const imageList = (product.images && product.images.length > 0) ? product.images : [product.image];
    
    let imgContainerHtml = '';
    if (imageList.length > 1) {
        const slidesHtml = imageList.map((imgSrc, idx) => `
            <div class="modal-slide">
                <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(product.name)} - View ${idx + 1}" loading="lazy" decoding="async" data-fallback="product" data-name="${escapeHtml(product.name)}" data-category="${escapeHtml(product.category)}">
            </div>
        `).join('');

        const dotsHtml = imageList.map((_, idx) => `
            <span class="slider-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>
        `).join('');

        imgContainerHtml = `
            <div class="modal-img-container">
                <div class="modal-slider" id="modalSlider">
                    <div class="modal-slides" id="modalSlides">
                        ${slidesHtml}
                    </div>
                    <button class="slider-arrow slider-prev" id="sliderPrevBtn" aria-label="Previous Image">‹</button>
                    <button class="slider-arrow slider-next" id="sliderNextBtn" aria-label="Next Image">›</button>
                    <div class="slider-dots" id="sliderDots">
                        ${dotsHtml}
                    </div>
                </div>
            </div>
        `;
    } else {
        imgContainerHtml = `
            <div class="modal-img-container">
                <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" decoding="async" data-fallback="product" data-name="${escapeHtml(product.name)}" data-category="${escapeHtml(product.category)}">
            </div>
        `;
    }

    // Related products (same category, excluding this one)
    const related = allProducts
        .filter(p => p.category === product.category && p.id !== product.id && !String(p.id).startsWith('custom-'))
        .slice(0, 4);
    let relatedHtml = '';
    if (related.length > 0) {
        relatedHtml = `
            <div class="modal-related">
                <h4 class="related-title">You might also like 🌸</h4>
                <div class="related-grid">
                    ${related.map(r => `
                        <div class="related-card" data-action="quickview" data-id="${r.id}">
                            <img src="${escapeHtml(r.image)}" alt="${escapeHtml(r.name)}" loading="lazy" decoding="async" data-fallback="product" data-name="${escapeHtml(r.name)}" data-category="${escapeHtml(r.category)}">
                            <span class="related-name">${escapeHtml(r.name)}</span>
                            <span class="related-price">₹${escapeHtml(r.price)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    modalBody.innerHTML = `
        ${imgContainerHtml}
        <div class="modal-content-panel">
            <span class="modal-badge">${escapeHtml(product.category)}</span>
            <h2 class="modal-title">${escapeHtml(product.name)}</h2>
            <div class="modal-price">₹${escapeHtml(product.price)}</div>
            <p class="modal-desc">${escapeHtml(product.description)}</p>

            <div class="modal-care-guide">
                <h4 class="care-title">🌸 Dimensions & Care Guide</h4>
                <p class="care-text" style="margin-bottom: 4px;"><strong>Dimensions:</strong> ${careSpecs.dimensions}</p>
                <p class="care-text"><strong>Care:</strong> ${careSpecs.care}</p>
            </div>
            
            ${product.customizable ? `
                <div class="modal-custom-name-box" style="margin: 14px 0; padding: 12px; background: rgba(200, 154, 144, 0.12); border-radius: 14px; border: 1.5px dashed var(--color-accent);">
                    <label for="modalCustomNameInput" style="display: block; font-weight: 700; font-size: 0.9rem; margin-bottom: 6px; color: var(--color-text-dark);">
                        ✍️ Personalize Name / Inscription (included):
                    </label>
                    <input type="text" id="modalCustomNameInput" placeholder="e.g. Ms. Mohona" style="width: 100%; padding: 10px 14px; border: 1.5px solid var(--color-primary-dark); border-radius: 10px; font-family: inherit; font-size: 0.95rem; outline: none; background: #ffffff;">
                </div>
            ` : ''}
            
            <div class="modal-action-row">
                <div class="modal-qty-selector">
                    <button class="qty-btn" id="modalQtyMinus">-</button>
                    <span class="qty-val" id="modalQtyVal">1</span>
                    <button class="qty-btn" id="modalQtyPlus">+</button>
                </div>
                <button class="modal-add-btn" id="modalAddBtn">
                    Add to Basket 🌸
                </button>
            </div>
            ${relatedHtml}
        </div>
    `;
    
    if (imageList.length > 1) {
        let currentIndex = 0;
        const slides = document.getElementById('modalSlides');
        const dots = document.querySelectorAll('.slider-dot');

        const goToSlide = (index) => {
            if (index < 0) index = imageList.length - 1;
            if (index >= imageList.length) index = 0;
            currentIndex = index;
            slides.style.transform = `translateX(-${currentIndex * 100}%)`;
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
            });
        };

        document.getElementById('sliderPrevBtn').onclick = (e) => {
            e.stopPropagation();
            goToSlide(currentIndex - 1);
        };
        document.getElementById('sliderNextBtn').onclick = (e) => {
            e.stopPropagation();
            goToSlide(currentIndex + 1);
        };
        dots.forEach(dot => {
            dot.onclick = (e) => {
                e.stopPropagation();
                const idx = parseInt(dot.getAttribute('data-index'), 10);
                goToSlide(idx);
            };
        });

        // Touch Swipe Gesture Listener
        let touchStartX = 0;
        let touchEndX = 0;
        const sliderEl = document.getElementById('modalSlider');

        sliderEl.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        sliderEl.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 35) {
                if (diff > 0) {
                    goToSlide(currentIndex + 1);
                } else {
                    goToSlide(currentIndex - 1);
                }
            }
        }, { passive: true });
    }
    
    let qty = 1;
    const qtyVal = document.getElementById('modalQtyVal');
    
    document.getElementById('modalQtyMinus').onclick = () => {
        if (qty > 1) {
            qty--;
            qtyVal.textContent = qty;
        }
    };
    
    document.getElementById('modalQtyPlus').onclick = () => {
        qty++;
        qtyVal.textContent = qty;
    };
    
    document.getElementById('modalAddBtn').onclick = () => {
        let customName = '';
        if (product.customizable) {
            const nameInput = document.getElementById('modalCustomNameInput');
            if (nameInput) {
                customName = nameInput.value.trim();
            }
        }
        addToCartById(product.id, qty, customName);
        closeQuickView();
    };
    
    const modalOverlay = document.getElementById('quickViewOverlay');
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeQuickView() {
    const modalOverlay = document.getElementById('quickViewOverlay');
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

// ==========================================
// CLIPBOARD CHECKOUT & ORDER COMPILING
// ==========================================

function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        let successful = false;
        try {
            successful = document.execCommand('copy');
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }
        document.body.removeChild(textArea);
        return successful ? Promise.resolve() : Promise.reject('Fallback copy failed');
    }
}

function handleCheckout() {
    if (cart.length === 0) return;
    
    let message = "Hi HetAas Atelier! 🌸 I would love to place a pre-paid order:\n\n";
    message += "--------------------------------------\n";
    
    cart.forEach(item => {
        message += `• ${item.quantity}x ${item.product.name} (₹${item.product.price} each)\n`;
        if (item.isCustom && item.customization) {
            message += `  - Base shape: ${item.product.category}\n`;
            message += `  - Tint color: ${item.customization.color}\n`;
            message += `  - Florals/Accents: ${item.customization.inclusion}\n`;
            if (item.customization.sticker) {
                message += `  - Metallic Name: "${item.customization.text}"\n`;
            }
        } else if (item.customName) {
            message += `  - Custom Name / Inscription: "${item.customName}"\n`;
        }
        message += "\n";
    });
    
    message += "--------------------------------------\n";
    
    const notes = document.getElementById('cartNotes').value.trim();
    if (notes) {
        message += `Special Instructions:\n"${notes}"\n\n`;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    message += `Basket Subtotal: ₹${subtotal}\n`;
    message += "--------------------------------------\n";
    message += "⚠️ ORDER AGREEMENT & POLICIES:\n";
    message += "• Pre-paid orders accepted only.\n";
    message += "• Custom curing takes 3 to 4 days before shipping.\n";
    message += "• Delivery cost is borne entirely by the buyer (self-pickup in Ahmedabad is free).\n";
    message += "• Customized items - no returns/refunds/exchanges.\n";
    message += "--------------------------------------\n\n";
    message += "Please verify availability and share payment details! ✨";
    
    copyTextToClipboard(message).then(() => {
        const codeBox = document.getElementById('checkoutCodeBox');
        codeBox.textContent = message;
        
        document.getElementById('cartDrawerOverlay').classList.remove('open');
        
        const popup = document.getElementById('checkoutPopupOverlay');
        popup.classList.add('open');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        // Force-open the popup anyway so they can see the details and try manual copy
        const codeBox = document.getElementById('checkoutCodeBox');
        codeBox.textContent = message;
        
        document.getElementById('cartDrawerOverlay').classList.remove('open');
        
        const popup = document.getElementById('checkoutPopupOverlay');
        popup.classList.add('open');
        showToast('Auto-copy failed. Please manually copy the order details below! 🌸', '⚠️');
    });
}

// ==========================================
// SEARCH & PROFILE UI INTERACTIONS
// ==========================================

function initSearchAndProfile() {
    const searchOverlay = document.getElementById('searchOverlay');
    const searchInput = document.getElementById('searchBarInput');
    const searchResultsList = document.getElementById('searchResultsList');
    
    document.getElementById('searchBtn').onclick = () => {
        searchOverlay.classList.add('open');
        searchInput.value = '';
        searchResultsList.innerHTML = '';
        setTimeout(() => searchInput.focus(), 100);
    };
    
    const closeSearch = () => {
        searchOverlay.classList.remove('open');
    };
    document.getElementById('closeSearchBtn').onclick = closeSearch;
    searchOverlay.onclick = (e) => {
        if (e.target === searchOverlay) closeSearch();
    };
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        searchResultsList.innerHTML = '';
        
        if (query.length < 2) return;
        
        const matches = allProducts.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.category.toLowerCase().includes(query) || 
            p.description.toLowerCase().includes(query)
        ).sort((a, b) => b.id - a.id);
        
        if (matches.length === 0) {
            searchResultsList.innerHTML = '<p class="error" style="padding: 10px;">No matching creations found</p>';
            return;
        }
        
        matches.forEach(product => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.setAttribute('data-action', 'quickview');
            item.setAttribute('data-id', product.id);
            item.innerHTML = `
                <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" data-fallback="product" data-name="${escapeHtml(product.name)}" data-category="${escapeHtml(product.category)}">
                <div class="search-result-details">
                    <h5>${escapeHtml(product.name)}</h5>
                    <span>₹${escapeHtml(product.price)} - in ${escapeHtml(product.category)}</span>
                </div>
            `;
            searchResultsList.appendChild(item);
        });
    });
    
    document.getElementById('profileBtn').onclick = () => {
        showToast('Guest checkout active - account system offline! 🌸');
    };
}

// ==========================================
// FAQ ACCORDIONS & REVIEW SLIDER
// ==========================================

function setupAccordions() {
    const faqCards = document.querySelectorAll('.faq-card');
    faqCards.forEach(card => {
        const question = card.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = card.classList.contains('active');
            faqCards.forEach(c => c.classList.remove('active'));
            if (!isActive) {
                card.classList.add('active');
            }
        });
    });
}

let currentReviewIndex = 0;
let reviewSlides = [];
let reviewsTimer = null;

function setupReviews() {
    reviewSlides = document.querySelectorAll('.review-slide');
    const dotsContainer = document.getElementById('reviewsDots');
    const prevBtn = document.getElementById('reviewsPrev');
    const nextBtn = document.getElementById('reviewsNext');

    if (reviewsTimer) { clearInterval(reviewsTimer); reviewsTimer = null; }

    // Nothing to rotate (no reviews yet, or controls hidden for a single review)
    if (reviewSlides.length === 0 || !dotsContainer || !prevBtn || !nextBtn) {
        return;
    }

    dotsContainer.innerHTML = '';
    reviewSlides.forEach((slide, idx) => {
        const dot = document.createElement('span');
        dot.className = `reviews-dot ${idx === 0 ? 'active' : ''}`;
        dot.onclick = () => showReview(idx);
        dotsContainer.appendChild(dot);
    });

    prevBtn.onclick = () => {
        let index = currentReviewIndex - 1;
        if (index < 0) index = reviewSlides.length - 1;
        showReview(index);
    };

    nextBtn.onclick = () => {
        let index = currentReviewIndex + 1;
        if (index >= reviewSlides.length) index = 0;
        showReview(index);
    };

    if (reviewSlides.length > 1) {
        reviewsTimer = setInterval(() => {
            let index = currentReviewIndex + 1;
            if (index >= reviewSlides.length) index = 0;
            showReview(index);
        }, 8000);
    }
}

function showReview(index) {
    if (reviewSlides.length === 0) return;
    reviewSlides.forEach(slide => slide.classList.remove('active'));
    const dots = document.querySelectorAll('.reviews-dot');
    dots.forEach(dot => dot.classList.remove('active'));

    if (reviewSlides[index]) reviewSlides[index].classList.add('active');
    if (dots[index]) dots[index].classList.add('active');
    currentReviewIndex = index;
}

// ==========================================
// GENERAL UI HANDLERS & TOASTS
// ==========================================

function initUIHandlers() {
    const cartDrawerOverlay = document.getElementById('cartDrawerOverlay');
    const openBtn = document.getElementById('navCartBtn');
    const openBtnFloat = document.getElementById('floatingCartBtn');
    const closeBtn = document.getElementById('closeDrawerBtn');
    
    const toggleCart = () => {
        cartDrawerOverlay.classList.toggle('open');
    };
    
    openBtn.onclick = toggleCart;
    openBtnFloat.onclick = toggleCart;
    closeBtn.onclick = toggleCart;
    
    cartDrawerOverlay.onclick = (e) => {
        if (e.target === cartDrawerOverlay) {
            cartDrawerOverlay.classList.remove('open');
        }
    };

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    const toggleMobileMenu = () => {
        mobileMenuOverlay.classList.toggle('open');
        document.body.style.overflow = mobileMenuOverlay.classList.contains('open') ? 'hidden' : '';
    };

    if (mobileMenuBtn) {
        mobileMenuBtn.onclick = toggleMobileMenu;
    }

    if (mobileMenuClose) {
        mobileMenuClose.onclick = toggleMobileMenu;
    }

    if (mobileMenuOverlay) {
        mobileMenuOverlay.onclick = (e) => {
            if (e.target === mobileMenuOverlay) {
                toggleMobileMenu();
            }
        };
    }

    mobileNavLinks.forEach(link => {
        link.onclick = () => {
            toggleMobileMenu();
        };
    });
    
    const modalOverlay = document.getElementById('quickViewOverlay');
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) closeQuickView();
    };
    
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.onclick = closeQuickView;
    }
    
    document.getElementById('checkoutBtn').onclick = handleCheckout;
    
    const popupOverlay = document.getElementById('checkoutPopupOverlay');
    const igGoBtn = document.getElementById('checkoutGoBtn');
    if (igGoBtn) {
        igGoBtn.onclick = () => {
            popupOverlay.classList.remove('open');
            const orderText = document.getElementById('checkoutCodeBox').textContent;
            copyTextToClipboard(orderText);
            window.open(getInstagramDmUrl(), '_blank', 'noopener,noreferrer');
        };
    }

    // WhatsApp checkout (only wired/shown when a number is configured in content.json)
    const waGoBtn = document.getElementById('checkoutWhatsappBtn');
    if (waGoBtn) {
        const waNumber = getWhatsappNumber();
        if (waNumber) {
            waGoBtn.style.display = '';
            waGoBtn.onclick = () => {
                popupOverlay.classList.remove('open');
                const orderText = document.getElementById('checkoutCodeBox').textContent;
                window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(orderText)}`, '_blank', 'noopener,noreferrer');
            };
        } else {
            waGoBtn.style.display = 'none';
        }
    }

    popupOverlay.onclick = (e) => {
        if (e.target === popupOverlay) {
            popupOverlay.classList.remove('open');
        }
    };

    setupDelegation();
    setupStickyOrderBar();
    initSearchAndProfile();
    setupAccordions();
    setupReviews();
}

// Instagram DM deep link derived from the configured handle.
function getInstagramDmUrl() {
    const handle = (content.business && content.business.instagramHandle) || 'hetaas_atelier';
    return `https://ig.me/m/${handle}`;
}

// Normalise the WhatsApp number to digits only (country code + number), or '' if unset.
function getWhatsappNumber() {
    const raw = (content.business && content.business.whatsappNumber) || '';
    return String(raw).replace(/[^0-9]/g, '');
}

function showToast(message, icon = '🌸') {
    const toast = document.getElementById('toastContainer');
    const msgEl = document.getElementById('toastMessage');
    const iconEl = document.getElementById('toastIcon');
    
    toast.classList.remove('show');
    void toast.offsetWidth; 
    
    msgEl.textContent = message;
    iconEl.textContent = icon;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==========================================
// CONTENT (content.json) LOADING & RENDERING
// ==========================================

async function loadContent() {
    try {
        const res = await fetch('content.json', { cache: 'no-cache' });
        if (res.ok) content = await res.json();
    } catch (e) {
        // fetch() is blocked over file:// (double-click). Fall back to the generated data.js.
        if (window.__HETAAS_CONTENT__) {
            console.info('Using local data.js fallback for content (opened via file://).');
            content = window.__HETAAS_CONTENT__;
        } else {
            console.warn('content.json not loaded; using built-in page defaults.', e);
            content = content || {};
        }
    }
    // Override customizer option lists when provided by content.json
    if (content.customizer) {
        if (Array.isArray(content.customizer.bases) && content.customizer.bases.length) customizerData.bases = content.customizer.bases;
        if (Array.isArray(content.customizer.colors) && content.customizer.colors.length) customizerData.colors = content.customizer.colors;
        if (Array.isArray(content.customizer.inclusions) && content.customizer.inclusions.length) customizerData.inclusions = content.customizer.inclusions;
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null && value !== '') el.textContent = value;
}
// Owner-authored HTML from content.json (trusted, committed to the repo) — allows <strong> etc.
function setTrustedHtml(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null && value !== '') el.innerHTML = value;
}
function setMeta(attr, key, value) {
    if (value === undefined || value === null || value === '') return;
    const el = document.querySelector(`meta[${attr}="${key}"]`);
    if (el) el.setAttribute('content', value);
}

function applyContent() {
    if (!content || Object.keys(content).length === 0) return;

    // SEO / meta reflect admin edits at runtime
    if (content.site) {
        if (content.site.title) document.title = content.site.title;
        setMeta('name', 'description', content.site.metaDescription);
        setMeta('property', 'og:title', content.site.title);
        setMeta('property', 'og:description', content.site.metaDescription);
        setMeta('name', 'twitter:title', content.site.title);
        setMeta('name', 'twitter:description', content.site.metaDescription);
        setMeta('name', 'theme-color', content.site.themeColor);
    }

    if (content.hero) {
        setText('heroHeading', content.hero.heading);
        setText('heroSubtext', content.hero.subtext);
        setTrustedHtml('heroBlurb', content.hero.blurb);
        setText('heroCta', content.hero.ctaLabel);
    }

    renderTrustBar();
    renderHowToOrder();
    renderAbout();
    renderFaqs();
    renderReviews();
    renderFooter();
}

function renderTrustBar() {
    const bar = document.getElementById('trustBar');
    const wrap = document.getElementById('trustBarContent');
    if (!bar || !wrap) return;
    const tb = content.trustBar;
    if (!tb || tb.enabled === false || !Array.isArray(tb.items) || tb.items.length === 0) { bar.hidden = true; return; }
    wrap.innerHTML = tb.items.map((item, i) => `
        ${i > 0 ? '<div class="trust-divider">•</div>' : ''}
        <div class="trust-item"><span>${escapeHtml(item.icon || '')}</span> ${escapeHtml(item.text || '')}</div>
    `).join('');
    bar.hidden = false;
}

function renderHowToOrder() {
    const sec = document.getElementById('howToOrder');
    const grid = document.getElementById('howToOrderGrid');
    if (!sec || !grid) return;
    const h = content.howToOrder;
    if (!h || h.enabled === false || !Array.isArray(h.steps) || h.steps.length === 0) { sec.hidden = true; return; }
    setText('howToOrderHeading', h.heading);
    grid.innerHTML = h.steps.map((s, i) => `
        <div class="hto-step">
            <div class="hto-num">${i + 1}</div>
            <div class="hto-emoji">${escapeHtml(s.icon || '')}</div>
            <h3>${escapeHtml(s.title || '')}</h3>
            <p>${escapeHtml(s.text || '')}</p>
        </div>
    `).join('');
    sec.hidden = false;
}

function renderAbout() {
    if (!content.about) return;
    setText('aboutBadge', content.about.badge);
    setText('aboutHeading', content.about.heading);
    setText('aboutSubtitle', content.about.subtitle);
    setTrustedHtml('aboutStory', content.about.story);
    const grid = document.getElementById('aboutFeatures');
    if (grid && Array.isArray(content.about.features) && content.about.features.length) {
        grid.innerHTML = content.about.features.map(f => `
            <div class="feature">
                <span class="feature-icon">${escapeHtml(f.icon || '')}</span>
                <h3>${escapeHtml(f.title || '')}</h3>
                <p>${escapeHtml(f.text || '')}</p>
            </div>
        `).join('');
    }
}

function renderFaqs() {
    const container = document.getElementById('faqContainer');
    if (!container || !Array.isArray(content.faqs) || content.faqs.length === 0) return;
    container.innerHTML = content.faqs.map(f => `
        <div class="faq-card">
            <div class="faq-question">
                <span>${escapeHtml(f.q || '')}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>
            <div class="faq-answer">
                <div class="faq-answer-content">${f.a || ''}</div>
            </div>
        </div>
    `).join('');
}

function renderReviews() {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;
    const reviews = Array.isArray(content.reviews) ? content.reviews : [];
    if (reviews.length === 0) return; // keep default "coming soon" markup
    const clamp = (n) => Math.max(0, Math.min(5, Number(n) || 5));
    const bubble = (r) => {
        if (r.image) {
            return `<figure class="review-bubble review-bubble-img">
                <img src="${escapeHtml(r.image)}" alt="${escapeHtml(r.alt || 'Customer review')}" loading="lazy" decoding="async">
            </figure>`;
        }
        const stars = clamp(r.rating);
        return `<figure class="review-bubble">
            <div class="review-stars">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</div>
            <p class="review-text">${escapeHtml(r.text || '')}</p>
            ${r.name ? `<figcaption class="review-author">— ${escapeHtml(r.name)}</figcaption>` : ''}
        </figure>`;
    };
    // Duplicate the set so the right-to-left loop is seamless
    const cards = reviews.map(bubble).join('');
    container.innerHTML = `
        <div class="reviews-marquee" aria-label="Customer reviews">
            <div class="reviews-track">${cards}${cards}</div>
        </div>
        <p class="reviews-more-note">🌸 More happy reviews coming soon!</p>`;
}

function renderFooter() {
    if (content.footer) {
        setText('footerBrand', content.footer.brand);
        setText('footerTagline', content.footer.tagline);
        setText('footerLocation', content.footer.location);
        setText('footerContactHeading', content.footer.contactHeading);
        setText('footerPolicyNote', content.footer.policyNote);
        setText('footerCopyright', content.footer.copyright);
    }
    const ig = document.getElementById('footerInstagram');
    if (ig && content.business) {
        if (content.business.instagramUrl) ig.href = content.business.instagramUrl;
        if (content.business.instagramHandle) ig.textContent = '@' + content.business.instagramHandle;
    }
}

// Rebuild category filter buttons from content.json (so new categories appear automatically)
function buildCategoryFilters() {
    const container = document.getElementById('filterContainer');
    if (!container) return;
    const cats = (Array.isArray(content.categories) && content.categories.length)
        ? content.categories
        : [...new Set(allProducts.map(p => p.category))];
    let html = '<button class="filter-btn active" data-filter="all">Shop All</button>';
    cats.forEach(cat => {
        html += `<button class="filter-btn" data-filter="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`;
    });
    container.innerHTML = html;
}

// ==========================================
// STRUCTURED DATA (Product ItemList JSON-LD)
// ==========================================

function absoluteUrl(path, base) {
    try { return new URL(path, base).href; } catch (e) { return path; }
}

function injectProductJsonLd() {
    try {
        const existing = document.getElementById('product-jsonld');
        if (existing) existing.remove();
        if (!allProducts.length) return;
        const base = (content.site && content.site.url) || (location.origin + location.pathname);
        const itemList = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": allProducts.slice(0, 40).map((p, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "item": {
                    "@type": "Product",
                    "name": p.name,
                    "image": absoluteUrl(p.image, base),
                    "description": p.description,
                    "category": p.category,
                    "offers": {
                        "@type": "Offer",
                        "price": p.price,
                        "priceCurrency": "INR",
                        "availability": "https://schema.org/InStock"
                    }
                }
            }))
        };
        const s = document.createElement('script');
        s.type = 'application/ld+json';
        s.id = 'product-jsonld';
        s.textContent = JSON.stringify(itemList);
        document.head.appendChild(s);
    } catch (e) { /* non-fatal */ }
}

// ==========================================
// PWA: SERVICE WORKER, INSTALL PROMPT, UPDATES
// ==========================================

function initPwa() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').then((reg) => {
                reg.addEventListener('updatefound', () => {
                    const nw = reg.installing;
                    if (!nw) return;
                    nw.addEventListener('statechange', () => {
                        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                            showToast('Fresh updates available — refresh to see them! 🌸', '🔄');
                        }
                    });
                });
            }).catch((err) => console.warn('Service worker registration failed', err));
        });
    }

    let deferredPrompt = null;
    const installBtn = document.getElementById('pwaInstallBtn');
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installBtn) installBtn.hidden = false;
    });
    if (installBtn) {
        installBtn.onclick = async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            try { await deferredPrompt.userChoice; } catch (e) {}
            deferredPrompt = null;
            installBtn.hidden = true;
        };
    }
    window.addEventListener('appinstalled', () => {
        if (installBtn) installBtn.hidden = true;
        showToast('App installed! Find HetAas on your home screen 🌸');
    });
}

// ==========================================
// PRIVACY-FRIENDLY ANALYTICS (opt-in via content.json)
// ==========================================

function initAnalytics() {
    const a = content.analytics;
    if (!a || !a.enabled || !a.code) return;
    if (a.provider === 'plausible') {
        const s = document.createElement('script');
        s.defer = true;
        s.setAttribute('data-domain', a.code);
        s.src = 'https://plausible.io/js/script.js';
        document.head.appendChild(s);
    } else {
        // GoatCounter (default). `code` is the site subdomain, e.g. "hetaas".
        const s = document.createElement('script');
        s.async = true;
        s.setAttribute('data-goatcounter', `https://${a.code}.goatcounter.com/count`);
        s.src = 'https://gc.zgo.at/count.js';
        document.body.appendChild(s);
    }
}

// Direct-contact floating button → WhatsApp when configured, else Instagram DM.
function setupStickyOrderBar() {
    const fab = document.getElementById('contactFab');
    if (!fab) return;
    const wa = getWhatsappNumber();
    const label = fab.querySelector('.floating-contact-label');
    if (wa) {
        fab.href = `https://wa.me/${wa}`;
        if (label) label.textContent = 'Chat on WhatsApp';
    } else {
        fab.href = getInstagramDmUrl();
        if (label) label.textContent = 'Chat to Order';
    }
}

// Load products when page loads
document.addEventListener('DOMContentLoaded', loadProducts);
