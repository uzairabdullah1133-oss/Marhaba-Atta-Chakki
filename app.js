// State Management
const STATE = {
    products: JSON.parse(localStorage.getItem('mac_products')) || [
        { id: 1, name: "Premium Chakki Atta", price: 130, quantity: 100, category: "Flour", image: "https://placehold.co/400x300?text=Atta" },
        { id: 2, name: "Super Basmati Rice", price: 350, quantity: 50, category: "Rice", image: "https://placehold.co/400x300?text=Rice" },
        { id: 3, name: "Pure Desi Ghee", price: 1200, quantity: 20, category: "Oil/Ghee", image: "https://placehold.co/400x300?text=Ghee" },
        { id: 4, name: "Daal Chana", price: 240, quantity: 60, category: "Pulses", image: "https://placehold.co/400x300?text=Daal" }
    ],
    cart: [],
    sales: JSON.parse(localStorage.getItem('mac_sales')) || [],
    complaints: JSON.parse(localStorage.getItem('mac_complaints')) || [],
    owner: JSON.parse(localStorage.getItem('mac_owner')) || {
        name: "Malik Zeeshan",
        username: "malik.zeeshan7676@marhabastore.com",
        password: "malik.zeeshan7676",
        photo: "https://placehold.co/150x150?text=MZ",
        bio: "Dedicated to providing the freshest grocery items to our community. Quality is our promise."
    },
    loginLogs: JSON.parse(localStorage.getItem('mac_login_logs')) || [], // Security auditing,
    // Migrated to array for dynamic management
    paymentAccounts: JSON.parse(localStorage.getItem('mac_accounts')) || [
        { id: 'jazzcash', type: 'JazzCash', title: "JazzCash", number: "0300-1234567", holder: "Malik Zeeshan", active: true },
        { id: 'easypaisa', type: 'EasyPaisa', title: "EasyPaisa", number: "0311-9876543", holder: "Malik Zeeshan", active: true },
        { id: 'bank', type: 'Bank Transfer', title: "Meezan Bank", number: "0101-0101-0101", holder: "Marhaba Enterprises", active: true }
    ],
    myOrders: JSON.parse(localStorage.getItem('mac_my_orders')) || []
};

let state_editingId = null;
let authTargetView = 'owner';

// Utilities
const saveToStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const formatCurrency = (amount) => `PKR ${amount.toLocaleString()}`;
const getTodayDate = () => new Date().toISOString().split('T')[0];

const readFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// Navigation
function navigateTo(view) {
    // Guard for protected views
    if (view === 'owner' || view === 'manager') {
        authTargetView = view;
        const isAuth = sessionStorage.getItem('mac_auth_token');
        if (!isAuth) {
            renderOwnerLogin();
            updateNavState(view);
            return;
        } else {
            // Session exists, but require Re-Authentication for security
            showReAuthModal();
            updateNavState(view);
            return;
        }
    }

    // Render View
    const main = document.getElementById('main-content');
    main.innerHTML = ''; // Clear current content

    if (view === 'home') renderHome();
    else if (view === 'customer') renderCustomer();
    // Protected views are handled above
}

function checkAuth() {
    const isAuth = sessionStorage.getItem('mac_auth_token');
    if (!isAuth) {
        renderOwnerLogin();
        // Ensure nav state reflects we are in a 'login' mode or keep previous
        return false;
    }
    return true;
}

function handleProfileSettings() {
    if (checkAuth()) {
        navigateTo('owner');
    } else {
        // Highlighting Owner tab to indicate context
        updateNavState('owner');
    }
}

function updateNavState(view) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.querySelector(`.nav-btn[onclick="navigateTo('${view}')"]`);
    if (btn) btn.classList.add('active');
}

function renderOwnerLogin() {
    const main = document.getElementById('main-content');
    const title = authTargetView === 'manager' ? 'Manager Access' : 'Owner Access';
    main.innerHTML = `
        <div style="max-width: 400px; margin: 4rem auto; padding: 2rem; background: var(--surface); border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); text-align: center;">
            <div style="width: 80px; height: 80px; background: var(--primary-bg); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                <i class="fa-solid fa-user-shield" style="font-size: 2rem; color: var(--primary-color);"></i>
            </div>
            <h2 style="margin-bottom: 0.5rem; color: var(--primary-color);">${title}</h2>
            <p style="color: var(--text-muted); margin-bottom: 2rem;">Please verify your identity to continue.</p>
            
            <form onsubmit="attemptLogin(event)">
                <div class="form-group" style="text-align: left;">
                    <label>Username</label>
                    <div style="position: relative;">
                        <i class="fa-solid fa-user" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
                        <input type="text" name="username" class="form-control" style="padding-left: 45px;" required placeholder="Enter username">
                    </div>
                </div>
                <div class="form-group" style="text-align: left;">
                    <label>Password</label>
                     <div style="position: relative;">
                        <i class="fa-solid fa-lock" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
                        <input type="password" name="password" class="form-control" style="padding-left: 45px;" required placeholder="Enter password">
                    </div>
                </div>
                <button type="submit" class="btn btn-primary" style="margin-top: 1rem;">
                    Secure Login <i class="fa-solid fa-arrow-right" style="margin-left: 8px;"></i>
                </button>
            </form>
            <div style="margin-top: 1.5rem; font-size: 0.85rem; color: var(--text-muted);">
                <i class="fa-solid fa-shield-halved"></i> Protected by Marhaba Security
            </div>
        </div>
    `;
}

function attemptLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const u = formData.get('username');
    const p = formData.get('password');

    if (u === STATE.owner.username && p === STATE.owner.password) {
        // Success
        const token = Date.now().toString() + Math.random().toString();
        sessionStorage.setItem('mac_auth_token', token);

        // Log it
        STATE.loginLogs.unshift({
            date: new Date().toLocaleString(),
            ip: "Session: " + token.substring(0, 8),
            status: "Success"
        });
        saveToStorage('mac_login_logs', STATE.loginLogs);

        // Direct render to bypass Re-Auth check since we just logged in
        if (authTargetView === 'manager') {
            renderManager();
        } else if (authTargetView === 'notifications') {
            renderOwner();
            showNotificationsModal();
        } else {
            renderOwner();
        }
        updateNavState(authTargetView === 'notifications' ? 'owner' : authTargetView);
        // Update logout button in header
        toggleProfileDropdown();
    } else {
        // Fail
        STATE.loginLogs.unshift({
            date: new Date().toLocaleString(),
            ip: "Unknown",
            status: "Failed Attempt"
        });
        saveToStorage('mac_login_logs', STATE.loginLogs);
        alert("Invalid Credentials! Access Denied.");
    }
}

function logout() {
    sessionStorage.removeItem('mac_auth_token');
    alert("Logged out successfully.");
    navigateTo('home');
}

// Re-Authentication System
function showReAuthModal() {
    const main = document.getElementById('main-content');
    // Keep generic background or placeholder while modal shows
    main.innerHTML = '<div style="height: 80vh; display: flex; align-items: center; justify-content: center; color: var(--text-muted);">Verifying Identity...</div>';

    const modalHtml = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 2500;">
            <div style="background: white; padding: 2rem; border-radius: 16px; width: 90%; max-width: 400px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <div style="width: 60px; height: 60px; background: #e3f2fd; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: #1976d2; font-size: 1.5rem;">
                    <i class="fa-solid fa-fingerprint"></i>
                </div>
                <h2 style="margin-bottom: 0.5rem; color: var(--text-main);">Verify Identity</h2>
                <p style="color: var(--text-muted); margin-bottom: 1.5rem; font-size: 0.95rem;">
                    For security reasons, please confirm your password to access Owner settings.
                </p>
                
                <form onsubmit="processReAuth(event)">
                    <div class="form-group" style="text-align: left;">
                        <label>Password</label>
                        <input type="password" name="password" class="form-control" placeholder="Enter owner password" required autofocus>
                    </div>
                    <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem;">
                        Verify & Access
                    </button>
                    <button type="button" class="btn" style="margin-top: 0.5rem; background: transparent; color: var(--text-muted);" onclick="document.getElementById('reauth-modal-container').innerHTML = ''; navigateTo('home');">
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    `;
    // Create specific container for re-auth if needed, or append to body, but duplicating modal usage
    // Using a temp div to ensure it doesn't conflict with main content replace
    let modalContainer = document.getElementById('reauth-modal-container');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'reauth-modal-container';
        document.body.appendChild(modalContainer);
    }
    modalContainer.innerHTML = modalHtml;
}

function processReAuth(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const p = formData.get('password');

    if (p === STATE.owner.password) {
        // Success
        document.getElementById('reauth-modal-container').innerHTML = '';

        // Log Success
        STATE.loginLogs.unshift({
            date: new Date().toLocaleString(),
            ip: "Re-Auth",
            status: "Success"
        });
        saveToStorage('mac_login_logs', STATE.loginLogs);

        if (authTargetView === 'manager') {
            renderManager();
        } else if (authTargetView === 'notifications') {
            renderOwner();
            showNotificationsModal();
        } else {
            renderOwner();
        }
    } else {
        // Fail
        STATE.loginLogs.unshift({
            date: new Date().toLocaleString(),
            ip: "Re-Auth",
            status: "Failed"
        });
        saveToStorage('mac_login_logs', STATE.loginLogs);

        alert("Incorrect Password!");
    }
}

// ======================= Views =======================

function renderHome() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div class="section active hero">
            <h1>Welcome to Marhaba Atta Chakki</h1>
            <p>Your one-stop shop for fresh groceries and daily essentials.</p>
            <button onclick="navigateTo('customer')" class="cta-btn">Start Shopping <i class="fa-solid fa-arrow-right"></i></button>
        </div>
        
        <h2 style="margin-bottom: 1rem;">Featured Products</h2>
        <div class="card-grid">
            ${STATE.products.slice(0, 3).map(p => `
                <div class="card">
                    <img src="${p.image}" alt="${p.name}" class="product-img">
                    <div class="product-title">${p.name}</div>
                    <div class="product-meta">${p.category}</div>
                    <div class="product-price">${formatCurrency(p.price)}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderCustomer() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div class="section active">
            <h2 style="margin-bottom: 2rem;">Shop Groceries</h2>
            <div class="card-grid" id="product-list">
                ${STATE.products.map(p => {
        const stockVal = parseFloat(p.quantity);
        const isOutOfStock = isNaN(stockVal) || stockVal <= 0;
        return `
                    <div class="card">
                        <img src="${p.image}" alt="${p.name}" class="product-img">
                        <div class="product-title">${p.name}</div>
                        <div class="product-meta">Stock: ${p.quantity}</div>
                        <div class="product-price">${formatCurrency(p.price)}</div>
                        <button onclick="addToCart(${p.id})" class="btn btn-primary" ${isOutOfStock ? 'disabled' : ''}>
                            ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'} <i class="fa-solid fa-cart-plus"></i>
                        </button>
                    </div>
                `}).join('')}
            </div>

            <div style="margin-top: 4rem; background: var(--white); padding: 2rem; border-radius: 12px; box-shadow: var(--shadow);">
                <h3><i class="fa-solid fa-comment-dots"></i> Submit a Complaint</h3>
                <p>We value your feedback. Let us know if you faced any issues.</p>
                <form onsubmit="submitComplaint(event)" style="margin-top: 1rem;">
                    <div class="form-group">
                        <label>Your Name</label>
                        <input type="text" id="comp-name" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Issue Description</label>
                        <textarea id="comp-desc" class="form-control" rows="3" required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Submit Complaint</button>
                </form>
            </div>
        </div>

        ${STATE.myOrders.length > 0 ? `
        <div style="margin-top: 2rem; background: var(--white); padding: 2rem; border-radius: 12px; box-shadow: var(--shadow);">
            <h3 style="margin-bottom: 1.5rem;"><i class="fa-solid fa-list-check"></i> My Orders</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Payment</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${STATE.myOrders.slice().reverse().map(orderId => {
            const order = STATE.sales.find(s => s.id == orderId);
            if (!order) return '';
            const statusColor = order.status === 'Confirmed' ? '#2e7d32' : (order.status === 'Rejected' ? '#c62828' : '#ef6c00');
            const statusBg = order.status === 'Confirmed' ? '#e8f5e9' : (order.status === 'Rejected' ? '#ffebee' : '#fff3e0');
            return `
                                <tr>
                                    <td>${order.date}</td>
                                    <td>${formatCurrency(order.total)}</td>
                                    <td>
                                        <span style="padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 500; background: ${statusBg}; color: ${statusColor};">
                                            ${order.status || 'Confirmed'}
                                        </span>
                                    </td>
                                    <td>${(() => {
                    // Try to find in current accounts
                    const acc = STATE.paymentAccounts.find(a => a.id == order.paymentMethod);
                    // Fallback for legacy or deleted accounts
                    return acc ? acc.title : (order.paymentMethod || 'Cash');
                })()}</td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        ` : ''}
        
        <!-- Floating Cart -->
        <div class="floating-cart" onclick="toggleCartModal()">
            <i class="fa-solid fa-cart-shopping"></i>
            <span class="cart-count" id="cart-count">${STATE.cart.reduce((a, b) => a + b.qty, 0)}</span>
        </div>
    `;
}

function renderManager() {
    // Calc stats
    const today = getTodayDate();
    // Filter only confirmed sales for stats (include legacy records with no status)
    const confirmedSales = STATE.sales.filter(s => !s.status || s.status === 'Confirmed');
    const todaySales = confirmedSales.filter(s => s.date === today);
    const totalRev = todaySales.reduce((a, b) => a + b.total, 0);
    const totalProfit = todaySales.reduce((a, b) => a + b.profit, 0);
    const itemsSold = todaySales.reduce((a, b) => a + b.itemsCount, 0);

    // Pending orders
    const pendingOrders = STATE.sales.filter(s => s.status === 'Pending');

    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div class="section active">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2 style="margin:0;">Manager Dashboard</h2>
                <button onclick="showNotificationsModal()" class="btn" style="position: relative; background: white; color: var(--text-main); border: 1px solid #ddd; padding: 0.5rem 1rem;">
                    <i class="fa-solid fa-bell"></i> Notifications
                    <span class="notif-badge" style="position: absolute; top: -5px; right: -5px; width: 12px; height: 12px; background: #ff4444; border-radius: 50%; display: ${STATE.complaints.filter(c => c.status === 'Pending').length > 0 ? 'block' : 'none'}; border: 2px solid white;"></span>
                </button>
            </div>
            
            <div class="stats-container">
                <div class="stat-card">
                    <div class="stat-value">${formatCurrency(totalRev)}</div>
                    <div class="stat-label">Today's Revenue</div>
                </div>
                <div class="stat-card" style="border-left-color: var(--secondary-color);">
                    <div class="stat-value">${formatCurrency(totalProfit)}</div>
                    <div class="stat-label">Today's Profit (Est. 20%)</div>
                </div>
                 <div class="stat-card" style="border-left-color: #2196F3;">
                    <div class="stat-value">${itemsSold}</div>
                    <div class="stat-label">Items Sold Today</div>
                </div>
                <div class="stat-card" style="border-left-color: #9C27B0;">
                    <div class="stat-value">${pendingOrders.length}</div>
                    <div class="stat-label">Pending Orders</div>
                </div>
            </div>

            ${pendingOrders.length > 0 ? `
            <div style="background: var(--white); padding: 1.5rem; border-radius: 12px; box-shadow: var(--shadow); margin-bottom: 2rem; border: 2px solid #ff9800;">
                <h3 style="margin-bottom: 1rem; color: #f57c00;"><i class="fa-solid fa-clock"></i> Pending Orders (Requires Confirmation)</h3>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Total</th>
                                <th>Method</th>
                                <th>Proof</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pendingOrders.map(Order => `
                                <tr>
                                    <td>${Order.date}</td>
                                    <td>${Order.customerName || 'Guest'}</td>
                                    <td>${formatCurrency(Order.total)}</td>
                                    <td>${Order.paymentMethod}</td>
                                    <td>
                                        <button onclick="viewProof('${Order.id}')" class="btn btn-primary" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;">View Image</button>
                                    </td>
                                    <td>
                                        <button onclick="confirmOrder('${Order.id}')" class="btn" style="background: var(--success); color: white; padding: 0.3rem 0.8rem; font-size: 0.8rem; display:inline-block; width: auto; margin-right: 5px;">Confirm</button>
                                        <button onclick="rejectOrder('${Order.id}')" class="btn" style="background: var(--danger); color: white; padding: 0.3rem 0.8rem; font-size: 0.8rem; display:inline-block; width: auto;">Reject</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : ''}

            <div style="background: var(--white); padding: 1.5rem; border-radius: 12px; box-shadow: var(--shadow); margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;">Manage Inventory</h3>
                <button onclick="showProductModal()" class="btn btn-primary" style="width: auto; margin-bottom: 1rem;">
                    <i class="fa-solid fa-plus"></i> Add New Item
                </button>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${STATE.products.map(p => `
                                <tr>
                                    <td>${p.name}</td>
                                    <td>${p.category}</td>
                                    <td>${formatCurrency(p.price)}</td>
                                    <td>${p.quantity}</td>
                                    <td>
                                        <button onclick="editProduct(${p.id})" style="color: blue; background:none; border:none; cursor:pointer; margin-right: 10px;"><i class="fa-solid fa-edit"></i></button>
                                        <button onclick="deleteProduct(${p.id})" style="color: red; background:none; border:none; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

             <div style="background: var(--white); padding: 1.5rem; border-radius: 12px; box-shadow: var(--shadow); margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;">Sales History</h3>
                 <div class="table-container" style="max-height: 300px; overflow-y: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                             ${STATE.sales.length === 0 ? '<tr><td colspan="4">No sales recorded yet.</td></tr>' :
            STATE.sales.slice().reverse().map(s => `
                                <tr>
                                    <td>${s.date}</td>
                                    <td>${s.itemsCount} items</td>
                                    <td>${formatCurrency(s.total)}</td>
                                    <td>
                                        <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.9rem; background: ${s.status === 'Confirmed' ? '#e8f5e9' : (s.status === 'Rejected' ? '#ffebee' : '#fff3e0')}; color: ${s.status === 'Confirmed' ? '#2e7d32' : (s.status === 'Rejected' ? '#c62828' : '#ef6c00')}">
                                            ${s.status || 'Confirmed'}
                                        </span>
                                    </td>
                                </tr>
                                `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

             <div style="background: var(--white); padding: 1.5rem; border-radius: 12px; box-shadow: var(--shadow);">
                <h3 style="margin-bottom: 1rem;">Customer Complaints</h3>
                 <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Issue</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                             ${STATE.complaints.length === 0 ? '<tr><td colspan="4">No complaints found.</td></tr>' :
            STATE.complaints.map(c => `
                                <tr>
                                    <td>${c.timestamp}</td>
                                    <td>${c.customerName}</td>
                                    <td>${c.issue}</td>
                                    <td><span style="padding: 4px 8px; background: #e0e0e0; border-radius: 4px;">${c.status}</span></td>
                                </tr>
                                `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderOwner() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div class="section active">
            <div class="profile-header" style="margin-bottom: 2rem; position: relative;">
                <button onclick="showNotificationsModal()" class="btn" style="position: absolute; top: 0; right: 0; background: white; color: var(--text-main); border: 1px solid #ddd; padding: 0.5rem 1rem; z-index: 10;">
                    <i class="fa-solid fa-bell"></i>
                    <span class="notif-badge" style="position: absolute; top: -5px; right: -5px; width: 12px; height: 12px; background: #ff4444; border-radius: 50%; display: ${STATE.complaints.filter(c => c.status === 'Pending').length > 0 ? 'block' : 'none'}; border: 2px solid white;"></span>
                </button>
                <div class="profile-img-container">
                    <img src="${STATE.owner.photo}" alt="Owner" class="profile-img">
                     <button onclick="triggerProfileUpload()" style="position: absolute; bottom: 0; right: 0; background: var(--secondary-color); border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer;"><i class="fa-solid fa-camera"></i></button>
                     <input type="file" id="owner-photo-input" hidden accept="image/*" onchange="updateProfilePic(this)">
                </div>
                <h1 class="profile-name">${STATE.owner.name}</h1>
                <div class="profile-role">Owner (Authenticated)</div>
                <p style="margin-top: 1rem; max-width: 600px; margin-left: auto; margin-right: auto;">${STATE.owner.bio}</p>
                <div style="margin-top: 1rem; display: flex; gap: 10px; justify-content: center; align-items: center;">
                     <span style="font-size: 0.9rem; color: var(--success); background: #e8f5e9; padding: 4px 12px; border-radius: 20px;">
                        <i class="fa-solid fa-check-circle"></i> Session Active
                     </span>
                     <button onclick="logout()" class="btn btn-danger" style="width: auto; padding: 4px 12px; font-size: 0.8rem; border-radius: 20px;">
                        <i class="fa-solid fa-sign-out-alt"></i> Logout
                     </button>
                </div>
                <div style="margin-top: 1rem;">
                    <button onclick="showCredentialsModal()" style="background: transparent; border: 1px solid var(--primary-color); color: var(--primary-color); padding: 5px 15px; border-radius: 20px; font-size: 0.85rem; cursor: pointer;">
                        <i class="fa-solid fa-key"></i> Change Login Details
                    </button>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                
                <!-- Accounts Section -->
                <div style="background: var(--white); padding: 1.5rem; border-radius: 12px; box-shadow: var(--shadow);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h3><i class="fa-solid fa-wallet"></i> Payment Accounts</h3>
                        <button onclick="manageAccount()" class="btn btn-primary" style="width: auto; padding: 0.5rem 1rem; font-size: 0.9rem;"><i class="fa-solid fa-plus"></i> Add</button>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${STATE.paymentAccounts.map(acc => `
                                    <tr>
                                        <td>
                                            <div style="font-weight: 600;">${acc.title}</div>
                                            <div style="font-size: 0.8rem; color: var(--text-light);">${acc.number}</div>
                                        </td>
                                        <td>
                                            <button onclick="toggleAccount('${acc.id}')" style="cursor: pointer; padding: 3px 10px; border-radius: 20px; border: none; font-size: 0.75rem; font-weight: 600; background: ${acc.active ? '#e8f5e9' : '#ffebee'}; color: ${acc.active ? '#2e7d32' : '#c62828'};">
                                                ${acc.active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td>
                                            <button onclick="manageAccount('${acc.id}')" style="color: blue; background:none; border:none; cursor:pointer;"><i class="fa-solid fa-edit"></i></button>
                                            <button onclick="deleteAccount('${acc.id}')" style="color: red; background:none; border:none; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Security Logs -->
                <div style="background: var(--white); padding: 1.5rem; border-radius: 12px; box-shadow: var(--shadow);">
                    <h3 style="margin-bottom: 1.5rem;"><i class="fa-solid fa-shield-cat"></i> Login Activity</h3>
                     <div class="table-container" style="max-height: 300px; overflow-y: auto;">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${STATE.loginLogs.slice(0, 10).map(log => `
                                    <tr>
                                        <td style="font-size: 0.85rem;">${log.date}</td>
                                        <td>
                                            <span style="font-size: 0.8rem; color: ${log.status === 'Success' ? 'var(--success)' : 'var(--danger)'};">
                                                ${log.status}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                     </div>
                </div>
            </div>
        </div>
    `;
}

// ======================= Logic & Actions =======================

// Customer Actions
function addToCart(productId) {
    const product = STATE.products.find(p => p.id === productId);
    const stockVal = parseFloat(product.quantity);

    if (product && !isNaN(stockVal) && stockVal > 0) {
        const existing = STATE.cart.find(item => item.id === productId);
        if (existing) {
            existing.qty++;
        } else {
            STATE.cart.push({ ...product, qty: 1 });
        }
        updateCartCount();
        alert(`${product.name} added to cart!`);
    } else {
        alert("Out of stock!");
    }
}

function updateCartCount() {
    const count = STATE.cart.reduce((a, b) => a + b.qty, 0);
    const badge = document.getElementById('cart-count');
    if (badge) badge.textContent = count;
}

function toggleCartModal() {
    const total = STATE.cart.reduce((a, b) => a + (b.price * b.qty), 0);
    const modalHtml = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 2000;">
            <div style="background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 500px;">
                <h2>Your Cart</h2>
                <div style="margin: 1rem 0; max-height: 300px; overflow-y: auto;">
                    ${STATE.cart.length === 0 ? '<p>Cart is empty.</p>' : STATE.cart.map(item => `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;">
                            <div>
                                <strong>${item.name}</strong><br>
                                ${item.qty} x ${formatCurrency(item.price)}
                            </div>
                            <div>
                                ${formatCurrency(item.price * item.qty)}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: bold; margin-bottom: 1rem;">
                    <span>Total:</span>
                    <span>${formatCurrency(total)}</span>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button onclick="document.getElementById('modal-container').innerHTML = ''" class="btn" style="background: #ccc;">Close</button>
                    ${STATE.cart.length > 0 ? `<button onclick="checkout()" class="btn btn-primary">Checkout</button>` : ''}
                </div>
            </div>
        </div>
    `;
    document.getElementById('modal-container').innerHTML = modalHtml;
}

function checkout() {
    if (STATE.cart.length === 0) return;
    showPaymentModal();
}

function showPaymentModal() {
    const total = STATE.cart.reduce((a, b) => a + (b.price * b.qty), 0);

    // Filter active accounts
    const activeAccounts = STATE.paymentAccounts.filter(a => a.active);

    const methodsHtml = activeAccounts.length > 0
        ? activeAccounts.map(acc => `<option value="${acc.id}">${acc.title}</option>`).join('')
        : '<option value="">No payment methods available</option>';

    const modalHtml = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 2000;">
            <div style="background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto;">
                <h2>Secure Checkout</h2>
                <div style="margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                    <strong>Total to Pay: ${formatCurrency(total)}</strong>
                </div>
                
                <form onsubmit="processOrder(event)">
                    <div class="form-group">
                        <label>Your Name</label>
                        <input type="text" name="customerName" class="form-control" required placeholder="Enter your full name">
                    </div>

                    <div class="form-group">
                        <label>Select Payment Method</label>
                        <select id="payment-method-select" name="paymentMethod" class="form-control" onchange="updatePaymentDetails()" required>
                            ${methodsHtml}
                        </select>
                    </div>

                    <div id="payment-details-box" style="background: #e3f2fd; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #90caf9;">
                        <!-- JS populates this -->
                    </div>

                    <div class="form-group">
                        <label>Upload Payment Screenshot/Receipt</label>
                        <input type="file" name="paymentProof" class="form-control" accept="image/*" required>
                        <small style="color: #666;">Please transfer the amount and attach the proof here.</small>
                    </div>

                    <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="btn" style="background: #ccc;">Cancel</button>
                        <button type="submit" class="btn btn-primary">Submit Order</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modalHtml;
    // Trigger initial details update
    setTimeout(updatePaymentDetails, 0);
}

function updatePaymentDetails() {
    const select = document.getElementById('payment-method-select');
    const box = document.getElementById('payment-details-box');
    if (select && box && select.value) {
        const accId = select.value;
        const acc = STATE.paymentAccounts.find(a => a.id == accId);
        if (acc) {
            box.innerHTML = `
                <p style="margin:0; color: #1565c0;">
                    <strong>${acc.title} (${acc.type})</strong><br>
                    Account No: <strong>${acc.number}</strong><br>
                    Holder: ${acc.holder}
                </p>`;
        }
    } else if (box) {
        box.innerHTML = '<p>No method selected</p>';
    }
}

async function processOrder(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const file = formData.get('paymentProof');

    if (!file || file.size === 0) {
        alert("Please upload the payment screenshot.");
        return;
    }

    let proofImage = "";
    try {
        proofImage = await readFile(file);
    } catch (err) {
        alert("Error reading image file.");
        return;
    }

    const total = STATE.cart.reduce((a, b) => a + (b.price * b.qty), 0);
    const profit = total * 0.20;
    const itemsCount = STATE.cart.reduce((a, b) => a + b.qty, 0);

    const saleRecord = {
        id: Date.now().toString(), // String ID for easier handling
        date: getTodayDate(),
        items: [...STATE.cart],
        total: total,
        profit: profit,
        itemsCount: itemsCount,
        status: 'Pending', // New Pending status
        customerName: formData.get('customerName'),
        paymentMethod: formData.get('paymentMethod'),
        paymentProof: proofImage
    };

    STATE.sales.push(saleRecord);
    saveToStorage('mac_sales', STATE.sales);

    // Save to local user history
    STATE.myOrders.push(saleRecord.id);
    saveToStorage('mac_my_orders', STATE.myOrders);

    // Update Stock (Reserve it)
    STATE.cart.forEach(cartItem => {
        const product = STATE.products.find(p => p.id === cartItem.id);
        if (product) {
            const currentStock = parseFloat(product.quantity);
            if (!isNaN(currentStock)) {
                // Preserve non-numeric characters (units) like "kg", " packs"
                const unitMatch = product.quantity.toString().match(/[a-zA-Z\s%]+$/);
                const unit = unitMatch ? unitMatch[0] : '';
                product.quantity = (currentStock - cartItem.qty) + unit;
            }
        }
    });
    saveToStorage('mac_products', STATE.products);

    STATE.cart = [];
    updateCartCount();
    document.getElementById('modal-container').innerHTML = '';

    alert("Order Placed Successfully! Please wait for Admin confirmation.");
    navigateTo('customer');
}

// Admin/Manager Workflow Actions
function viewProof(saleId) {
    const sale = STATE.sales.find(s => s.id == saleId);
    if (!sale || !sale.paymentProof) return;

    const modalHtml = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 2200;" onclick="this.remove()">
             <div style="max-width: 90%; max-height: 90%;">
                <img src="${sale.paymentProof}" style="max-width: 100%; max-height: 80vh; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                <p style="color: white; text-align: center; margin-top: 1rem;">Click anywhere to close</p>
             </div>
        </div>
    `;
    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div.firstElementChild);
}

function confirmOrder(saleId) {
    if (!confirm("Confirm this order and payment?")) return;

    const saleIndex = STATE.sales.findIndex(s => s.id == saleId);
    if (saleIndex > -1) {
        STATE.sales[saleIndex].status = 'Confirmed';
        saveToStorage('mac_sales', STATE.sales);
        renderManager();
        alert("Order Confirmed!");
    }
}

function rejectOrder(saleId) {
    if (!confirm("Reject this order? Stock will be returned.")) return;

    const saleIndex = STATE.sales.findIndex(s => s.id == saleId);
    if (saleIndex > -1) {
        const sale = STATE.sales[saleIndex];

        // Return stock
        sale.items.forEach(item => {
            const product = STATE.products.find(p => p.id === item.id);
            if (product) {
                product.quantity += item.qty;
            }
        });
        saveToStorage('mac_products', STATE.products);

        // Update status
        STATE.sales[saleIndex].status = 'Rejected';
        saveToStorage('mac_sales', STATE.sales);

        renderManager();
        alert("Order Rejected and Stock Returned.");
    }
}

function submitComplaint(e) {
    e.preventDefault();
    const name = document.getElementById('comp-name').value;
    const desc = document.getElementById('comp-desc').value;

    const complaint = {
        id: Date.now(),
        customerName: name,
        issue: desc,
        status: 'Pending',
        timestamp: new Date().toLocaleString()
    };

    STATE.complaints.push(complaint);
    saveToStorage('mac_complaints', STATE.complaints);
    updateNotificationBadge();
    alert("Complaint Submitted Successfully.");
    e.target.reset();
}

function showComplaintModal() {
    const modalHtml = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 2000;">
            <div style="background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 500px;">
                <h3><i class="fa-solid fa-comment-dots"></i> Submit a Complaint</h3>
                <p>We value your feedback. Let us know if you faced any issues.</p>
                <form onsubmit="processComplaintModal(event)" style="margin-top: 1rem;">
                    <div class="form-group">
                        <label>Your Name</label>
                        <input type="text" name="name" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Issue Description</label>
                        <textarea name="desc" class="form-control" rows="3" required></textarea>
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="btn" style="background: #ccc;">Cancel</button>
                        <button type="submit" class="btn btn-primary">Submit Complaint</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.getElementById('modal-container').innerHTML = modalHtml;
}

function processComplaintModal(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const desc = formData.get('desc');

    const complaint = {
        id: Date.now(),
        customerName: name,
        issue: desc,
        status: 'Pending',
        timestamp: new Date().toLocaleString()
    };

    STATE.complaints.push(complaint);
    saveToStorage('mac_complaints', STATE.complaints);
    updateNotificationBadge();
    alert("Complaint Submitted Successfully.");
    document.getElementById('modal-container').innerHTML = '';
}

function handleNotificationClick() {
    authTargetView = 'notifications';
    if (checkAuth()) {
        showNotificationsModal();
    }
}

function showNotificationsModal() {
    const pending = STATE.complaints.filter(c => c.status === 'Pending');
    const history = STATE.complaints.filter(c => c.status !== 'Pending');

    // Mark as viewed or similar could happen here, but we will just list them

    const modalHtml = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 2000;">
            <div style="background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
                    <h3 style="margin:0;"><i class="fa-solid fa-bell"></i> Notifications</h3>
                    <button onclick="document.getElementById('modal-container').innerHTML = ''" style="background:none; border:none; font-size:1.2rem; cursor:pointer;"><i class="fa-solid fa-times"></i></button>
                </div>

                <h4 style="color: var(--primary-color); border-bottom: 1px solid #eee; padding-bottom: 0.5rem; margin-bottom: 1rem;">
                    New Complaints <span style="background: #ff4444; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">${pending.length}</span>
                </h4>

                ${pending.length === 0 ? '<p style="color:#777; font-style:italic;">No new complaints.</p>' :
            pending.map(c => `
                        <div style="background: #fff3e0; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #ef6c00;">
                            <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem;">
                                <strong>${c.customerName}</strong>
                                <small style="color:#666;">${c.timestamp}</small>
                            </div>
                            <p style="margin-bottom: 0.5rem;">${c.issue}</p>
                            <div style="text-align: right;">
                                <button onclick="resolveComplaint(${c.id})" class="btn" style="padding: 4px 12px; font-size: 0.8rem; background: var(--success); color: white;">Mark Resolved</button>
                            </div>
                        </div>
                    `).join('')}

                <h4 style="color: #666; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; margin-bottom: 1rem; margin-top: 2rem;">
                    History
                </h4>
                 <div style="max-height: 200px; overflow-y: auto;">
                    ${history.length === 0 ? '<p style="color:#777;">No history.</p>' :
            history.map(c => `
                            <div style="padding: 0.8rem; border-bottom: 1px solid #f0f0f0;">
                                <div style="display:flex; justify-content:space-between;">
                                    <strong>${c.customerName}</strong>
                                    <span style="font-size:0.8rem; color:green;">Resolved</span>
                                </div>
                                <p style="color:#666; font-size:0.9rem; margin-top:0.3rem;">${c.issue}</p>
                            </div>
                        `).join('')}
                 </div>
            </div>
        </div>
    `;
    document.getElementById('modal-container').innerHTML = modalHtml;
}

function resolveComplaint(id) {
    const idx = STATE.complaints.findIndex(c => c.id === id);
    if (idx > -1) {
        STATE.complaints[idx].status = 'Resolved';
        saveToStorage('mac_complaints', STATE.complaints);
        updateNotificationBadge();
        showNotificationsModal(); // Refresh modal
    }
}

function updateNotificationBadge() {
    const pending = STATE.complaints.filter(c => c.status === 'Pending').length;
    const badges = document.querySelectorAll('.notif-badge');
    badges.forEach(badge => {
        if (pending > 0) {
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    });
}


// Manager Actions
function deleteProduct(id) {
    if (confirm("Are you sure you want to delete this product?")) {
        STATE.products = STATE.products.filter(p => p.id !== id);
        saveToStorage('mac_products', STATE.products);
        renderManager();
    }
}

function showProductModal(product = null) {
    state_editingId = product ? product.id : null;

    // Default values
    const vals = product || { name: '', category: '', price: '', quantity: '', image: '' };

    const modalHtml = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 2000;">
            <div style="background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 500px;">
                <h2>${product ? 'Edit Product' : 'Add Product'}</h2>
                <form onsubmit="saveProduct(event)">
                    <div class="form-group">
                        <label>Name</label>
                        <input type="text" name="name" class="form-control" value="${vals.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                         <input type="text" name="category" class="form-control" value="${vals.category}" required>
                    </div>
                    <div class="form-group">
                        <label>Price</label>
                         <input type="number" name="price" class="form-control" value="${vals.price}" required>
                    </div>
                    <div class="form-group">
                        <label>Quantity (e.g. 50 kg)</label>
                         <input type="text" name="quantity" class="form-control" value="${vals.quantity}" required placeholder="50 kg">
                    </div>
                    <div class="form-group">
                        <label>Product Image</label>
                        <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 5px;">
                            <img src="${vals.image}" alt="Preview" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd;">
                            <input type="file" id="img-file" accept="image/*" class="form-control" style="padding: 0.5rem;">
                        </div>
                        <input type="hidden" name="existing_image" value="${vals.image}">
                        <small style="color: #666;">Upload a new image to replace the current one.</small>
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="btn" style="background: #ccc;">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.getElementById('modal-container').innerHTML = modalHtml;
}

function editProduct(id) {
    const product = STATE.products.find(p => p.id === id);
    if (product) {
        showProductModal(product);
    }
}

async function saveProduct(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const fileInput = document.getElementById('img-file');

    let finalImage = formData.get('existing_image') || "https://placehold.co/400x300?text=Item";

    // If file is selected, read it
    if (fileInput.files && fileInput.files[0]) {
        try {
            finalImage = await readFile(fileInput.files[0]);
        } catch (err) {
            console.error("Error reading file", err);
            alert("Failed to upload image.");
            return;
        }
    }

    const productData = {
        name: formData.get('name'),
        category: formData.get('category'),
        price: Number(formData.get('price')),
        quantity: formData.get('quantity'), // Store as string to allow units
        image: finalImage
    };

    if (state_editingId) {
        // Update existing
        const index = STATE.products.findIndex(p => p.id === state_editingId);
        if (index > -1) {
            STATE.products[index] = { ...STATE.products[index], ...productData };
        }
    } else {
        // Create new
        const newProduct = {
            id: Date.now(),
            ...productData
        };
        STATE.products.push(newProduct);
    }

    saveToStorage('mac_products', STATE.products);
    document.getElementById('modal-container').innerHTML = '';
    renderManager();
}

// Owner Actions
function triggerProfileUpload() {
    if (checkAuth()) {
        document.getElementById('owner-photo-input').click();
    }
}

async function updateProfilePic(input) {
    if (!checkAuth()) return; // Security check

    if (input.files && input.files[0]) {
        try {
            const base64 = await readFile(input.files[0]);
            STATE.owner.photo = base64;
            saveToStorage('mac_owner', STATE.owner);
            renderOwner();
            updateNavProfile(); // Use new function
        } catch (err) {
            console.error(err);
            alert("Failed to update profile picture.");
        }
    }
}

function showCredentialsModal() {
    if (!checkAuth()) return;

    const p = document.createElement('div');
    p.id = 'cred-modal-container';
    p.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 3000;">
            <div style="background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 450px;">
                <h2 style="margin-bottom: 1rem; color: var(--primary-color);">Change Login Details</h2>
                <form onsubmit="processCredentialsUpdate(event)">
                    <h4 style="margin-bottom: 0.5rem; color: var(--text-muted);">Current Credentials (Required)</h4>
                    <div class="form-group">
                        <input type="text" name="oldUser" class="form-control" placeholder="Current Email/Username" required>
                    </div>
                    <div class="form-group">
                        <input type="password" name="oldPass" class="form-control" placeholder="Current Password" required>
                    </div>

                    <h4 style="margin-top: 1.5rem; margin-bottom: 0.5rem; color: var(--text-muted);">New Credentials</h4>
                    <div class="form-group">
                        <input type="text" name="newUser" class="form-control" placeholder="New Email/Username" required>
                    </div>
                    <div class="form-group">
                        <input type="password" name="newPass" class="form-control" placeholder="New Password" required>
                    </div>

                    <button type="submit" class="btn btn-primary">Update Securely</button>
                    <button type="button" class="btn" style="margin-top: 0.5rem; background: #eee;" onclick="document.getElementById('cred-modal-container').remove()">Cancel</button>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(p);
}

function processCredentialsUpdate(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const oldU = fd.get('oldUser');
    const oldP = fd.get('oldPass');
    const newU = fd.get('newUser');
    const newP = fd.get('newPass');

    // Verify Old
    if (oldU !== STATE.owner.username || oldP !== STATE.owner.password) {
        alert("Verification Failed! Incorrect current username or password.");
        return;
    }

    // Update
    STATE.owner.username = newU;
    STATE.owner.password = newP;
    saveToStorage('mac_owner', STATE.owner);

    alert("Credentials updated successfully! Please login again.");
    document.getElementById('cred-modal-container').remove();
    logout(); // Force re-login
}

// Payment Account Management
function manageAccount(id = null) {
    if (!checkAuth()) {
        updateNavState('owner'); // Switch nav highlight
        return;
    }

    const account = id ? STATE.paymentAccounts.find(a => a.id == id) : null;
    const isEdit = !!account;
    const vals = account || { type: 'JazzCash', title: '', number: '', holder: '' };

    const modalHtml = `
         <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 2000;">
            <div style="background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 500px;">
                <h2>${isEdit ? 'Edit Account' : 'Add Account'}</h2>
                <form onsubmit="saveAccountDetails(event, '${id || ''}')">
                    <div class="form-group">
                        <label>Account Type</label>
                        <select name="type" class="form-control" required>
                            <option value="JazzCash" ${vals.type === 'JazzCash' ? 'selected' : ''}>JazzCash</option>
                            <option value="EasyPaisa" ${vals.type === 'EasyPaisa' ? 'selected' : ''}>EasyPaisa</option>
                            <option value="Bank Transfer" ${vals.type === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
                            <option value="Other" ${vals.type === 'Other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Title / Name</label>
                        <input type="text" name="title" class="form-control" value="${vals.title}" required placeholder="e.g. My JazzCash">
                    </div>
                    <div class="form-group">
                        <label>Account Number / IBAN</label>
                        <input type="text" name="number" class="form-control" value="${vals.number}" required placeholder="e.g. 0300-1234567">
                    </div>
                    <div class="form-group">
                        <label>Account Holder Name</label>
                         <input type="text" name="holder" class="form-control" value="${vals.holder}" required placeholder="e.g. Malik Zeeshan">
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="btn" style="background: #ccc;">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Account</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.getElementById('modal-container').innerHTML = modalHtml;
}

function saveAccountDetails(e, id) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        type: formData.get('type'),
        title: formData.get('title'),
        number: formData.get('number'),
        holder: formData.get('holder'),
    };

    if (id) {
        // Update
        const idx = STATE.paymentAccounts.findIndex(a => a.id == id);
        if (idx > -1) {
            STATE.paymentAccounts[idx] = { ...STATE.paymentAccounts[idx], ...data };
        }
    } else {
        // Create
        STATE.paymentAccounts.push({
            id: Date.now().toString(),
            active: true,
            ...data
        });
    }

    saveToStorage('mac_accounts', STATE.paymentAccounts);
    document.getElementById('modal-container').innerHTML = '';
    renderOwner();
}

function toggleAccount(id) {
    const idx = STATE.paymentAccounts.findIndex(a => a.id == id);
    if (idx > -1) {
        STATE.paymentAccounts[idx].active = !STATE.paymentAccounts[idx].active;
        saveToStorage('mac_accounts', STATE.paymentAccounts);
        renderOwner();
    }
}

function deleteAccount(id) {
    if (confirm("Are you sure you want to delete this account?")) {
        STATE.paymentAccounts = STATE.paymentAccounts.filter(a => a.id != id);
        saveToStorage('mac_accounts', STATE.paymentAccounts);
        renderOwner();
    }
}

// Init
window.onload = () => {
    // Force update credentials to ensure they apply over existing local storage data
    STATE.owner.username = "malik.zeeshan7676@marhabastore.com";
    STATE.owner.password = "malik.zeeshan7676";
    saveToStorage('mac_owner', STATE.owner);

    navigateTo('home');
    updateNavProfile(); // Sync nav profile
    updateNotificationBadge();
    saveToStorage('mac_products', STATE.products);
};

function updateNavProfile() {
    const img = document.getElementById('nav-profile-img');
    const name = document.getElementById('nav-profile-name');
    if (img) img.src = STATE.owner.photo;
    if (name) name.textContent = STATE.owner.name;
}

function toggleProfileDropdown() {
    // Optional JS toggle for mobile interactions if hover isn't enough
    // CSS handles hover state, but we can add a class if needed
    // For now, rely on CSS hover
}

// Developer Info
function showDeveloperModal() {
    const modalHtml = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 3000; backdrop-filter: blur(5px);">
            <div style="background: white; padding: 0; border-radius: 20px; width: 90%; max-width: 450px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.2);">
                <div style="background: linear-gradient(135deg, #2c3e50, #4ca1af); padding: 3rem 2rem; text-align: center; color: white;">
                    <img src="developer.png" alt="Abdullah Malik" style="width: 100px; height: 100px; border-radius: 50%; border: 4px solid rgba(255,255,255,0.3); object-fit: cover; margin: 0 auto 1.5rem; display: block; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                    <h2 style="margin-bottom: 0.5rem; font-size: 1.8rem;">Abdullah Malik</h2>
                    <p style="font-size: 1rem; opacity: 0.9; letter-spacing: 1px;">Software Engineer</p>
                </div>
                <div style="padding: 2.5rem 2rem;">
                    <p style="text-align: center; color: #555; margin-bottom: 2rem; font-size: 1.05rem; line-height: 1.6;">
                        This website was developed by <strong>Abdullah Malik</strong>, a Software Engineer.
                    </p>
                    
                    <div style="background: #f8f9fa; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;">
                        <h4 style="margin-bottom: 1rem; color: #2c3e50; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">Expertise</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.8rem;">
                            <span style="background: #e3f2fd; color: #1565c0; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 500;">Full Stack Web Development</span>
                            <span style="background: #e8f5e9; color: #2e7d32; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 500;">Full Stack Software Development</span>
                        </div>
                    </div>

                    <div style="margin-bottom: 2rem;">
                        <h4 style="margin-bottom: 1rem; color: #2c3e50; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">Contact Information</h4>
                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 0.8rem; color: #444;">
                            <div style="width: 36px; height: 36px; background: #eee; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary-color);">
                                <i class="fa-solid fa-phone"></i>
                            </div>
                            <span style="font-weight: 500;">0314-0408651</span>
                        </div>
                         <div style="display: flex; align-items: center; gap: 15px; color: #444;">
                            <div style="width: 36px; height: 36px; background: #eee; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--secondary-color);">
                                <i class="fa-solid fa-envelope"></i>
                            </div>
                            <span style="font-weight: 500;">uzair.abdullah1133@gmail.com</span>
                        </div>
                    </div>

                    <button onclick="document.getElementById('modal-container').innerHTML = ''" class="btn" style="background: #2c3e50; color: white;">Close</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('modal-container').innerHTML = modalHtml;
}
