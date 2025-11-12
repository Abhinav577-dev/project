// Show summary
async function showSummary() {
    try {
        const response = await fetch('/api/board/summary');
        const data = await response.json();

        document.getElementById('content').innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h4>Electricity Board Summary</h4>
                </div>
                <div class="card-body">
                    <div class="mb-4">
                        <h5>Board Information</h5>
                        <p><strong>Board ID:</strong> ${data.board.board_id || 'N/A'}</p>
                        <p><strong>Board Name:</strong> ${data.board.board_name || 'N/A'}</p>
                    </div>
                    <div class="row">
                        <div class="col-md-3">
                            <div class="card bg-primary text-white mb-3">
                                <div class="card-body">
                                    <h5>Total Admins</h5>
                                    <h2>${data.admins}</h2>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-success text-white mb-3">
                                <div class="card-body">
                                    <h5>Total Customers</h5>
                                    <h2>${data.customers}</h2>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-info text-white mb-3">
                                <div class="card-body">
                                    <h5>Total Revenue</h5>
                                    <h2>₹${data.totalRevenue.toFixed(2)}</h2>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-warning text-white mb-3">
                                <div class="card-body">
                                    <h5>Pending Revenue</h5>
                                    <h2>₹${data.pendingRevenue.toFixed(2)}</h2>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        updateActiveMenu(0);
    } catch (error) {
        alert('Error loading summary: ' + error.message);
    }
}

// Show admins
async function showAdmins() {
    try {
        const response = await fetch('/api/board/admins');
        const admins = await response.json();

        let tableRows = admins.map(a => `
            <tr>
                <td>${a.admin_id}</td>
                <td>${a.username}</td>
                <td>${a.full_name}</td>
                <td>${a.email || '-'}</td>
                <td>${a.board_name || '-'}</td>
                <td>${new Date(a.created_at).toLocaleDateString()}</td>
            </tr>
        `).join('');

        document.getElementById('content').innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h4>All Administrators</h4>
                </div>
                <div class="card-body">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Admin ID</th>
                                <th>Username</th>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Board</th>
                                <th>Created At</th>
                            </tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
            </div>
        `;
        updateActiveMenu(1);
    } catch (error) {
        alert('Error loading admins: ' + error.message);
    }
}

// Show customers
async function showCustomers() {
    try {
        const response = await fetch('/api/board/customers');
        const customers = await response.json();

        let tableRows = customers.map(c => `
            <tr>
                <td>${c.customer_id}</td>
                <td>${c.username}</td>
                <td>${c.full_name}</td>
                <td>${c.email || '-'}</td>
                <td>${c.phone || '-'}</td>
                <td>${c.admin_name || '-'}</td>
                <td>${new Date(c.created_at).toLocaleDateString()}</td>
            </tr>
        `).join('');

        document.getElementById('content').innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h4>All Customers</h4>
                </div>
                <div class="card-body">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Customer ID</th>
                                <th>Username</th>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Admin</th>
                                <th>Created At</th>
                            </tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
            </div>
        `;
        updateActiveMenu(2);
    } catch (error) {
        alert('Error loading customers: ' + error.message);
    }
}

// Update active menu
function updateActiveMenu(index) {
    const items = document.querySelectorAll('.list-group-item');
    items.forEach((item, i) => {
        if (i === index) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Initialize
showSummary();

