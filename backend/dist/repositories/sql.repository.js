"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLRepository = void 0;
class SQLRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    isSQLite() {
        return this.db.type === 'sqlite';
    }
    parseJSON(val) {
        if (!val)
            return null;
        if (typeof val === 'string') {
            try {
                return JSON.parse(val);
            }
            catch (e) {
                return val;
            }
        }
        return val;
    }
    stringifyJSON(val) {
        if (typeof val === 'string')
            return val;
        return JSON.stringify(val);
    }
    // Employees
    async findEmployeeByUsername(username) {
        const res = await this.db.query('SELECT * FROM employees WHERE username = $1', [username]);
        return res.rows[0] || null;
    }
    async findEmployeeById(id) {
        const res = await this.db.query('SELECT * FROM employees WHERE id = $1', [id]);
        return res.rows[0] || null;
    }
    async saveEmployee(employee) {
        await this.db.query(`INSERT INTO employees (id, username, password_hash, full_name, role, pin_hash, biometric_enabled, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
            employee.id,
            employee.username,
            employee.password_hash,
            employee.full_name,
            employee.role,
            employee.pin_hash || null,
            employee.biometric_enabled || false,
            employee.created_at || new Date(),
            employee.updated_at || new Date()
        ]);
    }
    async updateEmployeePin(id, pinHash) {
        await this.db.query('UPDATE employees SET pin_hash = $1, updated_at = $2 WHERE id = $3', [pinHash, new Date(), id]);
    }
    // Products
    async getProducts() {
        const res = await this.db.query('SELECT * FROM products ORDER BY name ASC');
        return res.rows;
    }
    async findProductById(id) {
        const res = await this.db.query('SELECT * FROM products WHERE id = $1', [id]);
        return res.rows[0] || null;
    }
    async findProductBySku(sku) {
        const res = await this.db.query('SELECT * FROM products WHERE sku = $1', [sku]);
        return res.rows[0] || null;
    }
    async findProductByBarcode(barcode) {
        const res = await this.db.query('SELECT * FROM products WHERE barcode = $1', [barcode]);
        return res.rows[0] || null;
    }
    async searchProducts(query) {
        const likeQuery = `%${query}%`;
        const res = await this.db.query('SELECT * FROM products WHERE sku LIKE $1 OR name LIKE $2 OR barcode LIKE $3 ORDER BY name ASC', [likeQuery, likeQuery, likeQuery]);
        return res.rows;
    }
    async saveProduct(product) {
        await this.db.query(`INSERT INTO products (id, sku, name, description, barcode, quantity, min_stock_level, bin_id, weight, dimensions, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`, [
            product.id,
            product.sku,
            product.name,
            product.description || null,
            product.barcode,
            product.quantity || 0,
            product.min_stock_level || 10,
            product.bin_id || null,
            product.weight || null,
            product.dimensions || null,
            product.created_at || new Date(),
            product.updated_at || new Date()
        ]);
    }
    async updateProductQuantity(id, quantity) {
        await this.db.query('UPDATE products SET quantity = $1, updated_at = $2 WHERE id = $3', [quantity, new Date(), id]);
    }
    // Bins
    async getBins() {
        const res = await this.db.query('SELECT * FROM bins ORDER BY code ASC');
        return res.rows;
    }
    async findBinById(id) {
        const res = await this.db.query('SELECT * FROM bins WHERE id = $1', [id]);
        return res.rows[0] || null;
    }
    async findBinByCode(code) {
        const res = await this.db.query('SELECT * FROM bins WHERE code = $1', [code]);
        return res.rows[0] || null;
    }
    async saveBin(bin) {
        await this.db.query(`INSERT INTO bins (id, code, zone, aisle, shelf, level, capacity_m3, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
            bin.id,
            bin.code,
            bin.zone,
            bin.aisle,
            bin.shelf,
            bin.level,
            bin.capacity_m3,
            bin.created_at || new Date(),
            bin.updated_at || new Date()
        ]);
    }
    // QR History
    async getQRHistory() {
        const res = await this.db.query('SELECT * FROM qr_history ORDER BY created_at DESC');
        return res.rows;
    }
    async saveQRHistory(qr) {
        await this.db.query(`INSERT INTO qr_history (id, product_id, generated_by, qr_data, label_type, printed_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
            qr.id,
            qr.product_id,
            qr.generated_by,
            qr.qr_data,
            qr.label_type,
            qr.printed_at || new Date(),
            qr.created_at || new Date()
        ]);
    }
    // Barcode History
    async getBarcodeHistory(limit = 50) {
        const res = await this.db.query('SELECT * FROM barcode_history ORDER BY created_at DESC LIMIT $1', [limit]);
        return res.rows;
    }
    async saveBarcodeHistory(barcodeLog) {
        await this.db.query(`INSERT INTO barcode_history (id, scanned_barcode, product_id, scanned_by, scan_status, device_info, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
            barcodeLog.id,
            barcodeLog.scanned_barcode,
            barcodeLog.product_id || null,
            barcodeLog.scanned_by,
            barcodeLog.scan_status,
            barcodeLog.device_info || null,
            barcodeLog.created_at || new Date()
        ]);
    }
    // Audits
    async getAudits() {
        const res = await this.db.query('SELECT * FROM audits ORDER BY scheduled_date DESC');
        return res.rows.map((row) => ({
            ...row,
            details: this.parseJSON(row.details)
        }));
    }
    async findAuditById(id) {
        const res = await this.db.query('SELECT * FROM audits WHERE id = $1', [id]);
        if (!res.rows[0])
            return null;
        return {
            ...res.rows[0],
            details: this.parseJSON(res.rows[0].details)
        };
    }
    async saveAudit(audit) {
        await this.db.query(`INSERT INTO audits (id, title, scheduled_date, status, assigned_to, details, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
            audit.id,
            audit.title,
            audit.scheduled_date,
            audit.status,
            audit.assigned_to,
            this.stringifyJSON(audit.details),
            audit.created_at || new Date(),
            audit.updated_at || new Date()
        ]);
    }
    async updateAuditStatus(id, status) {
        await this.db.query('UPDATE audits SET status = $1, updated_at = $2 WHERE id = $3', [status, new Date(), id]);
    }
    async updateAuditDetails(id, details) {
        await this.db.query('UPDATE audits SET details = $1, updated_at = $2 WHERE id = $3', [
            this.stringifyJSON(details),
            new Date(),
            id
        ]);
    }
    // Reports
    async getReports() {
        const res = await this.db.query('SELECT * FROM reports ORDER BY created_at DESC');
        return res.rows;
    }
    async saveReport(report) {
        await this.db.query(`INSERT INTO reports (id, title, report_type, format, file_path, generated_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
            report.id,
            report.title,
            report.report_type,
            report.format,
            report.file_path,
            report.generated_by,
            report.created_at || new Date()
        ]);
    }
    // Issues
    async getIssues() {
        const res = await this.db.query('SELECT * FROM issues ORDER BY created_at DESC');
        return res.rows;
    }
    async findIssueById(id) {
        const res = await this.db.query('SELECT * FROM issues WHERE id = $1', [id]);
        return res.rows[0] || null;
    }
    async saveIssue(issue) {
        await this.db.query(`INSERT INTO issues (id, product_id, reported_by, audit_id, issue_type, severity, description, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, [
            issue.id,
            issue.product_id,
            issue.reported_by,
            issue.audit_id || null,
            issue.issue_type,
            issue.severity,
            issue.description,
            issue.status,
            issue.created_at || new Date(),
            issue.updated_at || new Date()
        ]);
    }
    async updateIssueStatus(id, status) {
        await this.db.query('UPDATE issues SET status = $1, updated_at = $2 WHERE id = $3', [status, new Date(), id]);
    }
    // Notifications
    async getNotifications(employeeId) {
        const res = await this.db.query('SELECT * FROM notifications WHERE employee_id = $1 ORDER BY created_at DESC', [
            employeeId
        ]);
        return res.rows;
    }
    async saveNotification(notification) {
        await this.db.query(`INSERT INTO notifications (id, employee_id, title, message, is_read, type, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
            notification.id,
            notification.employee_id,
            notification.title,
            notification.message,
            notification.is_read || false,
            notification.type,
            notification.created_at || new Date()
        ]);
    }
    async markNotificationRead(id) {
        await this.db.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [id]);
    }
    // Favorites
    async getFavorites(employeeId) {
        const res = await this.db.query(`SELECT f.*, p.sku, p.name, p.barcode, p.quantity 
       FROM favorites f 
       JOIN products p ON f.product_id = p.id 
       WHERE f.employee_id = $1 
       ORDER BY f.created_at DESC`, [employeeId]);
        return res.rows;
    }
    async addFavorite(id, employeeId, productId) {
        await this.db.query('INSERT INTO favorites (id, employee_id, product_id, created_at) VALUES ($1, $2, $3, $4)', [
            id,
            employeeId,
            productId,
            new Date()
        ]);
    }
    async deleteFavorite(employeeId, productId) {
        await this.db.query('DELETE FROM favorites WHERE employee_id = $1 AND product_id = $2', [employeeId, productId]);
    }
    // Recent Searches
    async getRecentSearches(employeeId, limit = 10) {
        const res = await this.db.query('SELECT * FROM recent_searches WHERE employee_id = $1 ORDER BY created_at DESC LIMIT $2', [employeeId, limit]);
        return res.rows;
    }
    async addRecentSearch(id, employeeId, query) {
        // Delete oldest search if count > 10 for employee (simple maintenance)
        await this.db.query(`DELETE FROM recent_searches 
       WHERE employee_id = $1 
       AND id NOT IN (
         SELECT id FROM recent_searches 
         WHERE employee_id = $1 
         ORDER BY created_at DESC 
         LIMIT 9
       )`, [employeeId]);
        await this.db.query('INSERT INTO recent_searches (id, employee_id, query, created_at) VALUES ($1, $2, $3, $4)', [id, employeeId, query, new Date()]);
    }
    // Settings
    async getSettingsByEmployeeId(employeeId) {
        const res = await this.db.query('SELECT * FROM settings WHERE employee_id = $1', [employeeId]);
        return res.rows[0] || null;
    }
    async saveSettings(settings) {
        const isSQLite = this.isSQLite();
        const existing = await this.getSettingsByEmployeeId(settings.employee_id);
        if (existing) {
            await this.db.query(`UPDATE settings 
         SET language = $1, theme = $2, scanner_beep = $3, biometrics_enabled = $4, sync_interval_mins = $5, updated_at = $6
         WHERE employee_id = $7`, [
                settings.language || 'en',
                settings.theme || 'dark',
                settings.scanner_beep !== undefined ? settings.scanner_beep : true,
                settings.biometrics_enabled !== undefined ? settings.biometrics_enabled : false,
                settings.sync_interval_mins || 5,
                new Date(),
                settings.employee_id
            ]);
        }
        else {
            await this.db.query(`INSERT INTO settings (id, employee_id, language, theme, scanner_beep, biometrics_enabled, sync_interval_mins, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
                settings.id,
                settings.employee_id,
                settings.language || 'en',
                settings.theme || 'dark',
                settings.scanner_beep !== undefined ? settings.scanner_beep : true,
                settings.biometrics_enabled !== undefined ? settings.biometrics_enabled : false,
                settings.sync_interval_mins || 5,
                new Date()
            ]);
        }
    }
    // Activity Logs
    async getActivityLogs(limit = 100) {
        const res = await this.db.query(`SELECT l.*, e.username, e.full_name 
       FROM activity_logs l 
       JOIN employees e ON l.employee_id = e.id 
       ORDER BY l.created_at DESC LIMIT $1`, [limit]);
        return res.rows;
    }
    async saveActivityLog(log) {
        await this.db.query(`INSERT INTO activity_logs (id, employee_id, action, details, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`, [log.id, log.employee_id, log.action, log.details || null, log.ip_address || null, log.created_at || new Date()]);
    }
    // Sync Queue
    async getSyncQueue(limit = 100) {
        const res = await this.db.query('SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT $1', [limit]);
        return res.rows.map((row) => ({
            ...row,
            payload: this.parseJSON(row.payload)
        }));
    }
    async saveSyncQueue(item) {
        await this.db.query(`INSERT INTO sync_queue (id, table_name, action_type, record_id, payload, created_at, retry_count, last_error)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
            item.id,
            item.table_name,
            item.action_type,
            item.record_id,
            this.stringifyJSON(item.payload),
            item.created_at || new Date(),
            item.retry_count || 0,
            item.last_error || null
        ]);
    }
    async deleteSyncQueueItem(id) {
        await this.db.query('DELETE FROM sync_queue WHERE id = $1', [id]);
    }
    async incrementSyncQueueRetry(id, error) {
        await this.db.query('UPDATE sync_queue SET retry_count = retry_count + 1, last_error = $1 WHERE id = $2', [error, id]);
    }
}
exports.SQLRepository = SQLRepository;
exports.default = SQLRepository;
//# sourceMappingURL=sql.repository.js.map