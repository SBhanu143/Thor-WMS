import { Router } from 'express';
import { getDatabase } from '../config/db';
import { SQLRepository } from '../repositories/sql.repository';
import { AuthController } from '../controllers/auth.controller';
import { WarehouseController } from '../controllers/warehouse.controller';
import { ReportController } from '../controllers/report.controller';
import { SyncController } from '../controllers/sync.controller';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Lazy initialize repos and controllers to ensure db setup runs first
const db = getDatabase();
const repo = new SQLRepository(db);

const authCtrl = new AuthController(repo);
const whCtrl = new WarehouseController(repo);
const repCtrl = new ReportController(repo);
const syncCtrl = new SyncController(repo);

// PUBLIC AUTH ROUTES
router.post('/auth/login', authCtrl.login);
router.post('/auth/pin-login', authCtrl.pinLogin);
router.post('/auth/biometric-login', authCtrl.biometricLogin);

// AUTHENTICATED AUTH ROUTES
router.get('/auth/profile', authenticateJWT, authCtrl.getProfile);
router.post('/auth/settings', authenticateJWT, authCtrl.saveSettings);

// PRODUCTS & BINS CATALOG
router.get('/products', authenticateJWT, whCtrl.getProducts);
router.get('/products/search', authenticateJWT, whCtrl.searchProducts);
router.get('/bins', authenticateJWT, whCtrl.getBins);
router.post(
  '/bins',
  authenticateJWT,
  requireRole(['Admin', 'WarehouseManager']),
  whCtrl.createBin
);

// BARCODE & SCANS
router.post('/scan', authenticateJWT, whCtrl.registerScan);
router.get('/scan/history', authenticateJWT, whCtrl.getBarcodeHistory);

// AUDITS & CYCLE COUNTING
router.get('/audits', authenticateJWT, whCtrl.getAudits);
router.post(
  '/audits',
  authenticateJWT,
  requireRole(['Admin', 'WarehouseManager', 'TeamLeader']),
  whCtrl.createAudit
);
router.post('/audits/:id/submit', authenticateJWT, whCtrl.submitAuditResults);

// STOCK ISSUES
router.get('/issues', authenticateJWT, whCtrl.getIssues);
router.post('/issues', authenticateJWT, whCtrl.reportIssue);
router.post(
  '/issues/:id/resolve',
  authenticateJWT,
  requireRole(['Admin', 'WarehouseManager', 'InventoryController']),
  whCtrl.resolveIssue
);

// NOTIFICATIONS & PREFERENCES
router.get('/favorites', authenticateJWT, whCtrl.getFavorites);
router.post('/favorites', authenticateJWT, whCtrl.addFavorite);
router.delete('/favorites/:product_id', authenticateJWT, whCtrl.removeFavorite);

router.get('/notifications', authenticateJWT, whCtrl.getNotifications);
postMarkNotificationRead();

// SYNC
router.post('/sync', authenticateJWT, syncCtrl.sync);

// REPORTS & EXPORTS
router.get(
  '/reports',
  authenticateJWT,
  requireRole(['Admin', 'WarehouseManager']),
  repCtrl.getReportsList
);
router.get(
  '/reports/export',
  authenticateJWT,
  requireRole(['Admin', 'WarehouseManager']),
  repCtrl.exportReport
);

// ADMIN ACTIVITY LOGS & AUDIT TRAILS
router.get(
  '/activity-logs',
  authenticateJWT,
  requireRole(['Admin', 'WarehouseManager']),
  whCtrl.getActivityLogs
);
router.get('/recent-searches', authenticateJWT, whCtrl.getRecentSearches);

function postMarkNotificationRead() {
  router.post('/notifications/:id/read', authenticateJWT, whCtrl.markNotificationRead);
}

export default router;
