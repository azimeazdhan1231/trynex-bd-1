
// Global cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Initialize cart on all pages
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Main.js initializing...');
    initializeCartModal();
    updateCartCount();
    setupMobileMenu();
    setupSearch();
    setupPromoBanner();
    
    // Force load products to ensure they exist
    ensureProductsExist();
});

// Ensure products exist in storage
function ensureProductsExist() {
    const existingProducts = localStorage.getItem('website-products') || 
                           localStorage.getItem('admin-products');
    
    if (!existingProducts) {
        console.log('📦 No products found, generating sample products...');
        const sampleProducts = generateSampleProducts();
        localStorage.setItem('website-products', JSON.stringify(sampleProducts));
        localStorage.setItem('admin-products', JSON.stringify(sampleProducts));
        console.log('✅ Sample products generated and saved');
    }
}

// Generate sample products
function generateSampleProducts() {
    const products = [];
    const categories = ['mug', 't-shirt', 'keychain', 'couple'];
    
    for (let i = 1; i <= 48; i++) {
        const category = categories[(i - 1) % categories.length];
        products.push({
            id: i,
            name: `Custom ${category} ${i}`,
            price: Math.floor(200 + (Math.random() * 800)),
            category: category,
            description: `Premium quality ${category} with custom design.`,
            image_url: `https://images.unsplash.com/photo-${1544787219 + i}?w=400&h=400&fit=crop&q=80`,
            stock_quantity: Math.floor(20 + Math.random() * 80),
            is_active: true,
            created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    return products;
}

function initializeCartModal() {
    updateCartDisplay();
    updateCartCount();
}

function toggleCart() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.classList.toggle('active');

        // Add click outside to close functionality
        if (cartModal.classList.contains('active')) {
            setTimeout(() => {
                document.addEventListener('click', handleOutsideClick);
            }, 100);
        } else {
            document.removeEventListener('click', handleOutsideClick);
        }
    }
}

function handleOutsideClick(event) {
    const cartModal = document.getElementById('cartModal');
    const cartContent = cartModal?.querySelector('.cart-content');
    const cartIcon = document.querySelector('.cart-icon');

    if (cartModal && cartModal.classList.contains('active')) {
        if (!cartContent?.contains(event.target) && !cartIcon?.contains(event.target)) {
            closeCartModal();
        }
    }
}

function closeCartModal() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.classList.remove('active');
        document.removeEventListener('click', handleOutsideClick);
    }
}

function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartTotal = document.getElementById('cartTotal');

    if (!cartItems) return;

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
            </div>
        `;
        if (cartSubtotal) cartSubtotal.textContent = '৳0';
        if (cartTotal) cartTotal.textContent = '৳60';
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const delivery = 60;
    const total = subtotal + delivery;

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">৳${item.price}</div>
            </div>
            <div class="cart-item-actions">
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" readonly>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                <button class="remove-btn" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    if (cartSubtotal) cartSubtotal.textContent = `৳${subtotal}`;
    if (cartTotal) cartTotal.textContent = `৳${total}`;
}

function addToCart(productId, productData) {
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            ...productData,
            quantity: 1
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    updateCartCount();

    showToast('✅ Item added to cart!', 'success');
}

function updateQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }

    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        updateCartCount();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    updateCartCount();
    showToast('🗑️ Item removed from cart', 'info');
}

function clearCart() {
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    updateCartCount();
    showToast('🧹 Cart cleared', 'info');
}

function applyVoucher() {
    const voucherInput = document.getElementById('voucherInput');
    const discountItem = document.getElementById('discountItem');
    const cartDiscount = document.getElementById('cartDiscount');

    if (voucherInput && voucherInput.value.trim() === 'TRYNEX20') {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discount = Math.round(subtotal * 0.2);

        if (discountItem) discountItem.style.display = 'flex';
        if (cartDiscount) cartDiscount.textContent = `-৳${discount}`;

        // Update total
        const cartTotal = document.getElementById('cartTotal');
        const delivery = 60;
        const newTotal = subtotal - discount + delivery;
        if (cartTotal) cartTotal.textContent = `৳${newTotal}`;

        showToast('🎉 20% discount applied!', 'success');
        voucherInput.value = '';
    } else {
        showToast('❌ Invalid voucher code', 'error');
    }
}

function proceedToOrder() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        showToast('Your cart is empty!', 'warning');
        return;
    }

    // Close cart modal
    closeCartModal();

    // Redirect to checkout page
    showToast('Redirecting to checkout...', 'info');
    setTimeout(() => {
        window.location.href = 'checkout.html';
    }, 1000);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 5px;
        z-index: 10001;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        font-family: 'Poppins', sans-serif;
        font-weight: 500;
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Mobile menu functionality
function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');

    if (mobileMenuBtn && mobileMenuOverlay) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenuOverlay.classList.toggle('active');
        });

        mobileMenuOverlay.addEventListener('click', function(e) {
            if (e.target === mobileMenuOverlay) {
                mobileMenuOverlay.classList.remove('active');
            }
        });
    }
}

function toggleMobileMenu() {
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    if (mobileMenuOverlay) {
        mobileMenuOverlay.classList.toggle('active');
    }
}

// Search functionality
function setupSearch() {
    const searchIcon = document.querySelector('.nav-icon[onclick="toggleSearch()"]');
    const searchBar = document.getElementById('searchBar');

    if (searchIcon && searchBar) {
        searchIcon.addEventListener('click', function() {
            searchBar.style.display = searchBar.style.display === 'block' ? 'none' : 'block';
        });
    }
}

function toggleSearch() {
    const searchBar = document.getElementById('searchBar');
    if (searchBar) {
        searchBar.style.display = searchBar.style.display === 'block' ? 'none' : 'block';
        if (searchBar.style.display === 'block') {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
            }
        }
    }
}

// Promo banner functionality
function setupPromoBanner() {
    const promoBanner = document.getElementById('promoBanner');
    if (promoBanner && !localStorage.getItem('promoBannerClosed')) {
        promoBanner.style.display = 'block';
    }
}

function closePromoBanner() {
    const promoBanner = document.getElementById('promoBanner');
    if (promoBanner) {
        promoBanner.style.display = 'none';
        localStorage.setItem('promoBannerClosed', 'true');
    }
}

// Simple Admin Access System
function openAdminPanel() {
    // Check if already authenticated
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const sessionTime = localStorage.getItem('admin_session');

    if (isAuthenticated && sessionTime) {
        const sessionAge = Date.now() - parseInt(sessionTime);
        if (sessionAge < 24 * 60 * 60 * 1000) { // 24 hours
            // Already authenticated, open admin directly
            showToast('🔐 Opening admin panel...', 'info');
            setTimeout(() => {
                const adminWindow = window.open('admin.html', '_blank');
                if (!adminWindow) {
                    window.location.href = 'admin.html';
                }
            }, 300);
            return;
        } else {
            // Clear expired session
            localStorage.removeItem('admin_authenticated');
            localStorage.removeItem('admin_session');
        }
    }

    // Show authentication modal
    showAdminAuthModal();
}

function showAdminAuthModal() {
    const authModal = document.createElement('div');
    authModal.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: 'Poppins', sans-serif;
        ">
            <div style="
                background: white;
                padding: 2rem;
                border-radius: 15px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                text-align: center;
                min-width: 350px;
                max-width: 90%;
            ">
                <h2 style="margin-bottom: 1rem; color: #333;">🔐 Admin Panel Access</h2>
                <p style="margin-bottom: 1.5rem; color: #666;">Enter password to continue</p>
                <input type="password" id="adminPasswordInput" placeholder="Enter password" style="
                    width: 100%;
                    padding: 0.75rem;
                    border: 2px solid #ddd;
                    border-radius: 5px;
                    font-size: 1rem;
                    margin-bottom: 1rem;
                    box-sizing: border-box;
                ">
                <div>
                    <button id="adminLoginBtn" style="
                        background: #FFD700;
                        color: #000;
                        border: none;
                        padding: 0.75rem 2rem;
                        border-radius: 5px;
                        font-weight: 600;
                        cursor: pointer;
                        margin-right: 0.5rem;
                    ">Login</button>
                    <button id="adminCancelBtn" style="
                        background: #dc3545;
                        color: white;
                        border: none;
                        padding: 0.75rem 2rem;
                        border-radius: 5px;
                        font-weight: 600;
                        cursor: pointer;
                    ">Cancel</button>
                </div>
                <div id="adminErrorMsg" style="
                    color: #dc3545;
                    margin-top: 1rem;
                    display: none;
                "></div>
            </div>
        </div>
    `;

    document.body.appendChild(authModal);

    const passwordInput = document.getElementById('adminPasswordInput');
    const loginBtn = document.getElementById('adminLoginBtn');
    const cancelBtn = document.getElementById('adminCancelBtn');
    const errorMsg = document.getElementById('adminErrorMsg');

    passwordInput.focus();

    function validateLogin() {
        const password = passwordInput.value.trim();

        if (password === 'Amits@12345') {
            localStorage.setItem('admin_authenticated', 'true');
            localStorage.setItem('admin_session', Date.now().toString());

            authModal.querySelector('div > div').innerHTML = `
                <h2 style="color: #28a745;">✅ Success!</h2>
                <p>Opening admin panel...</p>
            `;

            setTimeout(() => {
                document.body.removeChild(authModal);
                const adminWindow = window.open('admin.html', '_blank');
                if (!adminWindow) {
                    window.location.href = 'admin.html';
                }
            }, 1000);

        } else if (password === '') {
            errorMsg.textContent = 'Please enter a password';
            errorMsg.style.display = 'block';
        } else {
            errorMsg.textContent = 'Invalid password';
            errorMsg.style.display = 'block';
            passwordInput.value = '';
        }
    }

    loginBtn.addEventListener('click', validateLogin);
    cancelBtn.addEventListener('click', () => document.body.removeChild(authModal));
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') validateLogin();
    });
    passwordInput.addEventListener('input', () => {
        errorMsg.style.display = 'none';
    });
}

// Make functions globally available
window.toggleCart = toggleCart;
window.closeCartModal = closeCartModal;
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.applyVoucher = applyVoucher;
window.proceedToOrder = proceedToOrder;
window.toggleMobileMenu = toggleMobileMenu;
window.toggleSearch = toggleSearch;
window.closePromoBanner = closePromoBanner;
window.openAdminPanel = openAdminPanel;
