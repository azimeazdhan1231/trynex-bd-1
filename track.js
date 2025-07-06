// Enhanced Order Tracking JavaScript

// Global variables
let savedOrders = [];
let adminOrders = [];

// Initialize tracking page
document.addEventListener('DOMContentLoaded', function() {
    loadSavedOrders();
    setupEventListeners();
    startRealTimeUpdates();
    
    // Auto-fill order ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    if (orderId) {
        document.getElementById('orderId').value = orderId;
        // Auto-track the order
        setTimeout(() => {
            trackOrderById(orderId);
        }, 500);
    }
});

// Load saved orders from localStorage
function loadSavedOrders() {
    // Load orders from admin panel first (most authoritative)
    const adminOrdersData = localStorage.getItem('admin-orders');
    if (adminOrdersData) {
        try {
            adminOrders = JSON.parse(adminOrdersData);
            savedOrders = [...adminOrders]; // Use admin orders as primary source
        } catch (error) {
            console.error('Error parsing admin orders:', error);
        }
    }

    // Load orders from main website and merge if needed
    const websiteOrders = localStorage.getItem('website-orders');
    if (websiteOrders) {
        try {
            const webOrders = JSON.parse(websiteOrders);
            webOrders.forEach(webOrder => {
                const existingOrder = savedOrders.find(order => order.id == webOrder.id);
                if (!existingOrder) {
                    savedOrders.push(webOrder);
                }
            });
        } catch (error) {
            console.error('Error parsing website orders:', error);
        }
    }

    // Listen for real-time order status updates
    window.addEventListener('orderStatusUpdated', function(event) {
        const { orderId, newStatus, order } = event.detail;
        const orderIndex = savedOrders.findIndex(o => o.id == orderId);
        if (orderIndex > -1) {
            savedOrders[orderIndex] = { ...savedOrders[orderIndex], ...order };
            
            // If currently displaying this order, refresh the display
            const currentOrderId = getCurrentDisplayedOrderId();
            if (currentOrderId && currentOrderId === orderId.toString()) {
                displayOrderInfo(savedOrders[orderIndex]);
                showMessage(`Order status updated to: ${newStatus.toUpperCase()}`, 'success');
            }
        }
    });

    // Enhanced storage listener for cross-tab communication
    window.addEventListener('storage', function(event) {
        if (event.key === 'admin-orders' && event.newValue) {
            try {
                const updatedAdminOrders = JSON.parse(event.newValue);
                const currentOrderId = getCurrentDisplayedOrderId();
                
                if (currentOrderId) {
                    const updatedOrder = updatedAdminOrders.find(o => o.id == currentOrderId);
                    if (updatedOrder) {
                        const orderIndex = savedOrders.findIndex(o => o.id == currentOrderId);
                        if (orderIndex > -1) {
                            savedOrders[orderIndex] = updatedOrder;
                            displayOrderInfo(updatedOrder);
                            showMessage('Order status updated in real-time!', 'info');
                        }
                    }
                }
            } catch (error) {
                console.error('Error processing real-time order update:', error);
            }
        }
        
        if (event.key === 'website-orders' && event.newValue) {
            loadSavedOrders();
        }
    });

    console.log(`Loaded ${savedOrders.length} orders for tracking`);
}

// Setup event listeners
function setupEventListeners() {
    const orderIdInput = document.getElementById('orderId');
    const phoneInput = document.getElementById('phoneNumber');

    if (orderIdInput) {
        orderIdInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                trackOrder(e);
            }
        });
    }

    if (phoneInput) {
        phoneInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                trackOrder(e);
            }
        });
    }
}

// Helper function to get status color
function getStatusColor(status) {
    const colors = {
        'booked': '#ffc107',
        'approved': '#17a2b8', 
        'working': '#fd7e14',
        'shipping': '#6f42c1',
        'completed': '#28a745',
        'cancelled': '#dc3545'
    };
    return colors[status] || '#6c757d';
}

// Helper function to get status icon
function getStatusIcon(status) {
    const icons = {
        'booked': '📋',
        'approved': '✅',
        'working': '⚡',
        'shipping': '🚚',
        'completed': '🎉',
        'cancelled': '❌'
    };
    return icons[status] || '📦';
}

// Generate dynamic timeline for order
function generateTimelineForOrder(order) {
    const statusSteps = {
        'booked': {
            title: 'Order Booked',
            description: 'Your order has been received and booked in our system',
            icon: 'fas fa-shopping-cart',
            completed: true
        },
        'approved': {
            title: 'Order Approved',
            description: 'Your order has been reviewed and approved for production',
            icon: 'fas fa-check-circle',
            completed: true
        },
        'working': {
            title: 'In Production',
            description: 'Your custom product is being created with care',
            icon: 'fas fa-tools',
            completed: true
        },
        'shipping': {
            title: 'Shipping',
            description: 'Your order has been completed and is on the way to you',
            icon: 'fas fa-shipping-fast',
            completed: true
        },
        'completed': {
            title: 'Order Completed',
            description: 'Your order has been successfully delivered',
            icon: 'fas fa-box-open',
            completed: true
        }
    };

    const currentStatus = order.status || 'booked';
    const statusOrder = ['booked', 'approved', 'working', 'shipping', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    // Generate timeline HTML
    const timelineSteps = statusOrder.map((status, index) => {
        const step = statusSteps[status];
        const isCompleted = index <= currentIndex;
        const isActive = index === currentIndex;

        return `
            <div class="timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}" style="position: relative; margin-bottom: 2.5rem; padding-left: 4rem;">
                <div class="step-icon" style="position: absolute; left: -1.5rem; top: 0.5rem; width: 3rem; height: 3rem; background: ${isCompleted ? 'linear-gradient(135deg, #28a745, #20c997)' : isActive ? 'linear-gradient(135deg, #FFD700, #FFA500)' : 'linear-gradient(135deg, #e9ecef, #dee2e6)'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${isCompleted || isActive ? 'white' : '#6c757d'}; font-size: 1.1rem; box-shadow: 0 4px 15px rgba(0,0,0,0.15); ${isActive ? 'animation: pulse 2s infinite;' : ''} border: 4px solid white; z-index: 2;">
                    <i class="${step.icon}"></i>
                </div>
                <div class="step-content" style="background: ${isCompleted ? 'linear-gradient(135deg, #d4edda, #e8f5e9)' : isActive ? 'linear-gradient(135deg, #fff3cd, #fff8db)' : 'linear-gradient(135deg, #f8f9fa, #fff)'}; padding: 1.5rem; border-radius: 12px; border-left: 5px solid ${isCompleted ? '#28a745' : isActive ? '#FFD700' : '#e9ecef'}; box-shadow: 0 4px 15px rgba(0,0,0,0.08); transition: all 0.3s ease; position: relative; overflow: hidden;">
                    ${isActive ? '<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%); animation: shimmer 2s infinite;"></div>' : ''}
                    <h4 style="margin: 0 0 0.8rem 0; color: ${isCompleted ? '#155724' : isActive ? '#856404' : '#6c757d'}; font-size: 1.2rem; font-weight: 600; position: relative; z-index: 1;">${step.title}</h4>
                    <p style="margin: 0; color: ${isCompleted ? '#155724' : isActive ? '#856404' : '#6c757d'}; font-size: 1rem; line-height: 1.6; position: relative; z-index: 1;">${step.description}</p>
                    ${isCompleted ? `<small class="step-date" style="color: #666; font-size: 0.9rem; margin-top: 0.8rem; display: block; padding: 0.5rem; background: rgba(255,255,255,0.5); border-radius: 6px; position: relative; z-index: 1;"><i class="fas fa-calendar-alt"></i> ${new Date(order.createdAt || Date.now()).toLocaleDateString()}</small>` : ''}
                </div>
            </div>
        `;
    }).join('');

    return timelineSteps;
}

// Select tracking method
function selectTrackMethod(method) {
    const orderIdSection = document.getElementById('orderIdSection');
    const phoneSection = document.getElementById('phoneSection');
    const methodButtons = document.querySelectorAll('.method-btn');

    // Reset active states
    methodButtons.forEach(btn => btn.classList.remove('active'));

    if (method === 'orderId') {
        orderIdSection.style.display = 'block';
        phoneSection.style.display = 'none';
        document.querySelector('[onclick="selectTrackMethod(\'orderId\')"]').classList.add('active');
        document.getElementById('orderId').focus();
    } else if (method === 'phone') {
        orderIdSection.style.display = 'none';
        phoneSection.style.display = 'block';
        document.querySelector('[onclick="selectTrackMethod(\'phone\')"]').classList.add('active');
        document.getElementById('phoneNumber').focus();
    }
}

// Track order
function trackOrder(event) {
    event.preventDefault();

    const orderId = document.getElementById('orderId')?.value.trim();
    const phoneNumber = document.getElementById('phoneNumber')?.value.trim();

    if (orderId) {
        trackOrderById(orderId);
    } else if (phoneNumber) {
        trackOrderByPhone(phoneNumber);
    } else {
        showMessage('Please enter an Order ID or Phone Number', 'error');
    }
}

// Track order by ID
function trackOrderById(orderId) {
    // Reload latest orders first
    loadSavedOrders();
    
    // Remove # if present and clean the input
    const cleanOrderId = orderId.replace(/[#\s-]/g, '').toLowerCase();

    // Find order by ID with multiple matching strategies
    const order = savedOrders.find(o => {
        if (!o || !o.id) return false;
        
        const orderIdStr = o.id.toString().toLowerCase();
        const orderIdNum = parseInt(o.id);
        const cleanOrderIdNum = parseInt(cleanOrderId);
        
        // Try different matching strategies
        return orderIdStr === cleanOrderId || 
               orderIdStr.includes(cleanOrderId) ||
               cleanOrderId.includes(orderIdStr) ||
               (orderIdNum && cleanOrderIdNum && orderIdNum === cleanOrderIdNum) ||
               orderIdStr.replace('trx', '') === cleanOrderId ||
               cleanOrderId.replace('trx', '') === orderIdStr;
    });

    if (order) {
        displayOrderInfo(order);
    } else {
        displayNoOrderFound();
        // Show suggestion for correct format
        showOrderIdSuggestion(orderId);
        
        // Create demo order for testing if no orders exist
        if (savedOrders.length === 0) {
            createDemoOrder(orderId);
        }
    }
}

// Track order by phone
function trackOrderByPhone(phoneNumber) {
    // Reload latest orders first
    loadSavedOrders();
    
    // Clean phone number (remove spaces, dashes, country codes, etc.)
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)+]/g, '').replace(/^880/, '').replace(/^88/, '');

    // Find orders by phone number with multiple matching strategies
    const orders = savedOrders.filter(order => {
        if (!order.customerPhone && !order.phone) return false;
        
        const orderPhone = (order.customerPhone || order.phone || '').replace(/[\s\-\(\)+]/g, '').replace(/^880/, '').replace(/^88/, '');
        
        // Try different matching strategies
        return orderPhone.includes(cleanPhone) || 
               cleanPhone.includes(orderPhone) ||
               orderPhone.endsWith(cleanPhone.slice(-8)) ||
               cleanPhone.endsWith(orderPhone.slice(-8));
    });

    if (orders.length > 0) {
        if (orders.length === 1) {
            displayOrderInfo(orders[0]);
        } else {
            displayMultipleOrders(orders);
        }
    } else {
        displayNoOrderFound();
        // Create a demo trackable order if no orders exist
        if (savedOrders.length === 0) {
            createSampleTrackableOrder(null, phoneNumber);
        }
    }
}

// Display single order information
function displayOrderInfo(order) {
    const resultDiv = document.getElementById('trackResult');

    const timeline = generateTimelineForOrder(order);
    const estimatedDelivery = getEstimatedDelivery(order);
    
    // Calculate due amount
    const totalAmount = order.totalAmount || 0;
    const advancePaid = order.advancePaid || 100; // Default 100 or saved amount
    const dueAmount = Math.max(0, totalAmount - advancePaid);
    
    // Set payment status if not exists
    if (!order.paymentStatus) {
        order.paymentStatus = dueAmount > 0 ? 'partially_paid' : 'fully_paid';
    }
    
    // Check if order is accepted (approved status or higher)
    const isAccepted = ['approved', 'working', 'shipping', 'completed'].includes(order.status);

    resultDiv.innerHTML = `
        <div class="order-found" style="background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%); border-radius: 20px; padding: 2.5rem; box-shadow: 0 15px 40px rgba(0,0,0,0.12); margin-bottom: 2rem; border: 1px solid rgba(255,215,0,0.2);">
            <div class="order-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 3px solid #f0f0f0; position: relative;">
                <div>
                    <h2 style="margin: 0; color: #333; font-size: 2rem; display: flex; align-items: center; gap: 0.8rem; font-weight: 700;">
                        <i class="fas fa-package" style="color: #FFD700; background: rgba(255,215,0,0.1); padding: 0.5rem; border-radius: 50%; font-size: 1.5rem;"></i> 
                        Order #${order.id}
                    </h2>
                    <p style="margin: 0.8rem 0 0 0; color: #666; font-size: 1.1rem; font-weight: 500;">Customer: ${order.customerPhone || order.customerName || 'N/A'}</p>
                </div>
                <div class="order-status-badge" style="background: linear-gradient(135deg, ${getStatusColor(order.status)}, ${getStatusColor(order.status)}dd); color: white; padding: 1rem 2rem; border-radius: 30px; font-weight: 700; font-size: 1.1rem; text-transform: uppercase; box-shadow: 0 4px 15px rgba(0,0,0,0.2); position: relative; overflow: hidden;">
                    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%); animation: shimmer 2s infinite;"></div>
                    <span style="position: relative; z-index: 1;">${getStatusIcon(order.status)} ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                </div>
            </div>

            ${isAccepted ? `
                <div class="payment-status-card" style="background: linear-gradient(135deg, #e8f5e8 0%, #f0fff0 100%); border: 2px solid #28a745; border-radius: 15px; padding: 1.5rem; margin-bottom: 2rem; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -10px; right: -10px; background: #28a745; color: white; padding: 0.5rem 1rem; border-radius: 0 0 0 15px; font-size: 0.8rem; font-weight: 600;">
                        ✅ ORDER ACCEPTED
                    </div>
                    <h3 style="margin: 0 0 1rem 0; color: #28a745; font-size: 1.3rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-credit-card"></i> Payment Information
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div style="background: white; padding: 1rem; border-radius: 10px; text-align: center; border: 2px solid #e9ecef;">
                            <div style="color: #28a745; font-size: 0.9rem; margin-bottom: 0.3rem;">Advance Paid</div>
                            <div style="font-size: 1.3rem; font-weight: 700; color: #333;">৳${order.advancePaid || 100}</div>
                        </div>
                        <div style="background: ${dueAmount > 0 ? '#fff3cd' : 'white'}; padding: 1rem; border-radius: 10px; text-align: center; border: 2px solid ${dueAmount > 0 ? '#ffc107' : '#e9ecef'};">
                            <div style="color: ${dueAmount > 0 ? '#856404' : '#28a745'}; font-size: 0.9rem; margin-bottom: 0.3rem;">
                                ${dueAmount > 0 ? 'Due Amount' : 'Fully Paid'}
                            </div>
                            <div style="font-size: 1.3rem; font-weight: 700; color: ${dueAmount > 0 ? '#856404' : '#28a745'};">
                                ৳${dueAmount}
                            </div>
                        </div>
                        <div style="background: white; padding: 1rem; border-radius: 10px; text-align: center; border: 2px solid #e9ecef;">
                            <div style="color: #666; font-size: 0.9rem; margin-bottom: 0.3rem;">Total Amount</div>
                            <div style="font-size: 1.3rem; font-weight: 700; color: #333;">৳${totalAmount}</div>
                        </div>
                        <div style="background: ${order.paymentStatus === 'fully_paid' ? '#d4edda' : order.paymentStatus === 'partially_paid' ? '#fff3cd' : '#f8d7da'}; padding: 1rem; border-radius: 10px; text-align: center; border: 2px solid ${order.paymentStatus === 'fully_paid' ? '#28a745' : order.paymentStatus === 'partially_paid' ? '#ffc107' : '#dc3545'};">
                            <div style="color: ${order.paymentStatus === 'fully_paid' ? '#155724' : order.paymentStatus === 'partially_paid' ? '#856404' : '#721c24'}; font-size: 0.9rem; margin-bottom: 0.3rem;">Payment Status</div>
                            <div style="font-size: 1rem; font-weight: 700; color: ${order.paymentStatus === 'fully_paid' ? '#155724' : order.paymentStatus === 'partially_paid' ? '#856404' : '#721c24'};">
                                ${order.paymentStatus === 'fully_paid' ? '✅ Fully Paid' : order.paymentStatus === 'partially_paid' ? '⏳ Partial' : '❌ Pending'}
                            </div>
                        </div>
                    </div>
                    ${dueAmount > 0 ? `
                        <div style="margin-top: 1.5rem;">
                            <div style="padding: 1rem; background: rgba(255,193,7,0.1); border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 1rem;">
                                <p style="margin: 0; color: #856404; font-weight: 500;">
                                    <i class="fas fa-info-circle"></i> Due amount: ৳${dueAmount} - ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Payment Required'}
                                </p>
                            </div>
                            <div style="text-align: center;">
                                <button onclick="showPaymentOptions('${order.id}', ${dueAmount})" style="
                                    background: linear-gradient(135deg, #28a745, #20c997); 
                                    color: white; 
                                    border: none; 
                                    padding: 0.75rem 2rem; 
                                    border-radius: 25px; 
                                    font-weight: 600; 
                                    cursor: pointer; 
                                    font-size: 1rem;
                                    box-shadow: 0 4px 15px rgba(40,167,69,0.3);
                                    transition: all 0.3s ease;
                                " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                                    <i class="fas fa-credit-card"></i> Clear Due Payment
                                </button>
                            </div>
                        </div>
                    ` : `
                        <div style="margin-top: 1rem; padding: 1rem; background: rgba(40,167,69,0.1); border-radius: 8px; border-left: 4px solid #28a745;">
                            <p style="margin: 0; color: #155724; font-weight: 500;">
                                <i class="fas fa-check-circle"></i> Your order is fully paid. No additional payment required.
                            </p>
                        </div>
                    `}
                </div>
            ` : ''}

            <div class="order-summary-card" style="background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%); padding: 2rem; border-radius: 15px; margin-bottom: 2rem; border: 1px solid #e9ecef;">
                <div class="order-details-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 2rem;">
                    <div class="detail-item" style="text-align: center; padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 2px solid #f0f0f0; transition: all 0.3s ease;">
                        <i class="fas fa-calendar-alt" style="color: #FFD700; font-size: 2rem; margin-bottom: 0.8rem; background: rgba(255,215,0,0.1); padding: 0.8rem; border-radius: 50%;"></i>
                        <div class="detail-label" style="font-size: 1rem; color: #666; margin-bottom: 0.5rem; font-weight: 500;">Order Date</div>
                        <div class="detail-value" style="font-weight: 700; color: #333; font-size: 1.1rem;">${new Date(order.createdAt || Date.now()).toLocaleDateString()}</div>
                    </div>
                    <div class="detail-item" style="text-align: center; padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 2px solid #f0f0f0; transition: all 0.3s ease;">
                        <i class="fas fa-dollar-sign" style="color: #28a745; font-size: 2rem; margin-bottom: 0.8rem; background: rgba(40,167,69,0.1); padding: 0.8rem; border-radius: 50%;"></i>
                        <div class="detail-label" style="font-size: 1rem; color: #666; margin-bottom: 0.5rem; font-weight: 500;">Total Amount</div>
                        <div class="detail-value" style="font-weight: 700; color: #333; font-size: 1.4rem;">৳${totalAmount}</div>
                    </div>
                    <div class="detail-item" style="text-align: center; padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 2px solid #f0f0f0; transition: all 0.3s ease;">
                        <i class="fas fa-truck" style="color: #17a2b8; font-size: 2rem; margin-bottom: 0.8rem; background: rgba(23,162,184,0.1); padding: 0.8rem; border-radius: 50%;"></i>
                        <div class="detail-label" style="font-size: 1rem; color: #666; margin-bottom: 0.5rem; font-weight: 500;">Estimated Delivery</div>
                        <div class="detail-value" style="font-weight: 700; color: #333; font-size: 1.1rem;">${estimatedDelivery}</div>
                    </div>
                </div>
            </div>

            ${order.items ? `
                <div class="order-items" style="margin-bottom: 2rem;">
                    <h3 style="color: #333; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.8rem; font-size: 1.4rem; font-weight: 700;">
                        <i class="fas fa-shopping-bag" style="color: #FFD700; background: rgba(255,215,0,0.1); padding: 0.5rem; border-radius: 50%;"></i> Order Items
                    </h3>
                    <div class="items-list" style="display: grid; gap: 1.5rem;">
                        ${order.items.map(item => `
                            <div class="item-card" style="display: flex; align-items: center; gap: 1.5rem; padding: 1.8rem; background: linear-gradient(135deg, white 0%, #f8f9ff 100%); border: 2px solid #e0e0e0; border-radius: 15px; box-shadow: 0 8px 25px rgba(0,0,0,0.08); transition: all 0.3s ease; position: relative; overflow: hidden;">
                                <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: linear-gradient(135deg, #FFD700, #FFA500);"></div>
                                <img src="${item.image || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=100&auto=format&fit=crop'}" alt="${item.name}" class="item-image" style="width: 100px; height: 100px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 3px solid white;">
                                <div class="item-info" style="flex: 1;">
                                    <h4 style="margin: 0 0 0.8rem 0; color: #333; font-size: 1.3rem; font-weight: 600;">${item.name}</h4>
                                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                                        <span style="background: #e9ecef; padding: 0.3rem 0.8rem; border-radius: 15px; color: #495057; font-weight: 500; font-size: 0.9rem;">
                                            <i class="fas fa-box"></i> Quantity: ${item.quantity}
                                        </span>
                                        <span style="background: linear-gradient(135deg, #FFD700, #FFA500); color: white; padding: 0.3rem 0.8rem; border-radius: 15px; font-weight: 600; font-size: 0.9rem;">
                                            <i class="fas fa-tag"></i> ৳${item.price} each
                                        </span>
                                    </div>
                                    <p class="item-total" style="margin: 0.8rem 0 0 0; color: #28a745; font-weight: 700; font-size: 1.2rem;">
                                        Total: ৳${item.price * item.quantity}
                                    </p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="order-timeline" style="margin-bottom: 2.5rem;">
                <h3 style="color: #333; margin-bottom: 2rem; display: flex; align-items: center; gap: 0.8rem; font-size: 1.4rem; font-weight: 700;">
                    <i class="fas fa-history" style="color: #FFD700; background: rgba(255,215,0,0.1); padding: 0.5rem; border-radius: 50%;"></i> Order Timeline
                </h3>
                <div class="timeline" style="position: relative; padding-left: 3rem; background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%); padding: 2rem 2rem 2rem 3rem; border-radius: 15px; border: 2px solid #e9ecef;">
                    <div style="position: absolute; left: 1.5rem; top: 2rem; bottom: 2rem; width: 3px; background: linear-gradient(135deg, #FFD700, #FFA500); border-radius: 2px;"></div>
                    ${timeline}
                </div>
            </div>

            <div class="order-actions" style="display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap; padding: 2rem; background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%); border-radius: 15px; border: 2px solid #e9ecef;">
                <button class="btn btn-primary" onclick="window.open('https://wa.me/8801747292277?text=Hello, I need help with Order #${order.id}', '_blank')" style="background: linear-gradient(135deg, #25d366, #20bf55); border: none; color: white; padding: 1rem 2rem; border-radius: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.8rem; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(37,211,102,0.3); font-size: 1rem; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%); animation: shimmer 2s infinite;"></div>
                    <i class="fab fa-whatsapp" style="font-size: 1.2rem; position: relative; z-index: 1;"></i> 
                    <span style="position: relative; z-index: 1;">Contact Support</span>
                </button>
                <button class="btn btn-secondary" onclick="refreshOrderStatus('${order.id}')" style="background: linear-gradient(135deg, #17a2b8, #138496); border: none; color: white; padding: 1rem 2rem; border-radius: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.8rem; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(23,162,184,0.3); font-size: 1rem; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%); animation: shimmer 2s infinite;"></div>
                    <i class="fas fa-sync-alt" style="font-size: 1.2rem; position: relative; z-index: 1;"></i> 
                    <span style="position: relative; z-index: 1;">Refresh Status</span>
                </button>
            </div>
        </div>
    `;

    resultDiv.style.display = 'block';
    showMessage('Order found successfully!', 'success');
}

// Display multiple orders
function displayMultipleOrders(orders) {
    const resultDiv = document.getElementById('trackResult');

    resultDiv.innerHTML = `
        <div class="multiple-orders">
            <h2><i class="fas fa-list"></i> Multiple Orders Found</h2>
            <p>We found ${orders.length} orders associated with this phone number:</p>

            <div class="orders-list">
                ${orders.map(order => `
                    <div class="order-card" onclick="displayOrderInfo(${JSON.stringify(order).replace(/"/g, '&quot;')})">
                        <div class="order-card-header">
                            <h3>Order #${order.id}</h3>
                            <div class="order-status status-${order.status}">
                                ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </div>
                        </div>
                        <div class="order-card-details">
                            <p><strong>Date:</strong> ${new Date(order.createdAt || Date.now()).toLocaleDateString()}</p>
                            <p><strong>Total:</strong> ৳${order.totalAmount || 0}</p>
                            <p><strong>Items:</strong> ${order.items ? order.items.length : 0} item(s)</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    resultDiv.style.display = 'block';
    showMessage(`Found ${orders.length} orders for this phone number`, 'success');
}

// Display no order found
function displayNoOrderFound() {
    const resultDiv = document.getElementById('trackResult');

    resultDiv.innerHTML = `
        <div class="no-order">
            <div class="no-order-icon">
                <i class="fas fa-search"></i>
            </div>
            <h2>No Order Found</h2>
            <p>We couldn't find any orders matching your search criteria.</p>
            <div class="help-options">
                <h3>What you can do:</h3>
                <ul>
                    <li>Double-check your Order ID or Phone Number</li>
                    <li>Make sure you're using the same phone number used for the order</li>
                    <li>Contact our support team for assistance</li>
                </ul>
                <button class="btn btn-primary" onclick="window.open('https://wa.me/8801747292277?text=Hello, I need help tracking my order', '_blank')">
                    <i class="fab fa-whatsapp"></i> Contact Support
                </button>
            </div>
        </div>
    `;

    resultDiv.style.display = 'block';
    showMessage('No orders found matching your search', 'warning');
}

// Show order ID suggestion
function showOrderIdSuggestion(enteredId) {
    const resultDiv = document.getElementById('trackResult');

    resultDiv.innerHTML = `
        <div class="order-suggestion">
            <div class="suggestion-icon">
                <i class="fas fa-search"></i>
            </div>
            <h2>Order Not Found</h2>
            <p>We couldn't find an order with ID: <strong>${enteredId}</strong></p>

            <div class="id-format-help">
                <h3>Order ID Format:</h3>
                <div class="format-examples">
                    <div class="format-item">
                        <span class="format-label">Standard Format:</span>
                        <span class="format-example">TRX123456789</span>
                    </div>
                    <div class="format-item">
                        <span class="format-label">Alternative:</span>
                        <span class="format-example">Numbers only (e.g., 1234567890)</span>
                    </div>
                </div>
            </div>

            <div class="suggestion-actions">
                <h3>What you can do:</h3>
                <ul>
                    <li>Check your WhatsApp conversation for the correct Order ID</li>
                    <li>Try searching with your phone number instead</li>
                    <li>Make sure you're entering the complete Order ID</li>
                    <li>Contact support if you need help finding your order</li>
                </ul>

                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="selectTrackMethod('phone')">
                        <i class="fas fa-phone"></i> Try Phone Number
                    </button>
                    <button class="btn btn-secondary" onclick="window.open('https://wa.me/8801747292277?text=I need help finding my order ID: ${enteredId}', '_blank')">
                        <i class="fab fa-whatsapp"></i> Contact Support
                    </button>
                    <button class="btn btn-outline" onclick="createDemoOrder('${enteredId}')">
                        <i class="fas fa-play"></i> Try Demo Order
                    </button>
                </div>
            </div>
        </div>
    `;

    resultDiv.style.display = 'block';
}

// Create demo order for testing
function createDemoOrder(orderId) {
    const demoOrder = {
        id: orderId.startsWith('TRX') ? orderId : `TRX${orderId}`,
        customerPhone: '+880 1747 292277',
        items: [
            {
                id: 1,
                name: 'Custom Photo Mug',
                quantity: 1,
                price: 450,
                image: 'https://pixabay.com/get/g540f3ce1740df1e44769f5e3158512062b1c378c2eda6c363b500818daab02f6a1eed81f56ef73db6d167266fd7cb37d541583ba571e8821838c096661391dba_1280.jpg'
            }
        ],
        subtotal: 450,
        deliveryFee: 60,
        discount: 0,
        totalAmount: 510,
        status: 'working',
        statusHistory: [
            {
                status: 'booked',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                note: 'Order placed via website'
            },
            {
                status: 'approved',
                timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                note: 'Order approved and sent for production'
            },
            {
                status: 'working',
                timestamp: new Date().toISOString(),
                note: 'Your custom product is being created'
            }
        ],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        orderMessage: 'Demo order for tracking demonstration'
    };

    // Add to saved orders for future tracking
    savedOrders.push(demoOrder);
    localStorage.setItem('website-orders', JSON.stringify(savedOrders));

    // Show the demo order
    setTimeout(() => {
        displayOrderInfo(demoOrder);
        showMessage('Demo order created successfully! This is how tracking works.', 'success');
    }, 500);
}

// Get estimated delivery date
function getEstimatedDelivery(order) {
    const orderDate = new Date(order.createdAt || Date.now());
    const status = order.status;

    let daysToAdd = 0;
    switch(status) {
        case 'booked':
            daysToAdd = 7;
            break;
        case 'approved':
            daysToAdd = 5;
            break;
        case 'working':
            daysToAdd = 3;
            break;
        case 'shipping':
            daysToAdd = 1;
            break;
        case 'completed':
            return 'Delivered';
        default:
            daysToAdd = 7;
    }

    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);

    return deliveryDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Refresh order status
function refreshOrderStatus(orderId) {
    // Force reload orders from localStorage to get latest status
    loadSavedOrders();

    // Find and display updated order with flexible matching
    const order = savedOrders.find(o => o.id == orderId || o.id.toString() === orderId.toString());
    if (order) {
        displayOrderInfo(order);
        showMessage('Order status refreshed!', 'success');
    } else {
        showMessage('Could not refresh order status. Order may have been removed.', 'warning');
        // Try to find by partial match
        const partialMatch = savedOrders.find(o => 
            o.id.toString().includes(orderId.toString()) || 
            orderId.toString().includes(o.id.toString())
        );
        if (partialMatch) {
            displayOrderInfo(partialMatch);
            showMessage('Found similar order!', 'info');
        }
    }
}

// Show message
function showMessage(message, type) {
    const existingMessage = document.querySelector('.tracking-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `tracking-message message-${type}`;
    messageDiv.innerHTML = `
        <div class="message-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="message-close">&times;</button>
        </div>
    `;

    document.body.appendChild(messageDiv);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentElement) {
            messageDiv.remove();
        }
    }, 5000);
}

// Start real-time updates monitoring
function startRealTimeUpdates() {
    // Check for status updates every 10 seconds
    setInterval(() => {
        const currentOrderId = getCurrentDisplayedOrderId();
        if (currentOrderId) {
            // Reload orders from localStorage to get latest updates
            loadSavedOrders();
            
            // Find updated order
            const updatedOrder = savedOrders.find(o => o.id == currentOrderId);
            if (updatedOrder) {
                // Re-display with updated information
                displayOrderInfo(updatedOrder);
            }
        }
    }, 10000); // Check every 10 seconds

    // Listen for storage changes (when admin updates order status)
    window.addEventListener('storage', function(e) {
        if (e.key === 'admin-orders' || e.key === 'website-orders') {
            const currentOrderId = getCurrentDisplayedOrderId();
            if (currentOrderId) {
                loadSavedOrders();
                const updatedOrder = savedOrders.find(o => o.id == currentOrderId);
                if (updatedOrder) {
                    displayOrderInfo(updatedOrder);
                    showMessage('Order status updated!', 'info');
                }
            }
        }
    });
}

// Get currently displayed order ID
function getCurrentDisplayedOrderId() {
    const trackResult = document.getElementById('trackResult');
    if (trackResult && trackResult.style.display !== 'none') {
        const orderHeader = trackResult.querySelector('h2');
        if (orderHeader) {
            const orderText = orderHeader.textContent;
            const match = orderText.match(/Order #(.+)/);
            return match ? match[1] : null;
        }
    }
    return null;
}

// Enhanced refresh function with better feedback
function refreshOrderStatus(orderId) {
    // Show loading message
    showMessage('Refreshing order status...', 'info');
    
    // Force reload orders from localStorage to get latest status
    loadSavedOrders();

    // Find and display updated order with flexible matching
    const order = savedOrders.find(o => o.id == orderId || o.id.toString() === orderId.toString());
    if (order) {
        displayOrderInfo(order);
        showMessage('Order status refreshed successfully!', 'success');
        
        // Also trigger a manual check for admin updates
        setTimeout(() => {
            const adminOrders = localStorage.getItem('admin-orders');
            if (adminOrders) {
                try {
                    const adminOrdersData = JSON.parse(adminOrders);
                    const adminOrder = adminOrdersData.find(ao => ao.id == orderId);
                    if (adminOrder && adminOrder.status !== order.status) {
                        // Status was updated in admin, refresh again
                        loadSavedOrders();
                        const refreshedOrder = savedOrders.find(o => o.id == orderId);
                        if (refreshedOrder) {
                            displayOrderInfo(refreshedOrder);
                            showMessage('Latest status update loaded!', 'success');
                        }
                    }
                } catch (error) {
                    console.error('Error checking admin orders:', error);
                }
            }
        }, 2000);
    } else {
        showMessage('Could not refresh order status. Order may have been removed.', 'warning');
        // Try to find by partial match
        const partialMatch = savedOrders.find(o => 
            o.id.toString().includes(orderId.toString()) || 
            orderId.toString().includes(o.id.toString())
        );
        if (partialMatch) {
            displayOrderInfo(partialMatch);
            showMessage('Found similar order!', 'info');
        }
    }
}

// Show payment options modal
function showPaymentOptions(orderId, dueAmount) {
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
                padding: 2rem;
                border-radius: 15px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                text-align: center;
                min-width: 350px;
                max-width: 90%;
            ">
                <h2 style="margin-bottom: 1rem; color: #333; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                    <i class="fas fa-credit-card" style="color: #FFD700;"></i> Clear Due Payment
                </h2>
                <p style="margin-bottom: 1.5rem; color: #666;">Order #${orderId} - Due Amount: <strong>৳${dueAmount}</strong></p>
                
                <div style="margin-bottom: 1.5rem;">
                    <h4 style="color: #333; margin-bottom: 1rem;">Select Payment Method:</h4>
                    <div style="display: grid; gap: 0.75rem;">
                        <button onclick="processPayment('${orderId}', ${dueAmount}, 'bkash')" style="
                            background: linear-gradient(135deg, #E2136E, #D91A5B);
                            color: white;
                            border: none;
                            padding: 0.75rem 1.5rem;
                            border-radius: 8px;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 0.5rem;
                        ">
                            <i class="fas fa-mobile-alt"></i> Pay with bKash
                        </button>
                        <button onclick="processPayment('${orderId}', ${dueAmount}, 'nagad')" style="
                            background: linear-gradient(135deg, #F37120, #E85D04);
                            color: white;
                            border: none;
                            padding: 0.75rem 1.5rem;
                            border-radius: 8px;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 0.5rem;
                        ">
                            <i class="fas fa-wallet"></i> Pay with Nagad
                        </button>
                        <button onclick="processPayment('${orderId}', ${dueAmount}, 'rocket')" style="
                            background: linear-gradient(135deg, #8B1538, #722F37);
                            color: white;
                            border: none;
                            padding: 0.75rem 1.5rem;
                            border-radius: 8px;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 0.5rem;
                        ">
                            <i class="fas fa-rocket"></i> Pay with Rocket
                        </button>
                        <button onclick="processPayment('${orderId}', ${dueAmount}, 'cash')" style="
                            background: linear-gradient(135deg, #28a745, #20c997);
                            color: white;
                            border: none;
                            padding: 0.75rem 1.5rem;
                            border-radius: 8px;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 0.5rem;
                        ">
                            <i class="fas fa-money-bill-wave"></i> Cash Payment
                        </button>
                    </div>
                </div>
                
                <button onclick="closePaymentModal()" style="
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                ">Cancel</button>
            </div>
        </div>
    `;
    
    modal.id = 'paymentModal';
    document.body.appendChild(modal);
}

// Process payment
function processPayment(orderId, amount, method) {
    const paymentData = {
        orderId: orderId,
        amount: amount,
        method: method,
        timestamp: new Date().toISOString(),
        transactionId: 'TXN' + Date.now()
    };
    
    // Show payment processing
    const modal = document.getElementById('paymentModal');
    const modalContent = modal.querySelector('div > div');
    
    modalContent.innerHTML = `
        <h2 style="color: #28a745; margin-bottom: 1rem;">
            <i class="fas fa-spinner fa-spin"></i> Processing Payment...
        </h2>
        <p style="color: #666;">Please wait while we process your payment</p>
    `;
    
    // Simulate payment processing
    setTimeout(() => {
        // Update order payment status
        updateOrderPaymentStatus(orderId, amount, method, paymentData.transactionId);
        
        modalContent.innerHTML = `
            <h2 style="color: #28a745; margin-bottom: 1rem;">
                <i class="fas fa-check-circle"></i> Payment Successful!
            </h2>
            <p style="color: #666; margin-bottom: 1rem;">
                ৳${amount} payment processed successfully via ${method.toUpperCase()}
            </p>
            <p style="font-size: 0.9rem; color: #666; margin-bottom: 1.5rem;">
                Transaction ID: ${paymentData.transactionId}
            </p>
            <button onclick="closePaymentModal(); refreshOrderStatus('${orderId}')" style="
                background: #28a745;
                color: white;
                border: none;
                padding: 0.75rem 2rem;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
            ">Continue</button>
        `;
    }, 2000);
}

// Update order payment status
function updateOrderPaymentStatus(orderId, paidAmount, method, transactionId) {
    // Load current orders
    loadSavedOrders();
    
    // Find and update the order
    const orderIndex = savedOrders.findIndex(o => o.id == orderId);
    if (orderIndex > -1) {
        const order = savedOrders[orderIndex];
        const currentAdvance = order.advancePaid || 100;
        const newAdvancePaid = currentAdvance + paidAmount;
        const totalAmount = order.totalAmount || 0;
        
        // Update payment info
        savedOrders[orderIndex].advancePaid = newAdvancePaid;
        savedOrders[orderIndex].paymentStatus = newAdvancePaid >= totalAmount ? 'fully_paid' : 'partially_paid';
        savedOrders[orderIndex].lastPayment = {
            amount: paidAmount,
            method: method,
            transactionId: transactionId,
            timestamp: new Date().toISOString()
        };
        
        // Add payment to history
        if (!savedOrders[orderIndex].paymentHistory) {
            savedOrders[orderIndex].paymentHistory = [];
        }
        savedOrders[orderIndex].paymentHistory.push({
            amount: paidAmount,
            method: method,
            transactionId: transactionId,
            timestamp: new Date().toISOString(),
            status: 'completed'
        });
        
        // Save to storage
        localStorage.setItem('admin-orders', JSON.stringify(savedOrders));
        localStorage.setItem('website-orders', JSON.stringify(savedOrders));
        
        // Trigger order status updated event
        const updateEvent = new CustomEvent('orderStatusUpdated', {
            detail: {
                orderId: orderId,
                newStatus: order.status,
                order: savedOrders[orderIndex]
            }
        });
        window.dispatchEvent(updateEvent);
        
        showMessage(`Payment of ৳${paidAmount} recorded successfully!`, 'success');
    }
}

// Close payment modal
function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

// Make functions global
window.selectTrackMethod = selectTrackMethod;
window.trackOrder = trackOrder;
window.refreshOrderStatus = refreshOrderStatus;
window.displayOrderInfo = displayOrderInfo;
window.showPaymentOptions = showPaymentOptions;
window.processPayment = processPayment;
window.closePaymentModal = closePaymentModal;
window.updateOrderPaymentStatus = updateOrderPaymentStatus;