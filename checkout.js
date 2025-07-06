
// Checkout functionality with real-time order processing

let cartItems = [];
let selectedPaymentMethod = '';
let appliedVoucher = null;
let orderCalculations = {
    subtotal: 0,
    deliveryFee: 60,
    discount: 0,
    total: 0,
    dueAmount: 0
};

// Bangladesh districts and thanas data
const bangladeshData = {
    dhaka: ['Dhanmondi', 'Gulshan', 'Uttara', 'Mirpur', 'Wari', 'Ramna', 'Tejgaon', 'Pallabi', 'Shah Ali'],
    chittagong: ['Kotwali', 'Panchlaish', 'Halishahar', 'Khulshi', 'Bayazid', 'Pahartali', 'Bakalia', 'Chandgaon'],
    rajshahi: ['Boalia', 'Motihar', 'Rajpara', 'Shah Makhdum', 'Paba', 'Durgapur', 'Mohonpur', 'Charghat'],
    khulna: ['Khulna Sadar', 'Sonadanga', 'Khalishpur', 'Daulatpur', 'Khan Jahan Ali', 'Kotwali', 'Harintana'],
    barisal: ['Barisal Sadar', 'Kotwali', 'Babuganj', 'Bakerganj', 'Banaripara', 'Gaurnadi', 'Hizla'],
    sylhet: ['Sylhet Sadar', 'Jalalabad', 'Dakshin Surma', 'Osmani Nagar', 'Shah Poran', 'Kotwali'],
    rangpur: ['Rangpur Sadar', 'Kotwali', 'Mahiganj', 'Mithapukur', 'Pirganj', 'Badarganj', 'Gangachara'],
    mymensingh: ['Mymensingh Sadar', 'Kotwali', 'Muktagacha', 'Phulpur', 'Haluaghat', 'Gouripur', 'Dhobaura']
};

// Initialize checkout page
document.addEventListener('DOMContentLoaded', function() {
    loadCartItems();
    calculateTotals();
    displayOrderSummary();
});

// Load cart items from localStorage
function loadCartItems() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    cartItems = cart;
}

// Load thanas based on selected district
function loadThanas() {
    const districtSelect = document.getElementById('district');
    const thanaSelect = document.getElementById('thana');
    
    const selectedDistrict = districtSelect.value;
    
    // Clear thana options
    thanaSelect.innerHTML = '<option value="">Select Thana/Upazila</option>';
    
    if (selectedDistrict && bangladeshData[selectedDistrict]) {
        bangladeshData[selectedDistrict].forEach(thana => {
            const option = document.createElement('option');
            option.value = thana.toLowerCase().replace(/\s+/g, '-');
            option.textContent = thana;
            thanaSelect.appendChild(option);
        });
    }
}

// Select payment method
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    // Update UI
    document.querySelectorAll('.payment-method').forEach(pm => pm.classList.remove('selected'));
    document.querySelector(`.payment-method.${method}`).classList.add('selected');
    
    // Show payment details
    document.getElementById('paymentDetails').style.display = 'block';
    
    // Update transaction instructions
    updatePaymentInstructions(method);
}

// Update payment instructions
function updatePaymentInstructions(method) {
    const instructionsText = {
        bkash: 'Send Money to 01747292277 via bKash and enter the transaction ID below',
        nagad: 'Send Money to 01747292277 via Nagad and enter the transaction ID below',
        upay: 'Send Money to 01747292277 via Upay and enter the transaction ID below'
    };
    
    // You can add more UI updates here if needed
    console.log('Payment method selected:', method);
}

// Apply voucher
function applyVoucher() {
    const voucherCode = document.getElementById('voucherCode').value.trim().toUpperCase();
    const voucherResult = document.getElementById('voucherResult');
    
    if (!voucherCode) {
        voucherResult.innerHTML = '<div style="color: #dc3545;">Please enter a voucher code</div>';
        return;
    }
    
    // Load vouchers from localStorage
    const vouchers = JSON.parse(localStorage.getItem('admin-vouchers')) || [];
    const voucher = vouchers.find(v => v.code === voucherCode && v.is_active);
    
    if (voucher) {
        appliedVoucher = voucher;
        voucherResult.innerHTML = `<div style="color: #28a745;">✅ Voucher applied! ${voucher.discount_value}${voucher.discount_type === 'percentage' ? '%' : '৳'} discount</div>`;
        calculateTotals();
        displayOrderSummary();
    } else {
        voucherResult.innerHTML = '<div style="color: #dc3545;">❌ Invalid or expired voucher code</div>';
    }
}

// Calculate order totals
function calculateTotals() {
    orderCalculations.subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Apply voucher discount
    orderCalculations.discount = 0;
    if (appliedVoucher) {
        if (appliedVoucher.discount_type === 'percentage') {
            orderCalculations.discount = Math.round(orderCalculations.subtotal * (appliedVoucher.discount_value / 100));
        } else {
            orderCalculations.discount = appliedVoucher.discount_value;
        }
    }
    
    orderCalculations.total = orderCalculations.subtotal + orderCalculations.deliveryFee - orderCalculations.discount;
    orderCalculations.dueAmount = Math.max(0, orderCalculations.total - 100); // 100tk advance
}

// Display order summary
function displayOrderSummary() {
    const orderItemsContainer = document.getElementById('orderItems');
    const subtotalElement = document.getElementById('subtotal');
    const discountElement = document.getElementById('discount');
    const discountLine = document.getElementById('discountLine');
    const totalAmountElement = document.getElementById('totalAmount');
    const dueAmountElement = document.getElementById('dueAmount');
    
    // Display cart items
    orderItemsContainer.innerHTML = cartItems.map(item => `
        <div class="order-item">
            <img src="${item.image}" alt="${item.name}" class="item-image">
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-price">৳${item.price} × ${item.quantity}</div>
            </div>
            <div style="font-weight: 600;">৳${item.price * item.quantity}</div>
        </div>
    `).join('');
    
    // Update totals
    subtotalElement.textContent = `৳${orderCalculations.subtotal}`;
    totalAmountElement.textContent = `৳${orderCalculations.total}`;
    dueAmountElement.textContent = `৳${orderCalculations.dueAmount}`;
    
    // Show/hide discount line
    if (orderCalculations.discount > 0) {
        discountLine.style.display = 'flex';
        discountElement.textContent = `-৳${orderCalculations.discount}`;
    } else {
        discountLine.style.display = 'none';
    }
}

// Handle form submission
document.getElementById('checkoutForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    if (!selectedPaymentMethod) {
        showToast('Please select a payment method', 'error');
        return;
    }
    
    if (!document.getElementById('transactionId').value.trim()) {
        showToast('Please enter transaction ID after making payment', 'error');
        return;
    }
    
    // Collect form data
    const formData = new FormData(event.target);
    const orderData = {
        id: 'TRX' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase(),
        customerName: formData.get('customerName'),
        customerPhone: formData.get('customerPhone'),
        customerEmail: formData.get('customerEmail'),
        district: formData.get('district'),
        thana: formData.get('thana'),
        fullAddress: formData.get('fullAddress'),
        items: cartItems,
        paymentMethod: selectedPaymentMethod,
        transactionId: formData.get('transactionId'),
        voucherCode: appliedVoucher ? appliedVoucher.code : null,
        subtotal: orderCalculations.subtotal,
        deliveryFee: orderCalculations.deliveryFee,
        discount: orderCalculations.discount,
        totalAmount: orderCalculations.total,
        advancePaid: 100,
        dueAmount: orderCalculations.dueAmount,
        status: 'booked',
        paymentStatus: orderCalculations.dueAmount > 0 ? 'partially_paid' : 'fully_paid',
        createdAt: new Date().toISOString(),
        orderMessage: `Order placed via website. Payment: ${selectedPaymentMethod.toUpperCase()} - TXN: ${formData.get('transactionId')}`
    };
    
    // Save order to localStorage (admin will see this)
    saveOrderToStorage(orderData);
    
    // Clear cart
    localStorage.removeItem('cart');
    
    // Show success and redirect
    showOrderConfirmation(orderData);
});

// Save order to storage for admin to see
function saveOrderToStorage(orderData) {
    // Save to multiple locations for reliability
    const adminOrders = JSON.parse(localStorage.getItem('admin-orders')) || [];
    const websiteOrders = JSON.parse(localStorage.getItem('website-orders')) || [];
    
    adminOrders.unshift(orderData);
    websiteOrders.unshift(orderData);
    
    localStorage.setItem('admin-orders', JSON.stringify(adminOrders));
    localStorage.setItem('website-orders', JSON.stringify(websiteOrders));
    
    // Trigger real-time update event
    const updateEvent = new CustomEvent('orderPlaced', {
        detail: { order: orderData }
    });
    window.dispatchEvent(updateEvent);
    
    // Force cache refresh
    localStorage.setItem('cache_buster', Date.now().toString());
    
    console.log('✅ Order saved and broadcasted to admin panel:', orderData.id);
}

// Show order confirmation
function showOrderConfirmation(orderData) {
    const modal = document.createElement('div');
    modal.innerHTML = `
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
                padding: 3rem;
                border-radius: 15px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 500px;
                width: 90%;
            ">
                <div style="color: #28a745; font-size: 4rem; margin-bottom: 1rem;">✅</div>
                <h2 style="color: #333; margin-bottom: 1rem;">Order Placed Successfully!</h2>
                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin: 1.5rem 0;">
                    <h3 style="margin-bottom: 1rem; color: #333;">Order Details:</h3>
                    <p><strong>Order ID:</strong> ${orderData.id}</p>
                    <p><strong>Total Amount:</strong> ৳${orderData.totalAmount}</p>
                    <p><strong>Advance Paid:</strong> ৳${orderData.advancePaid}</p>
                    <p><strong>Due on Delivery:</strong> ৳${orderData.dueAmount}</p>
                </div>
                <p style="color: #666; margin-bottom: 2rem; line-height: 1.6;">
                    Your order has been received and is being processed. 
                    You can track your order using the Order ID above.
                </p>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button onclick="goToTracking('${orderData.id}')" style="
                        background: #FFD700;
                        color: #333;
                        border: none;
                        padding: 1rem 2rem;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                    ">Track Order</button>
                    <button onclick="goToHome()" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 1rem 2rem;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                    ">Continue Shopping</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto redirect after 10 seconds
    setTimeout(() => {
        goToTracking(orderData.id);
    }, 10000);
}

// Navigation functions
function goToTracking(orderId) {
    window.location.href = `track-order.html?orderId=${orderId}`;
}

function goToHome() {
    window.location.href = 'index.html';
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 5px;
        z-index: 10001;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        font-family: 'Poppins', sans-serif;
        font-weight: 500;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Make functions globally available
window.loadThanas = loadThanas;
window.selectPaymentMethod = selectPaymentMethod;
window.applyVoucher = applyVoucher;
window.goToTracking = goToTracking;
window.goToHome = goToHome;
