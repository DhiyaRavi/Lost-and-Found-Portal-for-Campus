// State Management
let currentUser = JSON.parse(localStorage.getItem('campusUser')) || null;
let items = [];

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    fetchItems();
    
    // Form Listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    document.getElementById('reportForm').addEventListener('submit', handleReport);
});

// Navigation Logic
function showSection(sectionId) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    if (sectionId === 'feed') document.getElementById('nav-feed').classList.add('active');
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// Auth UI Updates
function updateAuthUI() {
    const authLinks = document.getElementById('auth-links');
    const userProfile = document.getElementById('user-profile');
    const userDisplay = document.getElementById('user-display');

    if (currentUser) {
        authLinks.classList.add('hidden');
        userProfile.classList.remove('hidden');
        userDisplay.innerText = `Hi, ${currentUser.username}`;
    } else {
        authLinks.classList.remove('hidden');
        userProfile.classList.add('hidden');
    }
}

// API Functions
async function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();
    if (data.success) {
        currentUser = data.user;
        localStorage.setItem('campusUser', JSON.stringify(currentUser));
        updateAuthUI();
        closeModal('signup-modal');
        alert('Welcome to CampusFinder!');
    } else {
        alert(data.error);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.success) {
        currentUser = data.user;
        localStorage.setItem('campusUser', JSON.stringify(currentUser));
        updateAuthUI();
        closeModal('login-modal');
    } else {
        alert(data.error);
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('campusUser');
    updateAuthUI();
    showSection('home');
}

function checkAuthAndReport() {
    if (!currentUser) {
        alert('Please login to report an item.');
        openModal('login-modal');
    } else {
        openModal('report-modal');
    }
}

async function handleReport(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', document.getElementById('reportTitle').value);
    formData.append('description', document.getElementById('reportDescription').value);
    formData.append('category', document.getElementById('reportCategory').value);
    formData.append('location', document.getElementById('reportLocation').value);
    formData.append('date', document.getElementById('reportDate').value);
    formData.append('status', document.getElementById('reportStatus').value);
    formData.append('contact_info', document.getElementById('reportContact').value);
    formData.append('reporter_id', currentUser.id);
    
    const imageFile = document.getElementById('reportImage').files[0];
    if (imageFile) formData.append('image', imageFile);

    const res = await fetch('/api/items', {
        method: 'POST',
        body: formData
    });

    const data = await res.json();
    if (data.success) {
        alert('Reported successfully!');
        closeModal('report-modal');
        fetchItems();
        showSection('feed');
    } else {
        alert('Failed to report');
    }
}

async function fetchItems() {
    const grid = document.getElementById('itemsGrid');
    grid.innerHTML = '<div class="loader"></div>';

    const res = await fetch('/api/items');
    items = await res.json();
    renderItems(items);
}

function renderItems(itemsList) {
    const grid = document.getElementById('itemsGrid');
    grid.innerHTML = '';

    if (itemsList.length === 0) {
        grid.innerHTML = '<p class="no-items">No items found matching your criteria.</p>';
        return;
    }

    itemsList.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div class="card-img">
                <img src="${item.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}" alt="${item.title}">
                <span class="status-badge ${item.status}">${item.status}</span>
            </div>
            <div class="card-body">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <div class="card-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${item.location}</span>
                    <span><i class="fas fa-calendar"></i> ${item.date}</span>
                </div>
                <div class="card-meta" style="margin-top: 10px; color: var(--primary);">
                    <span><i class="fas fa-user"></i> ${item.reporter_name}</span>
                    <span><i class="fas fa-phone"></i> ${item.contact_info}</span>
                </div>
                ${currentUser && currentUser.id === item.reporter_id ? 
                    `<button class="btn-primary full" style="margin-top:15px; background:var(--success);" onclick="resolveItem('${item.id}')">Mark as Resolved</button>` : ''}
            </div>
        `;
        grid.appendChild(card);
    });
}

async function resolveItem(id) {
    if (!confirm('Reclaimed or resolved?')) return;
    const res = await fetch(`/api/items/${id}/resolve`, { method: 'PATCH' });
    if (res.ok) {
        fetchItems();
    }
}

function filterItems() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;
    const category = document.getElementById('categoryFilter').value;

    const filtered = items.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(search) || item.description.toLowerCase().includes(search);
        const matchesStatus = !status || item.status === status;
        const matchesCategory = !category || item.category === category;
        return matchesSearch && matchesStatus && matchesCategory;
    });

    renderItems(filtered);
}
