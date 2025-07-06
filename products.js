// Supabase Configuration - Try environment variables first, fallback to hardcoded
const SUPABASE_URL = window.SUPABASE_URL || 'https://wifsqonbnfmwtqvupqbk.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZnNxb25ibmZtd3RxdnVwcWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1ODAyNjMsImV4cCI6MjA2NzE1NjI2M30.A7o3vhEaNZb9lmViHA_KQrwzKJTBWpsD6KbHqkkput0';

// Global variables
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 12;
let currentFilter = 'all';
let currentSort = 'default';
let currentPriceFilter = 'all';
let isLoading = false;

// Initialize Supabase client
let supabase;
try {
    if (typeof window !== 'undefined' && window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (error) {
    console.log('Supabase not available, using localStorage mode');
}

// Load products on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Products page initializing...');
    loadProducts();
    initializeFilters();
    updateCartCount();
});

// Generate 48 high-quality sample products
function getSampleProducts() {
    const categories = ['mug', 't-shirt', 'keychain', 'couple'];
    const products = [];

    // Mug products (12 items)
    const mugNames = [
        'Custom Photo Mug - Classic White',
        'Magic Color Changing Mug',
        'Travel Mug with Custom Design',
        'Heart Handle Love Mug',
        'Custom Coffee Mug Premium',
        'Ceramic Mug with Quote',
        'Personalized Name Mug',
        'Birthday Special Mug',
        'Anniversary Photo Mug',
        'Family Photo Mug',
        'Pet Photo Mug',
        'Graduation Custom Mug'
    ];

    mugNames.forEach((name, index) => {
        products.push({
            id: index + 1,
            name: name,
            price: 450 + (index * 20),
            category: 'mug',
            description: `Premium ceramic mug with high-quality photo printing. Perfect for daily use and gifts.`,
            image_url: `https://images.unsplash.com/photo-${1544787219 + index}?w=400&h=400&fit=crop&q=80`,
            discount: index % 3 === 0 ? 15 : 0,
            featured: index < 3,
            stock_quantity: 50 + index,
            is_active: true,
            created_at: new Date().toISOString()
        });
    });

    // T-shirt products (12 items)
    const tshirtNames = [
        'Premium Cotton Custom T-Shirt',
        'Polo Shirt with Custom Embroidery',
        'Hoodie with Custom Print',
        'V-Neck Custom Design Tee',
        'Sports T-Shirt Custom',
        'Designer T-Shirt Premium',
        'Couple T-Shirt Set',
        'Birthday T-Shirt Custom',
        'Team T-Shirt with Logo',
        'Event T-Shirt Custom',
        'Fashion T-Shirt Design',
        'Vintage Style Custom Tee'
    ];

    tshirtNames.forEach((name, index) => {
        products.push({
            id: index + 13,
            name: name,
            price: 650 + (index * 30),
            category: 't-shirt',
            description: `100% premium cotton t-shirt with high-quality custom printing and comfortable fit.`,
            image_url: `https://images.unsplash.com/photo-${1521572163 + index}?w=400&h=400&fit=crop&q=80`,
            discount: index % 4 === 0 ? 20 : 0,
            featured: index < 2,
            stock_quantity: 30 + index,
            is_active: true,
            created_at: new Date().toISOString()
        });
    });

    // Keychain products (12 items)
    const keychainNames = [
        'Acrylic Photo Keychain',
        'Metal Engraved Keychain',
        'Heart-Shaped Photo Keychain',
        'LED Light Photo Keychain',
        'Wooden Custom Keychain',
        'Crystal Photo Keychain',
        'Leather Custom Keychain',
        'Car Photo Keychain',
        'Round Photo Keychain',
        'Square Photo Keychain',
        'Diamond Shape Keychain',
        'Pet Photo Keychain'
    ];

    keychainNames.forEach((name, index) => {
        products.push({
            id: index + 25,
            name: name,
            price: 200 + (index * 15),
            category: 'keychain',
            description: `Durable custom keychain with high-quality photo printing. Perfect for keys and bags.`,
            image_url: `https://images.unsplash.com/photo-${1586495777 + index}?w=400&h=400&fit=crop&q=80`,
            discount: index % 5 === 0 ? 10 : 0,
            featured: index < 2,
            stock_quantity: 100 + index,
            is_active: true,
            created_at: new Date().toISOString()
        });
    });

    // Couple products (12 items)
    const coupleNames = [
        'Couple Mug Set - His & Hers',
        'Couple Photo Frame Set',
        'Matching Couple T-Shirts',
        'Couple Keychain Set - Puzzle Pieces',
        'Love Quote Couple Mugs',
        'Anniversary Couple Set',
        'Wedding Couple Items',
        'Valentine Couple Package',
        'Romantic Couple Gift Set',
        'Personalized Couple Items',
        'Custom Couple Photo Set',
        'Forever Love Couple Kit'
    ];

    coupleNames.forEach((name, index) => {
        products.push({
            id: index + 37,
            name: name,
            price: 800 + (index * 50),
            category: 'couple',
            description: `Romantic couple items set with custom photos and designs. Perfect for special occasions.`,
            image_url: `https://images.unsplash.com/photo-${1578662996 + index}?w=400&h=400&fit=crop&q=80`,
            discount: index % 3 === 0 ? 25 : 0,
            featured: index < 3,
            stock_quantity: 25 + index,
            is_active: true,
            created_at: new Date().toISOString()
        });
    });

    return products;
}

// Load products from multiple sources
async function loadProducts() {
    try {
        isLoading = true;
        console.log('🔄 Loading products...');

        let products = [];

        // Try Supabase first
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (!error && data && data.length > 0) {
                    products = data;
                    console.log('✅ Loaded products from Supabase:', products.length);
                }
            } catch (supabaseError) {
                console.log('Supabase failed, trying localStorage');
            }
        }

        // Try localStorage if Supabase failed
        if (products.length === 0) {
            const cachedProducts = localStorage.getItem('website-products') || 
                                 localStorage.getItem('admin-products') || 
                                 localStorage.getItem('frontend-products');

            if (cachedProducts) {
                try {
                    products = JSON.parse(cachedProducts);
                    console.log('✅ Loaded products from cache:', products.length);
                } catch (parseError) {
                    console.log('Cache parse failed, using samples');
                }
            }
        }

        // Use sample products as final fallback
        if (products.length === 0) {
            products = getSampleProducts();
            console.log('✅ Using sample products:', products.length);

            // Save to localStorage for future use
            localStorage.setItem('website-products', JSON.stringify(products));
            localStorage.setItem('admin-products', JSON.stringify(products));
        }

        allProducts = products;
        filteredProducts = [...allProducts];

        // Initialize display
        updateProductCounts();
        displayProducts();
        updateShowingInfo();

    } catch (error) {
        console.error('❌ Error loading products:', error);
        // Emergency fallback
        allProducts = getSampleProducts();
        filteredProducts = [...allProducts];
        localStorage.setItem('website-products', JSON.stringify(allProducts));
        displayProducts();
    } finally {
        isLoading = false;
    }
}

// Initialize filters
function initializeFilters() {
    updateProductCounts();
}

// Update product counts for each category
function updateProductCounts() {
    const categories = ['all', 'mug', 't-shirt', 'keychain', 'couple'];

    categories.forEach(category => {
        const count = category === 'all' 
            ? allProducts.length 
            : allProducts.filter(product => product.category === category).length;

        const countElement = document.getElementById(`count-${category}`);
        if (countElement) {
            countElement.textContent = count;
        }
    });
}

// Filter products by category
function filterByCategory(category, buttonElement) {
    currentFilter = category;
    currentPage = 1;

    // Update active filter button
    document.querySelectorAll('.category-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (buttonElement) {
        buttonElement.classList.add('active');
    }

    applyFilters();
}

// Filter products by price range
function filterByPrice(priceRange) {
    currentPriceFilter = priceRange;
    currentPage = 1;
    applyFilters();
}

// Sort products
function sortProducts(sortBy) {
    currentSort = sortBy;
    applyFilters();
}

// Apply all filters and sorting
function applyFilters() {
    let filtered = [...allProducts];

    // Apply category filter
    if (currentFilter !== 'all') {
        filtered = filtered.filter(product => product.category === currentFilter);
    }

    // Apply price filter
    if (currentPriceFilter !== 'all') {
        const [min, max] = currentPriceFilter.split('-').map(p => p.replace('+', ''));
        filtered = filtered.filter(product => {
            if (max) {
                return product.price >= parseInt(min) && product.price <= parseInt(max);
            } else {
                return product.price >= parseInt(min);
            }
        });
    }

    // Apply sorting
    switch (currentSort) {
        case 'price-low':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'newest':
            filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        default:
            break;
    }

    filteredProducts = filtered;
    displayProducts();
    updateShowingInfo();
}

// Display products
function displayProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) {
        console.error('Products grid element not found');
        return;
    }

    const startIndex = 0;
    const endIndex = currentPage * productsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);

    if (productsToShow.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products" style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
                <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3 style="color: #666; font-size: 1.2rem;">No Products Found</h3>
                <p style="color: #999; margin-bottom: 2rem;">Try adjusting your filters or search criteria</p>
                <button onclick="resetFilters()" class="btn btn-outline">
                    <i class="fas fa-undo"></i> Reset Filters
                </button>
            </div>
        `;
        return;
    }

    productsGrid.innerHTML = productsToShow.map(product => `
        <div class="product-card" onclick="openProductModal(${product.id})">
            ${product.discount ? `<div class="product-badge">${product.discount}% OFF</div>` : ''}
            ${product.featured ? `<div class="featured-badge">⭐ Featured</div>` : ''}

            <div class="product-image">
                <img src="${product.image_url}" alt="${product.name}" loading="lazy">
                <div class="product-overlay">
                    <button onclick="event.stopPropagation(); quickAddToCart(${product.id})">
                        <i class="fas fa-shopping-cart"></i> Quick Add
                    </button>
                </div>
            </div>

            <div class="product-info">
                <div class="product-category">${product.category.replace('-', ' ')}</div>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">
                    <span class="current-price">৳${product.price}</span>
                    ${product.discount ? `<span class="original-price">৳${Math.round(product.price / (1 - product.discount / 100))}</span>` : ''}
                </div>
                <div class="product-rating">
                    <div class="stars">★★★★★</div>
                    <span>(${Math.floor(Math.random() * 50) + 10} reviews)</span>
                </div>
                <div class="product-actions">
                    <button onclick="event.stopPropagation(); addToCart(${product.id})" class="btn btn-primary">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                    <button onclick="event.stopPropagation(); openProductModal(${product.id})" class="btn btn-secondary">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    updateLoadMoreButton();
}

// Quick add to cart
function quickAddToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        addToCart(productId, {
            name: product.name,
            price: product.price,
            image: product.image_url
        });
    }
}

// Add to cart function
function addToCart(productId, productData) {
    if (!productData) {
        const product = allProducts.find(p => p.id === productId);
        if (!product) return;

        productData = {
            name: product.name,
            price: product.price,
            image: product.image_url
        };
    }

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
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
    updateCartCount();
    showToast('✅ Product added to cart!', 'success');
}

// Update cart count
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// Open product modal
function openProductModal(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    console.log('Quick view:', product.name);

    const modal = document.createElement('div');
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 2rem;">
            <div style="background: white; border-radius: 20px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <button onclick="closeModal()" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.1); border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 1.2rem; z-index: 1;">×</button>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; padding: 2rem;">
                    <div>
                        <img src="${product.image_url}" alt="${product.name}" style="width: 100%; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <div style="font-size: 0.9rem; color: #FFD700; font-weight: 600; text-transform: uppercase;">${product.category.replace('-', ' ')}</div>
                        <h2 style="font-size: 1.8rem; font-weight: 700; color: #333; margin: 0;">${product.name}</h2>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <span style="font-size: 2rem; font-weight: 700; color: #28a745;">৳${product.price}</span>
                            ${product.discount ? `<span style="background: #ff6b6b; color: white; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.8rem;">${product.discount}% OFF</span>` : ''}
                        </div>
                        <div style="color: #666; line-height: 1.6;">${product.description}</div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; color: #FFD700;">★★★★★ <span style="color: #666; margin-left: 0.5rem;">(${Math.floor(Math.random() * 50) + 10} reviews)</span></div>
                        <div style="display: flex; gap: 1rem; margin-top: auto;">
                            <button onclick="addToCart(${product.id}); closeModal()" style="flex: 1; background: linear-gradient(135deg, #FFD700, #FFA500); color: white; border: none; padding: 1rem; border-radius: 8px; font-weight: 600; cursor: pointer;">Add to Cart</button>
                            <button onclick="closeModal()" style="background: #6c757d; color: white; border: none; padding: 1rem 2rem; border-radius: 8px; cursor: pointer;">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.id = 'productModal';
    document.body.appendChild(modal);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    window.closeModal = function() {
        modal.remove();
    };
}

// Update load more button
function updateLoadMoreButton() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const displayedProducts = currentPage * productsPerPage;

    if (loadMoreBtn) {
        if (displayedProducts >= filteredProducts.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }
}

// Load more products
function loadMoreProducts() {
    if (!isLoading && (currentPage * productsPerPage) < filteredProducts.length) {
        currentPage++;
        displayProducts();
        updateShowingInfo();
    }
}

// Update showing info
function updateShowingInfo() {
    const showingInfo = document.getElementById('showingInfo');
    if (showingInfo) {
        const displayedProducts = Math.min(currentPage * productsPerPage, filteredProducts.length);
        showingInfo.textContent = `Showing 1-${displayedProducts} of ${filteredProducts.length} products`;
    }
}

// Reset filters
function resetFilters() {
    currentFilter = 'all';
    currentSort = 'default';
    currentPriceFilter = 'all';
    currentPage = 1;

    document.querySelectorAll('.category-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const allBtn = document.querySelector('.category-filter-btn[data-category="all"]');
    if (allBtn) allBtn.classList.add('active');

    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect) sortSelect.value = 'default';

    applyFilters();
    showToast('🔄 Filters reset', 'info');
}

// Search products
function searchProducts() {
    const searchInput = document.getElementById('searchInput');
    const searchDropdown = document.getElementById('searchDropdown');

    if (!searchInput || !searchDropdown) return;

    const query = searchInput.value.toLowerCase().trim();

    if (query.length === 0) {
        searchDropdown.style.display = 'none';
        return;
    }

    const results = allProducts.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
    ).slice(0, 5);

    if (results.length > 0) {
        searchDropdown.innerHTML = results.map(product => `
            <div class="search-result" onclick="goToProduct(${product.id})" style="
                padding: 1rem;
                border-bottom: 1px solid #eee;
                cursor: pointer;
                transition: background 0.3s ease;
            " onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <img src="${product.image_url}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
                    <div>
                        <div style="font-weight: 600; color: #333;">${product.name}</div>
                        <div style="color: #666; font-size: 0.9rem;">৳${product.price}</div>
                    </div>
                </div>
            </div>
        `).join('');
        searchDropdown.style.display = 'block';
    } else {
        searchDropdown.innerHTML = '<div style="padding: 1rem; text-align: center; color: #666;">No results found</div>';
        searchDropdown.style.display = 'block';
    }
}

// Go to product
function goToProduct(productId) {
    const searchDropdown = document.getElementById('searchDropdown');
    if (searchDropdown) {
        searchDropdown.style.display = 'none';
    }
    openProductModal(productId);
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
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
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Admin access function
let adminClickCount = 0;
function adminAccess() {
    adminClickCount++;
    if (adminClickCount >= 3) {
        const password = prompt('Enter admin password:');
        if (password === 'Amits@12345') {
            window.location.href = 'admin.html';
        } else {
            alert('Incorrect password!');
        }
        adminClickCount = 0;
    }
}

// Scroll to products section
function scrollToProducts() {
    const productsSection = document.getElementById('products');
    if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Make functions globally available
window.filterByCategory = filterByCategory;
window.loadMoreProducts = loadMoreProducts;
window.addToCart = addToCart;
window.quickAddToCart = quickAddToCart;
window.openProductModal = openProductModal;
window.resetFilters = resetFilters;
window.searchProducts = searchProducts;
window.goToProduct = goToProduct;
window.adminAccess = adminAccess;
window.scrollToProducts = scrollToProducts;
window.filterByPrice = filterByPrice;
window.sortProducts = sortProducts;