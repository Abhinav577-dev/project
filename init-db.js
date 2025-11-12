const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'Electricity_Billing',
  password: process.env.DB_PASSWORD || 'root',
  port: process.env.DB_PORT || 5432,
});

async function initDatabase() {
  try {
    // Drop existing tables if they exist (in reverse order of dependencies)
    console.log('Dropping existing tables if they exist...');
    await pool.query('DROP TABLE IF EXISTS Invoices CASCADE');
    await pool.query('DROP TABLE IF EXISTS Billings CASCADE');
    await pool.query('DROP TABLE IF EXISTS Accounts CASCADE');
    await pool.query('DROP TABLE IF EXISTS Customers CASCADE');
    await pool.query('DROP TABLE IF EXISTS Admins CASCADE');
    await pool.query('DROP TABLE IF EXISTS Tariffs CASCADE');
    await pool.query('DROP TABLE IF EXISTS Elec_Board CASCADE');
    console.log('Tables dropped successfully.');
    
    // Create tables
    console.log('Creating tables...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Elec_Board (
        board_id SERIAL PRIMARY KEY,
        board_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS Admin (
        admin_id SERIAL PRIMARY KEY,
        board_id INTEGER REFERENCES Elec_Board(board_id) ON DELETE CASCADE,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS Customer (
        customer_id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES Admin(admin_id) ON DELETE CASCADE,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS Tariff (
        tariff_id SERIAL PRIMARY KEY,
        tariff_type VARCHAR(100) UNIQUE NOT NULL,
        rate_per_unit DECIMAL(10, 2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS Account (
        account_id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES Customer(customer_id) ON DELETE CASCADE,
        meter_number VARCHAR(50) UNIQUE NOT NULL,
        tariff_id INTEGER REFERENCES Tariff(tariff_id),
        connection_date DATE,
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS Billing (
        billing_id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES Account(account_id) ON DELETE CASCADE,
        reading_date DATE NOT NULL,
        units_consumed DECIMAL(10, 2) NOT NULL,
        tariff_id INTEGER REFERENCES Tariff(tariff_id),
        amount DECIMAL(10, 2) NOT NULL,
        billing_month VARCHAR(20),
        billing_year INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS Invoice (
        invoice_id SERIAL PRIMARY KEY,
        billing_id INTEGER REFERENCES Billing(billing_id) ON DELETE CASCADE,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        invoice_date DATE DEFAULT CURRENT_DATE,
        due_date DATE,
        amount_due DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'Unpaid',
        paid_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default data
    let boardId;
    try {
      const existingBoard = await pool.query('SELECT board_id FROM elec_board LIMIT 1');
      
      if (existingBoard.rows.length === 0) {
        const boardResult = await pool.query(`
          INSERT INTO elec_board (board_name) 
          VALUES ('State Electricity Board') 
          RETURNING board_id;
        `);
        boardId = boardResult.rows[0]?.board_id;
      } else {
        boardId = existingBoard.rows[0].board_id;
      }
    } catch (error) {
      // Table might have wrong structure, try to insert new board
      console.log('Checking board table structure, inserting new board...');
      const boardResult = await pool.query(`
        INSERT INTO elec_board (board_name) 
        VALUES ('State Electricity Board') 
        RETURNING board_id;
      `);
      boardId = boardResult.rows[0]?.board_id;
    }

    // Insert default admin (password: admin123)
    const bcrypt = require('bcryptjs');
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO admin (board_id, username, password, full_name, email)
      VALUES ($1, 'admin', $2, 'System Administrator', 'admin@electricity.com')
      ON CONFLICT (username) DO NOTHING;
    `, [boardId, hashedAdminPassword]);

    // Insert default tariffs
    await pool.query(`
      INSERT INTO tariff (tariff_type, rate_per_unit, description)
      VALUES 
        ('Domestic', 5.50, 'Residential electricity tariff'),
        ('Commercial', 7.50, 'Commercial electricity tariff'),
        ('Industrial', 6.50, 'Industrial electricity tariff')
      ON CONFLICT (tariff_type) DO NOTHING;
    `);

    console.log('Database initialized successfully!');
    console.log('Default admin credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await pool.end();
  }
}

initDatabase();

