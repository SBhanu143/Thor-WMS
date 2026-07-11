"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../config/db");
const sql_repository_1 = require("../repositories/sql.repository");
const auth_controller_1 = require("../controllers/auth.controller");
const warehouse_controller_1 = require("../controllers/warehouse.controller");
const report_controller_1 = require("../controllers/report.controller");
const sync_controller_1 = require("../controllers/sync.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Lazy initialize repos and controllers to ensure db setup runs first
const db = (0, db_1.getDatabase)();
const repo = new sql_repository_1.SQLRepository(db);
const authCtrl = new auth_controller_1.AuthController(repo);
const whCtrl = new warehouse_controller_1.WarehouseController(repo);
const repCtrl = new report_controller_1.ReportController(repo);
const syncCtrl = new sync_controller_1.SyncController(repo);
// PUBLIC AUTH ROUTES
router.post('/auth/login', authCtrl.login);
router.post('/auth/pin-login', authCtrl.pinLogin);
router.post('/auth/biometric-login', authCtrl.biometricLogin);
// AUTHENTICATED AUTH ROUTES
router.get('/auth/profile', auth_middleware_1.authenticateJWT, authCtrl.getProfile);
router.post('/auth/settings', auth_middleware_1.authenticateJWT, authCtrl.saveSettings);
// PRODUCTS & BINS CATALOG
router.get('/products', auth_middleware_1.authenticateJWT, whCtrl.getProducts);
router.get('/products/search', auth_middleware_1.authenticateJWT, whCtrl.searchProducts);
router.get('/bins', auth_middleware_1.authenticateJWT, whCtrl.getBins);
router.post('/bins', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRole)(['Admin', 'WarehouseManager']), whCtrl.createBin);
// BARCODE & SCANS
router.post('/scan', auth_middleware_1.authenticateJWT, whCtrl.registerScan);
router.get('/scan/history', auth_middleware_1.authenticateJWT, whCtrl.getBarcodeHistory);
// AUDITS & CYCLE COUNTING
router.get('/audits', auth_middleware_1.authenticateJWT, whCtrl.getAudits);
router.post('/audits', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRole)(['Admin', 'WarehouseManager', 'TeamLeader']), whCtrl.createAudit);
router.post('/audits/:id/submit', auth_middleware_1.authenticateJWT, whCtrl.submitAuditResults);
// STOCK ISSUES
router.get('/issues', auth_middleware_1.authenticateJWT, whCtrl.getIssues);
router.post('/issues', auth_middleware_1.authenticateJWT, whCtrl.reportIssue);
router.post('/issues/:id/resolve', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRole)(['Admin', 'WarehouseManager', 'InventoryController']), whCtrl.resolveIssue);
// NOTIFICATIONS & PREFERENCES
router.get('/favorites', auth_middleware_1.authenticateJWT, whCtrl.getFavorites);
router.post('/favorites', auth_middleware_1.authenticateJWT, whCtrl.addFavorite);
router.delete('/favorites/:product_id', auth_middleware_1.authenticateJWT, whCtrl.removeFavorite);
router.get('/notifications', auth_middleware_1.authenticateJWT, whCtrl.getNotifications);
postMarkNotificationRead();
// SYNC
router.post('/sync', auth_middleware_1.authenticateJWT, syncCtrl.sync);
// REPORTS & EXPORTS
router.get('/reports', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRole)(['Admin', 'WarehouseManager']), repCtrl.getReportsList);
router.get('/reports/export', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRole)(['Admin', 'WarehouseManager']), repCtrl.exportReport);
// ADMIN ACTIVITY LOGS & AUDIT TRAILS
router.get('/activity-logs', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requireRole)(['Admin', 'WarehouseManager']), whCtrl.getActivityLogs);
router.get('/recent-searches', auth_middleware_1.authenticateJWT, whCtrl.getRecentSearches);
function postMarkNotificationRead() {
    router.post('/notifications/:id/read', auth_middleware_1.authenticateJWT, whCtrl.markNotificationRead);
}
exports.default = router;
//# sourceMappingURL=api.routes.js.map