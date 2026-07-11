import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import '../../services/sqlite_helper.dart';

class WMSRepository {
  final _secureStorage = const FlutterSecureStorage();

  // Authentication API calls
  Future<Map<String, dynamic>> login(String username, String password, String apiBase) async {
    try {
      final res = await http.post(
        Uri.parse('$apiBase/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'username': username, 'password': password}),
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        
        // Cache credentials for offline fallback
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', data['token']);
        await prefs.setString('api_base', apiBase);
        await prefs.setString('logged_in_username', username);
        await prefs.setString('logged_in_user_id', data['employee']['id']);
        await prefs.setString('logged_in_user_name', data['employee']['full_name']);
        await prefs.setString('logged_in_user_role', data['employee']['role']);
        
        // Store PIN and user credentials securely for offline authentication
        await _secureStorage.write(key: 'cached_username', value: username);
        await _secureStorage.write(key: 'cached_password', value: password);

        return {'success': true, 'employee': data['employee']};
      }
    } catch (e) {
      print('Network Login Error, trying offline credentials: $e');
    }

    // Offline login check
    final cachedUser = await _secureStorage.read(key: 'cached_username');
    final cachedPass = await _secureStorage.read(key: 'cached_password');

    if (cachedUser == username && cachedPass == password) {
      final prefs = await SharedPreferences.getInstance();
      return {
        'success': true,
        'employee': {
          'id': prefs.getString('logged_in_user_id') ?? 'offline-uuid',
          'username': username,
          'full_name': prefs.getString('logged_in_user_name') ?? 'Offline Worker',
          'role': prefs.getString('logged_in_user_role') ?? 'Picker',
          'biometric_enabled': false
        }
      };
    }

    return {'success': false, 'error': 'Invalid credentials.'};
  }

  Future<Map<String, dynamic>> pinLogin(String username, String pin, String apiBase) async {
    try {
      final res = await http.post(
        Uri.parse('$apiBase/auth/pin-login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'username': username, 'pin': pin}),
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', data['token']);
        await prefs.setString('api_base', apiBase);

        await _secureStorage.write(key: 'cached_pin_$username', value: pin);
        return {'success': true, 'employee': data['employee']};
      }
    } catch (e) {
      print('PIN login network error: $e');
    }

    // Offline PIN verify
    final cachedPin = await _secureStorage.read(key: 'cached_pin_$username');
    if (cachedPin == pin) {
      return {'success': true, 'employee': {'username': username}};
    }
    return {'success': false, 'error': 'Invalid PIN.'};
  }

  // Products SQLite methods
  Future<List<Map<String, dynamic>>> getProducts() async {
    final db = await SQLiteHelper.instance.database;
    return await db.query('products', orderBy: 'name ASC');
  }

  Future<Map<String, dynamic>?> findProductByBarcode(String barcode) async {
    final db = await SQLiteHelper.instance.database;
    final res = await db.query('products', where: 'barcode = ?', whereArgs: [barcode]);
    return res.isNotEmpty ? res.first : null;
  }

  // Bins SQLite methods
  Future<List<Map<String, dynamic>>> getBins() async {
    final db = await SQLiteHelper.instance.database;
    return await db.query('bins', orderBy: 'code ASC');
  }

  // Audits SQLite counts
  Future<List<Map<String, dynamic>>> getAudits() async {
    final db = await SQLiteHelper.instance.database;
    return await db.query('audits', orderBy: 'scheduled_date DESC');
  }

  Future<void> submitAudit(String auditId, List<dynamic> details) async {
    final db = await SQLiteHelper.instance.database;
    final now = DateTime.now().toIso8601String();

    // 1. Update local SQLite checklist
    await db.update(
      'audits',
      {
        'status': 'Completed',
        'details': jsonEncode(details),
        'updated_at': now,
      },
      where: 'id = ?',
      whereArgs: [auditId],
    );

    // 2. Adjust local product quantities
    for (var item in details) {
      await db.update(
        'products',
        {'quantity': item['counted'], 'updated_at': now},
        where: 'id = ?',
        whereArgs: [item['product_id']],
      );
    }

    // 3. Queue this audit completion to sync
    final syncId = 'sync-aud-$auditId-${DateTime.now().millisecondsSinceEpoch}';
    await db.insert('sync_queue', {
      'id': syncId,
      'table_name': 'audits',
      'action_type': 'UPDATE',
      'record_id': auditId,
      'payload': jsonEncode({
        'details': details,
        'status': 'Completed',
        'updated_at': now,
      }),
      'created_at': now,
      'retry_count': 0,
    });
  }

  // Scanner matches & logging
  Future<Map<String, dynamic>> registerBarcodeScan(String barcode) async {
    final db = await SQLiteHelper.instance.database;
    final product = await findProductByBarcode(barcode);
    final now = DateTime.now().toIso8601String();
    
    final prefs = await SharedPreferences.getInstance();
    final worker = prefs.getString('logged_in_username') ?? 'offline';

    final scanId = 'scan-${DateTime.now().millisecondsSinceEpoch}';
    final status = product != null ? 'Match' : 'Mismatch';

    // 1. Insert into local SQLite scanner history
    await db.insert('barcode_history', {
      'id': scanId,
      'scanned_barcode': barcode,
      'product_id': product != null ? product['id'] : null,
      'scanned_by': worker,
      'scan_status': status,
      'device_info': 'Android Mobile Terminal',
      'created_at': now,
    });

    // 2. Queue scan to sync
    await db.insert('sync_queue', {
      'id': 'sync-scan-$scanId',
      'table_name': 'barcode_history',
      'action_type': 'INSERT',
      'record_id': scanId,
      'payload': jsonEncode({
        'scanned_barcode': barcode,
        'product_id': product != null ? product['id'] : null,
        'scanned_by': worker,
        'scan_status': status,
        'device_info': 'Android Mobile Terminal',
        'created_at': now,
      }),
      'created_at': now,
    });

    return {
      'matched': product != null,
      'scanStatus': status,
      'product': product,
    };
  }

  // Logging Issues (damaged / missing items)
  Future<void> logStockIssue(String productId, String type, String severity, String desc) async {
    final db = await SQLiteHelper.instance.database;
    final now = DateTime.now().toIso8601String();
    
    final prefs = await SharedPreferences.getInstance();
    final worker = prefs.getString('logged_in_username') ?? 'offline';
    final issueId = 'issue-${DateTime.now().millisecondsSinceEpoch}';

    // 1. Save issue locally
    await db.insert('issues', {
      'id': issueId,
      'product_id': productId,
      'reported_by': worker,
      'audit_id': null,
      'issue_type': type,
      'severity': severity,
      'description': desc,
      'status': 'Open',
      'created_at': now,
      'updated_at': now,
    });

    // 2. Queue to sync_queue
    await db.insert('sync_queue', {
      'id': 'sync-issue-$issueId',
      'table_name': 'issues',
      'action_type': 'INSERT',
      'record_id': issueId,
      'payload': jsonEncode({
        'product_id': productId,
        'reported_by': worker,
        'audit_id': null,
        'issue_type': type,
        'severity': severity,
        'description': desc,
        'status': 'Open',
        'created_at': now,
        'updated_at': now,
      }),
      'created_at': now,
    });
  }
}
