import 'package:flutter/material.dart';
import '../../data/repositories/wms_repository.dart';

class ScannerViewModel extends ChangeNotifier {
  final WMSRepository _repo = WMSRepository();

  bool _isLoading = false;
  String? _scanResult;
  bool _isMatch = false;
  Map<String, dynamic>? _matchedProduct;

  bool get isLoading => _isLoading;
  String? get scanResult => _scanResult;
  bool get isMatch => _isMatch;
  Map<String, dynamic>? get matchedProduct => _matchedProduct;

  Future<void> scanBarcode(String barcode) async {
    _isLoading = true;
    _scanResult = null;
    _matchedProduct = null;
    notifyListeners();

    try {
      final res = await _repo.registerBarcodeScan(barcode);
      _isMatch = res['matched'] ?? false;
      _scanResult = res['scanStatus'];
      _matchedProduct = res['product'];
    } catch (e) {
      _isMatch = false;
      _scanResult = 'Error during scan verification';
    }

    _isLoading = false;
    notifyListeners();
  }

  void reset() {
    _scanResult = null;
    _matchedProduct = null;
    _isMatch = false;
    notifyListeners();
  }
}
