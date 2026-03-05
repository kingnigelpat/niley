import { auth, db } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// DOM Elements
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const loginError = document.getElementById('login-error');
const productList = document.getElementById('admin-product-list');
const productForm = document.getElementById('product-form');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');

// STATE
let currentProducts = [];
let productMedia = "";
let widget;

// --- CLOUDINARY CONFIG ---
const cloudName = "dohfg4cin";
const uploadPreset = "nileymall";

// AUTH LISTENER
onAuthStateChanged(auth, (user) => {
    if (user) {
        showDashboard();
    } else {
        showLogin();
    }
});

function showLogin() {
    loginView.style.display = 'block';
    dashboardView.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
}

function showDashboard() {
    loginView.style.display = 'none';
    dashboardView.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'block';
    loadProducts();
}

// LOGIN HANDLER
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    const allowedEmails = ['lyvine16@gmail.com', 'patricknigel33@gmail.com', 'niely2423@gmail.com', 'admin@niley.com'];

    if (!allowedEmails.includes(email)) {
        loginError.innerText = "Unauthorized Access Attempt.";
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        loginError.innerText = "Authentication Failed: " + error.message;
    }
});

window.logout = () => signOut(auth);

// CLOUDINARY UPLOAD
document.getElementById("uploadBtn").onclick = function () {
    if (!window.cloudinary) {
        alert("Cloudinary module not ready.");
        return;
    }

    if (!widget) {
        widget = window.cloudinary.createUploadWidget(
            {
                cloudName: cloudName,
                uploadPreset: uploadPreset,
                folder: "nileymall/products",
                sources: ['local', 'url', 'camera'],
                multiple: false,
                clientAllowedFormats: ["png", "gif", "jpeg", "jpg", "mp4"]
            },
            (error, result) => {
                if (!error && result && result.event === "success") {
                    let optimizedUrl = result.info.secure_url;
                    // Auto-optimize images
                    if (optimizedUrl.includes("/upload/")) {
                        optimizedUrl = optimizedUrl.replace("/upload/", "/upload/f_auto,q_auto/");
                    }
                    productMedia = optimizedUrl;

                    const preview = document.getElementById("preview");
                    const previewContainer = preview.parentElement;

                    // Clear existing video previews if any
                    const existingVids = previewContainer.querySelectorAll('video');
                    existingVids.forEach(v => v.remove());

                    if (optimizedUrl.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || optimizedUrl.includes('/video/')) {
                        const video = document.createElement('video');
                        video.src = optimizedUrl;
                        video.style = "max-width:100%; margin-top:10px; border-radius: 8px; border: 1px solid var(--card-border);";
                        video.autoplay = true;
                        video.muted = true;
                        video.loop = true;
                        video.playsInline = true;
                        previewContainer.appendChild(video);
                        preview.style.display = 'none';
                    } else {
                        preview.src = optimizedUrl;
                        preview.style.display = "block";
                    }
                    console.log("Uploaded Content:", productMedia);
                }
            }
        );
    }
    widget.open();
};

// PRODUCT CRUD
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.innerText = "Synchronizing...";
    submitBtn.disabled = true;

    try {
        const id = document.getElementById('p-id').value;
        const name = document.getElementById('name').value;
        const formalPrice = parseFloat(document.getElementById('formal-price').value);
        const discountPriceInput = document.getElementById('discount-price').value;
        const discountPrice = discountPriceInput ? parseFloat(discountPriceInput) : null;
        const desc = document.getElementById('description').value;

        if (!name || isNaN(formalPrice)) throw new Error("Validation Failed.");

        const productData = {
            name,
            price: formalPrice, // Original price
            discountPrice: discountPrice, // Sale price
            description: desc,
            imageUrl: productMedia || 'https://via.placeholder.com/600x800?text=No+Image',
            updatedAt: new Date().toISOString()
        };

        if (id) {
            await updateDoc(doc(db, "products", id), productData);
            alert("Product Synchronized.");
        } else {
            productData.createdAt = new Date().toISOString();
            await addDoc(collection(db, "products"), productData);
            alert("New Artifact Added to Vault.");
        }

        clearForm();
        loadProducts();

    } catch (error) {
        alert("System Error: " + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Save to Vault";
    }
});

async function loadProducts() {
    productList.innerHTML = '<p style="color:var(--text-secondary)">Scanning Vault...</p>';
    currentProducts = [];

    try {
        // Primary Query: Ordered by Date
        let q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        let querySnapshot;

        try {
            querySnapshot = await getDocs(q);
        } catch (queryError) {
            console.warn("Ordered query failed (likely missing index), falling back to basic fetch.");
            // Fallback: Basic Query (if index isn't ready or createdAt missing)
            q = collection(db, "products");
            querySnapshot = await getDocs(q);
        }

        const totalCountEl = document.getElementById('total-count');
        if (totalCountEl) totalCountEl.innerText = querySnapshot.size;

        if (querySnapshot.empty) {
            productList.innerHTML = '<div style="text-align:center; padding: 40px; opacity:0.5;"><i class="fas fa-box-open" style="font-size:2rem; margin-bottom:10px;"></i><p>Vault is empty. Add your first masterpiece.</p></div>';
            return;
        }

        productList.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            data.id = docSnap.id;
            currentProducts.push(data);

            const div = document.createElement('div');
            div.className = 'admin-product-item';
            div.style = "background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; margin-bottom: 10px; display: flex; align-items: center; gap: 15px; border: 1px solid rgba(255,255,255,0.05); transition: 0.3s;";

            const isVid = data.imageUrl && (data.imageUrl.includes('.mp4') || data.imageUrl.includes('/video/'));
            const hasDiscount = data.discountPrice && data.discountPrice < data.price;

            div.innerHTML = `
                ${isVid ?
                    `<video src="${data.imageUrl}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" autoplay muted loop></video>` :
                    `<img src="${data.imageUrl || 'https://via.placeholder.com/60'}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">`
                }
                <div style="flex-grow: 1;">
                    <h4 style="margin: 0; font-size: 1rem;">${data.name}</h4>
                    <p style="margin: 0; font-weight: 600;">
                        ${hasDiscount ?
                    `<span style="color: var(--danger); text-decoration: line-through; font-size: 0.8rem; opacity: 0.6;">$${data.price}</span> 
                             <span style="color: var(--accent-color);">$${data.discountPrice}</span>` :
                    `<span style="color: var(--accent-color);">$${data.price}</span>`
                }
                    </p>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="editProduct('${data.id}')" style="background: var(--card-bg); color: white; border: 1px solid var(--card-border); padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">Edit</button>
                    <button onclick="deleteProduct('${data.id}')" style="background: rgba(239, 68, 68, 0.1); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.2); padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">Delete</button>
                </div>
            `;
            productList.appendChild(div);
        });
    } catch (error) {
        console.error("Firestore Error:", error);
        if (error.message.includes("permissions")) {
            productList.innerHTML = `
                <div style="background: rgba(239, 68, 68, 0.1); padding: 20px; border-radius: 12px; border: 1px solid var(--danger); color: white;">
                    <h4 style="color: var(--danger); margin-bottom:10px;"><i class="fas fa-lock"></i> Permission Denied</h4>
                    <p style="font-size: 0.9rem; margin-bottom:15px;">Your Firebase Database rules are blocking access. Please update your Firestore Rules in the Firebase Console.</p>
                    <code style="display:block; background:#000; padding:10px; border-radius:4px; font-size:0.75rem;">allow read/write: if request.auth != null;</code>
                </div>
            `;
        } else {
            productList.innerHTML = `<p style="color:red">Access Error: ${error.message}</p>`;
        }
    }
}

window.editProduct = (id) => {
    const product = currentProducts.find(p => p.id === id);
    if (!product) return;

    document.getElementById('p-id').value = product.id;
    document.getElementById('name').value = product.name;
    document.getElementById('formal-price').value = product.price;
    document.getElementById('discount-price').value = product.discountPrice || "";
    document.getElementById('description').value = product.description || "";
    productMedia = product.imageUrl;

    formTitle.innerText = "Edit Artifact";
    submitBtn.innerText = "Update Vault";
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const preview = document.getElementById('preview');
    preview.style.display = 'block';
    preview.src = product.imageUrl;
};

window.deleteProduct = async (id) => {
    if (confirm("Evict this product from the vault?")) {
        try {
            await deleteDoc(doc(db, "products", id));
            loadProducts();
        } catch (error) {
            alert("Eviction Failed: " + error.message);
        }
    }
};

window.clearForm = () => {
    productForm.reset();
    document.getElementById('p-id').value = "";
    formTitle.innerText = "Add New Artifact";
    submitBtn.innerText = "Save to Vault";
    productMedia = "";

    const preview = document.getElementById("preview");
    preview.style.display = "none";
    preview.src = "";

    // Clear video previews
    const existingVids = preview.parentElement.querySelectorAll('video');
    existingVids.forEach(v => v.remove());
};
