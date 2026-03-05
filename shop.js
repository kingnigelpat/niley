import { db } from './firebase-config.js';
import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const productGrid = document.getElementById('product-grid');
let products = [];
let cart = JSON.parse(localStorage.getItem('niley-cart')) || [];

// UTILITIES
const isVideo = (url) => url && (url.includes('.mp4') || url.includes('/video/'));
const getOptimizedMedia = (url) => {
    if (!url || isVideo(url)) return url;
    return url.replace('/upload/', '/upload/f_auto,q_auto/');
};

// INITIAL LOAD
async function initShop() {
    try {
        // Fetch ALL products first to ensure 100% visibility
        const snapshot = await getDocs(collection(db, 'products'));
        products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort manually by date if possible, otherwise keep original order
        products.sort((a, b) => {
            const dateA = new Date(a.updatedAt || 0);
            const dateB = new Date(b.updatedAt || 0);
            return dateB - dateA;
        });

        renderProducts(products);
        updateCartUI();
    } catch (error) {
        console.error("Critical Load Error:", error);
    }
}

// RENDER PRODUCTS
window.renderProducts = (list) => {
    if (!productGrid) return;

    if (list.length === 0) {
        productGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 100px 0;">
                <p style="color: var(--text-secondary); opacity: 0.5;">No artifacts found in this sector.</p>
            </div>`;
        return;
    }

    productGrid.innerHTML = list.map((p, index) => {
        const isVid = p.imageUrl && isVideo(p.imageUrl);
        const optimizedUrl = isVid ? p.imageUrl : getOptimizedMedia(p.imageUrl);
        const hasDiscount = p.discountPrice && p.discountPrice < p.price;
        const displayPrice = hasDiscount ? p.discountPrice : p.price;

        return `
            <div class="product-card" data-aos style="transition-delay: ${index * 0.1}s">
                <div class="product-img-container" onclick="openQuickView('${p.id}')" style="cursor: pointer;">
                    ${hasDiscount ? `<div class="product-badge" style="background: var(--danger); border-color: var(--danger); color: white;">SALE</div>` : ''}
                    ${isVid ?
                `<video class="product-video" src="${optimizedUrl}" autoplay muted loop playsinline></video>` :
                `<img class="product-img" src="${optimizedUrl}" alt="${p.name}" loading="${index < 6 ? 'eager' : 'lazy'}">`
            }
                    <div class="product-overlay">
                        <button class="btn-primary">Quick View</button>
                    </div>
                </div>
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <p>${p.description || 'Premium curated artifact.'}</p>
                    <div class="product-footer">
                        <div class="price-stack" style="text-align: left;">
                            ${hasDiscount ? `<span class="formal-price">$${parseFloat(p.price).toLocaleString()}</span>` : ''}
                            <span class="price" style="font-size: 1.2rem; font-weight: 700; color: var(--accent-color);">$${parseFloat(displayPrice).toLocaleString()}</span>
                        </div>
                        <div class="add-btn" onclick="addToCart('${p.id}'); event.stopPropagation();">
                            <i class="fas fa-plus"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Trigger visibility update immediately
    setTimeout(() => {
        if (window.checkScroll) window.checkScroll();
    }, 100);
};

// CART LOGIC
window.addToCart = (id) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('niley-cart', JSON.stringify(cart));
    updateCartUI();
    showToast(`${product.name} added to bag`);
};

window.removeFromCart = (id) => {
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('niley-cart', JSON.stringify(cart));
    updateCartUI();
};

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCountSpan = document.getElementById('cart-count');
    const cartTotalSpan = document.getElementById('cart-total');

    if (!cartItemsContainer) return;

    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    if (cartCountSpan) cartCountSpan.innerText = count;

    const total = cart.reduce((acc, item) => {
        const priceToUse = item.discountPrice && item.discountPrice < item.price ? item.discountPrice : item.price;
        return acc + (parseFloat(priceToUse) * item.quantity);
    }, 0);
    if (cartTotalSpan) cartTotalSpan.innerText = `$${total.toLocaleString()}`;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div style="text-align:center; padding: 40px 0; opacity: 0.5;">
                <i class="fas fa-shopping-bag" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>Bag is empty</p>
            </div>
        `;
    } else {
        cartItemsContainer.innerHTML = cart.map(item => {
            const priceToUse = item.discountPrice && item.discountPrice < item.price ? item.discountPrice : item.price;
            return `
                <div class="cart-item">
                    <img src="${getOptimizedMedia(item.imageUrl)}" class="cart-item-img">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">$${parseFloat(priceToUse).toLocaleString()} &times; ${item.quantity}</div>
                    </div>
                    <button onclick="removeFromCart('${item.id}')" style="background: none; border: none; color: var(--danger); cursor: pointer;">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
        }).join('');
    }
}

// QUICK VIEW
window.openQuickView = (id) => {
    const p = products.find(p => p.id === id);
    if (!p) return;

    const mediaUrl = getOptimizedMedia(p.imageUrl);
    const video = isVideo(p.imageUrl);
    const container = document.getElementById('qv-media-container');

    if (container) {
        container.innerHTML = video ?
            `<video src="${mediaUrl}" autoplay muted loop playsinline style="width:100%; height:100%; object-fit:cover;"></video>` :
            `<img src="${mediaUrl}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover;">`;
    }

    const hasDiscount = p.discountPrice && p.discountPrice < p.price;
    const displayPrice = hasDiscount ? p.discountPrice : p.price;

    document.getElementById('qv-title').innerText = p.name;
    document.getElementById('qv-price').innerHTML = hasDiscount ?
        `<span class="formal-price" style="margin-right: 12px; font-size: 1.1rem;">$${parseFloat(p.price).toLocaleString()}</span> 
         <span style="font-size: 1.8rem; font-weight: 700; color: var(--accent-color);">$${parseFloat(p.discountPrice).toLocaleString()}</span>` :
        `<span style="font-size: 1.8rem; font-weight: 700; color: var(--accent-color);">$${parseFloat(p.price).toLocaleString()}</span>`;
    document.getElementById('qv-description').innerText = p.description || "No description available.";

    const qvBtn = document.getElementById('qv-btn');
    if (qvBtn) {
        qvBtn.onclick = () => {
            addToCart(p.id);
            window.closeQuickView();
            window.toggleCart();
        };
    }

    document.getElementById('quick-view-modal').classList.add('active');
};

window.closeQuickView = () => {
    const modal = document.getElementById('quick-view-modal');
    if (modal) modal.classList.remove('active');
};

// THEME TOGGLE
window.toggleTheme = () => {
    const body = document.documentElement;
    const currentTheme = body.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

    body.setAttribute('data-theme', nextTheme);
    localStorage.setItem('niley-theme', nextTheme);

    // Update Icon
    const themeIcon = document.querySelector('#theme-toggle i');
    if (themeIcon) {
        themeIcon.className = nextTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }

    showToast(`Switched to ${nextTheme} mode`);
};

// CHECKOUT (Optimized for Instagram Bio Link)
window.checkout = async () => {
    if (cart.length === 0) {
        showToast("Bag is empty");
        return;
    }

    let message = "Hi NILEY! I'd like to order these artifacts:\n\n";
    let total = 0;

    cart.forEach(item => {
        const priceToUse = item.discountPrice && item.discountPrice < item.price ? item.discountPrice : item.price;
        const itemTotal = parseFloat(priceToUse) * item.quantity;
        message += `• ${item.name} (${item.quantity}x) - $${itemTotal.toLocaleString()}\n`;
        total += itemTotal;
    });

    message += `\nTotal: $${total.toLocaleString()}\n\nAre these currently in the vault?`;

    try {
        // COPY TO CLIPBOARD - Best for Instagram Bio Link
        await navigator.clipboard.writeText(message);

        // VISUAL FEEDBACK
        showToast("✓ Order Details Copied! Redirecting to DMs. Just PASTE it there.");

        // Wait a small moment so they see the toast
        setTimeout(() => {
            // Direct link to the profile/inbox
            window.open('https://www.instagram.com/niely_2423/', '_blank');
        }, 2500);

    } catch (err) {
        console.error('Failed to copy: ', err);
        // Fallback for browsers that block clipboard (rare but possible in some webviews)
        const igLink = `https://www.instagram.com/niely_2423/`;
        window.open(igLink, '_blank');
    }
};

// FILTER CATEGORIES
window.filterCategory = (category, element) => {
    const items = document.querySelectorAll('.chip');
    const isAlreadyActive = element && element.classList.contains('active');

    if (isAlreadyActive && category !== 'All') {
        const allChip = document.querySelector('.chip[onclick*="\'All\'"]');
        return window.filterCategory('All', allChip);
    }

    items.forEach(c => c.classList.remove('active'));

    if (element) {
        element.classList.add('active');
    } else {
        items.forEach(c => {
            if (c.innerText.includes(category)) c.classList.add('active');
        });
    }

    const heading = document.getElementById('current-category-name');
    if (heading) heading.innerText = category === 'All' ? 'The Collection' : category;

    let filtered = products;
    if (category === 'Trending') {
        filtered = products.slice(0, 3);
    } else if (category === 'Gadgets') {
        filtered = products.filter(p => /phone|watch|laptop|tablet|gadget/i.test((p.name || "") + (p.description || "")));
    } else if (category === 'Audio') {
        filtered = products.filter(p => /audio|headphone|speaker|earbud|sound/i.test((p.name || "") + (p.description || "")));
    } else if (category === 'Smart Home') {
        filtered = products.filter(p => /smart|home|light|bulb|alexa|google/i.test((p.name || "") + (p.description || "")));
    }

    renderProducts(filtered);

    if (window.innerWidth < 1024) {
        window.scrollTo({ top: document.getElementById('collection').offsetTop - 100, behavior: 'smooth' });
    }
};

// SEARCH
window.searchProducts = (event) => {
    const input = document.getElementById('search-input');
    const query = input.value.toLowerCase().trim();

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
    );

    if (query && filtered.length === 0) {
        if (productGrid) {
            productGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 100px 20px;">
                    <i class="fas fa-search-minus" style="font-size: 3rem; color: var(--text-secondary); opacity: 0.3; margin-bottom: 20px;"></i>
                    <h3 style="color: var(--text-secondary); font-weight: 300; text-transform: uppercase;">Artifact Not Found</h3>
                    <p style="margin-top: 10px; color: var(--text-secondary); opacity: 0.6;">We don't have that in the vault right now.</p>
                    <button class="btn-outline" style="margin-top: 24px;" onclick="window.filterCategory('All')">Explore All Artifacts</button>
                </div>
            `;
        }
    } else {
        renderProducts(filtered);
    }

    if (event && event.key === 'Enter') {
        window.toggleSearch();
        window.scrollTo({ top: document.getElementById('collection').offsetTop - 100, behavior: 'smooth' });
        input.blur();
    }
};

// TOAST
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerText = message;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 3000);
}

// INITIAL LOAD WRAPPER
document.addEventListener('DOMContentLoaded', () => {
    // Restore Theme
    const savedTheme = localStorage.getItem('niley-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeIcon = document.querySelector('#theme-toggle i');
    if (themeIcon) themeIcon.className = savedTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';

    initShop();

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') window.searchProducts(e);
        });
    }
});

// UI Toggles
window.toggleCart = () => document.getElementById('cart-panel').classList.toggle('active');
window.toggleSearch = () => {
    const overlay = document.getElementById('search-overlay');
    overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
    if (overlay.style.display === 'block') document.getElementById('search-input').focus();
};
