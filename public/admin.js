// Check authentication
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (!response.ok || data.user?.type !== 'admin') {
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

// Show dashboard
async function showDashboard() {
    try {
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();

        document.getElementById('content').innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h4>Dashboard Overview</h4>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="card bg-primary text-white mb-3">
                                <div class="card-body">
                                    <h5>Total Customers</h5>
                                    <h2>${data.customers}</h2>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card bg-success text-white mb-3">
                                <div class="card-body">
                                    <h5>Total Accounts</h5>
                                    <h2>${data.accounts}</h2>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card bg-warning text-white mb-3">
                                <div class="card-body">
                                    <h5>Pending Bills</h5>
                                    <h2>${data.pendingBills}</h2>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        updateActiveMenu(0);
    } catch (error) {
        alert('Error loading dashboard: ' + error.message);
    }
}

// Show customers
async function showCustomers() {
    try {
        const response = await fetch('/api/admin/customers');
        const customers = await response.json();

        if (customers.length === 0) {
            document.getElementById('content').innerHTML = `
                <div class="card">
                    <div class="card-header d-flex justify-content-between">
                        <h4>Customers</h4>
                        <button class="btn btn-primary" onclick="showAddCustomerModal()">Add Customer</button>
                    </div>
                    <div class="card-body text-center">
                        <p class="text-muted">No customers found. Click "Add Customer" to create one.</p>
                    </div>
                </div>
            `;
            updateActiveMenu(1);
            return;
        }

        let tableRows = customers.map(c => `
            <tr>
                <td>${c.customer_id}</td>
                <td>${c.username}</td>
                <td>${c.full_name}</td>
                <td>${c.email || '-'}</td>
                <td>${c.phone || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editCustomer(${c.customer_id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCustomer(${c.customer_id})">Delete</button>
                </td>
            </tr>
        `).join('');

        document.getElementById('content').innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between">
                    <h4>Customers</h4>
                    <button class="btn btn-primary" onclick="showAddCustomerModal()">Add Customer</button>
                </div>
                <div class="card-body">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Username</th>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
            </div>
        `;
        updateActiveMenu(1);
    } catch (error) {
        alert('Error loading customers: ' + error.message);
    }
}

// Show accounts
async function showAccounts() {
    try {
        const response = await fetch('/api/admin/accounts');
        const accounts = await response.json();

        if (accounts.length === 0) {
            document.getElementById('content').innerHTML = `
                <div class="card">
                    <div class="card-header d-flex justify-content-between">
                        <h4>Accounts</h4>
                        <button class="btn btn-primary" onclick="showAddAccountModal()">Add Account</button>
                    </div>
                    <div class="card-body text-center">
                        <p class="text-muted">No accounts found. Click "Add Account" to create one.</p>
                    </div>
                </div>
            `;
            updateActiveMenu(2);
            return;
        }

        let tableRows = accounts.map(a => `
            <tr>
                <td>${a.account_id}</td>
                <td>${a.meter_number}</td>
                <td>${a.customer_name}</td>
                <td>${a.tariff_type || '-'}</td>
                <td>${a.status}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editAccount(${a.account_id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAccount(${a.account_id})">Delete</button>
                </td>
            </tr>
        `).join('');

        document.getElementById('content').innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between">
                    <h4>Accounts</h4>
                    <button class="btn btn-primary" onclick="showAddAccountModal()">Add Account</button>
                </div>
                <div class="card-body">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Meter Number</th>
                                <th>Customer</th>
                                <th>Tariff</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
            </div>
        `;
        updateActiveMenu(2);
    } catch (error) {
        alert('Error loading accounts: ' + error.message);
    }
}

// Show billing form
async function showBilling() {
    try {
        const [accountsRes, tariffsRes] = await Promise.all([
            fetch('/api/admin/accounts'),
            fetch('/api/admin/tariffs')
        ]);
        const accounts = await accountsRes.json();
        const tariffs = await tariffsRes.json();

        const accountOptions = accounts.map(a => 
            `<option value="${a.account_id}">${a.meter_number} - ${a.customer_name}</option>`
        ).join('');

        document.getElementById('content').innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h4>Add Meter Reading & Generate Bill</h4>
                </div>
                <div class="card-body">
                    <form id="billingForm">
                        <div class="mb-3">
                            <label class="form-label">Account (Meter Number)</label>
                            <select class="form-select" id="billingAccountId" required>
                                <option value="">Select Account</option>
                                ${accountOptions}
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Reading Date</label>
                            <input type="date" class="form-control" id="readingDate" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Units Consumed</label>
                            <input type="number" step="0.01" class="form-control" id="unitsConsumed" required>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Billing Month</label>
                                <select class="form-select" id="billingMonth" required>
                                    <option value="01">January</option>
                                    <option value="02">February</option>
                                    <option value="03">March</option>
                                    <option value="04">April</option>
                                    <option value="05">May</option>
                                    <option value="06">June</option>
                                    <option value="07">July</option>
                                    <option value="08">August</option>
                                    <option value="09">September</option>
                                    <option value="10">October</option>
                                    <option value="11">November</option>
                                    <option value="12">December</option>
                                </select>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Billing Year</label>
                                <input type="number" class="form-control" id="billingYear" value="${new Date().getFullYear()}" required>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary">Generate Bill</button>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('billingForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                accountId: document.getElementById('billingAccountId').value,
                readingDate: document.getElementById('readingDate').value,
                unitsConsumed: document.getElementById('unitsConsumed').value,
                billingMonth: document.getElementById('billingMonth').value,
                billingYear: document.getElementById('billingYear').value
            };

            try {
                const response = await fetch('/api/admin/billing', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();
                if (response.ok) {
                    alert(`Bill generated successfully! Invoice: ${data.invoice.invoice_number}\nAmount: ₹${data.billing.amount}`);
                    showBilling();
                } else {
                    alert(data.error || 'Error generating bill');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });

        updateActiveMenu(3);
    } catch (error) {
        alert('Error loading billing form: ' + error.message);
    }
}

// Show bills
async function showBills() {
    try {
        const response = await fetch('/api/admin/bills');
        const bills = await response.json();

        if (bills.length === 0) {
            document.getElementById('content').innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <h4>All Bills</h4>
                    </div>
                    <div class="card-body text-center">
                        <p class="text-muted">No bills found. Add a meter reading to generate bills.</p>
                    </div>
                </div>
            `;
            updateActiveMenu(4);
            return;
        }

        let tableRows = bills.map(b => `
            <tr>
                <td>${b.billing_id}</td>
                <td>${b.meter_number}</td>
                <td>${b.customer_name}</td>
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
                    <h4>All Bills</h4>
                </div>
                <div class="card-body">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Billing ID</th>
                                <th>Meter Number</th>
                                <th>Customer</th>
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
        updateActiveMenu(4);
    } catch (error) {
        alert('Error loading bills: ' + error.message);
    }
}

// Show invoices
async function showInvoices() {
    try {
        const response = await fetch('/api/admin/invoices');
        const invoices = await response.json();

        if (invoices.length === 0) {
            document.getElementById('content').innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <h4>All Invoices</h4>
                    </div>
                    <div class="card-body text-center">
                        <p class="text-muted">No invoices found. Generate bills to create invoices.</p>
                    </div>
                </div>
            `;
            updateActiveMenu(5);
            return;
        }

        let tableRows = invoices.map(i => `
            <tr>
                <td>${i.invoice_number}</td>
                <td>${i.meter_number}</td>
                <td>${i.customer_name}</td>
                <td>${i.invoice_date}</td>
                <td>${i.due_date}</td>
                <td>₹${i.amount_due}</td>
                <td><span class="badge ${i.status === 'Paid' ? 'bg-success' : 'bg-warning'}">${i.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="downloadInvoice(${i.invoice_id})">Download</button>
                </td>
            </tr>
        `).join('');

        document.getElementById('content').innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h4>All Invoices</h4>
                </div>
                <div class="card-body">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Invoice Number</th>
                                <th>Meter Number</th>
                                <th>Customer</th>
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
        updateActiveMenu(5);
    } catch (error) {
        alert('Error loading invoices: ' + error.message);
    }
}

// Show tariffs
async function showTariffs() {
    try {
        const response = await fetch('/api/admin/tariffs');
        const tariffs = await response.json();

        let tableRows = tariffs.map(t => `
            <tr>
                <td>${t.tariff_id}</td>
                <td>${t.tariff_type}</td>
                <td>₹${t.rate_per_unit}</td>
                <td>${t.description || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editTariff(${t.tariff_id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTariff(${t.tariff_id})">Delete</button>
                </td>
            </tr>
        `).join('');

        document.getElementById('content').innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between">
                    <h4>Tariff Management</h4>
                    <button class="btn btn-primary" onclick="showAddTariffModal()">Add Tariff</button>
                </div>
                <div class="card-body">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Type</th>
                                <th>Rate per Unit</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
            </div>
        `;
        updateActiveMenu(6);
    } catch (error) {
        alert('Error loading tariffs: ' + error.message);
    }
}

// Customer CRUD functions
async function showAddCustomerModal() {
    const modal = `
        <div class="modal fade" id="addCustomerModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add Customer</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="addCustomerForm">
                            <div class="mb-3">
                                <label class="form-label">Username</label>
                                <input type="text" class="form-control" id="customerUsername" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Password</label>
                                <input type="password" class="form-control" id="customerPassword" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Full Name</label>
                                <input type="text" class="form-control" id="customerFullName" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" id="customerEmail">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Phone</label>
                                <input type="tel" class="form-control" id="customerPhone">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Address</label>
                                <textarea class="form-control" id="customerAddress" rows="3"></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary">Add Customer</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);
    const bsModal = new bootstrap.Modal(document.getElementById('addCustomerModal'));
    bsModal.show();

    document.getElementById('addCustomerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            username: document.getElementById('customerUsername').value,
            password: document.getElementById('customerPassword').value,
            fullName: document.getElementById('customerFullName').value,
            email: document.getElementById('customerEmail').value,
            phone: document.getElementById('customerPhone').value,
            address: document.getElementById('customerAddress').value
        };

        try {
            const response = await fetch('/api/admin/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (response.ok) {
                alert('Customer added successfully!');
                bsModal.hide();
                document.getElementById('addCustomerModal').remove();
                showCustomers();
            } else {
                alert(data.error || 'Error adding customer');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });
}

async function editCustomer(id) {
    try {
        const response = await fetch('/api/admin/customers');
        const customers = await response.json();
        const customer = customers.find(c => c.customer_id === id);

        if (!customer) {
            alert('Customer not found');
            return;
        }

        const modal = `
            <div class="modal fade" id="editCustomerModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Customer</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editCustomerForm">
                                <div class="mb-3">
                                    <label class="form-label">Full Name</label>
                                    <input type="text" class="form-control" id="editFullName" value="${customer.full_name}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-control" id="editEmail" value="${customer.email || ''}">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Phone</label>
                                    <input type="tel" class="form-control" id="editPhone" value="${customer.phone || ''}">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Address</label>
                                    <textarea class="form-control" id="editAddress" rows="3">${customer.address || ''}</textarea>
                                </div>
                                <button type="submit" class="btn btn-primary">Update Customer</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modal);
        const bsModal = new bootstrap.Modal(document.getElementById('editCustomerModal'));
        bsModal.show();

        document.getElementById('editCustomerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                fullName: document.getElementById('editFullName').value,
                email: document.getElementById('editEmail').value,
                phone: document.getElementById('editPhone').value,
                address: document.getElementById('editAddress').value
            };

            try {
                const response = await fetch(`/api/admin/customers/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();
                if (response.ok) {
                    alert('Customer updated successfully!');
                    bsModal.hide();
                    document.getElementById('editCustomerModal').remove();
                    showCustomers();
                } else {
                    alert(data.error || 'Error updating customer');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteCustomer(id) {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
        const response = await fetch(`/api/admin/customers/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (response.ok) {
            alert('Customer deleted successfully!');
            showCustomers();
        } else {
            alert(data.error || 'Error deleting customer');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Account CRUD functions
async function showAddAccountModal() {
    try {
        const [customersRes, tariffsRes] = await Promise.all([
            fetch('/api/admin/customers'),
            fetch('/api/admin/tariffs')
        ]);
        const customers = await customersRes.json();
        const tariffs = await tariffsRes.json();

        const customerOptions = customers.map(c => 
            `<option value="${c.customer_id}">${c.full_name} (${c.username})</option>`
        ).join('');
        const tariffOptions = tariffs.map(t => 
            `<option value="${t.tariff_id}">${t.tariff_type} - ₹${t.rate_per_unit}/unit</option>`
        ).join('');

        const modal = `
            <div class="modal fade" id="addAccountModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Add Account</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="addAccountForm">
                                <div class="mb-3">
                                    <label class="form-label">Customer</label>
                                    <select class="form-select" id="accountCustomerId" required>
                                        <option value="">Select Customer</option>
                                        ${customerOptions}
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Meter Number</label>
                                    <input type="text" class="form-control" id="meterNumber" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Tariff</label>
                                    <select class="form-select" id="accountTariffId" required>
                                        <option value="">Select Tariff</option>
                                        ${tariffOptions}
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Connection Date</label>
                                    <input type="date" class="form-control" id="connectionDate">
                                </div>
                                <button type="submit" class="btn btn-primary">Add Account</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modal);
        const bsModal = new bootstrap.Modal(document.getElementById('addAccountModal'));
        bsModal.show();

        document.getElementById('addAccountForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                customerId: document.getElementById('accountCustomerId').value,
                meterNumber: document.getElementById('meterNumber').value,
                tariffId: document.getElementById('accountTariffId').value,
                connectionDate: document.getElementById('connectionDate').value
            };

            try {
                const response = await fetch('/api/admin/accounts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();
                if (response.ok) {
                    alert('Account added successfully!');
                    bsModal.hide();
                    document.getElementById('addAccountModal').remove();
                    showAccounts();
                } else {
                    alert(data.error || 'Error adding account');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function editAccount(id) {
    try {
        const [accountsRes, tariffsRes] = await Promise.all([
            fetch('/api/admin/accounts'),
            fetch('/api/admin/tariffs')
        ]);
        const accounts = await accountsRes.json();
        const tariffs = await tariffsRes.json();
        const account = accounts.find(a => a.account_id === id);

        if (!account) {
            alert('Account not found');
            return;
        }

        const tariffOptions = tariffs.map(t => 
            `<option value="${t.tariff_id}" ${t.tariff_id == account.tariff_id ? 'selected' : ''}>${t.tariff_type} - ₹${t.rate_per_unit}/unit</option>`
        ).join('');

        const modal = `
            <div class="modal fade" id="editAccountModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Account</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editAccountForm">
                                <div class="mb-3">
                                    <label class="form-label">Tariff</label>
                                    <select class="form-select" id="editTariffId" required>
                                        <option value="">Select Tariff</option>
                                        ${tariffOptions}
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Status</label>
                                    <select class="form-select" id="editStatus" required>
                                        <option value="Active" ${account.status === 'Active' ? 'selected' : ''}>Active</option>
                                        <option value="Inactive" ${account.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                                    </select>
                                </div>
                                <button type="submit" class="btn btn-primary">Update Account</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modal);
        const bsModal = new bootstrap.Modal(document.getElementById('editAccountModal'));
        bsModal.show();

        document.getElementById('editAccountForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                tariffId: document.getElementById('editTariffId').value,
                status: document.getElementById('editStatus').value
            };

            try {
                const response = await fetch(`/api/admin/accounts/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();
                if (response.ok) {
                    alert('Account updated successfully!');
                    bsModal.hide();
                    document.getElementById('editAccountModal').remove();
                    showAccounts();
                } else {
                    alert(data.error || 'Error updating account');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteAccount(id) {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
        const response = await fetch(`/api/admin/accounts/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (response.ok) {
            alert('Account deleted successfully!');
            showAccounts();
        } else {
            alert(data.error || 'Error deleting account');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Tariff CRUD functions
async function showAddTariffModal() {
    const modal = `
        <div class="modal fade" id="addTariffModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add Tariff</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="addTariffForm">
                            <div class="mb-3">
                                <label class="form-label">Tariff Type</label>
                                <input type="text" class="form-control" id="tariffType" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Rate per Unit (₹)</label>
                                <input type="number" step="0.01" class="form-control" id="ratePerUnit" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" id="tariffDescription" rows="3"></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary">Add Tariff</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);
    const bsModal = new bootstrap.Modal(document.getElementById('addTariffModal'));
    bsModal.show();

    document.getElementById('addTariffForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            tariffType: document.getElementById('tariffType').value,
            ratePerUnit: document.getElementById('ratePerUnit').value,
            description: document.getElementById('tariffDescription').value
        };

        try {
            const response = await fetch('/api/admin/tariffs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (response.ok) {
                alert('Tariff added successfully!');
                bsModal.hide();
                document.getElementById('addTariffModal').remove();
                showTariffs();
            } else {
                alert(data.error || 'Error adding tariff');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });
}

async function editTariff(id) {
    try {
        const response = await fetch('/api/admin/tariffs');
        const tariffs = await response.json();
        const tariff = tariffs.find(t => t.tariff_id === id);

        if (!tariff) {
            alert('Tariff not found');
            return;
        }

        const modal = `
            <div class="modal fade" id="editTariffModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Tariff</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editTariffForm">
                                <div class="mb-3">
                                    <label class="form-label">Rate per Unit (₹)</label>
                                    <input type="number" step="0.01" class="form-control" id="editRatePerUnit" value="${tariff.rate_per_unit}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Description</label>
                                    <textarea class="form-control" id="editTariffDescription" rows="3">${tariff.description || ''}</textarea>
                                </div>
                                <button type="submit" class="btn btn-primary">Update Tariff</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modal);
        const bsModal = new bootstrap.Modal(document.getElementById('editTariffModal'));
        bsModal.show();

        document.getElementById('editTariffForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                ratePerUnit: document.getElementById('editRatePerUnit').value,
                description: document.getElementById('editTariffDescription').value
            };

            try {
                const response = await fetch(`/api/admin/tariffs/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();
                if (response.ok) {
                    alert('Tariff updated successfully!');
                    bsModal.hide();
                    document.getElementById('editTariffModal').remove();
                    showTariffs();
                } else {
                    alert(data.error || 'Error updating tariff');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteTariff(id) {
    if (!confirm('Are you sure you want to delete this tariff?')) return;

    try {
        const response = await fetch(`/api/admin/tariffs/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (response.ok) {
            alert('Tariff deleted successfully!');
            showTariffs();
        } else {
            alert(data.error || 'Error deleting tariff');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Download invoice
async function downloadInvoice(invoiceId) {
    try {
        const response = await fetch(`/api/admin/invoices`);
        const invoices = await response.json();
        const invoice = invoices.find(i => i.invoice_id === invoiceId);

        if (!invoice) {
            alert('Invoice not found');
            return;
        }

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
showDashboard();

