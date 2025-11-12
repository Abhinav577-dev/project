// Check authentication
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (!response.ok || data.user?.type !== 'customer') {
            window.location.href = '/';
        }
    } catch (error) {
        window.location.href = '/';
    }
}

// Logout
async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Show profile
async function showProfile() {
    try {
        const response = await fetch('/api/customer/profile');
        const profile = await response.json();

        document.getElementById('content').innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h4>My Profile</h4>
                </div>
                <div class="card-body">
                    <table class="table">
                        <tr>
                            <th>Customer ID</th>
                            <td>${profile.customer_id}</td>
                        </tr>
                        <tr>
                            <th>Username</th>
                            <td>${profile.username}</td>
                        </tr>
                        <tr>
                            <th>Full Name</th>
                            <td>${profile.full_name}</td>
                        </tr>
                        <tr>
                            <th>Email</th>
                            <td>${profile.email || '-'}</td>
                        </tr>
                        <tr>
                            <th>Phone</th>
                            <td>${profile.phone || '-'}</td>
                        </tr>
                        <tr>
                            <th>Address</th>
                            <td>${profile.address || '-'}</td>
                        </tr>
                        <tr>
                            <th>Member Since</th>
                            <td>${new Date(profile.created_at).toLocaleDateString()}</td>
                        </tr>
                    </table>
                </div>
            </div>
        `;
        updateActiveMenu(0);
    } catch (error) {
        alert('Error loading profile: ' + error.message);
    }
}

// Show accounts
async function showAccounts() {
    try {
        const response = await fetch('/api/customer/accounts');
        const accounts = await response.json();

        if (accounts.length === 0) {
            document.getElementById('content').innerHTML = `
                <div class="card">
                    <div class="card-body text-center">
                        <p class="text-muted">No accounts found</p>
                    </div>
                </div>
            `;
            updateActiveMenu(1);
            return;
        }

        let cards = accounts.map(a => `
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Meter: ${a.meter_number}</h5>
                        <p class="card-text">
                            <strong>Tariff:</strong> ${a.tariff_type || 'Not assigned'}<br>
                            <strong>Rate:</strong> ₹${a.rate_per_unit || '0'}/unit<br>
                            <strong>Status:</strong> <span class="badge ${a.status === 'Active' ? 'bg-success' : 'bg-secondary'}">${a.status}</span><br>
                            <strong>Connection Date:</strong> ${a.connection_date ? new Date(a.connection_date).toLocaleDateString() : '-'}
                        </p>
                    </div>
                </div>
            </div>
        `).join('');

        document.getElementById('content').innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h4>My Accounts</h4>
                </div>
                <div class="card-body">
                    <div class="row">
                        ${cards}
                    </div>
                </div>
            </div>
        `;
        updateActiveMenu(1);
    } catch (error) {
        alert('Error loading accounts: ' + error.message);
    }
}

// Show bills
async function showBills() {
    try {
        const response = await fetch('/api/customer/bills');
        const bills = await response.json();

        if (bills.length === 0) {
            document.getElementById('content').innerHTML = `
                <div class="card">
                    <div class="card-body text-center">
                        <p class="text-muted">No bills found</p>
                    </div>
                </div>
            `;
            updateActiveMenu(2);
            return;
        }

        let tableRows = bills.map(b => `
            <tr>
                <td>${b.billing_id}</td>
                <td>${b.meter_number}</td>
                <td>${b.reading_date}</td>
                <td>${b.units_consumed}</td>
                <td>${b.tariff_type || '-'}</td>
                <td>₹${b.amount}</td>
                <td>${b.invoice_number || '-'}</td>
                <td><span class="badge ${b.invoice_status === 'Paid' ? 'bg-success' : 'bg-warning'}">${b.invoice_status || 'Unpaid'}</span></td>
            </tr>
        `).join('');

        document.getElementById('content').innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h4>My Bills</h4>
                </div>
                <div class="card-body">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Billing ID</th>
                                <th>Meter Number</th>
                                <th>Reading Date</th>
                                <th>Units</th>
                                <th>Tariff</th>
                                <th>Amount</th>
                                <th>Invoice</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
            </div>
        `;
        updateActiveMenu(2);
    } catch (error) {
        alert('Error loading bills: ' + error.message);
    }
}

// Show invoices
async function showInvoices() {
    try {
        const response = await fetch('/api/customer/invoices');
        const invoices = await response.json();

        if (invoices.length === 0) {
            document.getElementById('content').innerHTML = `
                <div class="card">
                    <div class="card-body text-center">
                        <p class="text-muted">No invoices found</p>
                    </div>
                </div>
            `;
            updateActiveMenu(3);
            return;
        }

        let tableRows = invoices.map(i => `
            <tr>
                <td>${i.invoice_number}</td>
                <td>${i.meter_number}</td>
                <td>${i.invoice_date}</td>
                <td>${i.due_date}</td>
                <td>₹${i.amount_due}</td>
                <td><span class="badge ${i.status === 'Paid' ? 'bg-success' : 'bg-warning'}">${i.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="downloadInvoice(${i.invoice_id})">Download</button>
                    <button class="btn btn-sm ${i.status === 'Paid' ? 'btn-secondary' : 'btn-success'}" 
                            onclick="togglePaymentStatus(${i.invoice_id}, '${i.status}')">
                        ${i.status === 'Paid' ? 'Mark Unpaid' : 'Mark Paid'}
                    </button>
                </td>
            </tr>
        `).join('');

        document.getElementById('content').innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h4>My Invoices</h4>
                </div>
                <div class="card-body">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Invoice Number</th>
                                <th>Meter Number</th>
                                <th>Invoice Date</th>
                                <th>Due Date</th>
                                <th>Amount Due</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
            </div>
        `;
        updateActiveMenu(3);
    } catch (error) {
        alert('Error loading invoices: ' + error.message);
    }
}

// Download invoice
async function downloadInvoice(invoiceId) {
    try {
        const response = await fetch(`/api/customer/invoices/${invoiceId}`);
        const invoice = await response.json();

        // Generate invoice HTML
        const invoiceHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice ${invoice.invoice_number}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .invoice-header { text-align: center; margin-bottom: 30px; }
                    .invoice-details { margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .total { font-weight: bold; font-size: 18px; }
                </style>
            </head>
            <body>
                <div class="invoice-header">
                    <h1>Electricity Billing System</h1>
                    <h2>INVOICE</h2>
                </div>
                <div class="invoice-details">
                    <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
                    <p><strong>Invoice Date:</strong> ${invoice.invoice_date}</p>
                    <p><strong>Due Date:</strong> ${invoice.due_date}</p>
                    <p><strong>Status:</strong> ${invoice.status}</p>
                </div>
                <div>
                    <h3>Customer Details</h3>
                    <p><strong>Name:</strong> ${invoice.customer_name}</p>
                    <p><strong>Email:</strong> ${invoice.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${invoice.phone || 'N/A'}</p>
                    <p><strong>Address:</strong> ${invoice.address || 'N/A'}</p>
                    <p><strong>Meter Number:</strong> ${invoice.meter_number}</p>
                </div>
                <table>
                    <tr>
                        <th>Description</th>
                        <th>Units Consumed</th>
                        <th>Tariff Type</th>
                        <th>Rate per Unit</th>
                        <th>Amount</th>
                    </tr>
                    <tr>
                        <td>Electricity Bill - ${invoice.reading_date}</td>
                        <td>${invoice.units_consumed}</td>
                        <td>${invoice.tariff_type || 'N/A'}</td>
                        <td>₹${(invoice.amount_due / invoice.units_consumed).toFixed(2)}</td>
                        <td>₹${invoice.amount_due}</td>
                    </tr>
                </table>
                <div class="total">
                    <p>Total Amount Due: ₹${invoice.amount_due}</p>
                </div>
            </body>
            </html>
        `;

        // Open in new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
        printWindow.print();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Toggle payment status
async function togglePaymentStatus(invoiceId, currentStatus) {
    const newStatus = currentStatus === 'Paid' ? 'Unpaid' : 'Paid';
    
    if (!confirm(`Are you sure you want to mark this invoice as ${newStatus}?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/customer/invoices/${invoiceId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();
        if (response.ok) {
            alert(`Invoice marked as ${newStatus} successfully!`);
            showInvoices();
        } else {
            alert(data.error || 'Error updating invoice status');
        }
    } catch (error) {
        alert('Error: ' + error.message);
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
checkAuth();
showProfile();

