import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const isDev = !app.isPackaged;
const dbPath = isDev 
  ? path.join(process.cwd(), 'bills.sqlite')
  : path.join(app.getPath('userData'), 'bills.sqlite');

// Ensure the directory exists
if (!isDev) {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
console.log("ACTIVE DB PATH:", dbPath);

const runMigrations = () => {
  // Check Items table
  const itemsInfo = db.pragma('table_info(items)') as any[];
  const itemsColumns = itemsInfo.map((col) => col.name);

  const requiredItemsColumns = [
    { name: 'category', type: 'TEXT' },
    { name: 'size', type: 'TEXT' },
    { name: 'color', type: 'TEXT' },
    { name: 'unit', type: 'TEXT' },
    { name: 'description', type: 'TEXT' },
    { name: 'hsn_code', type: 'TEXT' },
    { name: 'conversion_qty', type: 'REAL' }
  ];

  requiredItemsColumns.forEach((col) => {
    if (!itemsColumns.includes(col.name)) {
      console.log(`Adding missing column to items: ${col.name}`);
      db.exec(`ALTER TABLE items ADD COLUMN ${col.name} ${col.type}`);
    }
  });

  // Check Expenses table
  const expensesInfo = db.pragma('table_info(expenses)') as any[];
  const expensesColumns = expensesInfo.map((col) => col.name);

  const requiredExpensesColumns = [
    { name: 'vendor_name', type: 'TEXT' },
    { name: 'status', type: 'TEXT DEFAULT \'Paid\'' },
    { name: 'due_date', type: 'DATE' },
    { name: 'category', type: 'TEXT' }
  ];

  requiredExpensesColumns.forEach((col) => {
    if (!expensesColumns.includes(col.name)) {
      console.log(`Adding missing column to expenses: ${col.name}`);
      db.exec(`ALTER TABLE expenses ADD COLUMN ${col.name} ${col.type}`);
    }
  });

  // Check Invoices table for status
  const invoicesInfo = db.pragma('table_info(invoices)') as any[];
  const invoicesColumns = invoicesInfo.map((col) => col.name);
  if (!invoicesColumns.includes('status')) {
    db.exec(`ALTER TABLE invoices ADD COLUMN status TEXT DEFAULT 'Active'`);
  }

  // Check invoice_items table for hsn_code
  const invoiceItemsInfo = db.pragma('table_info(invoice_items)') as any[];
  const invoiceItemsColumns = invoiceItemsInfo.map((col) => col.name);
  if (!invoiceItemsColumns.includes('hsn_code')) {
    db.exec(`ALTER TABLE invoice_items ADD COLUMN hsn_code TEXT`);
  }

  // Check settings table for auth_enabled
  const settingsInfo = db.pragma('table_info(settings)') as any[];
  const settingsColumns = settingsInfo.map((col) => col.name);
  if (!settingsColumns.includes('auth_enabled')) {
    console.log('Adding missing column to settings: auth_enabled');
    db.exec(`ALTER TABLE settings ADD COLUMN auth_enabled INTEGER DEFAULT 1`);
  }
  if (!settingsColumns.includes('auth_username')) {
    db.exec(`ALTER TABLE settings ADD COLUMN auth_username TEXT`);
  }
  if (!settingsColumns.includes('auth_password_hash')) {
    db.exec(`ALTER TABLE settings ADD COLUMN auth_password_hash TEXT`);
  }

  // Check users table for role and is_active
  const usersInfo = db.pragma('table_info(users)') as any[];
  const usersColumns = usersInfo.map((col) => col.name.toLowerCase());
  
  if (!usersColumns.includes('role')) {
    try {
      console.log('Adding role column to users table...');
      db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'staff'`);
    } catch (e: any) {
      console.error('Error adding role column:', e);
    }
  }
  
  if (!usersColumns.includes('is_active')) {
    try {
      console.log('Adding is_active column to users table...');
      db.exec(`ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1`);
    } catch (e: any) {
      console.error('Error adding is_active column:', e);
    }
  }
};

export const initDatabase = () => {
  try {
    // FORCE ADD COLUMNS (NO CONDITIONS)
    const forceAdd = (table: string, column: string, type: string, defaultValue: string) => {
      try {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type} DEFAULT ${defaultValue}`);
        console.log(`SUCCESS: ${column} column added to ${table}`);
      } catch (e: any) {
        console.log(`INFO: ${table}.${column} column might already exist:`, e.message);
      }
    };

    forceAdd('users', 'role', 'TEXT', "'staff'");
    forceAdd('users', 'is_active', 'INTEGER', '1');
    forceAdd('settings', 'auth_enabled', 'INTEGER', '1');
    forceAdd('settings', 'auth_username', 'TEXT', 'NULL');
    forceAdd('settings', 'auth_password_hash', 'TEXT', 'NULL');

    // VERIFY TABLE STRUCTURE
    console.log("USERS TABLE STRUCTURE:", JSON.stringify(db.pragma('table_info(users)'), null, 2));
    console.log("SETTINGS TABLE STRUCTURE:", JSON.stringify(db.pragma('table_info(settings)'), null, 2));

    db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id TEXT UNIQUE,
        name TEXT NOT NULL,
        category TEXT,
        size TEXT,
        color TEXT,
        rate REAL NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        unit TEXT,
        description TEXT,
        hsn_code TEXT,
        conversion_qty REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id TEXT UNIQUE,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        email TEXT,
        tax_id TEXT,
        credit_limit REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        customer_id INTEGER,
        customer_name TEXT,
        total_amount REAL NOT NULL,
        gst_amount REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        round_off REAL DEFAULT 0,
        net_amount REAL NOT NULL,
        payment_type TEXT, -- 'Cash' or 'Credit'
        bill_date DATE NOT NULL,
        status TEXT DEFAULT 'Active', -- 'Active', 'Returned'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );

      CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER,
        item_id INTEGER,
        item_name TEXT,
        quantity INTEGER NOT NULL,
        rate REAL NOT NULL,
        amount REAL NOT NULL,
        hsn_code TEXT,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id),
        FOREIGN KEY (item_id) REFERENCES items(id)
      );

      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        invoice_id INTEGER, -- Optional: Payment against specific invoice
        amount REAL NOT NULL,
        payment_date DATE NOT NULL,
        payment_method TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (invoice_id) REFERENCES invoices(id)
      );

      CREATE TABLE IF NOT EXISTS ledger_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        date DATE NOT NULL,
        type TEXT NOT NULL, -- 'Debit' (Invoice/Return) or 'Credit' (Payment/Return)
        amount REAL NOT NULL,
        reference_id INTEGER, -- ID of invoice, payment, or return
        reference_type TEXT, -- 'invoice', 'payment', 'sales_return'
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        expense_date TEXT NOT NULL,
        vendor_name TEXT,
        status TEXT DEFAULT 'Paid', -- 'Paid', 'Unpaid'
        due_date DATE,
        category TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sales_returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER,
        customer_id INTEGER,
        return_number TEXT UNIQUE,
        return_date DATE NOT NULL,
        total_amount REAL NOT NULL,
        gst_amount REAL DEFAULT 0,
        net_amount REAL NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );

      CREATE TABLE IF NOT EXISTS sales_return_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        return_id INTEGER,
        item_id INTEGER,
        quantity INTEGER NOT NULL,
        rate REAL NOT NULL,
        amount REAL NOT NULL,
        FOREIGN KEY (return_id) REFERENCES sales_returns(id),
        FOREIGN KEY (item_id) REFERENCES items(id)
      );

      CREATE TABLE IF NOT EXISTS purchase_returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_id INTEGER,
        return_date DATE NOT NULL,
        amount REAL NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (expense_id) REFERENCES expenses(id)
      );

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'staff', -- 'admin', 'staff'
        is_active INTEGER DEFAULT 1, -- 1 = active, 0 = inactive
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        company_name TEXT,
        company_address TEXT,
        company_email TEXT,
        company_phone TEXT,
        company_gst TEXT,
        company_pan TEXT,
        company_logo TEXT,
        bank_name TEXT,
        bank_account TEXT,
        bank_ifsc TEXT,
        auth_enabled INTEGER DEFAULT 1, -- 1 = enabled, 0 = disabled
        auth_username TEXT,
        auth_password_hash TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Initialize settings with a default row if empty
      INSERT OR IGNORE INTO settings (id, company_name, auth_enabled) VALUES (1, 'My Billify Business', 1);
    `);

    // Run migrations for existing tables
    runMigrations();
  } catch (error) {
    console.error('Database Initialization Failed:', error);
  }
};

export default db;
