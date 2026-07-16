// Global variables
let allProducts = [];
let cart = [];

// Customizer Options Data
const customizerData = {
    bases: [
        { id: 'bookmark', name: 'Bookmark', price: 100, emoji: '🔖', category: 'Bookmarks' },
        { id: 'coaster', name: 'Coaster', price: 250, emoji: '🍵', category: 'Coasters' },
        { id: 'keychain', name: 'Butterfly Keychain', price: 180, emoji: '🦋', category: 'Keychains' },
        { id: 'earrings', name: 'Earrings', price: 120, emoji: '💎', category: 'Earrings' },
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
    else if (category === 'Bowls') { icon = '🥣'; }
    
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
    imgElement.src = getSvgPlaceholder(productName, category);
    imgElement.onerror = null; // Prevent infinite loops
};

// ==========================================
// LOAD & DISPLAY PRODUCTS
// ==========================================

async function loadProducts() {
    try {
        const response = await fetch('products.json');
        if (!response.ok) throw new Error('Fetch failed');
        const data = await response.json();
        allProducts = data.products;
    } catch (error) {
        console.warn('Unable to load products.json via fetch (often due to local CORS block on double-clicking index.html). Using local fallback products list.', error);
        
        // Hardcoded fallback list so the site remains 100% interactive and functional offline
        allProducts = [
            {
                "id": 9,
                "name": "Handmade Studs Set",
                "category": "Earrings",
                "price": 180,
                "image": "images/earrings-studs.jpg",
                "description": "Charming studs: circular yellow floral & trapezoidal pink glitter designs"
            },
            {
                "id": 10,
                "name": "Yellow Oval Dangles",
                "category": "Earrings",
                "price": 120,
                "image": "images/earrings-yellow-oval.jpg",
                "description": "Delicate yellow botanical petals embedded in oval transparent resin loops"
            },
            {
                "id": 11,
                "name": "Sparkly Green Circles",
                "category": "Earrings",
                "price": 120,
                "image": "images/earrings-green-circles.jpg",
                "description": "Three-tier cascading sparkly emerald green circles with gold dust accents"
            },
            {
                "id": 12,
                "name": "Emerald Monstera Leaves",
                "category": "Earrings",
                "price": 120,
                "image": "images/earrings-green-leaves.jpg",
                "description": "Detailed tropical monstera leaf dangles with green sparkles and shine"
            },
            {
                "id": 13,
                "name": "Bubbly Flower Earrings",
                "category": "Earrings",
                "price": 120,
                "image": "images/earrings-bubbly-flower.jpg",
                "description": "Charming rectangular dangles with embedded green blossoms and tiny bubbles"
            },
            {
                "id": 14,
                "name": "Golden Butterfly Keychain",
                "category": "Keychains",
                "price": 180,
                "image": "images/keychain-gold-butterfly.jpg",
                "description": "Delicate golden butterfly keychain embedded with dried blossoms and golden flakes"
            },
            {
                "id": 15,
                "name": "Amber Butterfly Keychain",
                "category": "Keychains",
                "price": 180,
                "image": "images/keychain-brown-butterfly.jpg",
                "description": "Warm amber-brown butterfly keychain with a matching leaf inclusion"
            },
            {
                "id": 16,
                "name": "Citrus Butterfly Keychain",
                "category": "Keychains",
                "price": 180,
                "image": "images/keychain-green-butterfly.jpg",
                "description": "Vibrant yellow-green butterfly keychain decorated with white baby's breath"
            },
            {
                "id": 17,
                "name": "Pink Shimmer Butterfly Keychain",
                "category": "Keychains",
                "price": 180,
                "image": "images/keychain-pink-butterfly.jpg",
                "description": "Whimsical pink and lavender butterfly keychain accented with shiny diamantes"
            },
            {
                "id": 18,
                "name": "Teal Butterfly Keychain",
                "category": "Keychains",
                "price": 180,
                "image": "images/keychain-teal-butterfly.jpg",
                "description": "Stunning teal and turquoise butterfly keychain with a deep blue body"
            },
            {
                "id": 19,
                "name": "Blue Flower Dangles",
                "category": "Earrings",
                "price": 120,
                "image": "images/earrings-blue-flowers.jpg",
                "description": "Delightful two-tier blue flower resin dangles with white dots and pearls"
            },
            {
                "id": 20,
                "name": "Red Sparkle Twin Set",
                "category": "Earrings",
                "price": 220,
                "image": "images/earrings-red-twins.jpg",
                "description": "Double pair combo set: glittery red teardrops and matching oval loops (4 earrings total)"
            },
            {
                "id": 21,
                "name": "Red Sparkle Rectangle Frames",
                "category": "Earrings",
                "price": 120,
                "image": "images/earrings-red-parent.jpg",
                "description": "Bold rectangular frames filled with shimmering red glitter"
            },
            {
                "id": 22,
                "name": "Multicolor Petal Drops",
                "category": "Earrings",
                "price": 120,
                "image": "images/earrings-multicolor-petal.jpg",
                "description": "Beautiful transparent teardrops embedded with colorful dried botanical leaves"
            },
            {
                "id": 23,
                "name": "Ocean Sea Coaster (Single)",
                "category": "Coasters",
                "price": 250,
                "image": "images/coasters-sea.jpg",
                "description": "Single wavy-edged ocean-themed coaster with real seashells, sand, pearls, and resin waves"
            },
            {
                "id": 24,
                "name": "Ocean Sea Coasters (Pair)",
                "category": "Coasters",
                "price": 450,
                "image": "images/coasters-sea.jpg",
                "description": "Set of 2 wavy-edged ocean-themed coasters with real seashells, sand, pearls, and resin waves"
            },
            {
                "id": 25,
                "name": "Turtle Ocean Decor Plate (8-inch)",
                "category": "Decor",
                "price": 700,
                "image": "images/decor-turtle-plate.jpg",
                "description": "Stunning 8-inch wavy-edged ocean-themed decor plate with sand, seashells, and swimming sea turtle"
            },
            {
                "id": 26,
                "name": "Purple Shimmer Coaster",
                "category": "Coasters",
                "price": 250,
                "image": "images/coasters-purple-shimmer.jpg",
                "description": "Beautiful wavy-edged coaster styled with deep pink and purple glitter swirls"
            },
            {
                "id": 27,
                "name": "Magenta Floral Teardrops",
                "category": "Earrings",
                "price": 120,
                "image": "images/earrings-magenta-teardrops.jpg",
                "description": "Elegant gold-framed teardrop earrings with a shimmery magenta pink base, a band of gold foil, and dried orange blossoms in clear resin"
            },
            {
                "id": 28,
                "name": "Pastel Rainbow Sprinkles Bookmark",
                "category": "Bookmarks",
                "price": 100,
                "image": "images/bookmark-rainbow.jpg",
                "description": "Playful clear resin bookmark containing colorful pastel sprinkles and a cute rainbow decal, complete with a white ribbon tassel"
            },
            {
                "id": 29,
                "name": "Crimson Marble Bookmark",
                "category": "Bookmarks",
                "price": 100,
                "image": "images/bookmark-crimson-marble.jpg",
                "description": "Stunning resin bookmark featuring elegant swirls of crimson red, soft pink, and white marble patterns, complete with a red ribbon tassel"
            },
            {
                "id": 30,
                "name": "Emerald & Gold Wave Bookmark",
                "category": "Bookmarks",
                "price": 100,
                "image": "images/bookmark-green-gold.jpg",
                "description": "Scenic resin bookmark with a mint green base transitioning into white waves and clear resin with gold foil, finished with a golden heart symbol and green ribbon tassel"
            },
            {
                "id": 31,
                "name": "Ocean Beach Shells Bookmark",
                "category": "Bookmarks",
                "price": 100,
                "image": "images/bookmark-ocean-shells.jpg",
                "description": "Beautiful ocean-themed bookmark featuring a blue sky, teal sea, crashing white waves, and real sand with embedded seashells, complete with a teal ribbon tassel"
            },
            {
                "id": 32,
                "name": "Iridescent Butterfly Bookmark",
                "category": "Bookmarks",
                "price": 100,
                "image": "images/bookmark-butterfly-custom.jpg",
                "description": "Charming iridescent pink and white bookmark featuring a bold black butterfly design and 'crush' lettering, complete with a red ribbon tassel"
            },
            {
                "id": 33,
                "name": "Colorful Smiley Beads Coaster",
                "category": "Coasters",
                "price": 250,
                "image": "images/coasters-beads-smiley.jpg",
                "description": "Whimsical clear round resin coaster filled with vibrant colorful beads, patterned tubes, and a cheerful central smiley-face heart"
            },
            {
                "id": 34,
                "name": "Sparkly Mint Bunny Coaster",
                "category": "Coasters",
                "price": 250,
                "image": "images/coasters-mint-sprinkles.jpg",
                "description": "Delightful mint green sparkly resin coaster decorated with colorful confetti sprinkles and adorable little cartoon rabbit faces"
            },
            {
                "id": 35,
                "name": "Custom Purple Butterfly Coaster",
                "category": "Coasters",
                "price": 250,
                "image": "images/coasters-purple-butterfly-hetal.jpg",
                "description": "Elegant purple shimmer coaster featuring a wavy scalloped border, a golden butterfly decal, and custom 'HETAL' golden lettering"
            },
            {
                "id": 36,
                "name": "2-in-1 Purple Star & Galaxy Pendant",
                "category": "Pendants",
                "price": 100,
                "image": "images/pendant-purple-2in1.jpg",
                "description": "Handcrafted double-sided resin pendant (2-in-1 design) featuring shimmery purple with teal star outlines on one side and a textured cosmic galaxy streak on the other"
            },
            {
                "id": 37,
                "name": "Emerald Shimmer Pendants",
                "category": "Pendants",
                "price": 100,
                "image": "images/pendants-green-shimmer.jpg",
                "description": "Handcrafted resin pendants with a green jade-like shimmer. Available in Kite, Oval, and Diamond shapes (₹100 each)"
            }
        ];
    }
    
    // Always initialize UI elements even if products.json fetch failed
    displayProducts(allProducts);
    setupCategoryFilters();
    initCart();
    initCustomizer();
    initUIHandlers();
}

function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = '<p class="error">No products found.</p>';
        return;
    }

    products.forEach((product, index) => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.style.animationDelay = `${index * 0.05}s`;
        
        productCard.innerHTML = `
            <div class="product-image" onclick="openQuickView(${product.id})">
                <img src="${product.image}" alt="${product.name}" onerror="handleImageError(this, '${product.name}', '${product.category}')">
                <div class="category-badge">${product.category}</div>
            </div>
            <div class="product-info">
                <h3 onclick="openQuickView(${product.id})">${product.name}</h3>
                <p class="description">${product.description}</p>
                <div class="product-footer">
                    <span class="price">₹${product.price}</span>
                    <button onclick="addToCartById(${product.id})" class="add-cart-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Basket
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(productCard);
    });
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

function addToCartById(productId, qty = 1) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    // Check combined limit of 15 items
    const currentTotal = getCartTotalQuantity();
    if (currentTotal + qty > 15) {
        showToast('Combined basket limit reached! You can only order up to 15 items. 🌸', '⚠️');
        return;
    }
    
    const existingItem = cart.find(item => item.product.id === productId && !item.isCustom);
    if (existingItem) {
        existingItem.quantity += qty;
    } else {
        cart.push({
            product: product,
            quantity: qty,
            isCustom: false,
            customization: null
        });
    }
    
    saveCart();
    showToast(`Added "${product.name}" to basket! 🌸`);
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
                <p style="font-size: 0.8rem;">Browse Shop or Customizer to fill it.</p>
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
            imageHtml = `<img class="cart-item-img" src="${item.product.image}" alt="Customized item">`;
        } else {
            imageHtml = `<img class="cart-item-img" src="${item.product.image}" alt="${item.product.name}" onerror="handleImageError(this, '${item.product.name}', '${item.product.category}')">`;
        }
        
        // Customization details text representation
        let customDetailsHtml = '';
        if (item.isCustom && item.customization) {
            customDetailsHtml = `
                <div class="cart-item-customization">
                    Tint: ${item.customization.color}<br>
                    Accents: ${item.customization.inclusion}
                    ${item.customization.text ? `<br>Sticker: "${item.customization.text}" (+₹90)` : ''}
                </div>
            `;
        }
        
        cartItemEl.innerHTML = `
            ${imageHtml}
            <div class="cart-item-details">
                <h4>${item.product.name}</h4>
                ${customDetailsHtml}
                <div class="cart-item-price">₹${item.product.price}</div>
                <div class="cart-item-qty">
                    <button onclick="changeCartQty(${index}, -1)" aria-label="Decrease quantity">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="changeCartQty(${index}, 1)" aria-label="Increase quantity">+</button>
                </div>
            </div>
            <button class="remove-cart-item" onclick="removeCartItem(${index})" aria-label="Remove item">
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
            <span class="option-price">Free</span>
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
                    ? `Golden Metallic Lettering (+₹90) ${customSelections.text ? `"${customSelections.text}"` : ''}` 
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
    } else if (category === 'Pendants') {
        return {
            dimensions: 'Size: Approx 1.5 - 2 inches. Elegant and lightweight.',
            care: 'Keep in a soft pouch when not wearing. Avoid spraying perfumes or chemicals directly on the resin.'
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
    
    modalBody.innerHTML = `
        <div class="modal-img-container">
            <img src="${product.image}" alt="${product.name}" onerror="handleImageError(this, '${product.name}', '${product.category}')">
        </div>
        <div class="modal-content-panel">
            <span class="modal-badge">${product.category}</span>
            <h2 class="modal-title">${product.name}</h2>
            <div class="modal-price">₹${product.price}</div>
            <p class="modal-desc">${product.description}</p>
            
            <div class="modal-care-guide">
                <h4 class="care-title">🌸 Dimensions & Care Guide</h4>
                <p class="care-text" style="margin-bottom: 4px;"><strong>Dimensions:</strong> ${careSpecs.dimensions}</p>
                <p class="care-text"><strong>Care:</strong> ${careSpecs.care}</p>
            </div>
            
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
        </div>
    `;
    
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
        addToCartById(product.id, qty);
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
    
    navigator.clipboard.writeText(message).then(() => {
        const codeBox = document.getElementById('checkoutCodeBox');
        codeBox.textContent = message;
        
        document.getElementById('cartDrawerOverlay').classList.remove('open');
        
        const popup = document.getElementById('checkoutPopupOverlay');
        popup.classList.add('open');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showToast('Clipboard copy failed. Please take a screenshot of your cart to order! 🌸', '⚠️');
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
        );
        
        if (matches.length === 0) {
            searchResultsList.innerHTML = '<p class="error" style="padding: 10px;">No matching creations found</p>';
            return;
        }
        
        matches.forEach(product => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.onclick = () => {
                closeSearch();
                openQuickView(product.id);
            };
            item.innerHTML = `
                <img src="${product.image}" onerror="handleImageError(this, '${product.name}', '${product.category}')">
                <div class="search-result-details">
                    <h5>${product.name}</h5>
                    <span>₹${product.price} - in ${product.category}</span>
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

function setupReviews() {
    reviewSlides = document.querySelectorAll('.review-slide');
    const dotsContainer = document.getElementById('sliderDots');
    const prevBtn = document.getElementById('sliderPrevBtn');
    const nextBtn = document.getElementById('sliderNextBtn');
    
    // Safety check: Exit if reviews slider elements do not exist
    if (reviewSlides.length === 0 || !dotsContainer || !prevBtn || !nextBtn) {
        return;
    }
    
    dotsContainer.innerHTML = '';
    
    reviewSlides.forEach((slide, idx) => {
        const dot = document.createElement('span');
        dot.className = `slider-dot ${idx === 0 ? 'active' : ''}`;
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
    
    setInterval(() => {
        let index = currentReviewIndex + 1;
        if (index >= reviewSlides.length) index = 0;
        showReview(index);
    }, 8000);
}

function showReview(index) {
    if (reviewSlides.length === 0) return;
    reviewSlides.forEach(slide => slide.classList.remove('active'));
    const dots = document.querySelectorAll('.slider-dot');
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
    document.getElementById('checkoutGoBtn').onclick = () => {
        popupOverlay.classList.remove('open');
        window.open('https://ig.me/m/aastha.thakker', '_blank');
    };

    
    popupOverlay.onclick = (e) => {
        if (e.target === popupOverlay) {
            popupOverlay.classList.remove('open');
        }
    };
    
    initSearchAndProfile();
    setupAccordions();
    setupReviews();
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

// Load products when page loads
document.addEventListener('DOMContentLoaded', loadProducts);
