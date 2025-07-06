// Custom Design Studio JavaScript
let designState = {
    selectedProduct: null,
    productPrice: 0,
    sizePrice: 0,
    customText: '',
    textColor: '#000000',
    fontSize: 24,
    uploadedImages: [],
    customerInfo: {},
    specialInstructions: ''
};

// Initialize custom design functionality
document.addEventListener('DOMContentLoaded', function() {
    setupProductSelector();
    setupImageUpload();
    setupTextControls();
    setupSizeOptions();
    setupColorPicker();
    setupPriceCalculator();
    updateCartCount();
    initializeCartModal();
});

// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function initializeCartModal() {
    updateCartDisplay();
    updateCartCount();
}

function toggleCart() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.classList.toggle('active');
    }
}

function closeCartModal() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.classList.remove('active');
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
    const cartDelivery = document.getElementById('cartDelivery');

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
    if (cart.length === 0) {
        showToast('⚠️ Your cart is empty', 'warning');
        return;
    }
    
    showToast('🚀 Redirecting to order...', 'info');
    setTimeout(() => {
        window.location.href = 'track-order.html';
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

// Make functions globally available
window.toggleCart = toggleCart;
window.closeCartModal = closeCartModal;
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.applyVoucher = applyVoucher;
window.proceedToOrder = proceedToOrder;

// Product selection functionality
function setupProductSelector() {
    const productOptions = document.querySelectorAll('.product-option');

    productOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove previous selection
            productOptions.forEach(opt => opt.classList.remove('selected'));

            // Add selection to clicked option
            this.classList.add('selected');

            // Update product selector
            designState.selectedProduct = this.dataset.product;
            designState.productPrice = parseInt(this.dataset.price);

            // Update feedback and pricing
            updateProductSelection();
            updatePriceCalculator();
        });
    });
}

// Image upload functionality
function setupImageUpload() {
    const imageUpload = document.getElementById('imageUpload');
    const uploadedImagesContainer = document.getElementById('uploadedImages');

    imageUpload.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);

        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();

                reader.onload = function(e) {
                    const imageData = {
                        name: file.name,
                        data: e.target.result,
                        file: file
                    };

                    designState.uploadedImages.push(imageData);
                    displayUploadedImages();
                    updateProductPreview();
                };

                reader.readAsDataURL(file);
            }
        });
    });

    // Drag and drop functionality
    const fileLabel = document.querySelector('.file-label');

    fileLabel.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.background = '#667eea';
        this.style.color = 'white';
    });

    fileLabel.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.style.background = '#f8f9ff';
        this.style.color = '#667eea';
    });

    fileLabel.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.background = '#f8f9ff';
        this.style.color = '#667eea';

        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length > 0) {
            // Trigger file input change event
            const dataTransfer = new DataTransfer();
            imageFiles.forEach(file => dataTransfer.items.add(file));
            imageUpload.files = dataTransfer.files;
            imageUpload.dispatchEvent(new Event('change'));
        }
    });
}

// Display uploaded images
function displayUploadedImages() {
    const container = document.getElementById('uploadedImages');
    container.innerHTML = '';

    designState.uploadedImages.forEach((image, index) => {
        const imgElement = document.createElement('img');
        imgElement.src = image.data;
        imgElement.className = 'uploaded-image';
        imgElement.title = image.name;
        imgElement.onclick = () => selectUploadedImage(index);
        container.appendChild(imgElement);
    });
}

// Select uploaded image for preview
function selectUploadedImage(index) {
    const selectedImage = designState.uploadedImages[index];
    if (selectedImage && designState.selectedProduct) {
        updateProductPreview(selectedImage.data);
    }
}

// Text controls setup
function setupTextControls() {
    const customText = document.getElementById('customText');
    const fontSize = document.getElementById('fontSize');

    customText.addEventListener('input', function() {
        designState.customText = this.value;
        updateTextPreview();
    });

    fontSize.addEventListener('input', function() {
        designState.fontSize = parseInt(this.value);
        updateTextPreview();
    });
}

// Color picker setup
function setupColorPicker() {
    const colorOptions = document.querySelectorAll('.color-option');

    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove previous selection
            colorOptions.forEach(opt => opt.classList.remove('selected'));

            // Add selection to clicked option
            this.classList.add('selected');

            // Update design state
            designState.textColor = this.dataset.color;
            updateTextPreview();
        });
    });
}

// Size options setup
function setupSizeOptions() {
    const sizeOptions = document.querySelectorAll('.size-option');

    sizeOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove previous selection
            sizeOptions.forEach(opt => opt.classList.remove('selected'));

            // Add selection to clicked option
            this.classList.add('selected');

            // Update design state
            designState.sizePrice = parseInt(this.dataset.price);
            updatePriceCalculator();
        });
    });
}

// Update product preview
function updateProductPreview(customImage = null) {
    const productPreview = document.getElementById('productPreview');
    const overlay = document.getElementById('designOverlay');

    if (!designState.selectedProduct) {
        productPreview.style.display = 'none';
        overlay.style.display = 'block';
        return;
    }

    const productImages = {
        'mug': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        'tshirt': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
        'keychain': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
        'frame': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400'
    };

    productPreview.src = customImage || productImages[designState.selectedProduct];
    productPreview.style.display = 'block';
    overlay.style.display = 'none';

    updateTextPreview();
}

// Update text preview
function updateTextPreview() {
    const textOverlay = document.getElementById('textOverlay');

    if (designState.customText && designState.selectedProduct) {
        textOverlay.textContent = designState.customText;
        textOverlay.style.display = 'block';
        textOverlay.style.color = designState.textColor;
        textOverlay.style.fontSize = designState.fontSize + 'px';
        textOverlay.style.fontWeight = '600';
        textOverlay.style.textShadow = '1px 1px 2px rgba(0,0,0,0.3)';
    } else {
        textOverlay.style.display = 'none';
    }
}

// Price calculator setup
function setupPriceCalculator() {
    updatePriceCalculator();
}

// Update price calculator
function updatePriceCalculator() {
    const basePrice = designState.productPrice;
    const sizePrice = designState.sizePrice;
    const customPrice = (designState.customText || designState.uploadedImages.length > 0) ? 50 : 0;
    const deliveryPrice = 60;
    const totalPrice = basePrice + sizePrice + customPrice + deliveryPrice;

    document.getElementById('basePrice').textContent = '৳' + basePrice;
    document.getElementById('sizePrice').textContent = '৳' + sizePrice;
    document.getElementById('customPrice').textContent = '৳' + customPrice;
    document.getElementById('deliveryPrice').textContent = '৳' + deliveryPrice;
    document.getElementById('totalPrice').textContent = '৳' + totalPrice;
}

// Load design inspiration
function loadInspiration(type) {
    const inspirationTexts = {
        'couple': 'Forever Together ❤️',
        'family': 'Family Love Never Ends',
        'birthday': 'Happy Birthday! 🎉',
        'motivational': 'Dream Big, Work Hard',
        'business': 'Excellence in Everything',
        'anniversary': 'Years of Love & Happiness'
    };

    const textInput = document.getElementById('customText');
    textInput.value = inspirationTexts[type] || 'Custom Design';
    designState.customText = textInput.value;
    updateTextPreview();

    showNotification('Design inspiration loaded! Customize further as needed.', 'success');
}

// Reset design
function resetDesign() {
    if (confirm('Are you sure you want to reset your design? All changes will be lost.')) {
        // Reset design state
        designState = {
            selectedProduct: null,
            productPrice: 0,
            sizePrice: 0,
            customText: '',
            textColor: '#000000',
            fontSize: 24,
            uploadedImages: [],
            customerInfo: {},
            specialInstructions: ''
        };

        // Reset UI elements
        document.querySelectorAll('.product-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelectorAll('.size-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelector('.size-option[data-size="medium"]').classList.add('selected');
        document.querySelector('.color-option[data-color="#000000"]').classList.add('selected');

        // Reset form inputs
        document.getElementById('customText').value = '';
        document.getElementById('fontSize').value = '24';
        document.getElementById('customerName').value = '';
        document.getElementById('customerPhone').value = '';
        document.getElementById('customerEmail').value = '';
        document.getElementById('specialInstructions').value = '';
        document.getElementById('imageUpload').value = '';
        document.getElementById('uploadedImages').innerHTML = '';

        // Reset preview
        document.getElementById('productPreview').style.display = 'none';
        document.getElementById('textOverlay').style.display = 'none';
        document.getElementById('designOverlay').style.display = 'block';

        updatePriceCalculator();
        showNotification('Design reset successfully!', 'info');
    }
}

// Submit custom order
function submitCustomOrder() {
    // Validate required fields
    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const specialInstructions = document.getElementById('specialInstructions').value.trim();

    if (!designState.selectedProduct) {
        showNotification('Please select a product first!', 'error');
        return;
    }

    if (!customerName) {
        showNotification('Please enter your name!', 'error');
        return;
    }

    if (!customerPhone) {
        showNotification('Please enter your phone number!', 'error');
        return;
    }

    if (!designState.customText && designState.uploadedImages.length === 0) {
        showNotification('Please add custom text or upload an image!', 'error');
        return;
    }

    // Prepare order data
    const orderData = {
        type: 'custom_design',
        product: designState.selectedProduct,
        customization: {
            text: designState.customText,
            textColor: designState.textColor,
            fontSize: designState.fontSize,
            images: designState.uploadedImages.length,
            hasCustomDesign: true
        },
        pricing: {
            basePrice: designState.productPrice,
            sizeUpgrade: designState.sizePrice,
            customDesign: (designState.customText || designState.uploadedImages.length > 0) ? 50 : 0,
            delivery: 60,
            total: designState.productPrice + designState.sizePrice + 
                   ((designState.customText || designState.uploadedImages.length > 0) ? 50 : 0) + 60
        },
        customer: {
            name: customerName,
            phone: customerPhone,
            email: document.getElementById('customerEmail').value.trim(),
            instructions: specialInstructions
        },
        timestamp: new Date().toISOString()
    };

    // Generate WhatsApp message
    let message = `🎨 *Custom Design Order - TryneX Lifestyle*\n\n`;
    message += `👤 *Customer Details:*\n`;
    message += `Name: ${customerName}\n`;
    message += `Phone: ${customerPhone}\n`;
    if (orderData.customer.email) {
        message += `Email: ${orderData.customer.email}\n`;
    }
    message += `\n📦 *Product Details:*\n`;
    message += `Product: ${designState.selectedProduct.charAt(0).toUpperCase() + designState.selectedProduct.slice(1)}\n`;

    if (designState.customText) {
        message += `Custom Text: "${designState.customText}"\n`;
        message += `Text Color: ${designState.textColor}\n`;
        message += `Font Size: ${designState.fontSize}px\n`;
    }

    if (designState.uploadedImages.length > 0) {
        message += `Custom Images: ${designState.uploadedImages.length} file(s) uploaded\n`;
    }

    message += `\n💰 *Pricing:*\n`;
    message += `Base Price: ৳${designState.productPrice}\n`;
    if (designState.sizePrice > 0) {
        message += `Size Upgrade: ৳${designState.sizePrice}\n`;
    }
    message += `Custom Design: ৳${(designState.customText || designState.uploadedImages.length > 0) ? 50 : 0}\n`;
    message += `Delivery: ৳60\n`;
    message += `*Total: ৳${orderData.pricing.total}*\n`;

    if (specialInstructions) {
        message += `\n📝 *Special Instructions:*\n${specialInstructions}\n`;
    }

    message += `\n🕒 Order Date: ${new Date().toLocaleDateString()}\n`;
    message += `\n✅ Ready to proceed with this custom design order!`;

    // Save order to localStorage
    const savedOrders = JSON.parse(localStorage.getItem('custom-orders') || '[]');
    const orderId = 'CD' + Date.now();
    orderData.id = orderId;
    savedOrders.push(orderData);
    localStorage.setItem('custom-orders', JSON.stringify(savedOrders));

    // Create WhatsApp link
    const whatsappNumber = '+8801747292277';
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;

    // Show success notification
    showNotification('Order prepared! Redirecting to WhatsApp...', 'success');

    // Add to cart (optional)
    const cartItem = {
        id: orderId,
        name: `Custom ${designState.selectedProduct.charAt(0).toUpperCase() + designState.selectedProduct.slice(1)}`,
        price: orderData.pricing.total,
        quantity: 1,
        image: document.getElementById('productPreview').src,
        customization: orderData.customization
    };

    addToCart(cartItem);

    // Redirect to WhatsApp after short delay
    setTimeout(() => {
        window.open(whatsappUrl, '_blank');
    }, 1500);
}

// Add item to cart (integrate with existing cart system)
function addToCart(item) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push(item);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Update cart count
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Admin access functionality (integrated from main.js)
function adminAccess() {
    let clickCount = 0;
    const adminTrigger = document.querySelector('.admin-trigger');

    adminTrigger.addEventListener('click', function() {
        clickCount++;
        if (clickCount === 3) {
            showAdminAuthModal();
            clickCount = 0;
        }

        setTimeout(() => {
            clickCount = 0;
        }, 2000);
    });
}

function showAdminAuthModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Admin Access</h3>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">Enter Admin Password:</label>
                    <input type="password" id="adminPassword" class="form-input" placeholder="Password">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                <button class="btn-primary" onclick="validateAdminLogin()">Login</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function validateAdminLogin() {
    const password = document.getElementById('adminPassword').value;
    if (password === 'Amits@12345') {
        localStorage.setItem('admin-auth', 'true');
        localStorage.setItem('admin-auth-time', Date.now().toString());
        window.location.href = 'admin.html';
    } else {
        showNotification('Invalid password!', 'error');
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Setup admin access
    adminAccess();

    // Initialize design functionality
    setupProductSelector();
    setupImageUpload();
    setupTextControls();
    setupSizeOptions();
    setupColorPicker();
    setupPriceCalculator();
    updateCartCount();

    // Set default selections
    document.querySelector('.color-option[data-color="#000000"]').classList.add('selected');
});

function updateProductSelection() {
    // Hide overlay
    document.getElementById('designOverlay').style.display = 'none';
    updateProductPreview();
}