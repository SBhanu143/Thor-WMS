export interface WMSRepository {
  // Employees
  findEmployeeByUsername(username: string): Promise<any>;
  findEmployeeById(id: string): Promise<any>;
  saveEmployee(employee: any): Promise<void>;
  updateEmployeePin(id: string, pinHash: string): Promise<void>;

  // Products
  getProducts(): Promise<any[]>;
  findProductById(id: string): Promise<any>;
  findProductBySku(sku: string): Promise<any>;
  findProductByBarcode(barcode: string): Promise<any>;
  searchProducts(query: string): Promise<any[]>;
  saveProduct(product: any): Promise<void>;
  updateProductQuantity(id: string, quantity: number): Promise<void>;

  // Bins
  getBins(): Promise<any[]>;
  findBinById(id: string): Promise<any>;
  findBinByCode(code: string): Promise<any>;
  saveBin(bin: any): Promise<void>;

  // QR History
  getQRHistory(): Promise<any[]>;
  saveQRHistory(qr: any): Promise<void>;

  // Barcode History
  getBarcodeHistory(limit?: number): Promise<any[]>;
  saveBarcodeHistory(barcodeLog: any): Promise<void>;

  // Audits
  getAudits(): Promise<any[]>;
  findAuditById(id: string): Promise<any>;
  saveAudit(audit: any): Promise<void>;
  updateAuditStatus(id: string, status: string): Promise<void>;
  updateAuditDetails(id: string, details: string): Promise<void>;

  // Reports
  getReports(): Promise<any[]>;
  saveReport(report: any): Promise<void>;

  // Issues
  getIssues(): Promise<any[]>;
  findIssueById(id: string): Promise<any>;
  saveIssue(issue: any): Promise<void>;
  updateIssueStatus(id: string, status: string): Promise<void>;

  // Notifications
  getNotifications(employeeId: string): Promise<any[]>;
  saveNotification(notification: any): Promise<void>;
  markNotificationRead(id: string): Promise<void>;

  // Favorites
  getFavorites(employeeId: string): Promise<any[]>;
  addFavorite(id: string, employeeId: string, productId: string): Promise<void>;
  deleteFavorite(employeeId: string, productId: string): Promise<void>;

  // Recent Searches
  getRecentSearches(employeeId: string, limit?: number): Promise<any[]>;
  addRecentSearch(id: string, employeeId: string, query: string): Promise<void>;

  // Settings
  getSettingsByEmployeeId(employeeId: string): Promise<any>;
  saveSettings(settings: any): Promise<void>;

  // Activity Logs
  getActivityLogs(limit?: number): Promise<any[]>;
  saveActivityLog(log: any): Promise<void>;

  // Sync Queue
  getSyncQueue(limit?: number): Promise<any[]>;
  saveSyncQueue(item: any): Promise<void>;
  deleteSyncQueueItem(id: string): Promise<void>;
  incrementSyncQueueRetry(id: string, error: string): Promise<void>;
}
