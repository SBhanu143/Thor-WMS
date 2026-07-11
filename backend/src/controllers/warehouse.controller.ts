import { Response } from 'express';
import { WMSRepository } from '../repositories/base.repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class WarehouseController {
  private repo: WMSRepository;

  constructor(repo: WMSRepository) {
    this.repo = repo;
  }

  // Products
  getProducts = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const products = await this.repo.getProducts();
      return res.status(200).json(products);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve products.' });
    }
  };

  searchProducts = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: 'Search query is required.' });
      }

      // Add to recent searches if authenticated
      if (req.user) {
        const id = `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await this.repo.addRecentSearch(id, req.user.id, query);
      }

      const startTime = Date.now();
      const products = await this.repo.searchProducts(query);
      const searchTimeMs = Date.now() - startTime;

      // Ensure search complies with <100ms requirement
      res.setHeader('X-Search-Time-Ms', searchTimeMs.toString());

      return res.status(200).json(products);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to search products.' });
    }
  };

  // Bins
  getBins = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const bins = await this.repo.getBins();
      return res.status(200).json(bins);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve bins.' });
    }
  };

  createBin = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { code, zone, aisle, shelf, level, capacity_m3 } = req.body;
      if (!code || !zone || aisle === undefined || shelf === undefined || level === undefined || capacity_m3 === undefined) {
        return res.status(400).json({ error: 'Missing required bin parameters.' });
      }

      const existing = await this.repo.findBinByCode(code);
      if (existing) {
        return res.status(409).json({ error: 'Bin code already exists.' });
      }

      const id = `bin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const bin = { id, code, zone, aisle, shelf, level, capacity_m3 };
      await this.repo.saveBin(bin);

      if (req.user) {
        await this.repo.saveActivityLog({
          id: `log-${Date.now()}`,
          employee_id: req.user.id,
          action: 'CREATE_BIN',
          details: `Bin ${code} created in Zone ${zone}.`
        });
      }

      return res.status(201).json(bin);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create bin.' });
    }
  };

  // Barcode / Scanner
  registerScan = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { barcode, deviceInfo } = req.body;
      if (!barcode) {
        return res.status(400).json({ error: 'Barcode is required.' });
      }

      const employeeId = req.user ? req.user.id : 'unknown-user';
      const product = await this.repo.findProductByBarcode(barcode);

      const scanStatus = product ? 'Match' : 'Mismatch';
      const id = `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const barcodeLog = {
        id,
        scanned_barcode: barcode,
        product_id: product ? product.id : null,
        scanned_by: employeeId,
        scan_status: scanStatus,
        device_info: deviceInfo || 'Desktop/Mobile Agent'
      };

      await this.repo.saveBarcodeHistory(barcodeLog);

      if (scanStatus === 'Mismatch') {
        // Automatically save alert notification for auditors / inventory controllers
        const managers = await this.repo.findEmployeeByUsername('admin');
        if (managers) {
          await this.repo.saveNotification({
            id: `notif-${Date.now()}`,
            employee_id: managers.id,
            title: 'Barcode Mismatch Warning',
            message: `Scanned code '${barcode}' did not match any stored records. Logged by device: ${deviceInfo || 'N/A'}.`,
            is_read: false,
            type: 'SystemAlert'
          });
        }
      }

      return res.status(200).json({
        matched: !!product,
        scanStatus,
        product: product || null
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to register scan.' });
    }
  };

  getBarcodeHistory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const history = await this.repo.getBarcodeHistory();
      return res.status(200).json(history);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve barcode scan logs.' });
    }
  };

  // Audits
  getAudits = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const audits = await this.repo.getAudits();
      return res.status(200).json(audits);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve audits list.' });
    }
  };

  createAudit = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { title, scheduled_date, assigned_to, details } = req.body;
      if (!title || !scheduled_date || !assigned_to || !details) {
        return res.status(400).json({ error: 'Title, scheduled date, assignee, and item details are required.' });
      }

      const id = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const audit = {
        id,
        title,
        scheduled_date,
        status: 'Pending',
        assigned_to,
        details
      };

      await this.repo.saveAudit(audit);

      // Create notification for assignee
      await this.repo.saveNotification({
        id: `notif-${Date.now()}`,
        employee_id: assigned_to,
        title: 'New Cycle Count Audit Assigned',
        message: `You have been assigned to conduct: ${title}. Scheduled date: ${scheduled_date}.`,
        is_read: false,
        type: 'AuditReminder'
      });

      return res.status(201).json(audit);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to create audit schedule.' });
    }
  };

  submitAuditResults = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { details } = req.body; // Array of { productId, expected, counted }

      const audit = await this.repo.findAuditById(id);
      if (!audit) {
        return res.status(404).json({ error: 'Audit file not found.' });
      }

      // Update details and mark audit as Completed
      await this.repo.updateAuditDetails(id, details);
      await this.repo.updateAuditStatus(id, 'Completed');

      // Sync counts to products table and report discrepancies
      for (const item of details) {
        if (item.counted !== item.expected) {
          // Discrepancy found!
          // Log an issue automatically
          const issueId = `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          await this.repo.saveIssue({
            id: issueId,
            product_id: item.product_id,
            reported_by: req.user ? req.user.id : 'system',
            audit_id: id,
            issue_type: 'Mismatch',
            severity: 'Medium',
            description: `Audit mismatch on product. Expected: ${item.expected}, Counted: ${item.counted}. Discrepancy: ${item.counted - item.expected}`,
            status: 'Open'
          });
        }
        // Correct inventory quantities
        await this.repo.updateProductQuantity(item.product_id, item.counted);
      }

      if (req.user) {
        await this.repo.saveActivityLog({
          id: `log-${Date.now()}`,
          employee_id: req.user.id,
          action: 'COMPLETE_AUDIT',
          details: `Completed cycle count audit: ${audit.title}. Stock updated.`
        });
      }

      return res.status(200).json({ message: 'Audit completed successfully. Inventory reconciled.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to submit audit counts.' });
    }
  };

  // Issues
  getIssues = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const issues = await this.repo.getIssues();
      return res.status(200).json(issues);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve stock issues.' });
    }
  };

  reportIssue = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { product_id, audit_id, issue_type, severity, description } = req.body;
      if (!product_id || !issue_type || !severity || !description) {
        return res.status(400).json({ error: 'Product ID, issue type, severity, and description are required.' });
      }

      const id = `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const issue = {
        id,
        product_id,
        reported_by: req.user ? req.user.id : 'unknown-user',
        audit_id: audit_id || null,
        issue_type,
        severity,
        description,
        status: 'Open'
      };

      await this.repo.saveIssue(issue);

      return res.status(201).json(issue);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to log product issue.' });
    }
  };

  resolveIssue = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const issue = await this.repo.findIssueById(id);
      if (!issue) {
        return res.status(404).json({ error: 'Issue log not found.' });
      }

      await this.repo.updateIssueStatus(id, 'Resolved');

      if (req.user) {
        await this.repo.saveActivityLog({
          id: `log-${Date.now()}`,
          employee_id: req.user.id,
          action: 'RESOLVE_ISSUE',
          details: `Resolved stock issue ${id}.`
        });
      }

      return res.status(200).json({ message: 'Issue resolved.' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to resolve issue.' });
    }
  };

  // Favorites
  getFavorites = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
      const list = await this.repo.getFavorites(req.user.id);
      return res.status(200).json(list);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch favorites.' });
    }
  };

  addFavorite = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
      const { product_id } = req.body;
      if (!product_id) return res.status(400).json({ error: 'Product ID required.' });

      const id = `fav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await this.repo.addFavorite(id, req.user.id, product_id);
      return res.status(200).json({ message: 'Added to favorites.' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to add favorite.' });
    }
  };

  removeFavorite = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
      const { product_id } = req.params;

      await this.repo.deleteFavorite(req.user.id, product_id);
      return res.status(200).json({ message: 'Removed from favorites.' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to remove favorite.' });
    }
  };

  // Notifications
  getNotifications = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
      const list = await this.repo.getNotifications(req.user.id);
      return res.status(200).json(list);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve notifications.' });
    }
  };

  markNotificationRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      await this.repo.markNotificationRead(id);
      return res.status(200).json({ message: 'Notification marked as read.' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to mark notification.' });
    }
  };

  // Activity Logs & Audit trails
  getActivityLogs = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const logs = await this.repo.getActivityLogs();
      return res.status(200).json(logs);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve activity trails.' });
    }
  };

  getRecentSearches = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
      const searches = await this.repo.getRecentSearches(req.user.id);
      return res.status(200).json(searches);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve recent searches.' });
    }
  };
}
