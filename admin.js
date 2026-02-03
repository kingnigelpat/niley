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

import { auth, db } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// MOCK AUTH REPLACED WITH REAL FIREBASE AUTH
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
    logoutBtn.style.display = 'none';
}

function showDashboard() {
    loginView.style.display = 'none';
    dashboardView.style.display = 'block';
    logoutBtn.style.display = 'block';
    loadProducts();
}

// Login Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    // STRICT ACCESS CONTROL (Front-line defense)
    const allowedEmails = ['lyvine16@gmail.com', 'patricknigel33@gmail.com', 'niely2423@gmail.com'];
    const requiredPassword = '2029togetherforever';

    // 1. Check strict credentials
    if (!allowedEmails.includes(email)) {
        loginError.innerText = "Access Denied: Unauthorized Email.";
        return;
    }
    if (password !== requiredPassword && !(email === 'admin@niley.com' && password === 'admin')) {
        loginError.innerText = "Access Denied: Incorrect Password.";
        return;
    }

    // 2. Perform Firebase Login
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.log("Login Error:", error.message);

        // Auto-Register Strict Admin if not found
        // (Only for the hardcoded admin@niley.com to make setup easier)
        if ((error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found')
            && email === 'admin@niley.com') {
            try {
                await createUserWithEmailAndPassword(auth, email, password);
                // Auto-login happens on success, state listener will trigger
            } catch (regError) {
                if (regError.code === 'auth/email-already-in-use') {
                    loginError.innerText = "Account exists but password in Firebase doesn't match 'admin'. Check Firebase Console.";
                } else {
                    loginError.innerText = "Auto-creation failed: " + regError.message;
                }
            }
        } else {
            // Normal Fallback for other users
            const wantRegister = confirm("User not found via Firebase. Register now?");
            if (wantRegister) {
                try {
                    await createUserWithEmailAndPassword(auth, email, password);
                } catch (err) {
                    loginError.innerText = err.message;
                }
            } else {
                loginError.innerText = error.message;
            }
        }
    }
});

// Logout Handler
window.logout = () => {
    signOut(auth);
};

// STATE
let currentProducts = [];

// --- CLOUDINARY WIDGET SETUP ---
// --- CLOUDINARY WIDGET SETUP ---
const cloudName = "dohfg4cin";
const uploadPreset = "nileymall";
let productMedia = "";
let widget;

document.getElementById("uploadBtn").onclick = function () {
    if (!window.cloudinary) {
        alert("Cloudinary script not loaded yet. Please refresh or check your connection.");
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
                    // OPTIMIZATION: Use Cloudinary's auto format and quality
                    // This replaces 'upload/' with 'upload/f_auto,q_auto/' in the URL
                    let optimizedUrl = result.info.secure_url;
                    if (optimizedUrl.includes("/upload/")) {
                        optimizedUrl = optimizedUrl.replace("/upload/", "/upload/f_auto,q_auto/");
                    }

                    productMedia = optimizedUrl;
                    document.getElementById("preview").src = productMedia;
                    document.getElementById("preview").style.display = "block";
                    console.log("Uploaded Optimized:", productMedia);
                } else if (error) {
                    console.error("Cloudinary Error:", error);
                    alert("Upload Error: " + error.message);
                }
            }
        );
    }

    widget.open();
};
// -----------------------------------

// Product Form Handler (FIRESTORE VERSION)
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.innerText = "Processing...";
    submitBtn.disabled = true;

    try {
        const id = document.getElementById('p-id').value;
        const name = document.getElementById('name').value;
        const price = parseFloat(document.getElementById('price').value);
        const desc = document.getElementById('description').value;

        if (!name || isNaN(price)) {
            throw new Error("Fill everything!");
        }

        // Image handling
        let finalImageUrl = productMedia || 'https://via.placeholder.com/150';

        if (id) {
            // EDIT
            const productRef = doc(db, "products", id);
            const updateData = {
                name,
                price,
                description: desc
            };
            if (productMedia) {
                updateData.imageUrl = finalImageUrl;
            }
            await updateDoc(productRef, updateData);
            alert("Product Updated!");
        } else {
            // CREATE
            const newProduct = {
                name,
                price,
                description: desc,
                imageUrl: finalImageUrl,
                createdAt: new Date().toISOString()
            };
            await addDoc(collection(db, "products"), newProduct);
            alert("Product Saved!");
        }

        clearForm();
        loadProducts();

    } catch (error) {
        console.error(error);
        alert("Error: " + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = document.getElementById('p-id').value ? "Update Product" : "Save Product";
    }
});

// Clear/Reset Form
window.clearForm = () => {
    productForm.reset();
    document.getElementById('p-id').value = "";
    formTitle.innerText = "Add New Product";
    submitBtn.innerText = "Save Product";
    productMedia = "";
    document.getElementById("preview").style.display = "none";
    document.getElementById("preview").src = "";
};

// Edit Product Setup
window.editProduct = (id) => {
    const product = currentProducts.find(p => p.id === id);
    if (!product) return;

    document.getElementById('p-id').value = product.id;
    document.getElementById('name').value = product.name;
    document.getElementById('price').value = product.price;
    document.getElementById('description').value = product.description || "";

    productMedia = product.imageUrl; // Keep existing image if not changed
    formTitle.innerText = "Edit Product";
    submitBtn.innerText = "Update Product";
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const preview = document.getElementById('preview');
    preview.style.display = 'block';
    preview.src = product.imageUrl;
};

// Load Products (FIRESTORE)
async function loadProducts() {
    productList.innerHTML = '<p>Loading products...</p>';
    currentProducts = [];

    try {
        const querySnapshot = await getDocs(collection(db, "products"));

        if (querySnapshot.empty) {
            productList.innerHTML = '<p>No products yet.</p>';
            return;
        }

        productList.innerHTML = ''; // Clear loading/empty message

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            data.id = doc.id; // Store Doc ID
            currentProducts.push(data);

            const item = document.createElement('div');
            item.className = 'product-card';
            item.style.marginBottom = '20px';
            item.style.display = 'flex';
            item.style.gap = '20px';
            item.style.alignItems = 'center';

            item.innerHTML = `
                <img src="${data.imageUrl}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px;">
                <div style="flex-grow: 1;">
                    <h4>${data.name}</h4>
                    <p>$${data.price}</p>
                </div>
                <div style="display:flex; flex-direction:column; gap: 5px;">
                    <button class="nav-btn" onclick="editProduct('${data.id}')" style="font-size: 0.8rem; border: 1px solid var(--accent-color); border-radius: 4px; padding: 5px;">
                        Edit
                    </button>
                    <button class="delete-btn" onclick="deleteProduct('${data.id}')">
                        Delete
                    </button>
                </div>
            `;
            productList.appendChild(item);
        });
    } catch (error) {
        console.error("Error loading products:", error);
        productList.innerHTML = `<p style="color:red">Error loading products: ${error.message}</p>`;
    }
}

// Delete Product
window.deleteProduct = async (id) => {
    if (confirm("Delete this product?")) {
        try {
            await deleteDoc(doc(db, "products", id));
            loadProducts();
        } catch (error) {
            alert("Error deleting: " + error.message);
        }
    }
}
