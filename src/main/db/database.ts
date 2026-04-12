import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const isDev = !app.isPackaged;
const dbPath = isDev 
  ? path.join(__dirname, '../../bills.sqlite')
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

// Initialize Schema
export const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id TEXT UNIQUE,
      name TEXT NOT NULL,
      rate REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      unit TEXT,
      description TEXT,
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER,
      customer_name TEXT, -- Denormalized for quick access
      total_amount REAL NOT NULL,
      payment_type TEXT,
      bill_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS bill_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER,
      item_id INTEGER,
      item_name TEXT,
      quantity INTEGER NOT NULL,
      rate REAL NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (bill_id) REFERENCES bills(id),
      FOREIGN KEY (item_id) REFERENCES items(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      bill_id INTEGER,
      amount REAL NOT NULL,
      payment_date DATE NOT NULL,
      payment_method TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (bill_id) REFERENCES bills(id)
    );
  `);
};

export default db;
