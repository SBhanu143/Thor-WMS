"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncController = void 0;
const db_1 = require("../config/db");
class SyncController {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    sync = async (req, res) => {
        const db = (0, db_1.getDatabase)();
        const { queue } = req.body; // Array of sync items: { id, table_name, action_type, record_id, payload, created_at }
        if (!Array.isArray(queue)) {
            return res.status(400).json({ error: 'Sync queue must be an array.' });
        }
        const syncedIds = [];
        const syncErrors = [];
        console.log(`Processing inbound sync payload of ${queue.length} items...`);
        // Process each queue item inside a database transaction if supported, or sequentially
        for (const item of queue) {
            try {
                const { id, table_name, action_type, record_id, payload, created_at } = item;
                // Perform table-specific sync updates
                if (table_name === 'barcode_history') {
                    // Sync scanned barcodes history (just insert)
                    const exists = await db.query('SELECT 1 FROM barcode_history WHERE id = $1', [record_id]);
                    if (exists.rows.length === 0) {
                        await this.repo.saveBarcodeHistory({
                            id: record_id,
                            scanned_barcode: payload.scanned_barcode,
                            product_id: payload.product_id,
                            scanned_by: payload.scanned_by,
                            scan_status: payload.scan_status,
                            device_info: payload.device_info,
                            created_at: payload.created_at
                        });
                    }
                }
                else if (table_name === 'issues') {
                    // Sync logged issues
                    const exists = await db.query('SELECT id, updated_at FROM issues WHERE id = $1', [record_id]);
                    if (exists.rows.length === 0) {
                        await this.repo.saveIssue({
                            id: record_id,
                            product_id: payload.product_id,
                            reported_by: payload.reported_by,
                            audit_id: payload.audit_id,
                            issue_type: payload.issue_type,
                            severity: payload.severity,
                            description: payload.description,
                            status: payload.status,
                            created_at: payload.created_at,
                            updated_at: payload.updated_at
                        });
                    }
                    else {
                        // Conflict check
                        const serverUpdated = new Date(exists.rows[0].updated_at || exists.rows[0].UPDATED_AT);
                        const clientUpdated = new Date(payload.updated_at || created_at);
                        if (clientUpdated > serverUpdated) {
                            await this.repo.updateIssueStatus(record_id, payload.status);
                        }
                    }
                }
                else if (table_name === 'audits') {
                    // Sync completed audits
                    const exists = await db.query('SELECT id, updated_at, status FROM audits WHERE id = $1', [record_id]);
                    if (exists.rows.length > 0) {
                        const serverUpdated = new Date(exists.rows[0].updated_at || exists.rows[0].UPDATED_AT);
                        const clientUpdated = new Date(payload.updated_at || created_at);
                        // If client has audit updates (e.g. count results) and client modified it later, apply details
                        if (clientUpdated > serverUpdated && exists.rows[0].status !== 'Completed') {
                            await this.repo.updateAuditDetails(record_id, payload.details);
                            await this.repo.updateAuditStatus(record_id, payload.status);
                            // Apply reconciled counts to products
                            if (payload.status === 'Completed' && Array.isArray(payload.details)) {
                                for (const detail of payload.details) {
                                    await this.repo.updateProductQuantity(detail.product_id, detail.counted);
                                    if (detail.counted !== detail.expected) {
                                        // Log discrepancy issue
                                        const issueId = `issue-sync-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                                        await this.repo.saveIssue({
                                            id: issueId,
                                            product_id: detail.product_id,
                                            reported_by: payload.assigned_to || 'system',
                                            audit_id: record_id,
                                            issue_type: 'Mismatch',
                                            severity: 'Medium',
                                            description: `Audit mismatch synced from mobile. Expected: ${detail.expected}, Counted: ${detail.counted}.`,
                                            status: 'Open'
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
                else if (table_name === 'products') {
                    // Update product counts (e.g. picker picked items offline)
                    const exists = await db.query('SELECT id, quantity, updated_at FROM products WHERE id = $1', [record_id]);
                    if (exists.rows.length > 0) {
                        const serverUpdated = new Date(exists.rows[0].updated_at || exists.rows[0].UPDATED_AT);
                        const clientUpdated = new Date(payload.updated_at || created_at);
                        if (clientUpdated > serverUpdated) {
                            await this.repo.updateProductQuantity(record_id, payload.quantity);
                        }
                        else {
                            // Conflict resolution (Merge quantities by checking delta adjustments if required)
                            console.log(`Conflict detected for product ${record_id}. Server is newer. Skipping client overwrite.`);
                            // Log activity override
                            await this.repo.saveActivityLog({
                                id: `log-conf-${Date.now()}`,
                                employee_id: req.user ? req.user.id : 'system',
                                action: 'SYNC_CONFLICT',
                                details: `Conflict bypassed for product SKU: ${payload.sku}. Server record was newer.`
                            });
                        }
                    }
                }
                // Add to successful sync IDs
                syncedIds.push(id);
            }
            catch (err) {
                console.error(`Sync error on item ${item.id}:`, err);
                syncErrors.push({
                    id: item.id,
                    error: err.message || 'Unknown sync error.'
                });
            }
        }
        // Load master data to return to client (products, bins, audits assigned to the current user)
        try {
            const products = await this.repo.getProducts();
            const bins = await this.repo.getBins();
            let audits = [];
            if (req.user) {
                audits = await this.repo.getAudits();
                // Filters audits for non-managers
                if (req.user.role !== 'Admin' && req.user.role !== 'WarehouseManager') {
                    audits = audits.filter(a => a.assigned_to === req.user?.id);
                }
            }
            return res.status(200).json({
                syncedIds,
                errors: syncErrors,
                master: {
                    products,
                    bins,
                    audits
                }
            });
        }
        catch (dbErr) {
            console.error('Failed to load master sync databases:', dbErr);
            return res.status(200).json({
                syncedIds,
                errors: syncErrors,
                master: null
            });
        }
    };
}
exports.SyncController = SyncController;
exports.default = SyncController;
//# sourceMappingURL=sync.controller.js.map