// Check authentication on page load
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
            const data = await response.json();
            if (data.user) {
                if (data.user.type === 'admin') {
                    window.location.href = '/admin';
                } else if (data.user.type === 'customer') {
                    window.location.href = '/customer';
                }
            }
        }
    } catch (error) {
        console.error('Auth check error:', error);
    }
}

// Show modals
function showAdminLogin() {
    const modal = new bootstrap.Modal(document.getElementById('adminLoginModal'));
    modal.show();
}

function showCustomerLogin() {
    const modal = new bootstrap.Modal(document.getElementById('customerLoginModal'));
    modal.show();
}

function showCustomerRegister() {
    const modal = new bootstrap.Modal(document.getElementById('customerRegisterModal'));
    modal.show();
}

// Admin Login
document.getElementById('adminLoginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    try {
        const response = await fetch('/api/auth/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Login successful!');
            window.location.href = '/admin';
        } else {
            alert('Error: ' + (data.error || 'Login failed'));
        }
    } catch (error) {
        alert('Network Error: ' + error.message + '. Please check if server is running.');
    }
});

// Customer Login
document.getElementById('customerLoginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('customerUsername').value;
    const password = document.getElementById('customerPassword').value;

    try {
        const response = await fetch('/api/auth/customer/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Login successful!');
            window.location.href = '/customer';
        } else {
            alert('Error: ' + (data.error || 'Login failed'));
        }
    } catch (error) {
        alert('Network Error: ' + error.message + '. Please check if server is running.');
    }
});

// Customer Register
document.getElementById('customerRegisterForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
        username: document.getElementById('regUsername').value,
        password: document.getElementById('regPassword').value,
        fullName: document.getElementById('regFullName').value,
        email: document.getElementById('regEmail').value,
        phone: document.getElementById('regPhone').value,
        address: document.getElementById('regAddress').value
    };

    try {
        const response = await fetch('/api/auth/customer/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (response.ok) {
            alert('Registration successful! Please login.');
            bootstrap.Modal.getInstance(document.getElementById('customerRegisterModal')).hide();
            showCustomerLogin();
        } else {
            alert('Error: ' + (data.error || 'Registration failed'));
        }
    } catch (error) {
        alert('Network Error: ' + error.message + '. Please check if server is running.');
    }
});

// Check auth on page load
if (window.location.pathname === '/') {
    checkAuth();
}

