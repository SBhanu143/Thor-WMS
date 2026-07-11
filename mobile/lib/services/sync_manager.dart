import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'sqlite_helper.dart';

class SyncManager {
  static final SyncManager instance = SyncManager._init();
  bool _isSyncing = false;

  SyncManager._init();

  bool get isSyncing => _isSyncing;

  Future<bool> hasInternet() async {
    final connectivityResult = await Connectivity().checkConnectivity();
    if (connectivityResult.contains(ConnectivityResult.mobile) ||
        connectivityResult.contains(ConnectivityResult.wifi)) {
      return true;
    }
    return false;
  }

  Future<bool> synchronize() async {
    if (_isSyncing) return false;
    _isSyncing = true;

    try {
      final online = await hasInternet();
      if (!online) {
        _isSyncing = false;
        return false;
      }

      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      final apiBase = prefs.getString('api_base') ?? 'http://10.0.2.2:5000/api'; // Android Emulator default localhost bridge

      if (token == null) {
        _isSyncing = false;
        return false;
      }

      final db = await SQLiteHelper.instance.database;

      // 1. Fetch pending sync queue items
      final List<Map<String, dynamic>> queueItems = await db.query('sync_queue', orderBy: 'created_at ASC');
      if (queueItems.isEmpty) {
        // Queue is empty, still pull fresh master state from server
        final res = await http.post(
          Uri.parse('$apiBase/sync'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
          body: jsonEncode({'queue': []}),
        );
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          if (data['master'] != null) {
            await _updateLocalCache(data['master']);
          }
        }
        _isSyncing = false;
        return true;
      }

      // 2. Map payload list for serialization
      final syncPayload = queueItems.map((item) {
        return {
          'id': item['id'],
          'table_name': item['table_name'],
          'action_type': item['action_type'],
          'record_id': item['record_id'],
          'payload': jsonDecode(item['payload']),
          'created_at': item['created_at'],
        };
      }).toList();

      // 3. Post to backend sync endpoint
      final response = await http.post(
        Uri.parse('$apiBase/sync'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'queue': syncPayload}),
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> resData = jsonDecode(response.body);
        final List<dynamic> syncedIds = resData['syncedIds'] ?? [];

        // 4. Delete successfully synced IDs from local queue
        for (var id in syncedIds) {
          await db.delete('sync_queue', where: 'id = ?', whereArgs: [id]);
        }

        // 5. If errors are returned, increment retry counters or log them
        final List<dynamic> errors = resData['errors'] ?? [];
        for (var err in errors) {
          final errId = err['id'];
          final errMsg = err['error'];
          await db.rawUpdate(
            'UPDATE sync_queue SET retry_count = retry_count + 1, last_error = ? WHERE id = ?',
            [errMsg, errId],
          );
        }

        // 6. Update local master tables with the server state returned
        if (resData['master'] != null) {
          await _updateLocalCache(resData['master']);
        }

        _isSyncing = false;
        return true;
      }
    } catch (e) {
      print('Sync Error: $e');
    }

    _isSyncing = false;
    return false;
  }

  Future<void> _updateLocalCache(Map<String, dynamic> master) async {
    if (master['products'] != null) {
      await SQLiteHelper.instance.cacheProducts(master['products']);
    }
    if (master['bins'] != null) {
      await SQLiteHelper.instance.cacheBins(master['bins']);
    }
    if (master['audits'] != null) {
      await SQLiteHelper.instance.cacheAudits(master['audits']);
    }
  }
}
