import { ipcMain } from 'electron';
import db from './database';

export const registerIpcHandlers = () => {
  // Items
  ipcMain.handle('get-items', () => {
    return db.prepare('SELECT * FROM items ORDER BY created_at DESC').all();
  });

  ipcMain.handle('add-item', (_, item) => {
    const stmt = db.prepare(`
      INSERT INTO items (item_id, name, rate, quantity, unit, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(item.item_id, item.name, item.rate, item.quantity, item.unit, item.description);
    return info.lastInsertRowid;
  });

  ipcMain.handle('update-item', (_, item) => {
    const stmt = db.prepare(`
      UPDATE items SET item_id = ?, name = ?, rate = ?, quantity = ?, unit = ?, description = ?
      WHERE id = ?
    `);
    return stmt.run(item.item_id, item.name, item.rate, item.quantity, item.unit, item.description, item.id);
  });

  ipcMain.handle('delete-item', (_, id) => {
    return db.prepare('DELETE FROM items WHERE id = ?').run(id);
  });

  // Customers
  ipcMain.handle('get-customers', () => {
    return db.prepare('SELECT * FROM customers ORDER BY name ASC').all();
  });

  ipcMain.handle('add-customer', (_, customer) => {
    const stmt = db.prepare(`
      INSERT INTO customers (customer_id, name, phone, address, email, tax_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(customer.customer_id, customer.name, customer.phone, customer.address, customer.email, customer.tax_id);
    return info.lastInsertRowid;
  });

  ipcMain.handle('update-customer', (_, customer) => {
    const stmt = db.prepare(`
      UPDATE customers SET customer_id = ?, name = ?, phone = ?, address = ?, email = ?, tax_id = ?
      WHERE id = ?
    `);
    return stmt.run(customer.customer_id, customer.name, customer.phone, customer.address, customer.email, customer.tax_id, customer.id);
  });

  ipcMain.handle('delete-customer', (_, id) => {
    return db.prepare('DELETE FROM customers WHERE id = ?').run(id);
  });

  // Bills
  ipcMain.handle('get-bills', (_, filters) => {
    let query = 'SELECT * FROM bills';
    const params = [];
    if (filters?.date) {
      query += ' WHERE bill_date = ?';
      params.push(filters.date);
    }
    query += ' ORDER BY created_at DESC';
    return db.prepare(query).all(...params);
  });

  ipcMain.handle('create-bill', (_, bill) => {
    const transaction = db.transaction(() => {
      const billStmt = db.prepare(`
        INSERT INTO bills (invoice_number, customer_id, customer_name, total_amount, payment_type, bill_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const billInfo = billStmt.run(
        bill.invoice_number, 
        bill.customer_id, 
        bill.customer_name, 
        bill.total_amount, 
        bill.payment_type, 
        bill.bill_date
      );
      const billId = billInfo.lastInsertRowid;

      const itemStmt = db.prepare(`
        INSERT INTO bill_items (bill_id, item_id, item_name, quantity, rate, amount)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const updateStockStmt = db.prepare(`
        UPDATE items SET quantity = quantity - ? WHERE id = ?
      `);

      for (const item of bill.items) {
        itemStmt.run(billId, item.id, item.name, item.quantity, item.rate, item.amount);
        updateStockStmt.run(item.quantity, item.id);
      }

      // If it's a payment, record it
      if (bill.paid_amount > 0) {
        const payStmt = db.prepare(`
          INSERT INTO payments (customer_id, bill_id, amount, payment_date, payment_method)
          VALUES (?, ?, ?, ?, ?)
        `);
        payStmt.run(bill.customer_id, billId, bill.paid_amount, bill.bill_date, bill.payment_type);
      }

      return billId;
    });

    return transaction();
  });

  ipcMain.handle('get-bill-details', (_, billId) => {
    const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(billId);
    const items = db.prepare('SELECT * FROM bill_items WHERE bill_id = ?').all(billId);
    return { ...bill, items };
  });

  // Reports
  ipcMain.handle('get-ledger-report', (_, customerId) => {
    const bills = db.prepare('SELECT * FROM bills WHERE customer_id = ?').all(customerId);
    const payments = db.prepare('SELECT * FROM payments WHERE customer_id = ?').all(customerId);
    return { bills, payments };
  });

  ipcMain.handle('get-dashboard-stats', () => {
    const totalSales = db.prepare('SELECT SUM(total_amount) as total FROM bills').get();
    const totalPayments = db.prepare('SELECT SUM(amount) as total FROM payments').get();
    const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get();
    const totalItems = db.prepare('SELECT COUNT(*) as count FROM items').get();
    const recentBills = db.prepare('SELECT * FROM bills ORDER BY created_at DESC LIMIT 5').all();
    
    return {
      totalSales: totalSales.total || 0,
      totalPayments: totalPayments.total || 0,
      totalCustomers: totalCustomers.count,
      totalItems: totalItems.count,
      recentBills
    };
  });
};
