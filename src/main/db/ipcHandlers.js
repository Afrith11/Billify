import { ipcMain, app } from 'electron';
import db from './database';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password, storedHash) => {
  const [salt, hash] = storedHash.split(':');
  const derivedHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === derivedHash;
};

export const registerIpcHandlers = () => {
  // Items
  ipcMain.handle('get-items', () => {
    try {
      return db.prepare('SELECT * FROM items ORDER BY id DESC').all();
    } catch (error) {
      console.error('Error fetching items:', error);
      return [];
    }
  });

  ipcMain.handle('add-item', (_, item) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO items (item_id, name, category, size, color, rate, quantity, unit, description, hsn_code, conversion_qty)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(
        item.item_id, 
        item.name, 
        item.category, 
        item.size, 
        item.color, 
        item.rate, 
        item.quantity, 
        item.unit, 
        item.description,
        item.hsn_code,
        item.conversion_qty
      );
      return { success: true, id: info.lastInsertRowid };
    } catch (error) {
      console.error('Error adding item:', error);
      if (error.message.includes('UNIQUE constraint failed')) {
        return {
          success: false,
          message: "Item ID already exists. Please enter another ID."
        };
      }
      return {
        success: false,
        message: "Failed to save item: " + error.message
      };
    }
  });

  ipcMain.handle('update-item', (_, item) => {
    try {
      const stmt = db.prepare(`
        UPDATE items SET 
          item_id = ?, name = ?, category = ?, size = ?, color = ?, 
          rate = ?, quantity = ?, unit = ?, description = ?, hsn_code = ?, conversion_qty = ?
        WHERE id = ?
      `);
      stmt.run(
        item.item_id, 
        item.name, 
        item.category, 
        item.size, 
        item.color, 
        item.rate, 
        item.quantity, 
        item.unit, 
        item.description, 
        item.hsn_code,
        item.conversion_qty,
        item.id
      );
      return { success: true };
    } catch (error) {
      console.error('Error updating item:', error);
      if (error.message.includes('UNIQUE constraint failed')) {
        return {
          success: false,
          message: "Item ID already exists. Please enter another ID."
        };
      }
      return {
        success: false,
        message: "Failed to update item: " + error.message
      };
    }
  });

  ipcMain.handle('delete-item', (_, id) => {
    try {
      db.prepare('DELETE FROM items WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting item:', error);
      return { success: false, message: error.message };
    }
  });

  // Customers
  ipcMain.handle('get-customers', () => {
    try {
      return db.prepare(`
        SELECT c.*, 
        (SELECT SUM(CASE WHEN type = 'Debit' THEN amount ELSE -amount END) FROM ledger_entries WHERE customer_id = c.id) as balance
        FROM customers c 
        ORDER BY name ASC
      `).all();
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  });

  ipcMain.handle('add-customer', (_, customer) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO customers (customer_id, name, phone, address, email, tax_id, credit_limit)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(
        customer.customer_id, 
        customer.name, 
        customer.phone, 
        customer.address, 
        customer.email, 
        customer.tax_id, 
        customer.credit_limit
      );
      return { success: true, id: info.lastInsertRowid };
    } catch (error) {
      console.error('Error adding customer:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('update-customer', (_, customer) => {
    try {
      const stmt = db.prepare(`
        UPDATE customers SET 
          customer_id = ?, name = ?, phone = ?, address = ?, email = ?, tax_id = ?, credit_limit = ?
        WHERE id = ?
      `);
      stmt.run(
        customer.customer_id, 
        customer.name, 
        customer.phone, 
        customer.address, 
        customer.email, 
        customer.tax_id, 
        customer.credit_limit, 
        customer.id
      );
      return { success: true };
    } catch (error) {
      console.error('Error updating customer:', error);
      return { success: false, message: error.message };
    }
  });

  // Invoices (Day Book)
  ipcMain.handle('get-invoices', (_, filters) => {
    try {
      let query = 'SELECT * FROM invoices';
      const params = [];
      if (filters?.fromDate && filters?.toDate) {
        query += ' WHERE bill_date BETWEEN ? AND ?';
        params.push(filters.fromDate, filters.toDate);
      } else if (filters?.date) {
        query += ' WHERE bill_date = ?';
        params.push(filters.date);
      }
      query += ' ORDER BY created_at DESC';
      return db.prepare(query).all(...params);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  });

  ipcMain.handle('get-invoice-by-id', (_, id) => {
    try {
      return db.prepare(`
        SELECT i.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address, c.tax_id as customer_gst
        FROM invoices i
        JOIN customers c ON i.customer_id = c.id
        WHERE i.id = ?
      `).get(id);
    } catch (error) {
      console.error('Error fetching invoice by id:', error);
      return null;
    }
  });

  ipcMain.handle('get-invoice-returns', (_, invoiceId) => {
    try {
      return db.prepare(`
        SELECT sr.*, sri.quantity, sri.rate, sri.amount, i.name as item_name
        FROM sales_returns sr
        JOIN sales_return_items sri ON sr.id = sri.return_id
        JOIN items i ON sri.item_id = i.id
        WHERE sr.invoice_id = ?
      `).all(invoiceId);
    } catch (error) {
      console.error('Error fetching invoice returns:', error);
      return [];
    }
  });

  ipcMain.handle('delete-invoice', (_, id) => {
    try {
      const transaction = db.transaction(() => {
        // 1. Get items to reverse stock
        const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(id);
        const updateStockStmt = db.prepare('UPDATE items SET quantity = quantity + ? WHERE id = ?');
        
        for (const item of items) {
          // Find original item to get unit/conversion if needed
          const originalItem = db.prepare('SELECT unit, conversion_qty FROM items WHERE id = ?').get(item.item_id);
          const stockReversal = (originalItem?.unit === 'Box' && originalItem?.conversion_qty)
            ? item.quantity * originalItem.conversion_qty
            : item.quantity;
          updateStockStmt.run(stockReversal, item.item_id);
        }

        // 2. Delete entries
        db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(id);
        db.prepare('DELETE FROM payments WHERE invoice_id = ?').run(id);
        db.prepare('DELETE FROM ledger_entries WHERE reference_id = ? AND reference_type = "invoice"').run(id);
        db.prepare('DELETE FROM invoices WHERE id = ?').run(id);

        return { success: true };
      });
      return transaction();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('get-invoice-items', (_, invoiceId) => {
    try {
      return db.prepare(`
        SELECT ii.*, i.unit, i.conversion_qty 
        FROM invoice_items ii
        JOIN items i ON ii.item_id = i.id
        WHERE ii.invoice_id = ?
      `).all(invoiceId);
    } catch (error) {
      console.error('Error fetching invoice items:', error);
      return [];
    }
  });

  ipcMain.handle('get-next-invoice-number', () => {
    try {
      const year = new Date().getFullYear();
      const searchPattern = `INV-${year}-%`;
      const lastInvoice = db.prepare('SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1').get(searchPattern);
      
      let nextNumber = 1;

      if (lastInvoice && lastInvoice.invoice_number) {
        const parts = lastInvoice.invoice_number.split('-');
        if (parts.length >= 3) {
          const lastNum = parseInt(parts[2]);
          if (!isNaN(lastNum)) {
            nextNumber = lastNum + 1;
          }
        }
      }

      return `INV-${year}-${String(nextNumber).padStart(4, '0')}`;
    } catch (error) {
      console.error('Invoice number error:', error);
      const year = new Date().getFullYear();
      return `INV-${year}-0001`;
    }
  });

  ipcMain.handle('create-invoice', (_, invoice) => {
    try {
      const transaction = db.transaction(() => {
        // 1. Insert Invoice
        const invStmt = db.prepare(`
          INSERT INTO invoices (
            invoice_number, customer_id, customer_name, total_amount, 
            gst_amount, discount_amount, round_off, net_amount, payment_type, bill_date
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const invInfo = invStmt.run(
          invoice.invoice_number, 
          invoice.customer_id, 
          invoice.customer_name, 
          invoice.total_amount, 
          invoice.gst_amount, 
          invoice.discount_amount, 
          invoice.round_off || 0,
          invoice.net_amount, 
          invoice.payment_type, 
          invoice.bill_date
        );
        const invoiceId = invInfo.lastInsertRowid;

        // 2. Insert Items & Update Stock
        const itemQuery = `
          INSERT INTO invoice_items (invoice_id, item_id, item_name, quantity, rate, amount, hsn_code)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const itemStmt = db.prepare(itemQuery);
        const updateStockStmt = db.prepare(`
          UPDATE items SET quantity = quantity - ? WHERE id = ?
        `);

        for (const item of invoice.items) {
          const itemParams = [invoiceId, item.id, item.name, item.quantity, item.rate, item.amount, item.hsn_code];
          console.log("ITEM PARAMS:", itemParams);
          console.log("ITEM PLACEHOLDER COUNT:", itemQuery.match(/\?/g)?.length);
          itemStmt.run(...itemParams);
          
          // Stock Handling: If Box, multiply by conversion_qty
          const stockDeduction = (item.unit === 'Box' && item.conversion_qty) 
            ? item.quantity * item.conversion_qty 
            : item.quantity;
            
          updateStockStmt.run(stockDeduction, item.id);
        }

        // 3. Create Ledger Entry (Debit)
        const ledgerQuery = `
          INSERT INTO ledger_entries (customer_id, date, type, amount, reference_id, reference_type, description)
          VALUES (?, ?, 'Debit', ?, ?, 'invoice', ?)
        `;
        const ledgerParams = [
          invoice.customer_id, 
          invoice.bill_date, 
          invoice.net_amount, 
          invoiceId, 
          `Invoice #${invoice.invoice_number}`
        ];

        console.log("QUERY PARAMS:", ledgerParams);
        console.log("PLACEHOLDER COUNT:", ledgerQuery.match(/\?/g)?.length);

        const ledgerStmt = db.prepare(ledgerQuery);
        ledgerStmt.run(...ledgerParams);

        // 4. Handle Cash Payment Flow
        if (invoice.payment_type === 'Cash') {
          // Record Payment
          const payStmt = db.prepare(`
            INSERT INTO payments (customer_id, invoice_id, amount, payment_date, payment_method, description)
            VALUES (?, ?, ?, ?, ?, ?)
          `);
          const payInfo = payStmt.run(
            invoice.customer_id,
            invoiceId,
            invoice.net_amount,
            invoice.bill_date,
            'Cash',
            `Auto-payment for Invoice #${invoice.invoice_number}`
          );
          const paymentId = payInfo.lastInsertRowid;

          // Record Ledger Credit
          db.prepare(`
            INSERT INTO ledger_entries (customer_id, date, type, amount, reference_id, reference_type, description)
            VALUES (?, ?, 'Credit', ?, ?, 'payment', ?)
          `).run(
            invoice.customer_id,
            invoice.bill_date,
            invoice.net_amount,
            paymentId,
            `Cash Payment for Invoice #${invoice.invoice_number}`
          );

          // Update Invoice Status
          db.prepare(`UPDATE invoices SET status = 'Paid' WHERE id = ?`).run(invoiceId);
        }

        return { success: true, id: invoiceId, invoiceNumber: invoice.invoice_number };
      });
      return transaction();
    } catch (error) {
      console.error('Error creating invoice:', error);
      return { success: false, message: error.message };
    }
  });

  // Payments
  ipcMain.handle('get-payments', (_, filters) => {
    try {
      let query = 'SELECT p.*, c.name as customer_name FROM payments p JOIN customers c ON p.customer_id = c.id';
      const params = [];
      if (filters?.fromDate && filters?.toDate) {
        query += ' WHERE p.payment_date BETWEEN ? AND ?';
        params.push(filters.fromDate, filters.toDate);
      }
      query += ' ORDER BY p.payment_date DESC';
      return db.prepare(query).all(...params);
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  });

  ipcMain.handle('add-payment', (_, payment) => {
    try {
      const transaction = db.transaction(() => {
        // 1. Insert Payment
        const payStmt = db.prepare(`
          INSERT INTO payments (customer_id, amount, payment_date, payment_method, description)
          VALUES (?, ?, ?, ?, ?)
        `);
        const payInfo = payStmt.run(
          payment.customer_id, 
          payment.amount, 
          payment.payment_date, 
          payment.payment_method, 
          payment.description
        );
        const paymentId = payInfo.lastInsertRowid;

        // 2. Create Ledger Entry (Credit)
        const ledgerQuery = `
          INSERT INTO ledger_entries (customer_id, date, type, amount, reference_id, reference_type, description)
          VALUES (?, ?, 'Credit', ?, ?, 'payment', ?)
        `;
        const ledgerParams = [
          payment.customer_id, 
          payment.payment_date, 
          payment.amount, 
          paymentId, 
          `Payment via ${payment.payment_method}`
        ];

        console.log("QUERY PARAMS:", ledgerParams);
        console.log("PLACEHOLDER COUNT:", ledgerQuery.match(/\?/g)?.length);

        const ledgerStmt = db.prepare(ledgerQuery);
        ledgerStmt.run(...ledgerParams);

        return { success: true };
      });
      return transaction();
    } catch (error) {
      console.error('Error adding payment:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('receive-payment', (_, payment) => {
    // Alias for add-payment to match preload
    return ipcMain._events['add-payment'](null, payment);
  });

  // Returns
  ipcMain.handle('get-sales-returns', (_, filters) => {
    try {
      let query = `
        SELECT sr.*, c.name as customer_name, i.invoice_number 
        FROM sales_returns sr 
        JOIN customers c ON sr.customer_id = c.id
        JOIN invoices i ON sr.invoice_id = i.id
      `;
      const params = [];
      if (filters?.fromDate && filters?.toDate) {
        query += ' WHERE sr.return_date BETWEEN ? AND ?';
        params.push(filters.fromDate, filters.toDate);
      }
      query += ' ORDER BY sr.return_date DESC';
      return db.prepare(query).all(...params);
    } catch (error) {
      console.error('Error fetching sales returns:', error);
      return [];
    }
  });

  ipcMain.handle('create-sales-return', (_, data) => {
    try {
      const transaction = db.transaction(() => {
        // 1. Create Return Record
        const returnNumber = `RET-${Date.now()}`;
        const returnStmt = db.prepare(`
          INSERT INTO sales_returns (invoice_id, customer_id, return_number, return_date, total_amount, gst_amount, net_amount, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const returnInfo = returnStmt.run(
          data.invoice_id,
          data.customer_id,
          returnNumber,
          data.return_date,
          data.total_amount,
          data.gst_amount,
          data.net_amount,
          data.notes
        );
        const returnId = returnInfo.lastInsertRowid;

        // 2. Process Items (Update Stock)
        const itemStmt = db.prepare(`
          INSERT INTO sales_return_items (return_id, item_id, quantity, rate, amount)
          VALUES (?, ?, ?, ?, ?)
        `);
        const updateStockStmt = db.prepare(`
          UPDATE items SET quantity = quantity + ? WHERE id = ?
        `);

        for (const item of data.items) {
          itemStmt.run(returnId, item.item_id, item.quantity, item.rate, item.amount);
          
          // Stock Re-entry: Handle Box conversion
          const stockAddition = (item.unit === 'Box' && item.conversion_qty)
            ? item.quantity * item.conversion_qty
            : item.quantity;
            
          updateStockStmt.run(stockAddition, item.item_id);
        }

        // 3. Update Ledger (Credit for customer - reducing their debt)
        const ledgerQuery = `
          INSERT INTO ledger_entries (customer_id, date, type, amount, reference_id, reference_type, description)
          VALUES (?, ?, 'Credit', ?, ?, 'sales_return', ?)
        `;
        const ledgerParams = [
          data.customer_id,
          data.return_date,
          data.net_amount,
          returnId,
          `Sales Return #${returnNumber}`
        ];

        console.log("QUERY PARAMS:", ledgerParams);
        console.log("PLACEHOLDER COUNT:", ledgerQuery.match(/\?/g)?.length);

        const ledgerStmt = db.prepare(ledgerQuery);
        ledgerStmt.run(...ledgerParams);

        // 4. Mark invoice as partially/fully returned (optional metadata)
        db.prepare("UPDATE invoices SET status = 'Returned' WHERE id = ?").run(data.invoice_id);

        return { success: true, returnNumber };
      });
      return transaction();
    } catch (error) {
      console.error('Error creating sales return:', error);
      return { success: false, message: error.message };
    }
  });

  // Purchase Returns
  ipcMain.handle('get-purchase-returns', (_, filters) => {
    try {
      let query = 'SELECT pr.*, e.vendor_name FROM purchase_returns pr JOIN expenses e ON pr.expense_id = e.id';
      const params = [];
      if (filters?.fromDate && filters?.toDate) {
        query += ' WHERE pr.return_date BETWEEN ? AND ?';
        params.push(filters.fromDate, filters.toDate);
      }
      query += ' ORDER BY pr.return_date DESC';
      return db.prepare(query).all(...params);
    } catch (error) {
      console.error('Error fetching purchase returns:', error);
      return [];
    }
  });

  ipcMain.handle('create-purchase-return', (_, data) => {
    try {
      const transaction = db.transaction(() => {
        const returnStmt = db.prepare(`
          INSERT INTO purchase_returns (expense_id, return_date, amount, notes)
          VALUES (?, ?, ?, ?)
        `);
        const returnInfo = returnStmt.run(data.expense_id, data.return_date, data.amount, data.notes);
        
        // Update expense status if fully returned
        db.prepare("UPDATE expenses SET status = 'Returned' WHERE id = ?").run(data.expense_id);
        
        return { success: true, id: returnInfo.lastInsertRowid };
      });
      return transaction();
    } catch (error) {
      console.error('Error creating purchase return:', error);
      return { success: false, message: error.message };
    }
  });

  // Reports & Analytics
  ipcMain.handle('get-dashboard-stats', () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      const todaySales = db.prepare("SELECT SUM(net_amount) as total FROM invoices WHERE bill_date = ? AND status != 'Cancelled'").get(today).total || 0;
      const monthlySales = db.prepare("SELECT SUM(net_amount) as total FROM invoices WHERE bill_date >= ? AND status != 'Cancelled'").get(firstDayOfMonth).total || 0;
      const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get().count || 0;
      
      const receivables = db.prepare(`
        SELECT SUM(CASE WHEN type = 'Debit' THEN amount ELSE -amount END) as balance 
        FROM ledger_entries
      `).get().balance || 0;

      const recentInvoices = db.prepare('SELECT * FROM invoices ORDER BY bill_date DESC, id DESC LIMIT 5').all();

      // Real Payables (Unpaid Expenses)
      const totalPayable = db.prepare("SELECT SUM(amount) as total FROM expenses WHERE status = 'Unpaid'").get().total || 0;
      
      // Real Expenses for Profit calculation (Current Month)
      const monthlyExpenses = db.prepare("SELECT SUM(amount) as total FROM expenses WHERE expense_date >= ?").get(firstDayOfMonth).total || 0;
      const netProfit = monthlySales - monthlyExpenses;

      return {
        todaySales,
        monthlySales,
        totalCustomers,
        totalReceivable: receivables,
        totalPayable,
        totalRevenue: monthlySales,
        netProfit,
        recentInvoices
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        todaySales: 0,
        monthlySales: 0,
        totalCustomers: 0,
        totalReceivable: 0,
        totalPayable: 0,
        totalRevenue: 0,
        netProfit: 0,
        recentInvoices: []
      };
    }
  });

  ipcMain.handle('get-receivables-report', () => {
    try {
      const customers = db.prepare('SELECT id, name, phone, customer_id as code FROM customers').all();
      const report = customers.map(cust => {
        const balance = db.prepare(`
          SELECT SUM(CASE WHEN type = 'Debit' THEN amount ELSE -amount END) as balance 
          FROM ledger_entries WHERE customer_id = ?
        `).get(cust.id).balance || 0;

        if (balance <= 0) return null;

        // Simple aging based on last debit entries
        const debits = db.prepare(`
          SELECT amount, date FROM ledger_entries 
          WHERE customer_id = ? AND type = 'Debit' 
          ORDER BY date DESC
        `).all(cust.id);

        const now = new Date();
        const aging = { bracket_30: 0, bracket_60: 0, bracket_90: 0 };
        
        let remainingBalance = balance;
        for (const debit of debits) {
          if (remainingBalance <= 0) break;
          const debitDate = new Date(debit.date);
          const diffDays = Math.floor((now - debitDate) / (1000 * 60 * 60 * 24));
          const amountToApply = Math.min(remainingBalance, debit.amount);

          if (diffDays <= 30) aging.bracket_30 += amountToApply;
          else if (diffDays <= 60) aging.bracket_60 += amountToApply;
          else aging.bracket_90 += amountToApply;

          remainingBalance -= amountToApply;
        }

        return { ...cust, outstanding: balance, aging };
      }).filter(Boolean);

      return report;
    } catch (error) {
      console.error('Receivables report error:', error);
      return [];
    }
  });

  ipcMain.handle('get-payables-report', () => {
    try {
      return db.prepare(`
        SELECT * FROM expenses 
        WHERE status = 'Unpaid' 
        ORDER BY due_date ASC
      `).all();
    } catch (error) {
      console.error('Payables report error:', error);
      return [];
    }
  });

  ipcMain.handle('get-sales-analytics', (_, filters) => {
    try {
      // Aggregates sales by day for the trend chart
      const query = `
        SELECT bill_date as date, SUM(net_amount) as total 
        FROM invoices 
        WHERE bill_date BETWEEN ? AND ? 
        GROUP BY bill_date 
        ORDER BY bill_date ASC
      `;
      return db.prepare(query).all(filters.fromDate, filters.toDate);
    } catch (error) {
      console.error('Sales analytics error:', error);
      return [];
    }
  });

  ipcMain.handle('get-advanced-sales-report', (_, filters) => {
    try {
      let query = `
        SELECT 
          i.id as invoice_id,
          i.invoice_number, 
          i.customer_name, 
          i.bill_date,
          ii.item_name,
          ii.quantity,
          ii.rate,
          ii.amount as item_total,
          i.gst_amount,
          i.discount_amount
        FROM invoices i
        JOIN invoice_items ii ON i.id = ii.invoice_id
        WHERE 1=1
      `;
      const params = [];
      if (filters?.fromDate && filters?.toDate) {
        query += ' AND i.bill_date BETWEEN ? AND ?';
        params.push(filters.fromDate, filters.toDate);
      }
      query += ' ORDER BY i.bill_date DESC';
      return db.prepare(query).all(...params);
    } catch (error) {
      console.error('Advanced sales report error:', error);
      return [];
    }
  });

  ipcMain.handle('get-receipt-statements', (_, filters) => {
    try {
      let query = `
        SELECT 
          p.*, 
          c.name as customer_name,
          i.invoice_number
        FROM payments p 
        JOIN customers c ON p.customer_id = c.id 
        LEFT JOIN invoices i ON p.invoice_id = i.id
        WHERE 1=1
      `;
      const params = [];
      if (filters?.fromDate && filters?.toDate) {
        query += ' AND p.payment_date BETWEEN ? AND ?';
        params.push(filters.fromDate, filters.toDate);
      }
      query += ' ORDER BY p.payment_date DESC';
      return db.prepare(query).all(...params);
    } catch (error) {
      console.error('Receipt statements error:', error);
      return [];
    }
  });

  ipcMain.handle('add-expense', (_, expense) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO expenses (title, amount, expense_date, vendor_name, status, due_date, category, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        expense.title,
        expense.amount,
        expense.expense_date,
        expense.vendor_name,
        expense.status || 'Paid',
        expense.due_date,
        expense.category,
        expense.notes
      );
      return { success: true };
    } catch (error) {
      console.error('Add expense error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('update-expense-status', (_, { id, status }) => {
    try {
      db.prepare('UPDATE expenses SET status = ? WHERE id = ?').run(status, id);
      return { success: true };
    } catch (error) {
      console.error('Update expense status error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('get-daybook', (_, { from, to }) => {
    try {
      // Invoices (Debit)
      const invoices = db.prepare(`
        SELECT 
          id,
          invoice_number AS ref,
          customer_name,
          net_amount AS debit,
          0 AS credit,
          bill_date AS date,
          'invoice' AS type
        FROM invoices
        WHERE bill_date BETWEEN ? AND ?
      `).all(from, to);

      // Payments (Credit)
      const payments = db.prepare(`
        SELECT 
          p.id,
          'PAY-' || p.id AS ref,
          c.name AS customer_name,
          0 AS debit,
          p.amount AS credit,
          p.payment_date AS date,
          'payment' AS type
        FROM payments p
        JOIN customers c ON p.customer_id = c.id
        WHERE payment_date BETWEEN ? AND ?
      `).all(from, to);

      // Expenses (Credit)
      const expenses = db.prepare(`
        SELECT 
          id,
          title AS ref,
          vendor_name AS customer_name,
          0 AS debit,
          amount AS credit,
          expense_date AS date,
          'expense' AS type
        FROM expenses
        WHERE expense_date BETWEEN ? AND ?
      `).all(from, to);

      // Sales Returns (Credit)
      const returns = db.prepare(`
        SELECT 
          sr.id,
          return_number AS ref,
          c.name AS customer_name,
          0 AS debit,
          sr.net_amount AS credit,
          return_date AS date,
          'return' AS type
        FROM sales_returns sr
        JOIN customers c ON sr.customer_id = c.id
        WHERE return_date BETWEEN ? AND ?
      `).all(from, to);

      return [...invoices, ...payments, ...expenses, ...returns]
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error('Error fetching daybook:', error);
      return [];
    }
  });

  ipcMain.handle('get-ledger-report', (_, customerId) => {
    try {
      return db.prepare(`
        SELECT *, 
        SUM(CASE WHEN type = 'Debit' THEN amount ELSE -amount END) OVER (ORDER BY date, id) as running_balance,
        CASE WHEN type = 'Debit' THEN amount ELSE 0 END as debit,
        CASE WHEN type = 'Credit' THEN amount ELSE 0 END as credit
        FROM ledger_entries 
        WHERE customer_id = ? 
        ORDER BY date ASC, id ASC
      `).all(customerId);
    } catch (error) {
      console.error('Error fetching ledger report:', error);
      return [];
    }
  });

  // Settings & Profile
  ipcMain.handle('get-settings', () => {
    try {
      return db.prepare('SELECT * FROM settings WHERE id = 1').get();
    } catch (error) {
      console.error('Error fetching settings:', error);
      return null;
    }
  });

  ipcMain.handle('update-settings', (_, settings) => {
    try {
      const stmt = db.prepare(`
        UPDATE settings SET 
          company_name = ?, company_address = ?, company_email = ?, 
          company_phone = ?, company_gst = ?, company_pan = ?, 
          company_logo = ?, bank_name = ?, bank_account = ?, bank_ifsc = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `);
      stmt.run(
        settings.company_name,
        settings.company_address,
        settings.company_email,
        settings.company_phone,
        settings.company_gst,
        settings.company_pan,
        settings.company_logo,
        settings.bank_name,
        settings.bank_account,
        settings.bank_ifsc
      );
      return { success: true };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('upload-logo', (_, { name, data }) => {
    try {
      const logoDir = path.join(app.getPath('userData'), 'logos');
      if (!fs.existsSync(logoDir)) {
        fs.mkdirSync(logoDir, { recursive: true });
      }
      
      const fileName = `${Date.now()}_${name}`;
      const filePath = path.join(logoDir, fileName);
      
      // Convert base64 data to buffer
      const buffer = Buffer.from(data, 'base64');
      fs.writeFileSync(filePath, buffer);
      
      // Return relative path or file protocol URL
      return { success: true, path: filePath };
    } catch (error) {
      console.error('Logo upload error:', error);
      return { success: false, message: error.message };
    }
  });
  ipcMain.handle('export-database', async () => {
    try {
      const { dialog } = require('electron');
      const { filePath } = await dialog.showSaveDialog({
        title: 'Export Database Backup',
        defaultPath: `billify_backup_${new Date().toISOString().split('T')[0]}.db`,
        filters: [{ name: 'SQLite Database', extensions: ['db'] }]
      });

      if (filePath) {
        const dbPath = path.join(app.getPath('userData'), 'billify.db');
        fs.copyFileSync(dbPath, filePath);
        return { success: true, path: filePath };
      }
      return { success: false, message: 'Export cancelled' };
    } catch (error) {
      console.error('Export error:', error);
      return { success: false, message: error.message };
    }
  });

  // Authentication Handlers
  ipcMain.handle('check-auth-status', () => {
    try {
      const settings = db.prepare('SELECT auth_enabled FROM settings WHERE id = 1').get();
      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
      return { 
        authEnabled: settings?.auth_enabled === 1,
        hasAdmin: userCount.count > 0 
      };
    } catch (error) {
      console.error('Auth status error:', error);
      return { authEnabled: false, hasAdmin: false };
    }
  });

  ipcMain.handle('create-admin', (_, { username, password }) => {
    try {
      const existing = db.prepare('SELECT COUNT(*) as count FROM users').get();
      if (existing.count > 0) return { success: false, message: 'Admin already exists' };

      const hash = hashPassword(password);
      const role = 'admin';
      console.log("Saving user:", username, role);
      db.prepare('INSERT INTO users (username, password_hash, role, is_active) VALUES (?, ?, ?, 1)').run(username, hash, role);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('login', (_, { username, password }) => {
    try {
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      if (!user) return { success: false, message: 'Invalid credentials' };
      if (user.is_active === 0) return { success: false, message: 'Account is deactivated' };

      const isValid = verifyPassword(password, user.password_hash);
      if (isValid) {
        return { 
          success: true, 
          username: user.username,
          role: user.role 
        };
      }
      return { success: false, message: 'Invalid credentials' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('change-password', (_, { username, oldPassword, newPassword }) => {
    try {
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      if (!user || !verifyPassword(oldPassword, user.password_hash)) {
        return { success: false, message: 'Invalid old password' };
      }

      const newHash = hashPassword(newPassword);
      db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(newHash, username);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('toggle-auth', (_, enabled) => {
    try {
      db.prepare('UPDATE settings SET auth_enabled = ? WHERE id = 1').run(enabled ? 1 : 0);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // User Management
  ipcMain.handle('get-users', () => {
    try {
      return db.prepare('SELECT id, username, role, is_active, created_at FROM users ORDER BY id ASC').all();
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  });

  ipcMain.handle('add-user', (_, { username, password, role }) => {
    try {
      const normalizedRole = role.toLowerCase();
      const hash = hashPassword(password);
      console.log("Saving user:", username, normalizedRole);
      db.prepare('INSERT INTO users (username, password_hash, role, is_active) VALUES (?, ?, ?, 1)').run(username, hash, normalizedRole);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('update-user', (_, { id, username, role, password }) => {
    try {
      const normalizedRole = role.toLowerCase();
      if (password) {
        const hash = hashPassword(password);
        db.prepare('UPDATE users SET username = ?, role = ?, password_hash = ? WHERE id = ?').run(username, normalizedRole, hash, id);
      } else {
        db.prepare('UPDATE users SET username = ?, role = ? WHERE id = ?').run(username, normalizedRole, id);
      }
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('delete-user', (_, id) => {
    try {
      // Prevent deleting the last admin if possible, but for now just delete
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('toggle-user-status', (_, { id, isActive }) => {
    try {
      db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(isActive ? 1 : 0, id);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });
};
