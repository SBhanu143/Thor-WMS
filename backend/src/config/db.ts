import { Pool } from 'pg';
import sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';

export type DBType = 'postgres' | 'sqlite';

export interface DatabaseConnection {
  type: DBType;
  query(sql: string, params?: any[]): Promise<any>;
  close(): Promise<void>;
}

class SQLiteConnection implements DatabaseConnection {
  type: DBType = 'sqlite';
  private db: sqlite3.Database;

  constructor(filePath: string) {
    this.db = new sqlite3.Database(filePath);
  }

  query(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      // Convert PostgreSQL style placeholders ($1, $2) to SQLite placeholders (?, ?)
      let sqliteSql = sql;
      let pCount = 1;
      while (sqliteSql.includes(`$${pCount}`)) {
        sqliteSql = sqliteSql.replace(`$${pCount}`, '?');
        pCount++;
      }

      const isSelect = sql.trim().toUpperCase().startsWith('SELECT');

      if (isSelect) {
        this.db.all(sqliteSql, params, (err, rows) => {
          if (err) reject(err);
          else resolve({ rows });
        });
      } else {
        this.db.run(sqliteSql, params, function (err) {
          if (err) reject(err);
          else {
            resolve({
              rows: [],
              rowCount: this.changes,
              lastID: this.lastID
            });
          }
        });
      }
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

class PostgresConnection implements DatabaseConnection {
  type: DBType = 'postgres';
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || '5432'),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined
    });
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    const result = await this.pool.query(sql, params);
    return result;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

let dbInstance: DatabaseConnection;

export function getDatabase(): DatabaseConnection {
  if (!dbInstance) {
    const usePostgres = process.env.PGHOST || process.env.DATABASE_URL;
    if (usePostgres) {
      console.log('Connecting to PostgreSQL database...');
      dbInstance = new PostgresConnection();
    } else {
      const dbPath = path.join(__dirname, '..', '..', 'wms.db');
      console.log(`Connecting to local SQLite database at: ${dbPath}`);
      dbInstance = new SQLiteConnection(dbPath);
    }
  }
  return dbInstance;
}

export async function initDatabase(): Promise<void> {
  const db = getDatabase();
  console.log(`Initializing database schema (${db.type})...`);

  const isPG = db.type === 'postgres';

  // Helper for database types
  const uuidType = isPG ? 'UUID PRIMARY KEY DEFAULT gen_random_uuid()' : 'TEXT PRIMARY KEY';
  const jsonType = isPG ? 'JSONB' : 'TEXT';
  const timestampDefault = isPG ? 'CURRENT_TIMESTAMP' : 'CURRENT_TIMESTAMP';

  // DDL Script execution
  const tables = [
    // 1. Employees table
    `CREATE TABLE IF NOT EXISTS employees (
      id ${uuidType},
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      role VARCHAR(30) NOT NULL,
      pin_hash VARCHAR(255),
      biometric_enabled BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT ${timestampDefault},
      updated_at TIMESTAMP DEFAULT ${timestampDefault}
    )`,

    // 2. Bins table
    `CREATE TABLE IF NOT EXISTS bins (
      id ${uuidType},
      code VARCHAR(20) UNIQUE NOT NULL,
      zone VARCHAR(20) NOT NULL,
      aisle INTEGER NOT NULL,
      shelf INTEGER NOT NULL,
      level INTEGER NOT NULL,
      capacity_m3 NUMERIC(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT ${timestampDefault},
      updated_at TIMESTAMP DEFAULT ${timestampDefault}
    )`,

    // 3. Products table
    `CREATE TABLE IF NOT EXISTS products (
      id ${uuidType},
      sku VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      barcode VARCHAR(50) UNIQUE NOT NULL,
      quantity INTEGER DEFAULT 0,
      min_stock_level INTEGER DEFAULT 10,
      bin_id TEXT,
      weight NUMERIC(10,2),
      dimensions VARCHAR(50),
      created_at TIMESTAMP DEFAULT ${timestampDefault},
      updated_at TIMESTAMP DEFAULT ${timestampDefault}
    )`,

    // 4. QR History table
    `CREATE TABLE IF NOT EXISTS qr_history (
      id ${uuidType},
      product_id TEXT NOT NULL,
      generated_by TEXT NOT NULL,
      qr_data TEXT NOT NULL,
      label_type VARCHAR(30) NOT NULL,
      printed_at TIMESTAMP DEFAULT ${timestampDefault},
      created_at TIMESTAMP DEFAULT ${timestampDefault}
    )`,

    // 5. Barcode History table
    `CREATE TABLE IF NOT EXISTS barcode_history (
      id ${uuidType},
      scanned_barcode VARCHAR(50) NOT NULL,
      product_id TEXT,
      scanned_by TEXT NOT NULL,
      scan_status VARCHAR(20) NOT NULL,
      device_info VARCHAR(100),
      created_at TIMESTAMP DEFAULT ${timestampDefault}
    )`,

    // 6. Audits table
    `CREATE TABLE IF NOT EXISTS audits (
      id ${uuidType},
      title VARCHAR(100) NOT NULL,
      scheduled_date DATE NOT NULL,
      status VARCHAR(20) NOT NULL,
      assigned_to TEXT NOT NULL,
      details ${jsonType} NOT NULL,
      created_at TIMESTAMP DEFAULT ${timestampDefault},
      updated_at TIMESTAMP DEFAULT ${timestampDefault}
    )`,

    // 7. Reports table
    `CREATE TABLE IF NOT EXISTS reports (
      id ${uuidType},
      title VARCHAR(100) NOT NULL,
      report_type VARCHAR(30) NOT NULL,
      format VARCHAR(10) NOT NULL,
      file_path VARCHAR(255) NOT NULL,
      generated_by TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT ${timestampDefault}
    )`,

    // 8. Issues table
    `CREATE TABLE IF NOT EXISTS issues (
      id ${uuidType},
      product_id TEXT NOT NULL,
      reported_by TEXT NOT NULL,
      audit_id TEXT,
      issue_type VARCHAR(30) NOT NULL,
      severity VARCHAR(20) NOT NULL,
      description TEXT NOT NULL,
      status VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT ${timestampDefault},
      updated_at TIMESTAMP DEFAULT ${timestampDefault}
    )`,

    // 9. Notifications table
    `CREATE TABLE IF NOT EXISTS notifications (
      id ${uuidType},
      employee_id TEXT NOT NULL,
      title VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      type VARCHAR(30) NOT NULL,
      created_at TIMESTAMP DEFAULT ${timestampDefault}
    )`,

    // 10. Favorites table
    `CREATE TABLE IF NOT EXISTS favorites (
      id ${uuidType},
      employee_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT ${timestampDefault}
    )`,

    // 11. Recent Searches table
    `CREATE TABLE IF NOT EXISTS recent_searches (
      id ${uuidType},
      employee_id TEXT NOT NULL,
      query VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT ${timestampDefault}
    )`,

    // 12. Settings table
    `CREATE TABLE IF NOT EXISTS settings (
      id ${uuidType},
      employee_id TEXT UNIQUE NOT NULL,
      language VARCHAR(10) DEFAULT 'en',
      theme VARCHAR(10) DEFAULT 'dark',
      scanner_beep BOOLEAN DEFAULT TRUE,
      biometrics_enabled BOOLEAN DEFAULT FALSE,
      sync_interval_mins INTEGER DEFAULT 5,
      updated_at TIMESTAMP DEFAULT ${timestampDefault}
    )`,

    // 13. Activity Logs table
    `CREATE TABLE IF NOT EXISTS activity_logs (
      id ${uuidType},
      employee_id TEXT NOT NULL,
      action VARCHAR(100) NOT NULL,
      details TEXT,
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT ${timestampDefault}
    )`,

    // 14. Sync Queue table
    `CREATE TABLE IF NOT EXISTS sync_queue (
      id ${uuidType},
      table_name VARCHAR(50) NOT NULL,
      action_type VARCHAR(10) NOT NULL,
      record_id TEXT NOT NULL,
      payload ${jsonType} NOT NULL,
      created_at TIMESTAMP DEFAULT ${timestampDefault},
      retry_count INTEGER DEFAULT 0,
      last_error TEXT
    )`
  ];

  for (const createTableSql of tables) {
    await db.query(createTableSql);
  }

  // Create Indexes for search performance (<100ms requirement)
  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)`,
    `CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)`,
    `CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`,
    `CREATE INDEX IF NOT EXISTS idx_bins_code ON bins(code)`,
    `CREATE INDEX IF NOT EXISTS idx_employees_username ON employees(username)`,
    `CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at)`
  ];

  for (const createIndexSql of indexes) {
    try {
      await db.query(createIndexSql);
    } catch (e) {
      // In SQLite, index creation for fields that are unique keys could sometimes trigger warning, safe to catch
    }
  }

  // Seed default admin employee if table is empty
  const bcrypt = require('bcryptjs');
  const countRes = await db.query('SELECT COUNT(*) as count FROM employees');
  const count = parseInt(countRes.rows[0]?.count || countRes.rows[0]?.['COUNT(*)'] || '0');

  if (count === 0) {
    console.log('Seeding default employees...');
    const adminId = isPG ? 'a68be7de-ee7e-49b0-bc42-491c6e1f0e21' : 'admin-uuid';
    const pwdHash = await bcrypt.hash('admin123', 10);
    const pinHash = await bcrypt.hash('1234', 10);

    // Create Admin
    await db.query(
      `INSERT INTO employees (id, username, password_hash, full_name, role, pin_hash, biometric_enabled) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [adminId, 'admin', pwdHash, 'Thor Admin', 'Admin', pinHash, false]
    );

    // Create a Picker
    const pickerId = isPG ? 'b68be7de-ee7e-49b0-bc42-491c6e1f0e22' : 'picker-uuid';
    await db.query(
      `INSERT INTO employees (id, username, password_hash, full_name, role, pin_hash, biometric_enabled) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [pickerId, 'picker', pwdHash, 'Suresh Kumar', 'Picker', pinHash, false]
    );

    // Seed default settings for Admin
    await db.query(
      `INSERT INTO settings (id, employee_id, language, theme, scanner_beep, biometrics_enabled, sync_interval_mins)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [isPG ? 's68be7de-ee7e-49b0-bc42-491c6e1f0e21' : 'settings-admin-uuid', adminId, 'en', 'dark', true, false, 5]
    );

    // Seed some products and bins
    const binIds = [
      isPG ? 'c11be7de-ee7e-49b0-bc42-491c6e1f0e31' : 'bin-1',
      isPG ? 'c11be7de-ee7e-49b0-bc42-491c6e1f0e32' : 'bin-2',
      isPG ? 'c11be7de-ee7e-49b0-bc42-491c6e1f0e33' : 'bin-3'
    ];

    await db.query(`INSERT INTO bins (id, code, zone, aisle, shelf, level, capacity_m3) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [binIds[0], 'A-01-01', 'Fast-Moving', 1, 1, 1, 10.5]);
    await db.query(`INSERT INTO bins (id, code, zone, aisle, shelf, level, capacity_m3) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [binIds[1], 'A-01-02', 'Fast-Moving', 1, 1, 2, 10.5]);
    await db.query(`INSERT INTO bins (id, code, zone, aisle, shelf, level, capacity_m3) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [binIds[2], 'B-04-12', 'Cold Storage', 4, 4, 12, 5.0]);

    await db.query(
      `INSERT INTO products (id, sku, name, description, barcode, quantity, min_stock_level, bin_id, weight, dimensions) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [isPG ? 'd11be7de-ee7e-49b0-bc42-491c6e1f0e41' : 'prod-1', 'PROD-HAMMER', 'Thor Hammer Mjolnir', 'Industrial Grade Heavy Hammer', 'TH-HAMMER-001', 50, 5, binIds[0], 42.50, '50x20x15']
    );

    await db.query(
      `INSERT INTO products (id, sku, name, description, barcode, quantity, min_stock_level, bin_id, weight, dimensions) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [isPG ? 'd11be7de-ee7e-49b0-bc42-491c6e1f0e42' : 'prod-2', 'PROD-BOLT', 'Titanium Bolts M12', 'Grade 5 Titanium Industrial Bolts pack of 100', 'TI-BOLT-100', 450, 50, binIds[1], 1.20, '10x10x5']
    );

    await db.query(
      `INSERT INTO products (id, sku, name, description, barcode, quantity, min_stock_level, bin_id, weight, dimensions) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [isPG ? 'd11be7de-ee7e-49b0-bc42-491c6e1f0e43' : 'prod-3', 'PROD-CABLE', 'Copper Cable 50m', 'High conductivity power cabling roll', 'CU-CABLE-050', 12, 10, binIds[2], 8.50, '30x30x20']
    );
  }
}
