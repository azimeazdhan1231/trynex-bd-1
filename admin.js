// Enhanced Admin Panel with Real-Time Global Sync
let currentSection = 'dashboard';
let allProducts = [];
let allOrders = [];
let allVouchers = [];
let allPromotions = [];

// Enhanced Supabase configuration - Try environment variables first, fallback to hardcoded
const supabaseUrl = window.SUPABASE_URL || 'https://wifsqonbnfmwtqvupqbk.supabase.co';
const supabaseKey = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZnNxb25ibmZtd3RxdnVwcWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1ODAyNjMsImV4cCI6MjA2NzE1NjI2M30.A7o3vhEaNZb9lmViHA_KQrwzKJTBWpsD6KbHqkkput0';

let supabase;
let isSupabaseConnected = false;
let realtimeSubscriptions = [];
let imageUploadSupported = false;

// Initialize Supabase
try {
    if (typeof window !== 'undefined' && window.supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log('✅ Supabase initialized');
        testSupabaseConnection();
    } else {
        console.log('📱 Supabase not available, using localStorage mode');
        initializeFallbackMode();
    }
} catch (error) {
    console.error('❌ Supabase initialization failed:', error);
    initializeFallbackMode();
}

// Enhanced connection test with image upload support check
async function testSupabaseConnection() {
    try {
        // Test database connection
        const { data, error } = await supabase.from('products').select('count').limit(1);
        if (error) throw error;

        // Test storage bucket access for image uploads
        try {
            const { data: buckets } = await supabase.storage.listBuckets();
            imageUploadSupported = buckets && buckets.some(bucket => bucket.name === 'product-images');
            console.log('📁 Image upload support:', imageUploadSupported ? 'Enabled' : 'Disabled');
        } catch (storageError) {
            console.log('📁 Storage not configured, using URL inputs only');
            imageUploadSupported = false;
        }

        isSupabaseConnected = true;
        console.log('✅ Supabase connection successful - Real-time mode enabled');
        showConnectionStatus('connected');
        setupRealtimeSubscriptions();
        initializeAdmin();
    } catch (error) {
        console.error('❌ Supabase connection failed:', error);
        showConnectionStatus('disconnected');
        initializeFallbackMode();
    }
}

// Show connection status
function showConnectionStatus(status) {
    const statusDiv = document.getElementById('connectionStatus') || createConnectionStatusDiv();

    switch (status) {
        case 'connected':
            statusDiv.innerHTML = `
                <i class="fas fa-check-circle" style="color: #28a745;"></i>
                <span>Live Database Connected</span>
                <small>Changes sync globally in real-time</small>
            `;
            statusDiv.className = 'connection-status connected';
            break;
        case 'disconnected':
            statusDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="color: #ffc107;"></i>
                <span>Offline Mode</span>
                <small>Using local storage only</small>
            `;
            statusDiv.className = 'connection-status disconnected';
            break;
        case 'error':
            statusDiv.innerHTML = `
                <i class="fas fa-times-circle" style="color: #dc3545;"></i>
                <span>Connection Error</span>
                <small>Check internet connection</small>
            `;
            statusDiv.className = 'connection-status error';
            break;
    }
}

function createConnectionStatusDiv() {
    const div = document.createElement('div');
    div.id = 'connectionStatus';
    div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 1rem;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        z-index: 1000;
        min-width: 200px;
        font-size: 0.9rem;
    `;

    const style = document.createElement('style');
    style.textContent = `
        .connection-status {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .connection-status i {
            font-size: 1.2rem;
        }
        .connection-status span {
            font-weight: 600;
        }
        .connection-status small {
            color: #666;
            font-size: 0.8rem;
        }
        .connection-status.connected {
            border-left: 4px solid #28a745;
        }
        .connection-status.disconnected {
            border-left: 4px solid #ffc107;
        }
        .connection-status.error {
            border-left: 4px solid #dc3545;
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(div);
    return div;
}

// Setup real-time subscriptions for instant updates
function setupRealtimeSubscriptions() {
    if (!isSupabaseConnected) return;

    // Products real-time subscription
    const productsSubscription = supabase
        .channel('products_changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'products' },
            (payload) => {
                console.log('🔄 Real-time product update:', payload);
                handleRealtimeProductUpdate(payload);
                broadcastToWebsite('products_updated', payload);
            }
        )
        .subscribe();

    // Orders real-time subscription
    const ordersSubscription = supabase
        .channel('orders_changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            (payload) => {
                console.log('🔄 Real-time order update:', payload);
                handleRealtimeOrderUpdate(payload);
                broadcastToWebsite('orders_updated', payload);
            }
        )
        .subscribe();

    // Vouchers real-time subscription
    const vouchersSubscription = supabase
        .channel('vouchers_changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'vouchers' },
            (payload) => {
                console.log('🔄 Real-time voucher update:', payload);
                handleRealtimeVoucherUpdate(payload);
                broadcastToWebsite('vouchers_updated', payload);
            }
        )
        .subscribe();

    realtimeSubscriptions = [productsSubscription, ordersSubscription, vouchersSubscription];
    console.log('🔴 Real-time subscriptions active for instant global updates');
}

// Broadcast changes to website via localStorage events
function broadcastToWebsite(eventType, data) {
    // Update localStorage to trigger storage events on website
    const updateData = {
        type: eventType,
        data: data,
        timestamp: Date.now(),
        source: 'admin_panel'
    };

    localStorage.setItem('admin_broadcast', JSON.stringify(updateData));

    // Also update specific data stores
    switch(eventType) {
        case 'products_updated':
            localStorage.setItem('admin-products', JSON.stringify(allProducts));
            localStorage.setItem('website-products', JSON.stringify(allProducts));
            localStorage.setItem('frontend-products', JSON.stringify(allProducts));
            break;
        case 'orders_updated':
            localStorage.setItem('admin-orders', JSON.stringify(allOrders));
            localStorage.setItem('website-orders', JSON.stringify(allOrders));
            break;
        case 'vouchers_updated':
            localStorage.setItem('admin-vouchers', JSON.stringify(allVouchers));
            localStorage.setItem('website-vouchers', JSON.stringify(allVouchers));
            break;
        case 'promotions_updated':
            localStorage.setItem('admin-promotions', JSON.stringify(allPromotions));
            localStorage.setItem('website-promotions', JSON.stringify(allPromotions));
            break;
    }

    console.log(`📡 Broadcasted ${eventType} to all website instances`);
}

// Handle real-time product updates
function handleRealtimeProductUpdate(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch(eventType) {
        case 'INSERT':
            allProducts.push(newRecord);
            break;
        case 'UPDATE':
            const updateIndex = allProducts.findIndex(p => p.id === newRecord.id);
            if (updateIndex > -1) {
                allProducts[updateIndex] = newRecord;
            }
            break;
        case 'DELETE':
            allProducts = allProducts.filter(p => p.id !== oldRecord.id);
            break;
    }

    if (currentSection === 'products') {
        displayProducts();
    }
    updateDashboard();
}

// Handle real-time order updates
function handleRealtimeOrderUpdate(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch(eventType) {
        case 'INSERT':
            allOrders.unshift(newRecord);
            break;
        case 'UPDATE':
            const updateIndex = allOrders.findIndex(o => o.id === newRecord.id);
            if (updateIndex > -1) {
                allOrders[updateIndex] = newRecord;
            }
            break;
        case 'DELETE':
            allOrders = allOrders.filter(o => o.id !== oldRecord.id);
            break;
    }

    if (currentSection === 'orders') {
        displayOrders();
    }
    updateDashboard();
}

// Handle real-time voucher updates
function handleRealtimeVoucherUpdate(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch(eventType) {
        case 'INSERT':
            allVouchers.push(newRecord);
            break;
        case 'UPDATE':
            const updateIndex = allVouchers.findIndex(v => v.id === newRecord.id);
            if (updateIndex > -1) {
                allVouchers[updateIndex] = newRecord;
            }
            break;
        case 'DELETE':
            allVouchers = allVouchers.filter(v => v.id !== oldRecord.id);
            break;
    }

    if (currentSection === 'vouchers') {
        displayVouchers();
    }
}

// Handle real-time promotion updates
function handleRealtimeVoucherUpdate(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch(eventType) {
        case 'INSERT':
            allPromotions.push(newRecord);
            break;
        case 'UPDATE':
            const updateIndex = allPromotions.findIndex(v => v.id === newRecord.id);
            if (updateIndex > -1) {
                allPromotions[updateIndex] = newRecord;
            }
            break;
        case 'DELETE':
            allPromotions = allPromotions.filter(v => v.id !== oldRecord.id);
            break;
    }

    if (currentSection === 'promotions') {
        displayPromotions();
    }
}

// Enhanced image upload functionality
async function uploadProductImage(file) {
    if (!imageUploadSupported) {
        showNotification('Image upload not configured. Please use image URLs.', 'warning');
        return null;
    }

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        showNotification('📤 Uploading image...', 'info');

        const { data, error } = await supabase.storage
            .from('product-images')
            .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

        showNotification('✅ Image uploaded successfully!', 'success');
        return publicUrl;
    } catch (error) {
        console.error('Image upload failed:', error);
        showNotification('❌ Image upload failed: ' + error.message, 'error');
        return null;
    }
}

// Enhanced product save with image support and real-time sync
async function saveProduct() {
    try {
        const form = document.getElementById('productForm');
        const formData = new FormData(form);

        // Validate required fields
        const name = formData.get('name')?.trim();
        const price = parseFloat(formData.get('price'));
        const category = formData.get('category');

        if (!name || !price || !category) {
            showNotification('⚠️ Please fill in all required fields', 'error');
            return;
        }

        let imageUrl = formData.get('image_url')?.trim();
        const imageFile = formData.get('image_file');

        // Handle image upload if file is provided
        if (imageFile && imageFile.size > 0) {
            const uploadedUrl = await uploadProductImage(imageFile);
            if (uploadedUrl) {
                imageUrl = uploadedUrl;
            }
        }

        // Use default image if none provided
        if (!imageUrl) {
            const defaultImages = {
                'mug': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&h=800&fit=crop&q=95',
                't-shirt': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop&q=95',
                'keychain': 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&h=800&fit=crop&q=95',
                'couple': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop&q=95'
            };
            imageUrl = defaultImages[category] || defaultImages['mug'];
        }

        const productData = {
            name: name,
            price: price,
            category: category,
            description: formData.get('description')?.trim() || `Premium ${category} with custom design`,
            image_url: imageUrl,
            discount: parseInt(formData.get('discount')) || 0,
            featured: formData.get('featured') === 'on',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        showNotification('💾 Saving product...', 'info');

        // Save to Supabase for real-time global sync
        if (isSupabaseConnected) {
            const { data, error } = await supabase
                .from('products')
                .insert([productData])
                .select()
                .single();

            if (error) throw error;

            productData.id = data.id;
            allProducts.unshift(productData);

            showNotification('✅ Product saved and synced globally!', 'success');
            console.log('🌍 Product synced to all devices:', productData.name);
        } else {
            // Fallback to localStorage
            productData.id = Date.now();
            allProducts.unshift(productData);
            localStorage.setItem('admin-products', JSON.stringify(allProducts));
            localStorage.setItem('website-products', JSON.stringify(allProducts));

            showNotification('✅ Product saved locally!', 'success');
        }

        // Update UI
        displayProducts();
        form.reset();

        // Auto-refresh the public website data
        localStorage.setItem('products-last-sync', Date.now().toString());

    } catch (error) {
        console.error('Error saving product:', error);
        showNotification('❌ Error saving product: ' + error.message, 'error');
    }
}

// Enhanced real-time subscriptions for global sync
function setupRealtimeSubscriptions() {
    try {
        // Products table subscription
        const productsChannel = supabase
            .channel('admin-products-sync')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'products' },
                (payload) => {
                    console.log('🔄 Real-time product change detected:', payload);
                    handleRealtimeProductChange(payload);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Admin real-time sync active');
                    showConnectionStatus('connected');
                } else {
                    console.log('❌ Real-time sync failed:', status);
                    showConnectionStatus('error');
                }
            });

        realtimeSubscriptions.push(productsChannel);

    } catch (error) {
        console.error('Failed to setup real-time subscriptions:', error);
        showConnectionStatus('error');
    }
}

// Handle real-time changes from other admin sessions
function handleRealtimeProductChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
        case 'INSERT':
            // Don't add if we just created this product
            if (!allProducts.find(p => p.id === newRecord.id)) {
                allProducts.unshift(newRecord);
                displayProducts();
                showNotification('🆕 New product added by another admin', 'info');
            }
            break;

        case 'UPDATE':
            const updateIndex = allProducts.findIndex(p => p.id === newRecord.id);
            if (updateIndex !== -1) {
                allProducts[updateIndex] = newRecord;
                displayProducts();
                showNotification('✏️ Product updated by another admin', 'info');
            }
            break;

        case 'DELETE':
            const beforeCount = allProducts.length;
            allProducts = allProducts.filter(p => p.id !== oldRecord.id);
            if (allProducts.length < beforeCount) {
                displayProducts();
                showNotification('🗑️ Product deleted by another admin', 'warning');
            }
            break;
    }

    // Keep localStorage in sync
    localStorage.setItem('admin-products', JSON.stringify(allProducts));
    localStorage.setItem('website-products', JSON.stringify(allProducts));
    localStorage.setItem('frontend-products', JSON.stringify(allProducts));
}

// Auto-reconnection for stable connection
function setupAutoReconnection() {
    // Monitor connection status
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const checkConnection = async () => {
        try {
            const { data, error } = await supabase.from('products').select('count').limit(1);
            if (error) throw error;

            if (!isSupabaseConnected) {
                isSupabaseConnected = true;
                reconnectAttempts = 0;
                console.log('✅ Connection restored');
                showConnectionStatus('connected');
                setupRealtimeSubscriptions();
            }
        } catch (error) {
            if (isSupabaseConnected) {
                isSupabaseConnected = false;
                console.log('❌ Connection lost, attempting to reconnect...');
                showConnectionStatus('error');
            }

            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                setTimeout(checkConnection, 5000 * reconnectAttempts); // Exponential backoff
            }
        }
    };

    // Check every 30 seconds
    setInterval(checkConnection, 30000);
}

// Initialize fallback mode
function initializeFallbackMode() {
    console.log('📱 Using enhanced localStorage fallback mode');
    isSupabaseConnected = false;
    initializeAdmin();

    // Setup storage event listener for cross-tab communication
    window.addEventListener('storage', function(e) {
        if (e.key === 'website_to_admin_sync' && e.newValue) {
            const syncData = JSON.parse(e.newValue);
            handleWebsiteSync(syncData);
        }
    });
}

// Enhanced admin panel initialization
function initializeAdmin() {
    loadAllData();
    setupEventListeners();
    showSection('dashboard');
    setupAutoReconnection();

    // Enhanced periodic sync with global updates
    setInterval(() => {
        if (isSupabaseConnected) {
            checkForUpdates();
        }
    }, 10000); // Check every 10 seconds

    // Force sync every 5 minutes to ensure consistency
    setInterval(() => {
        if (isSupabaseConnected) {
            console.log('🔄 Performing periodic full sync...');
            loadAllData();
        }
    }, 300000); // 5 minutes
}

// Check for database updates
async function checkForUpdates() {
    try {
        const { data: latestProducts } = await supabase
            .from('products')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1);

        if (latestProducts && latestProducts.length > 0) {
            const latestUpdate = new Date(latestProducts[0].updated_at);
            const currentLatest = allProducts.length > 0 ? 
                new Date(Math.max(...allProducts.map(p => new Date(p.updated_at || p.created_at)))) : 
                new Date(0);

            if (latestUpdate > currentLatest) {
                console.log('🔄 New updates detected, refreshing data...');
                await loadAllData();
            }
        }
    } catch (error) {
        console.error('❌ Error checking for updates:', error);
    }
}

// Load all data with enhanced sync
async function loadAllData() {
    await Promise.all([
        loadProducts(),
        loadOrders(),
        loadVouchers(),
        loadPromotions()
    ]);
    updateDashboard();

    // Broadcast loaded data to website
    broadcastToWebsite('admin_data_loaded', {
        products: allProducts,
        orders: allOrders,
        vouchers: allVouchers,
        promotions: allPromotions
    });
}

// Enhanced product loading with real-time sync - Load 48+ products
async function loadProducts() {
    try {
        // Always start with sample products to ensure we have data
        let products = getSample48Products();

        if (isSupabaseConnected) {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (!error && data && data.length > 0) {
                    // Merge database products with sample products
                    const dbProducts = data;
                    const existingIds = dbProducts.map(p => p.id);
                    const sampleToAdd = products.filter(p => !existingIds.includes(p.id));
                    products = [...dbProducts, ...sampleToAdd];
                }
            } catch (dbError) {
                console.log('Database connection failed, using sample data');
            }
        }

        allProducts = products;

        // Always sync to localStorage for website access
        localStorage.setItem('admin-products', JSON.stringify(allProducts));
        localStorage.setItem('website-products', JSON.stringify(allProducts));
        localStorage.setItem('frontend-products', JSON.stringify(allProducts));

        console.log(`✅ Loaded ${allProducts.length} products with real-time sync`);

    } catch (error) {
        console.error('❌ Error loading products:', error);
        allProducts = getSample48Products();
        localStorage.setItem('admin-products', JSON.stringify(allProducts));
        localStorage.setItem('website-products', JSON.stringify(allProducts));
        localStorage.setItem('frontend-products', JSON.stringify(allProducts));
    }
}

// Enhanced order loading
async function loadOrders() {
    try {
        if (isSupabaseConnected) {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            allOrders = data || [];

            // Sync to localStorage
            localStorage.setItem('admin-orders', JSON.stringify(allOrders));
            localStorage.setItem('website-orders', JSON.stringify(allOrders));

        } else {
            const adminOrders = JSON.parse(localStorage.getItem('admin-orders')) || [];
            const websiteOrders = JSON.parse(localStorage.getItem('website-orders')) || [];
            allOrders = [...adminOrders, ...websiteOrders].filter((order, index, self) => 
                index === self.findIndex(o => o.id === order.id)
            );
        }

        console.log(`✅ Loaded ${allOrders.length} orders with real-time sync`);

    } catch (error) {
        console.error('❌ Error loading orders:', error);
        allOrders = getSampleOrders();
    }
}

// Enhanced voucher loading
async function loadVouchers() {
    try {
        if (isSupabaseConnected) {
            const { data, error } = await supabase
                .from('vouchers')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            allVouchers = data || [];

            localStorage.setItem('admin-vouchers', JSON.stringify(allVouchers));
            localStorage.setItem('website-vouchers', JSON.stringify(allVouchers));

        } else {
            allVouchers = JSON.parse(localStorage.getItem('admin-vouchers')) || getSampleVouchers();
        }

        console.log(`✅ Loaded ${allVouchers.length} vouchers with real-time sync`);

    } catch (error) {
        console.error('❌ Error loading vouchers:', error);
        allVouchers = getSampleVouchers();
    }
}

// Enhanced promotion loading
async function loadPromotions() {
    try {
        if (isSupabaseConnected) {
            const { data, error } = await supabase
                .from('promotions')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            allPromotions = data || [];

            localStorage.setItem('admin-promotions', JSON.stringify(allPromotions));
            localStorage.setItem('website-promotions', JSON.stringify(allPromotions));

        } else {
            allPromotions = JSON.parse(localStorage.getItem('admin-promotions')) || getSamplePromotions();
        }

        console.log(`✅ Loaded ${allPromotions.length} promotions with real-time sync`);

    } catch (error) {
        console.error('❌ Error loading promotions:', error);
        allPromotions = getSamplePromotions();
    }
}

// Show section
function showSection(sectionName, buttonElement) {
    currentSection = sectionName;

    // Update navigation buttons
    document.querySelectorAll('.admin-nav-btn').forEach(btn => btn.classList.remove('active'));
    if (buttonElement) {
        buttonElement.classList.add('active');
    }

    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(sectionName + 'Section');
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Load section data
    switch(sectionName) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'products':
            displayProducts();
            break;
        case 'orders':
            displayOrders();
            break;
        case 'vouchers':
            displayVouchers();
            break;
        case 'promotions':
            displayPromotions();
            break;
        case 'categories':
            displayCategories();
            break;
        case 'featured':
            displayFeatured();
            break;
    }
}

// Display functions (keeping existing functionality)
function displayProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    productsGrid.innerHTML = allProducts.map(product => `
        <div class="product-card">
            <img src="${product.image_url || product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">৳${product.price}</p>
                <p>${product.description}</p>
                <div class="product-actions">
                    <button class="btn-edit" onclick="editProduct(${product.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-danger" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function displayOrders() {
    const ordersGrid = document.getElementById('ordersGrid');
    if (!ordersGrid) return;

    if (allOrders.length === 0) {
        ordersGrid.innerHTML = '<div class="empty-state"><p>No orders found.</p></div>';
        return;
    }

    ordersGrid.innerHTML = allOrders.map(order => {
        const totalAmount = order.total_amount || order.total || 0;
        const advancePaid = order.advancePaid || 100;
        const dueAmount = Math.max(0, totalAmount - advancePaid);
        const paymentStatus = order.paymentStatus || (dueAmount > 0 ? 'partially_paid' : 'fully_paid');

        return `
        <div class="order-card">
            <div class="order-header">
                <h4>Order #${order.id || order.order_id || 'N/A'}</h4>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <span class="order-status status-${(order.status || 'pending').toLowerCase()}">${order.status || 'Pending'}</span>
                    <span class="payment-status payment-${paymentStatus}" style="
                        padding: 0.25rem 0.75rem;
                        border-radius: 20px;
                        font-size: 0.8rem;
                        font-weight: 600;
                        text-transform: uppercase;
                        background: ${paymentStatus === 'fully_paid' ? '#d4edda' : paymentStatus === 'partially_paid' ? '#fff3cd' : '#f8d7da'};
                        color: ${paymentStatus === 'fully_paid' ? '#155724' : paymentStatus === 'partially_paid' ? '#856404' : '#721c24'};
                    ">${paymentStatus === 'fully_paid' ? '✅ Paid' : paymentStatus === 'partially_paid' ? '⏳ Partial' : '❌ Unpaid'}</span>
                </div>
            </div>
            <div class="order-details">
                <p><strong>Customer:</strong> ${order.customer_name || order.name || 'Unknown'}</p>
                <p><strong>Phone:</strong> ${order.customer_phone || order.phone || 'N/A'}</p>
                <p><strong>Email:</strong> ${order.customer_email || order.email || 'N/A'}</p>
                <p><strong>Address:</strong> ${order.shipping_address || order.address || 'N/A'}</p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.5rem; margin: 0.5rem 0;">
                    <div style="background: #f8f9fa; padding: 0.5rem; border-radius: 5px; text-align: center;">
                        <small style="color: #666;">Total</small><br>
                        <strong>৳${totalAmount}</strong>
                    </div>
                    <div style="background: #d4edda; padding: 0.5rem; border-radius: 5px; text-align: center;">
                        <small style="color: #155724;">Paid</small><br>
                        <strong style="color: #155724;">৳${advancePaid}</strong>
                    </div>
                    <div style="background: ${dueAmount > 0 ? '#fff3cd' : '#d4edda'}; padding: 0.5rem; border-radius: 5px; text-align: center;">
                        <small style="color: ${dueAmount > 0 ? '#856404' : '#155724'};">Due</small><br>
                        <strong style="color: ${dueAmount > 0 ? '#856404' : '#155724'};">৳${dueAmount}</strong>
                    </div>
                </div>
                <p><strong>Date:</strong> ${new Date(order.created_at || order.date || Date.now()).toLocaleDateString()}</p>
            </div>
            <div class="order-actions">
                <button class="btn-edit" onclick="updateOrderStatus('${order.id}', 'processing')">
                    <i class="fas fa-cog"></i> Processing
                </button>
                <button class="btn-primary" onclick="updateOrderStatus('${order.id}', 'shipped')">
                    <i class="fas fa-truck"></i> Shipped
                </button```text
                <button class="btn-danger" onclick="updateOrderStatus('${order.id}', 'delivered')">
                    <i class="fas fa-check"></i> Delivered
                </button>
                <button class="btn-secondary" onclick="manageOrderPayment('${order.id}', ${totalAmount}, ${advancePaid}, '${paymentStatus}')" style="
                    background: #17a2b8;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 5px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">
                    <i class="fas fa-credit-card"></i> Payment
                </button>
            </div>
        </div>
    `;
    }).join('');
}

function displayVouchers() {
    const vouchersGrid = document.getElementById('vouchersGrid');
    if (!vouchersGrid) return;

    if (allVouchers.length === 0) {
        vouchersGrid.innerHTML = '<div class="empty-state"><p>No vouchers found.</p></div>';
        return;
    }

    vouchersGrid.innerHTML = allVouchers.map(voucher => `
        <div class="voucher-card">
            <div class="voucher-header">
                <h4>${voucher.code}</h4>
                <span class="voucher-type">${voucher.discount_type}</span>
            </div>
            <div class="voucher-details">
                <p><strong>Value:</strong> ${voucher.discount_value}${voucher.discount_type === 'percentage' ? '%' : '৳'}</p>
                <p><strong>Description:</strong> ${voucher.description || 'No description'}</p>
                <p><strong>Expiry:</strong> ${voucher.expiry_date ? new Date(voucher.expiry_date).toLocaleDateString() : 'No expiry'}</p>
            </div>
            <div class="voucher-actions">
                <button class="btn-danger" onclick="deleteVoucher(${voucher.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
                <button class="btn-edit" onclick="toggleVoucherStatus(${voucher.id})">
                    <i class="fas fa-toggle-on"></i> ${voucher.is_active ? 'Deactivate' : 'Activate'}
                </button>
            </div>
        </div>
    `).join('');
}

function displayPromotions() {
    const promotionsGrid = document.getElementById('promotionsGrid');
    if (!promotionsGrid) return;

    if (allPromotions.length === 0) {
        promotionsGrid.innerHTML = '<div class="empty-state"><p>No promotions found.</p></div>';
        return;
    }

    promotionsGrid.innerHTML = allPromotions.map(promotion => `
        <div class="promotion-card">
            <div class="promotion-header">
                <h4>${promotion.title}</h4>
                <span class="promotion-type">${promotion.discount_type}</span>
            </div>
            <div class="promotion-details">
                <p><strong>Value:</strong> ${promotion.discount_value}${promotion.discount_type === 'percentage' ? '%' : '৳'}</p>
                <p><strong>Description:</strong> ${promotion.description}</p>
                <p><strong>Popup:</strong> ${promotion.show_popup ? 'Yes' : 'No'}</p>
                <p><strong>Period:</strong> ${promotion.start_date || 'No start'} to ${promotion.end_date || 'No end'}</p>
            </div>
            <div class="promotion-actions">
                <button class="btn-danger" onclick="deletePromotion(${promotion.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
                <button class="btn-edit" onclick="editPromotion(${promotion.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
            </div>
        </div>
    `).join('');
}

function displayCategories() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (!categoriesGrid) return;

    // Get categories from localStorage (admin-created categories)
    const adminCategories = JSON.parse(localStorage.getItem('admin-categories') || '[]');

    // Default categories
    const defaultCategories = [
        { id: 1, name: 'Custom Gifts', slug: 'custom-gifts', count: allProducts.filter(p => p.category === 'Custom Gifts').length, default: true },
        { id: 2, name: 'Apparel', slug: 'apparel', count: allProducts.filter(p => p.category === 'Apparel').length, default: true },
        { id: 3, name: 'Accessories', slug: 'accessories', count: allProducts.filter(p => p.category === 'Accessories').length, default: true },
        { id: 4, name: 'Personalized Items', slug: 'personalized', count: allProducts.filter(p => p.category === 'Personalized').length, default: true }
    ];

    // Combine default and admin categories
    const allCategories = [...defaultCategories, ...adminCategories.map(cat => ({
        ...cat,
        count: allProducts.filter(p => p.category === cat.name).length,
        default: false
    }))];

    categoriesGrid.innerHTML = allCategories.map(category => `
        <div class="category-card" style="background: white; padding: 1.5rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 1rem;">
            <div class="category-header" style="margin-bottom: 1rem;">
                <h4 style="margin: 0; color: #333;">${category.name}</h4>
                <span class="category-count" style="color: #666; font-size: 0.9rem;">${category.count} products</span>
                <div style="margin-top: 0.5rem; color: #999; font-size: 0.8rem;">
                    ${category.default ? 'Default Category' : 'Custom Category'}
                </div>
            </div>
            <div class="category-details" style="margin-bottom: 1rem;">
                ${category.image ? `<img src="${category.image}" alt="${category.name}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 5px; margin-bottom: 0.5rem;">` : ''}
                <p><strong>Slug:</strong> ${category.slug}</p>
                ${category.description ? `<p><strong>Description:</strong> ${category.description}</p>` : ''}
                <p><strong>Status:</strong> Active</p>
            </div>
            <div class="category-actions" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn-edit" onclick="editCategory('${category.slug}')" style="background: #ffc107; color: #000; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem;">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-primary" onclick="viewCategoryProducts('${category.slug}')" style="background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem;">
                    <i class="fas fa-eye"></i> View Products
                </button>
                ${!category.default ? 
                    `<button onclick="deleteCategory(${category.id})" style="background: #dc3545; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem;">
                        <i class="fas fa-trash"></i> Delete
                    </button>` 
                    : ''
                }
            </div>
        </div>
    `).join('');
}

function displayFeatured() {
    const featuredGrid = document.getElementById('featuredItemsGrid');
    if (!featuredGrid) return;

    const featuredProducts = allProducts.filter(p => p.feature || p.badge).slice(0, 6);

    if (featuredProducts.length === 0) {
        featuredGrid.innerHTML = '<div class="empty-state"><p>No featured products found.</p></div>';
        return;
    }

    featuredGrid.innerHTML = featuredProducts.map(product => `
        <div class="featured-card">
            <img src="${product.image_url || product.image}" alt="${product.name}" class="featured-image">
            <div class="featured-info">
                <h4>${product.name}</h4>
                <p>৳${product.price}</p>
                <span class="featured-badge">${product.badge || product.feature}</span>
            </div>
            <div class="featured-actions">
                <button class="btn-danger" onclick="removeFeatured(${product.id})">
                    <i class="fas fa-times"></i> Remove
                </button>
            </div>
        </div>
    `).join('');
}

function updateDashboard() {
    const totalProducts = document.getElementById('totalProducts');
    const totalOrders = document.getElementById('totalOrders');
    const pendingOrders = document.getElementById('pendingOrders');
    const totalRevenue = document.getElementById('totalRevenue');

    if (totalProducts) totalProducts.textContent = allProducts.length;
    if (totalOrders) totalOrders.textContent = allOrders.length;
    if (pendingOrders) {
        const pending = allOrders.filter(order => 
            !order.status || order.status === 'pending' || order.status === 'processing'
        ).length;
        pendingOrders.textContent = pending;
    }
    if (totalRevenue) {
        const revenue = allOrders.reduce((sum, order) => 
            sum + (parseFloat(order.total_amount || order.total || 0)), 0
        );
        totalRevenue.textContent = `৳${revenue.toFixed(0)}`;
    }
}

function setupEventListeners() {
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', handleAddProduct);
    }

    const addVoucherForm = document.getElementById('addVoucherForm');
    if (addVoucherForm) {
        addVoucherForm.addEventListener('submit', handleAddVoucher);
    }

    const addPromotionForm = document.getElementById('addPromotionForm');
    if (addPromotionForm) {
        addPromotionForm.addEventListener('submit', handleAddPromotion);
    }

    const addCategoryForm = document.getElementById('addCategoryForm');
    if (addCategoryForm) {
        addCategoryForm.addEventListener('submit', handleAddCategory);
    }

    const siteSettingsForm = document.getElementById('siteSettingsForm');
    if (siteSettingsForm) {
        siteSettingsForm.addEventListener('submit', handleSiteSettings);
    }

    const promotionPopup = document.getElementById('promotionPopup');
    if (promotionPopup) {
        promotionPopup.addEventListener('change', function() {
            const popupSettings = document.getElementById('popupSettings');
            if (popupSettings) {
                popupSettings.style.display = this.checked ? 'block' : 'none';
            }
        });
    }

    // Initialize featured products selector
    loadFeaturedProductsSelector();

    // Load existing site settings
    loadExistingSiteSettings();

    // Setup real-time design preview
    setupDesignPreview();
}

// Load existing site settings into form
function loadExistingSiteSettings() {
    const savedSettings = localStorage.getItem('site-settings');
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);

            // Populate form fields
            if (document.getElementById('siteName')) document.getElementById('siteName').value = settings.siteName || '';
            if (document.getElementById('heroTitle')) document.getElementById('heroTitle').value = settings.heroTitle || '';
            if (document.getElementById('heroSubtitle')) document.getElementById('heroSubtitle').value = settings.heroSubtitle || '';
            if (document.getElementById('contactPhone')) document.getElementById('contactPhone').value = settings.contactPhone || '';
            if (document.getElementById('contactEmail')) document.getElementById('contactEmail').value = settings.contactEmail || '';
            if (document.getElementById('aboutText')) document.getElementById('aboutText').value = settings.aboutText || '';
            if (document.getElementById('primaryColor')) document.getElementById('primaryColor').value = settings.primaryColor || '#1a1a1a';
            if (document.getElementById('secondaryColor')) document.getElementById('secondaryColor').value = settings.secondaryColor || '#FFD700';
            if (document.getElementById('accentColor')) document.getElementById('accentColor').value = settings.accentColor || '#FFF8DC';
            if (document.getElementById('fontFamily')) document.getElementById('fontFamily').value = settings.fontFamily || 'Poppins';
            if (document.getElementById('borderRadius')) document.getElementById('borderRadius').value = settings.borderRadius || '10px';

            // Apply current design
            applyDesignChangesToAdminPanel(settings);

        } catch (error) {
            console.error('❌ Error loading site settings:', error);
        }
    }
}

// Setup real-time design preview
function setupDesignPreview() {
    const colorInputs = ['primaryColor', 'secondaryColor', 'accentColor'];
    const otherInputs = ['fontFamily', 'borderRadius'];

    [...colorInputs, ...otherInputs].forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', function() {
                const previewSettings = {
                    primaryColor: document.getElementById('primaryColor')?.value || '#1a1a1a',
                    secondaryColor: document.getElementById('secondaryColor')?.value || '#FFD700',
                    accentColor: document.getElementById('accentColor')?.value || '#FFF8DC',
                    fontFamily: document.getElementById('fontFamily')?.value || 'Poppins',
                    borderRadius: document.getElementById('borderRadius')?.value || '10px'
                };

                applyDesignChangesToAdminPanel(previewSettings);
            });
        }
    });
}

// Enhanced add product with instant global sync
async function handleAddProduct(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const productData = {
        name: formData.get('productName'),
        price: parseFloat(formData.get('productPrice')),
        category: formData.get('productCategory'),
        description: formData.get('productDescription'),
        image_url: formData.get('productImage'),
        feature: formData.get('productFeature') || '',
        badge: formData.get('productBadge') || '',
        stock_quantity: parseInt(formData.get('productStock')) || 100,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    try {
        if (isSupabaseConnected) {
            const { data, error } = await supabase
                .from('products')
                .insert([productData])
                .select()
                .single();

            if (error) throw error;

            // Add to local array
            allProducts.unshift(data);

            showToast('✅ Product added and synced globally!', 'success');

        } else {
            productData.id = Date.now();
            allProducts.unshift(productData);

            // Save to multiple storage locations for fallback sync
            localStorage.setItem('admin-products', JSON.stringify(allProducts));
            localStorage.setItem('website-products', JSON.stringify(allProducts));
            localStorage.setItem('frontend-products', JSON.stringify(allProducts));

            // Broadcast to website
            broadcastToWebsite('products_updated', { eventType: 'INSERT', new: productData });

            showToast('✅ Product added successfully!', 'success');
        }

        event.target.reset();
        displayProducts();
        updateDashboard();

        // Force website refresh by updating cache buster
        localStorage.setItem('cache_buster', Date.now().toString());

    } catch (error) {
        console.error('❌ Error adding product:', error);
        showToast('❌ Error adding product: ' + error.message, 'error');
    }
}

// Continue with rest of existing functions...
async function handleAddVoucher(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const voucherData = {
        code: formData.get('voucherCode').toUpperCase(),
        discount_type: formData.get('voucherType'),
        discount_value: parseFloat(formData.get('voucherValue')),
        description: formData.get('voucherDescription') || '',
        expiry_date: formData.get('voucherExpiry') || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    try {
        if (isSupabaseConnected) {
            const { data, error } = await supabase
                .from('vouchers')
                .insert([voucherData])
                .select()
                .single();

            if (error) throw error;
            allVouchers.unshift(data);

        } else {
            voucherData.id = Date.now();
            allVouchers.unshift(voucherData);
            localStorage.setItem('admin-vouchers', JSON.stringify(allVouchers));
            localStorage.setItem('website-vouchers', JSON.stringify(allVouchers));
            broadcastToWebsite('vouchers_updated', { eventType: 'INSERT', new: voucherData });
        }

        showToast('✅ Voucher added and synced globally!', 'success');
        event.target.reset();
        displayVouchers();

        localStorage.setItem('cache_buster', Date.now().toString());

    } catch (error) {
        console.error('❌ Error adding voucher:', error);
        showToast('❌ Error adding voucher: ' + error.message, 'error');
    }
}

async function handleAddPromotion(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const promotionData = {
        title: formData.get('promotionTitle'),
        discount_type: formData.get('promotionType'),
        discount_value: parseFloat(formData.get('promotionValue')),
        description: formData.get('promotionDescription'),
        show_popup: formData.get('promotionPopup') === 'on',
        start_date: formData.get('promotionStart') || null,
        end_date: formData.get('promotionEnd') || null,
        popup_title: formData.get('popupTitle') || '',
        popup_message: formData.get('popupMessage') || '',
        button_text: formData.get('buttonText') || 'Shop Now',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    try {
        if (isSupabaseConnected) {
            const { data, error } = await supabase
                .from('promotions')
                .insert([promotionData])
                .select()
                .single();

            if (error) throw error;
            allPromotions.unshift(data);

        } else {
            promotionData.id = Date.now();
            allPromotions.unshift(promotionData);
            localStorage.setItem('admin-promotions', JSON.stringify(allPromotions));
            localStorage.setItem('website-promotions', JSON.stringify(allPromotions));
            broadcastToWebsite('promotions_updated', { eventType: 'INSERT', new: promotionData });
        }

        showToast('✅ Promotion added and synced globally!', 'success');
        event.target.reset();
        displayPromotions();

        localStorage.setItem('cache_buster', Date.now().toString());

    } catch (error) {
        console.error('❌ Error adding promotion:', error);
        showToast('❌ Error adding promotion: ' + error.message, 'error');
    }
}

// Enhanced update order status with real-time sync
async function updateOrderStatus(orderId, newStatus) {
    try {
        const orderIndex = allOrders.findIndex(order => order.id == orderId);
        if (orderIndex === -1) {
            showToast('❌ Order not found', 'error');
            return;
        }

        const updateData = {
            status: newStatus,
            updated_at: new Date().toISOString()
        };

        if (isSupabaseConnected) {
            const { error } = await supabase
                .from('orders')
                .update(updateData)
                .eq('id', orderId);

            if (error) throw error;
        }

        // Update local data
        allOrders[orderIndex] = { ...allOrders[orderIndex], ...updateData };

        // Sync to localStorage for website access
        localStorage.setItem('admin-orders', JSON.stringify(allOrders));
        localStorage.setItem('website-orders', JSON.stringify(allOrders));

        // Broadcast to website
        broadcastToWebsite('orders_updated', { 
            eventType: 'UPDATE', 
            new: allOrders[orderIndex] 
        });

        showToast(`✅ Order status updated to ${newStatus} - Synced globally!`, 'success');
        displayOrders();

        // Force cache refresh
        localStorage.setItem('cache_buster', Date.now().toString());

    } catch (error) {
        console.error('❌ Error updating order status:', error);
        showToast('❌ Error updating order status: ' + error.message, 'error');
    }
}

// Enhanced global sync for dynamic styles and design updates
function updateGlobalDesignSettings() {
    const designSettings = {
        primaryColor: localStorage.getItem('site-primary-color') || '#1a1a1a',
        secondaryColor: localStorage.getItem('site-secondary-color') || '#FFD700',
        accentColor: localStorage.getItem('site-accent-color') || '#FFF8DC',
        fontFamily: localStorage.getItem('site-font-family') || 'Poppins',
        borderRadius: localStorage.getItem('site-border-radius') || '10px',
        lastUpdated: Date.now()
    };

    // Broadcast design changes to all website instances
    broadcastToWebsite('design_updated', designSettings);
    localStorage.setItem('global-design-settings', JSON.stringify(designSettings));
    console.log('🎨 Global design settings updated and synced');
}

// Enhanced site settings management
async function handleSiteSettings(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const siteSettings = {
        siteName: formData.get('siteName') || 'TryneX Lifestyle',
        heroTitle: formData.get('heroTitle') || 'Premium Custom Gifts',
        heroSubtitle: formData.get('heroSubtitle') || 'Personalized products for every occasion',
        contactPhone: formData.get('contactPhone') || '+880 1747 292277',
        contactEmail: formData.get('contactEmail') || 'info@trynexlifestyle.com',
        aboutText: formData.get('aboutText') || 'Creating memories with premium custom gifts.',
        primaryColor: formData.get('primaryColor') || '#1a1a1a',
        secondaryColor: formData.get('secondaryColor') || '#FFD700',
        accentColor: formData.get('accentColor') || '#FFF8DC',
        fontFamily: formData.get('fontFamily') || 'Poppins',
        borderRadius: formData.get('borderRadius') || '10px',
        updated_at: new Date().toISOString()
    };

    try {
        // Save to multiple storage locations for maximum reliability
        localStorage.setItem('site-settings', JSON.stringify(siteSettings));
        localStorage.setItem('website-settings', JSON.stringify(siteSettings));
        localStorage.setItem('frontend-settings', JSON.stringify(siteSettings));

        // Save individual design settings for easy access
        Object.keys(siteSettings).forEach(key => {
            if (key.includes('Color') || key === 'fontFamily' || key === 'borderRadius') {
                localStorage.setItem(`site-${key.toLowerCase().replace(/([A-Z])/g, '-$1')}`, siteSettings[key]);
            }
        });

        // Update global design settings
        updateGlobalDesignSettings();

        // Broadcast comprehensive update
        broadcastToWebsite('site_settings_updated', siteSettings);

        // Force refresh all website instances
        localStorage.setItem('force_refresh', Date.now().toString());
        localStorage.setItem('cache_buster', Date.now().toString());

        showToast('✅ Site settings updated and synced globally!', 'success');

        // Apply changes immediately to admin panel
        applyDesignChangesToAdminPanel(siteSettings);

    } catch (error) {
        console.error('❌ Error saving site settings:', error);
        showToast('❌ Error saving site settings: ' + error.message, 'error');
    }
}

// Apply design changes to admin panel immediately
function applyDesignChangesToAdminPanel(settings) {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', settings.primaryColor);
    root.style.setProperty('--secondary-color', settings.secondaryColor);
    root.style.setProperty('--accent-color', settings.accentColor);
    root.style.setProperty('--border-radius', settings.borderRadius);

    if (settings.fontFamily) {
        document.body.style.fontFamily = `'${settings.fontFamily}', sans-serif`;
    }

    console.log('🎨 Admin panel design updated in real-time');
}

// Enhanced delete functions with real-time sync
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product? This change will be instant for all users.')) return;

    try {
        if (isSupabaseConnected) {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (error) throw error;
        }

        const deletedProduct = allProducts.find(p => p.id === productId);
        allProducts = allProducts.filter(p => p.id !== productId);

        // Sync to localStorage
        localStorage.setItem('admin-products', JSON.stringify(allProducts));
        localStorage.setItem('website-products', JSON.stringify(allProducts));
        localStorage.setItem('frontend-products', JSON.stringify(allProducts));

        // Broadcast deletion with force refresh
        broadcastToWebsite('products_updated', { 
            eventType: 'DELETE', 
            old: deletedProduct,
            forceRefresh: true
        });

        showToast('✅ Product deleted and synced globally!', 'success');
        displayProducts();
        updateDashboard();

        // Multiple cache busting strategies
        localStorage.setItem('cache_buster', Date.now().toString());
        localStorage.setItem('force_refresh', Date.now().toString());
        localStorage.setItem('data_version', Date.now().toString());

    } catch (error) {
        console.error('❌ Error deleting product:', error);
        showToast('❌ Error deleting product: ' + error.message, 'error');
    }
}

async function deleteVoucher(voucherId) {
    if (!confirm('Are you sure you want to delete this voucher? This change will be instant for all users.')) return;

    try {
        if (isSupabaseConnected) {
            const { error } = await supabase
                .from('vouchers')
                .delete()
                .eq('id', voucherId);

            if (error) throw error;
        }

        const deletedVoucher = allVouchers.find(v => v.id === voucherId);
        allVouchers = allVouchers.filter(v => v.id !== voucherId);

        localStorage.setItem('admin-vouchers', JSON.stringify(allVouchers));
        localStorage.setItem('website-vouchers', JSON.stringify(allVouchers));

        broadcastToWebsite('vouchers_updated', { 
            eventType: 'DELETE', 
            old: deletedVoucher 
        });

        showToast('✅ Voucher deleted globally!', 'success');
        displayVouchers();

        localStorage.setItem('cache_buster', Date.now().toString());

    } catch (error) {
        console.error('❌ Error deleting voucher:', error);
        showToast('❌ Error deleting voucher: ' + error.message, 'error');
    }
}

async function deletePromotion(promotionId) {
    if (!confirm('Are you sure you want to delete this promotion? This change will be instant for all users.')) return;

    try {
        if (isSupabaseConnected) {
            const { error } = await supabase
                .from('promotions')
                .delete()
                .eq('id', promotionId);

            if (error) throw error;
        }

        const deletedPromotion = allPromotions.find(p => p.id === promotionId);
        allPromotions = allPromotions.filter(p => p.id !== promotionId);

        localStorage.setItem('admin-promotions', JSON.stringify(allPromotions));
        localStorage.setItem('website-promotions', JSON.stringify(allPromotions));

        broadcastToWebsite('promotions_updated', { 
            eventType: 'DELETE', 
            old: deletedPromotion 
        });

        showToast('✅ Promotion deleted globally!', 'success');
        displayPromotions();

        localStorage.setItem('cache_buster', Date.now().toString());

    } catch (error) {
        console.error('❌ Error deleting promotion:', error);
        showToast('❌ Error deleting promotion: ' + error.message, 'error');
    }
}

// Payment management functions (keeping existing functionality)
function manageOrderPayment(orderId, totalAmount, currentPaid, paymentStatus) {
    const dueAmount = Math.max(0, totalAmount - currentPaid);

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
                min-width: 450px;
                max-width: 90%;
            ">
                <h2 style="margin-bottom: 1rem; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-credit-card" style="color: #FFD700;"></i> Manage Payment - Order #${orderId}
                </h2>

                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; text-align: center;">
                        <div>
                            <small style="color: #666;">Total Amount</small><br>
                            <strong style="font-size: 1.2rem;">৳${totalAmount}</strong>
                        </div>
                        <div>
                            <small style="color: #666;">Paid Amount</small><br>
                            <strong style="font-size: 1.2rem; color: #28a745;">৳${currentPaid}</strong>
                        </div>
                        <div>
                            <small style="color: #666;">Due Amount</small><br>
                            <strong style="font-size: 1.2rem; color: ${dueAmount > 0 ? '#dc3545' : '#28a745'};">৳${dueAmount}</strong>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <h4 style="color: #333; margin-bottom: 1rem;">Payment Actions:</h4>

                    ${dueAmount > 0 ? `
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Record Payment Amount:</label>
                            <input type="number" id="paymentAmount" placeholder="Enter amount" value="${dueAmount}" max="${dueAmount}" min="1" style="
                                width: 100%;
                                padding: 0.75rem;
                                border: 2px solid #ddd;
                                border-radius: 5px;
                                font-size: 1rem;
                                margin-bottom: 0.5rem;
                            ">
                            <select id="paymentMethod" style="
                                width: 100%;
                                padding: 0.75rem;
                                border: 2px solid #ddd;
                                border-radius: 5px;
                                font-size: 1rem;
                                margin-bottom: 1rem;
                            ">
                                <option value="cash">Cash Payment</option>
                                <option value="bkash">bKash</option>
                                <option value="nagad">Nagad</option>
                                <option value="rocket">Rocket</option>
                                <option value="bank">Bank Transfer</option>
                            </select>
                            <button onclick="recordPayment('${orderId}', '${totalAmount}')" style="
                                background: #28a745;
                                color: white;
                                border: none;
                                padding: 0.75rem 1.5rem;
                                border-radius: 5px;
                                font-weight: 600;
                                cursor: pointer;
                                width: 100%;
                                margin-bottom: 0.5rem;
                            ">
                                <i class="fas fa-plus"></i> Record Payment
                            </button>
                        </div>
                    ` : ''}

                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                        <button onclick="setPaymentStatus('${orderId}', 'fully_paid', ${totalAmount})" style="
                            background: #28a745;
                            color: white;
                            border: none;
                            padding: 0.75rem 1rem;
                            ```text
                            border-radius: 5px;
                            font-weight: 600;
                            cursor: pointer;
                        ">
                            <i class="fas fa-check"></i> Mark Fully Paid
                        </button>
                        <button onclick="setPaymentStatus('${orderId}', 'pending', ${currentPaid})" style="
                            background: #dc3545;
                            color: white;
                            border: none;
                            padding: 0.75rem 1rem;
                            border-radius: 5px;
                            font-weight: 600;
                            cursor: pointer;
                        ">
                            <i class="fas fa-times"></i> Mark Unpaid
                        </button>
                    </div>
                </div>

                <div style="text-align: center;">
                    <button onclick="closePaymentManagementModal()" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 0.75rem 2rem;
                        border-radius: 5px;
                        font-weight: 600;
                        cursor: pointer;
                    ">Close</button>
                </div>
            </div>
        </div>
    `;

    modal.id = 'paymentManagementModal';
    document.body.appendChild(modal);
}

function recordPayment(orderId, totalAmount) {
    const amountInput = document.getElementById('paymentAmount');
    const methodSelect = document.getElementById('paymentMethod');

    const amount = parseFloat(amountInput.value);
    const method = methodSelect.value;

    if (!amount || amount <= 0) {
        showToast('Please enter a valid payment amount', 'error');
        return;
    }

    const orderIndex = allOrders.findIndex(o => o.id == orderId);
    if (orderIndex > -1) {
        const order = allOrders[orderIndex];
        const currentPaid = order.advancePaid || 100;
        const newPaidAmount = currentPaid + amount;
        const total = parseFloat(totalAmount);

        allOrders[orderIndex].advancePaid = newPaidAmount;
        allOrders[orderIndex].paymentStatus = newPaidAmount >= total ? 'fully_paid' : 'partially_paid';
        allOrders[orderIndex].lastPayment = {
            amount: amount,
            method: method,
            timestamp: new Date().toISOString(),
            recordedBy: 'admin'
        };

        if (!allOrders[orderIndex].paymentHistory) {
            allOrders[orderIndex].paymentHistory = [];
        }
        allOrders[orderIndex].paymentHistory.push({
            amount: amount,
            method: method,
            timestamp: new Date().toISOString(),
            recordedBy: 'admin',
            transactionId: 'ADM' + Date.now()
        });

        saveOrdersToStorage();
        broadcastToWebsite('orders_updated', { 
            eventType: 'UPDATE', 
            new: allOrders[orderIndex] 
        });

        showToast(`Payment of ৳${amount} recorded and synced globally!`, 'success');
        closePaymentManagementModal();
        displayOrders();

        localStorage.setItem('cache_buster', Date.now().toString());
    }
}

function setPaymentStatus(orderId, status, amount) {
    const orderIndex = allOrders.findIndex(o => o.id == orderId);
    if (orderIndex > -1) {
        if (status === 'fully_paid') {
            allOrders[orderIndex].advancePaid = parseFloat(amount);
            allOrders[orderIndex].paymentStatus = 'fully_paid';
        } else if (status === 'pending') {
            allOrders[orderIndex].paymentStatus = 'pending';
        }

        allOrders[orderIndex].paymentStatusUpdatedBy = 'admin';
        allOrders[orderIndex].paymentStatusUpdatedAt = new Date().toISOString();

        saveOrdersToStorage();
        broadcastToWebsite('orders_updated', { 
            eventType: 'UPDATE', 
            new: allOrders[orderIndex] 
        });

        showToast(`Payment status updated to ${status.replace('_', ' ')} - Synced globally!`, 'success');
        closePaymentManagementModal();
        displayOrders();

        localStorage.setItem('cache_buster', Date.now().toString());
    }
}

function saveOrdersToStorage() {
    localStorage.setItem('admin-orders', JSON.stringify(allOrders));
    localStorage.setItem('website-orders', JSON.stringify(allOrders));
}

function closePaymentManagementModal() {
    const modal = document.getElementById('paymentManagementModal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

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
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        font-family: 'Poppins', sans-serif;
        font-weight: 500;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Sample data functions - Generate 48+ products
function getSample48Products() {
    const categories = ['Custom Gifts', 'Apparel', 'Accessories', 'Personalized Items', 'Home Decor', 'Office Items'];
    const baseProducts = [
        { name: 'Custom Photo Mug', basePrice: 450, category: 'Custom Gifts', description: 'Personalized photo mug with your favorite memories' },
        { name: 'Personalized T-Shirt', basePrice: 650, category: 'Apparel', description: 'Custom printed t-shirt with your design' },
        { name: 'Custom Phone Case', basePrice: 350, category: 'Accessories', description: 'Protect your phone with a personalized case' },
        { name: 'Photo Keychain', basePrice: 200, category: 'Accessories', description: 'Acrylic photo keychain with your memory' },
        { name: 'Custom Coffee Mug', basePrice: 400, category: 'Custom Gifts', description: 'Personalized coffee mug with your favorite quote' },
        { name: 'Polo Shirt', basePrice: 750, category: 'Apparel', description: 'Professional polo shirt with custom embroidery' },
        { name: 'Custom Mouse Pad', basePrice: 300, category: 'Office Items', description: 'Personalized mouse pad for your workspace' },
        { name: 'Photo Frame', basePrice: 500, category: 'Home Decor', description: 'Beautiful custom photo frame' }
    ];

    const features = ['Premium Quality', 'Durable Material', 'Premium Cotton', 'Eco-Friendly', 'Waterproof', 'Scratch Resistant'];
    const badges = ['🔥 Hot', '⭐ Popular', '🆕 New', '❤️ Love', '☕ Coffee', '📸 Memory', '👔 Professional', '🎁 Gift'];

    const products = [];

    for (let i = 0; i < 48; i++) {
        const base = baseProducts[i % baseProducts.length];
        const variation = Math.floor(i / baseProducts.length) + 1;

        products.push({
            id: i + 1,
            name: variation > 1 ? `${base.name} ${variation}` : base.name,
            price: base.basePrice + (variation - 1) * 50 + (Math.random() * 100 - 50),
            category: base.category,
            description: base.description + (variation > 1 ? ` - Variant ${variation}` : ''),
            image_url: `https://images.unsplash.com/photo-${1544787219 + i}?w=400&h=400&fit=crop`,
            feature: features[i % features.length],
            badge: badges[i % badges.length],
            stock_quantity: Math.floor(Math.random() * 100) + 20,
            is_active: true,
            created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
    }

    return products;
}

function getSampleOrders() {
    return [
        {
            id: 'TRX' + Date.now(),
            customer_name: 'John Doe',
            customer_phone: '01712345678',
            customer_email: 'john@example.com',
            shipping_address: 'Dhaka, Bangladesh',
            total_amount: 1500,
            advancePaid: 100,
            paymentStatus: 'partially_paid',
            status: 'pending',
            created_at: new Date().toISOString()
        }
    ];
}

function getSampleVouchers() {
    return [
        {
            id: 1,
            code: 'SAVE20',
            discount_type: 'percentage',
            discount_value: 20,
            description: '20% off on all items',
            is_active: true,
            created_at: new Date().toISOString()
        }
    ];
}

function getSamplePromotions() {
    return [
        {
            id: 1,
            title: 'Summer Special',
            discount_type: 'percentage',
            discount_value: 25,
            description: '25% off on all summer items',
            show_popup: true,
            popup_title: '🌞 Summer Special!',
            popup_message: 'Get 25% off on all items this summer!',
            button_text: 'Shop Now',
            is_active: true,
            created_at: new Date().toISOString()
        }
    ];
}

// Load featured products selector
function loadFeaturedProductsSelector() {
    const selector = document.getElementById('featuredProductsSelector');
    if (!selector || allProducts.length === 0) return;

    const featuredProducts = JSON.parse(localStorage.getItem('featured-products') || '[]');

    selector.innerHTML = allProducts.slice(0, 12).map(product => `
        <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; border: 1px solid #ddd; margin-bottom: 1rem; border-radius: 5px;">
            <input type="checkbox" 
                   id="featured_${product.id}" 
                   value="${product.id}"
                   ${featuredProducts.includes(product.id) ? 'checked' : ''}
                   style="width: auto;">
            <img src="${product.image_url}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
            <div>
                <strong>${product.name}</strong>
                <div style="color: #666; font-size: 0.9rem;">${product.category} - ৳${product.price}</div>
            </div>
        </div>
    `).join('');
}

// Save featured products
function saveFeaturedProducts() {
    const checkboxes = document.querySelectorAll('#featuredProductsSelector input[type="checkbox"]:checked');
    const featuredProductIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

    localStorage.setItem('featured-products', JSON.stringify(featuredProductIds));
    localStorage.setItem('cache_buster', Date.now().toString());

    // Update display
    displayFeatured();

    showToast('✅ Featured products updated successfully!', 'success');
}

// Delete category
async function deleteCategory(categoryId) {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
        const categories = JSON.parse(localStorage.getItem('admin-categories') || '[]');
        const updatedCategories = categories.filter(c => c.id !== categoryId);
        localStorage.setItem('admin-categories', JSON.stringify(updatedCategories));

        displayCategories();

        localStorage.setItem('cache_buster', Date.now().toString());

        showToast('✅ Category deleted successfully!', 'success');

    } catch (error) {
        console.error('❌ Error deleting category:', error);
        showToast('❌ Error deleting category!', 'error');
    }
}

// Remove featured product
function removeFeaturedProduct(productId) {
    const featuredProducts = JSON.parse(localStorage.getItem('featured-products') || '[]');
    const updatedFeatured = featuredProducts.filter(id => id !== productId);

    localStorage.setItem('featured-products', JSON.stringify(updatedFeatured));
    localStorage.setItem('cache_buster', Date.now().toString());

    // Update displays
    displayFeatured();
    loadFeaturedProductsSelector();

    showToast('✅ Product removed from featured!', 'success');
}

// Handle category addition
async function handleAddCategory(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const categoryData = {
        id: Date.now(),
        name: formData.get('categoryName'),
        slug: formData.get('categorySlug'),
        image: formData.get('categoryImage'),
        icon: formData.get('categoryIcon'),
        description: formData.get('categoryDescription'),
        created_at: new Date().toISOString()
    };

    try {
        // Add to categories array
        const categories = JSON.parse(localStorage.getItem('admin-categories') || '[]');
        categories.push(categoryData);
        localStorage.setItem('admin-categories', JSON.stringify(categories));

        displayCategories();

        // Reset form
        event.target.reset();

        // Clear cache
        localStorage.setItem('cache_buster', Date.now().toString());

        showToast('✅ Category added successfully!', 'success');

    } catch (error) {
        console.error('❌ Error adding category:', error);
        showToast('❌ Error adding category!', 'error');
    }
}

// Make functions globally available
window.showSection = showSection;
window.handleAddProduct = handleAddProduct;
window.handleAddVoucher = handleAddVoucher;
window.handleSiteSettings = handleSiteSettings;
window.updateOrderStatus = updateOrderStatus;
window.deleteProduct = deleteProduct;
window.updateGlobalDesignSettings = updateGlobalDesignSettings;
window.applyDesignChangesToAdminPanel = applyDesignChangesToAdminPanel;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Enhanced Admin panel with real-time global sync initializing...');

    if (typeof window.supabase !== 'undefined') {
        try {
            // Backend API configuration (using your deployed Render backend)
            const BACKEND_URL = 'https://trynex-gift-3.onrender.com'; // Your actual Render URL from the logs

            // Backend API helper function
            async function apiCall(endpoint, options = {}) {
                try {
                    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            ...options.headers
                        },
                        ...options
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    return await response.json();
                } catch (error) {
                    console.error('API call failed:', error);
                    throw error;
                }
            }

            const SUPABASE_URL = 'https://wifsqonbnfmwtqvupqbk.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZnNxb25ibmZtd3RxdnVwcWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1ODAyNjMsImV4cCI6MjA2NzE1NjI2M30.A7o3vhEaNZb9lmViHA_KQrwzKJTBWpsD6KbHqkkput0';
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase initialized for real-time sync');
            testSupabaseConnection();
        } catch (error) {
            console.error('❌ Supabase initialization failed:', error);
            initializeFallbackMode();
        }
    } else {
        console.log('📱 Supabase not available, using enhanced localStorage mode');
        initializeFallbackMode();
    }
});

// Cleanup subscriptions when page unloads
window.addEventListener('beforeunload', function() {
    realtimeSubscriptions.forEach(subscription => {
        if (subscription) {
            subscription.unsubscribe();
        }
    });
});