<<<<<<< HEAD
# Electricity-Billing
=======
# Electricity Billing & Invoicing Platform

A comprehensive web application for managing electricity billing, customers, accounts, and invoices using Node.js, Express.js, PostgreSQL, and Bootstrap.

## Features

### Admin Module
- Login/Logout
- Dashboard with statistics (customers, accounts, pending bills)
- Add/Edit/Delete Customers & Accounts
- Add monthly meter reading (units, date)
- Auto-calculate bill (Units × Tariff Rate)
- Auto-generate invoice with customer, account, meter no., amount due, tariff type
- Manage tariffs (type, rate)
- View all bills and invoices
- Download invoices

### Customer Module
- Login/Register
- View profile & linked accounts
- View bills & invoices
- Download invoice
- Mark as Paid/Unpaid

### Electricity Board
- Board information (ID, name)
- View summary of admins, customers, revenue
- View all admins and customers

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Authentication**: Express Session
- **Password Hashing**: bcryptjs

## Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up PostgreSQL Database**
   - Create a PostgreSQL database named `electricity_billing`
   - Update database credentials in `.env` file (or use defaults)

3. **Create `.env` file** (optional, defaults are provided)
   ```
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=electricity_billing
   DB_PASSWORD=postgres
   DB_PORT=5432
   PORT=3000
   ```

4. **Initialize Database**
   ```bash
   npm run init-db
   ```
   This will create all tables and insert default data:
   - Default admin: username `admin`, password `admin123`
   - Default tariffs: Domestic (₹5.50), Commercial (₹7.50), Industrial (₹6.50)

5. **Start Server**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

6. **Access Application**
   - Open browser and navigate to `http://localhost:3000`

## Database Schema

### Tables
- **Elec_Board**: Electricity board information
- **Admin**: Administrators (linked to Elec_Board)
- **Customer**: Customers (linked to Admin)
- **Account**: Customer accounts with meter numbers (linked to Customer)
- **Tariff**: Tariff types and rates
- **Billing**: Meter readings and bill calculations (linked to Account)
- **Invoice**: Auto-generated invoices (linked to Billing)

### Relationships
- Elec_Board → Admin (1–M)
- Admin → Customer (1–M)
- Customer → Account (1–M)
- Account → Billing → Invoice (1–M each)

## Usage

### Admin Login
1. Go to homepage
2. Click "Admin Login"
3. Use credentials: `admin` / `admin123`
4. Access dashboard to manage customers, accounts, tariffs, and generate bills

### Customer Registration/Login
1. Go to homepage
2. Click "Register" to create account or "Customer Login" to sign in
3. View profile, accounts, bills, and invoices
4. Download invoices and mark payment status

### Electricity Board Dashboard
1. Click "Electricity Board Dashboard" on homepage
2. View summary statistics, admins, and customers

## Bill Calculation

The system automatically calculates bills using:
```
Amount = Units_Consumed × Tariff_Rate
```

When a meter reading is added, the system:
1. Retrieves the account's tariff rate
2. Calculates the bill amount
3. Creates a billing record
4. Auto-generates an invoice with invoice number, dates, and amount

## API Endpoints

### Authentication
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/customer/login` - Customer login
- `POST /api/auth/customer/register` - Customer registration
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Check session

### Admin Routes
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/customers` - Get all customers
- `POST /api/admin/customers` - Add customer
- `PUT /api/admin/customers/:id` - Update customer
- `DELETE /api/admin/customers/:id` - Delete customer
- `GET /api/admin/accounts` - Get all accounts
- `POST /api/admin/accounts` - Add account
- `PUT /api/admin/accounts/:id` - Update account
- `DELETE /api/admin/accounts/:id` - Delete account
- `POST /api/admin/billing` - Add reading & generate bill
- `GET /api/admin/bills` - Get all bills
- `GET /api/admin/invoices` - Get all invoices
- `GET /api/admin/tariffs` - Get all tariffs
- `POST /api/admin/tariffs` - Add tariff
- `PUT /api/admin/tariffs/:id` - Update tariff
- `DELETE /api/admin/tariffs/:id` - Delete tariff

### Customer Routes
- `GET /api/customer/profile` - Get profile
- `GET /api/customer/accounts` - Get customer accounts
- `GET /api/customer/bills` - Get customer bills
- `GET /api/customer/invoices` - Get customer invoices
- `GET /api/customer/invoices/:id` - Get single invoice
- `PUT /api/customer/invoices/:id/status` - Update invoice status

### Board Routes
- `GET /api/board/summary` - Get board summary
- `GET /api/board/admins` - Get all admins
- `GET /api/board/customers` - Get all customers

## Security Features

- Password hashing using bcryptjs
- Session-based authentication
- Admin-only routes protection
- Customer data isolation (customers can only see their own data)

## Notes

- Default admin password should be changed in production
- Database credentials should be stored securely
- Session secret should be changed in production
- Consider adding HTTPS for production deployment

>>>>>>> ca022a8 (Initial commit)
