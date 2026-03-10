// State Management
let currentUser = JSON.parse(localStorage.getItem('campusUser')) || null;
let items = [];
let currentFeedStatus = 'all'; // 'all' | 'lost' | 'found'

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    fetchItems();
    
    // Form Listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    document.getElementById('reportForm').addEventListener('submit', handleReport);
    
    // Image Preview Setup
    setupImagePreview();
});

// Navigation Logic
function showSection(sectionId) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    // Reset nav active state
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));

    if (sectionId === 'home') {
        const homeLink = document.getElementById('nav-home');
        if (homeLink) homeLink.classList.add('active');
    }
}
/*
// Helper for "pages" inside the feed (All / Lost / Found)
function showFeedByStatus(status) {
    currentFeedStatus = status || 'all';

    // Show the feed section
    showSection('feed');

    // Apply status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.value = currentFeedStatus === 'all' ? '' : currentFeedStatus;
        filterItems();
    }

    // Update nav active state for sub-pages
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    if (currentFeedStatus === 'lost') {
        const lostLink = document.getElementById('nav-lost');
        if (lostLink) lostLink.classList.add('active');
    } else if (currentFeedStatus === 'found') {
        const foundLink = document.getElementById('nav-found');
        if (foundLink) foundLink.classList.add('active');
    } else {
        const feedLink = document.getElementById('nav-feed');
        if (feedLink) feedLink.classList.add('active');
    }
}
*/
function showFeedByStatus(status) {
    currentFeedStatus = status || 'all';

    // Show feed section
    showSection('feed');

    const statusFilter = document.getElementById('statusFilter');

    if (statusFilter) {
        statusFilter.value = currentFeedStatus === 'all' ? '' : currentFeedStatus;
    }

    // Apply filter
    filterItems();

    // Update navbar active state
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));

    if (currentFeedStatus === 'lost') {
        document.getElementById('nav-lost').classList.add('active');
    } 
    else if (currentFeedStatus === 'found') {
        document.getElementById('nav-found').classList.add('active');
    } 
    else {
        document.getElementById('nav-feed').classList.add('active');
    }
}

function applyCurrentFeedView() {
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) statusFilter.value = currentFeedStatus === 'all' ? '' : currentFeedStatus;
    filterItems();
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    
    // Reset report form if closing report modal
    if (id === 'report-modal') {
        const form = document.getElementById('reportForm');
        const successAnim = document.getElementById('successAnimation');
        form.reset();
        removeImagePreview();
        form.style.display = 'block';
        if (successAnim) successAnim.style.display = 'none';
    }
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
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;

    if (!username || !email || !password) {
        alert('Please fill in all fields');
        return;
    }

    try {
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
            
            showToast("Welcome to CampusFinder 🚀");
        } else {
            alert(data.error || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('Network error. Please check if the server is running.');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }

    try {
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
            
            showToast("Login Successful 🎉");
        } else {
            alert(data.error || 'Invalid credentials');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Network error. Please check if the server is running.');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('campusUser');
    updateAuthUI();
    showSection('home');
}
/*
function checkAuthAndReport() {
    if (!currentUser) {
        alert('Please login to report an item.');
        openModal('login-modal');
    } else {
        openModal('report-modal');
    }
}
    */
   function checkAuthAndReport() {

    if (!currentUser) {

        openModal("authWarningModal");

    } else {

        openModal("report-modal");

    }

}
function openLoginFromWarning(){

    closeModal("authWarningModal");
    openModal("login-modal");

}

function openSignupFromWarning(){

    closeModal("authWarningModal");
    openModal("signup-modal");

}
function showToast(message) {

  const toast = document.getElementById("toast");
  const text = document.getElementById("toastMessage");

  text.innerText = message;

  toast.classList.add("show");

  setTimeout(()=>{
      toast.classList.remove("show");
  },3000);

}

// Image Preview Functionality
function setupImagePreview() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('reportImage');
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const uploadContent = document.getElementById('fileUploadContent');

    // Click to upload
    dropArea.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files[0]);
    });

    // Drag and drop
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('dragover');
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('dragover');
    });

    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    function handleFileSelect(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                uploadContent.style.display = 'none';
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select a valid image file.');
        }
    }
}

function removeImagePreview() {
    const preview = document.getElementById('imagePreview');
    const uploadContent = document.getElementById('fileUploadContent');
    const fileInput = document.getElementById('reportImage');
    
    preview.style.display = 'none';
    uploadContent.style.display = 'flex';
    fileInput.value = '';
}

async function handleReport(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('.submit-btn');
    const originalBtnText = submitBtn.innerHTML;
    
    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Posting...</span>';
    
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

    try {
        const res = await fetch('/api/items', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (data.success) {
            // Show success animation
            form.style.display = 'none';
            document.getElementById('successAnimation').style.display = 'block';
            
            // Reset form after 2 seconds
            setTimeout(() => {
                form.reset();
                removeImagePreview();
                form.style.display = 'block';
                document.getElementById('successAnimation').style.display = 'none';
                closeModal('report-modal');
                fetchItems();
                showSection('feed');
            }, 2000);
        } else {
            alert('Failed to report: ' + (data.error || 'Unknown error'));
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    } catch (error) {
        alert('Error: ' + error.message);
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

async function fetchItems() {
    const grid = document.getElementById('itemsGrid');
    grid.innerHTML = '<div class="loader"></div>';

    try {
        const res = await fetch('/api/items');
        if (!res.ok) {
            throw new Error('Failed to fetch items');
        }
        items = await res.json();
        applyCurrentFeedView();
    } catch (error) {
        console.error('Error fetching items:', error);
        grid.innerHTML = '<div class="no-items" style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-secondary);"><i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i><p style="font-size: 1.2rem;">Failed to load items. Please refresh the page.</p></div>';
    }
}

function renderItems(itemsList) {
    const grid = document.getElementById('itemsGrid');
    grid.innerHTML = '';

    if (itemsList.length === 0) {
        grid.innerHTML = '<div class="no-items" style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-secondary);"><i class="fas fa-search" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i><p style="font-size: 1.2rem;">No items found matching your criteria.</p></div>';
        return;
    }

    itemsList.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';
        
        // Format date
        const dateObj = new Date(item.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        // Get category emoji
        const categoryEmojis = {
            'Electronics': '📱',
            'Cards/ID': '🪪',
            'Documents': '📄',
            'Accessories': '👓',
            'Others': '📦'
        };
        const categoryEmoji = categoryEmojis[item.category] || '📦';
        
        card.innerHTML = `
            <div class="card-img">
                <img src="${item.image_url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=400'}" alt="${item.title}" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=400'">
                <span class="status-badge ${item.status}">${item.status}</span>
            </div>
            <div class="card-body">
                <h3>${categoryEmoji} ${item.title}</h3>
                <p>${item.description}</p>
                <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px;">
                    <span class="location-tag">
                        <i class="fas fa-map-marker-alt"></i>
                        ${item.location}
                    </span>
                    <span class="date-tag">
                        <i class="fas fa-calendar"></i>
                        ${formattedDate}
                    </span>
                </div>
                <div class="card-meta">
                    <div class="card-meta-item">
                        <i class="fas fa-user"></i>
                        <span>${item.reporter_name || 'Anonymous'}</span>
                    </div>
                    <div class="card-meta-item">
                        <i class="fas fa-phone"></i>
                        <span>${item.contact_info || 'N/A'}</span>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="view-details-btn" onclick="viewItemDetails('${item.id}')">
                        <i class="fas fa-eye"></i>
                        <span>View Details</span>
                    </button>
                    ${currentUser && currentUser.id === item.reporter_id ? 
                        `<button class="btn-primary full" style="margin-top:10px; background:var(--success); border:none;" onclick="event.stopPropagation(); resolveItem('${item.id}')">
                            <i class="fas fa-check-circle"></i> Mark as Resolved
                        </button>` : ''}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function viewItemDetails(itemId) {

  const item = items.find(i => i.id == itemId);
  if (!item) return;

  document.getElementById("detailsImage").src =
    item.image_url || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64";

  document.getElementById("detailsTitle").innerText = item.title;
  document.getElementById("detailsDescription").innerText = item.description;
  document.getElementById("detailsCategory").innerText = item.category;
  document.getElementById("detailsStatus").innerText = item.status;
  document.getElementById("detailsLocation").innerText = item.location;
  document.getElementById("detailsDate").innerText = item.date;
  document.getElementById("detailsContact").innerText = item.contact_info;
  document.getElementById("detailsReporter").innerText =
    item.reporter_name || "Anonymous";

  document.getElementById("itemDetailsModal").style.display = "flex";
}
function closeItemDetails() {
  document.getElementById("itemDetailsModal").style.display = "none";
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
