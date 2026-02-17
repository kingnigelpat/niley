import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// CONFIGURATION
const IG_USERNAME = "niely_2423";
const WHATSAPP_NUMBER = "1234567890"; // REPLACE WITH YOUR REAL NUMBER

// STATE
let cart = [];
let products = [];

// DOM ELEMENTS
const productGrid = document.getElementById('product-grid');
const cartItemsContainer = document.getElementById('cart-items');
const cartCountSpan = document.getElementById('cart-count');
const cartTotalSpan = document.getElementById('cart-total');

// INITIALIZATION
async function init() {
    await fetchProducts();
    renderProducts();
    loadCart();
}

// FETCH PRODUCTS
async function fetchProducts() {
    // FIRESTORE IMPLEMENTATION
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        products = [];

        if (querySnapshot.empty) {
            productGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center;">No products found. Please add products in Admin.</div>`;
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            data.id = doc.id; // Include Firestore Doc ID
            products.push(data);
        });

    } catch (error) {
        console.error("Error fetching products:", error);
        productGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: red;">Error loading products.</div>`;
    }
}

// RENDER PRODUCTS
function renderProducts() {
    if (products.length === 0) return;

    productGrid.innerHTML = products.map((product, index) => `
        <div class="product-card" style="animation-delay: ${index * 0.1}s">
            <div class="product-image-container" onclick="openQuickView('${product.id}')" style="cursor: pointer;">
                ${index < 2 ? '<div class="product-tag">New Arrival</div>' : ''}
                <img src="${(product.imageUrl && product.imageUrl.includes('/upload/') && !product.imageUrl.includes('f_auto,q_auto')) ? product.imageUrl.replace('/upload/', '/upload/f_auto,q_auto/') : (product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image')}" alt="${product.name}" class="product-image" loading="lazy">
            </div>
            <div class="product-info">
                <h3 onclick="openQuickView('${product.id}')" style="cursor: pointer;">${product.name}</h3>
                <p>${product.description || 'No description available.'}</p>
                <span class="price">$${parseFloat(product.price).toFixed(2)}</span>
                <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

// SEARCH LOGIC
window.searchProducts = () => {
    const query = document.getElementById('search-input').value.toLowerCase();
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query))
    );

    // Temporarily override the global 'products' variable scope for rendering? 
    // No, better to pass the list to render. 
    // Let's refactor renderProducts slightly to accept a list, or just do it here.

    if (filteredProducts.length === 0) {
        productGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center;">No products match your search.</div>`;
    } else {
        renderFiltered(filteredProducts);
    }
};

function renderFiltered(list) {
    productGrid.innerHTML = list.map(product => `
        <div class="product-card">
            <img src="${(product.imageUrl && product.imageUrl.includes('/upload/') && !product.imageUrl.includes('f_auto,q_auto')) ? product.imageUrl.replace('/upload/', '/upload/f_auto,q_auto/') : (product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image')}" alt="${product.name}" class="product-image" loading="lazy">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.description || 'No description available.'}</p>
                <span class="price">$${parseFloat(product.price).toFixed(2)}</span>
                <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

// CART LOGIC
window.addToCart = (id) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCartUI();
    saveCart();
    // Animation/Feedback
    showToast(`${product.name} added to cart!`);
};

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
    saveCart();
}
// Expose specific function to window if needed by HTML strings
window.removeFromCart = removeFromCart;

function updateCartUI() {
    cartCountSpan.innerText = `(${cart.reduce((acc, item) => acc + item.quantity, 0)})`;

    const total = cart.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
    cartTotalSpan.innerText = `$${total.toFixed(2)}`;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; color: var(--text-light); margin-top: 20px;">Your bag is empty.</p>';
    } else {
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div>
                    <strong>${item.name}</strong><br>
                    <small>$${item.price} x ${item.quantity}</small>
                </div>
                <button onclick="removeFromCart('${item.id}')" style="color: var(--danger-color); background: none; font-size: 1.2rem;">&times;</button>
            </div>
        `).join('');
    }
}

function saveCart() {
    localStorage.setItem('niley-cart', JSON.stringify(cart));
}

function loadCart() {
    const saved = localStorage.getItem('niley-cart');
    if (saved) {
        cart = JSON.parse(saved);
        updateCartUI();
    }
}

// Helper: Show Toast
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.className = "toast show";
    setTimeout(function () { toast.className = toast.className.replace("show", ""); }, 5000);
}

// CHECKOUT (Copy Order & Open DM)
// CHECKOUT (Copy Order & Open DM)
window.checkout = async () => {
    if (cart.length === 0) {
        showToast("Your cart is empty!");
        return;
    }

    // 1. Build the message
    let messageLine = "👋 Hi Niley! I'd like to place an order:\n\n";
    let total = 0;

    cart.forEach(item => {
        const itemTotal = parseFloat(item.price) * item.quantity;
        cartItemsText += `📦 ${item.name} (x${item.quantity}) - $${itemTotal.toFixed(2)}%0A`; // %0A for new line in URL
        cartTotal += itemTotal;
    });

    // 2. Build WhatsApp Message
    const text = `Hi Niley! I'd like to place an order:%0A%0A${cartItemsText}%0A%0ATotal: $${cartTotal.toFixed(2)}%0A%0APlease confirm availability.`;
    const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`; // Replace with real number

    // 3. Open WhatsApp
    window.open(waLink, '_blank');
    showToast("Opening WhatsApp with your order details!");
};

// 4. Filter Logic for New Arrivals/Categories
// 4. Filter Logic for Categories
window.filterCategory = (category) => {
    const section = document.getElementById('product-grid');
    section.scrollIntoView({ behavior: 'smooth' });

    let filtered = products;

    if (category === 'Trending') {
        // Show first 3 products as "Trending"
        filtered = products.slice(0, 3);
    } else if (category === 'Gadgets') {
        filtered = products.filter(p =>
            /phone|watch|laptop|tablet|gadget/i.test(p.name)
        );
    } else if (category === 'Audio') {
        filtered = products.filter(p =>
            /audio|headphone|speaker|earbud|sound/i.test(p.name)
        );
    } else if (category === 'Smart Home') {
        filtered = products.filter(p =>
            /smart|home|light|bulb|alexa|google/i.test(p.name)
        );
    }

    if (filtered.length === 0) {
        showToast(`No ${category} products found.`);
        renderProducts(products); // Show all if none found
    } else {
        renderProducts(filtered);
        showToast(`Showing ${category}`);
    }
};

// QUICK VIEW MODAL LOGIC
window.openQuickView = (id) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    // Populate Modal Data
    const imgUrl = (product.imageUrl && product.imageUrl.includes('/upload/') && !product.imageUrl.includes('f_auto,q_auto'))
        ? product.imageUrl.replace('/upload/', '/upload/f_auto,q_auto/')
        : (product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image');

    const qvImage = document.getElementById('qv-image');
    if (qvImage) qvImage.src = imgUrl;

    document.getElementById('qv-title').innerText = product.name;
    document.getElementById('qv-price').innerText = `$${parseFloat(product.price).toFixed(2)}`;
    document.getElementById('qv-description').innerText = product.description || 'No detailed description available.';

    // Set Add to Cart Button action within modal
    const qvBtn = document.getElementById('qv-btn');
    // Remove old listeners by cloning
    const newBtn = qvBtn.cloneNode(true);
    qvBtn.parentNode.replaceChild(newBtn, qvBtn);

    newBtn.onclick = () => {
        addToCart(product.id);
        closeQuickView();
    };

    // Show Modal
    document.getElementById('quick-view-modal').classList.add('open');
};

window.closeQuickView = (e) => {
    // If e is present, check target. If simply called(), just close.
    if (e && e.target !== e.currentTarget && !e.target.classList.contains('close-modal')) return;

    document.getElementById('quick-view-modal').classList.remove('open');
};

// Run Init
init();
