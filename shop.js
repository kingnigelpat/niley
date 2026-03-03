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
function renderProducts(list = products) {
    if (list.length === 0) {
        productGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-light);">No products found.</div>`;
        return;
    }

    productGrid.innerHTML = list.map((product, index) => `
        <div class="product-card" style="animation-delay: ${index * 0.1}s">
            <div class="product-image-container" onclick="openQuickView('${product.id}')" style="cursor: pointer;">
                ${index < 2 ? '<div class="product-tag">New Arrival</div>' : ''}
                <img src="${(product.imageUrl && product.imageUrl.includes('/upload/') && !product.imageUrl.includes('f_auto,q_auto')) ? product.imageUrl.replace('/upload/', '/upload/f_auto,q_auto/') : (product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image')}" alt="${product.name}" class="product-image" loading="${index < 4 ? 'eager' : 'lazy'}">
            </div>
            <div class="product-info">
                <h3 onclick="openQuickView('${product.id}')" style="cursor: pointer;">${product.name}</h3>
                <p>${product.description || 'No description available.'}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                    <span class="price">$${parseFloat(product.price).toFixed(2)}</span>
                    <button class="add-to-cart-btn" onclick="addToCart('${product.id}')" style="width: auto; padding: 10px 20px; font-size: 0.8rem;">
                        Add to Cart
                    </button>
                </div>
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

    if (query && filteredProducts.length === 0) {
        showToast("No matches found.");
    }
    renderProducts(filteredProducts);
};

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
    showToast(`${product.name} added to cart!`);

    // Pulse animation for the badge
    const badge = document.getElementById('cart-count');
    if (badge) {
        badge.classList.remove('pulse-animation');
        void badge.offsetWidth; // Trigger reflow
        badge.classList.add('pulse-animation');
    }
};

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
    saveCart();
}
window.removeFromCart = removeFromCart;

function updateCartUI() {
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    cartCountSpan.innerText = count;

    const total = cart.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
    cartTotalSpan.innerText = `$${total.toFixed(2)}`;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; color: var(--text-light); margin-top: 20px;">Your bag is empty.</p>';
    } else {
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div style="flex: 1;">
                    <strong>${item.name}</strong><br>
                    <small>$${parseFloat(item.price).toFixed(2)} x ${item.quantity}</small>
                </div>
                <button onclick="removeFromCart('${item.id}')" style="color: var(--danger-color); background: none; font-size: 1.2rem; cursor: pointer; padding: 5px;">&times;</button>
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
    if (!toast) return;
    toast.innerText = message;
    toast.className = "toast show";
    setTimeout(function () { toast.className = toast.className.replace("show", ""); }, 4000);
}

// CHECKOUT (WhatsApp Integration)
window.checkout = async () => {
    if (cart.length === 0) {
        showToast("Your cart is empty!");
        return;
    }

    let cartItemsText = "";
    let cartTotal = 0;

    cart.forEach(item => {
        const itemTotal = parseFloat(item.price) * item.quantity;
        cartItemsText += `📦 ${item.name} (x${item.quantity}) - $${itemTotal.toFixed(2)}%0A`;
        cartTotal += itemTotal;
    });

    const text = `Hi Niley! I'd like to place an order:%0A%0A${cartItemsText}%0A%0ATotal: $${cartTotal.toFixed(2)}%0A%0APlease confirm availability.`;
    const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;

    window.open(waLink, '_blank');
    showToast("Opening WhatsApp with your order!");
};

// Filter Logic for Categories
window.filterCategory = (category, element) => {
    // Scroll to products
    const section = document.getElementById('product-grid');
    if (section) section.scrollIntoView({ behavior: 'smooth' });

    // Update active state in UI
    const cards = document.querySelectorAll('.featured-card');
    cards.forEach(card => card.classList.remove('active'));

    // If element is passed directly (from onclick="filterCategory('All', this)")
    if (element) {
        element.classList.add('active');
    } else {
        // Fallback: find by span text
        cards.forEach(card => {
            if (card.querySelector('span').innerText === category) {
                card.classList.add('active');
            }
        });
    }

    let filtered = products;

    if (category === 'Trending') {
        filtered = products.slice(0, 3);
    } else if (category === 'Gadgets') {
        filtered = products.filter(p =>
            /phone|watch|laptop|tablet|gadget/i.test((p.name || "") + (p.description || ""))
        );
    } else if (category === 'Audio') {
        filtered = products.filter(p =>
            /audio|headphone|speaker|earbud|sound/i.test((p.name || "") + (p.description || ""))
        );
    } else if (category === 'Smart Home') {
        filtered = products.filter(p =>
            /smart|home|light|bulb|alexa|google/i.test((p.name || "") + (p.description || ""))
        );
    }

    if (filtered.length === 0 && category !== 'All') {
        showToast(`No ${category} products found.`);
        renderProducts(products);
    } else {
        renderProducts(filtered);
        showToast(`Showing ${category}`);
    }
};


// QUICK VIEW MODAL LOGIC
window.openQuickView = (id) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const imgUrl = (product.imageUrl && product.imageUrl.includes('/upload/') && !product.imageUrl.includes('f_auto,q_auto'))
        ? product.imageUrl.replace('/upload/', '/upload/f_auto,q_auto/')
        : (product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image');

    const qvImage = document.getElementById('qv-image');
    if (qvImage) qvImage.src = imgUrl;

    document.getElementById('qv-title').innerText = product.name;
    document.getElementById('qv-price').innerText = `$${parseFloat(product.price).toFixed(2)}`;
    document.getElementById('qv-description').innerText = product.description || 'No detailed description available.';

    const qvBtn = document.getElementById('qv-btn');
    if (qvBtn) {
        const newBtn = qvBtn.cloneNode(true);
        qvBtn.parentNode.replaceChild(newBtn, qvBtn);

        newBtn.onclick = () => {
            addToCart(product.id);
            closeQuickView();
        };
    }

    const modal = document.getElementById('quick-view-modal');
    if (modal) modal.classList.add('open');
};

window.closeQuickView = (e) => {
    if (e && e.target !== e.currentTarget && !e.target.classList.contains('close-modal')) return;
    const modal = document.getElementById('quick-view-modal');
    if (modal) modal.classList.remove('open');
};

// Run Init
init();
