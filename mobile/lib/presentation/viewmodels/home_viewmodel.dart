import 'package:flutter/material.dart';
import '../../data/repositories/wms_repository.dart';
import '../../services/sync_manager.dart';

class HomeViewModel extends ChangeNotifier {
  final WMSRepository _repo = WMSRepository();

  List<Map<String, dynamic>> _products = [];
  List<Map<String, dynamic>> _bins = [];
  List<Map<String, dynamic>> _audits = [];
  bool _isLoading = false;
  bool _isSyncing = false;

  List<Map<String, dynamic>> get products => _products;
  List<Map<String, dynamic>> get bins => _bins;
  List<Map<String, dynamic>> get audits => _audits;
  bool get isLoading => _isLoading;
  bool get isSyncing => _isSyncing;

  HomeViewModel() {
    loadLocalData();
  }

  Future<void> loadLocalData() async {
    _isLoading = true;
    notifyListeners();

    try {
      _products = await _repo.getProducts();
      _bins = await _repo.getBins();
      _audits = await _repo.getAudits();
    } catch (e) {
      print('Failed to load local DB data: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> triggerSync() async {
    _isSyncing = true;
    notifyListeners();

    final success = await SyncManager.instance.synchronize();
    
    // Reload local DB records
    await loadLocalData();
    
    _isSyncing = false;
    notifyListeners();
    return success;
  }

  Future<void> submitAuditResults(String auditId, List<dynamic> details) async {
    _isLoading = true;
    notifyListeners();

    await _repo.submitAudit(auditId, details);
    await loadLocalData();

    _isLoading = false;
    notifyListeners();

    // Trigger an background sync try
    triggerSync();
  }

  Future<void> logIssue(String productId, String type, String severity, String desc) async {
    _isLoading = true;
    notifyListeners();

    await _repo.logStockIssue(productId, type, severity, desc);
    _isLoading = false;
    notifyListeners();

    triggerSync();
  }
}
