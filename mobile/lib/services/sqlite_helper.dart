import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'dart:convert';

class SQLiteHelper {
  static final SQLiteHelper instance = SQLiteHelper._init();
  static Database? _database;

  SQLiteHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('wms_offline.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  Future _createDB(Database db, int version) async {
    const textType = 'TEXT NOT NULL';
    const textTypeNull = 'TEXT';
    const integerType = 'INTEGER NOT NULL';
    const realType = 'REAL NOT NULL';
    
    // Create tables
    await db.execute('''
      CREATE TABLE products (
        id $textType PRIMARY KEY,
        sku $textType,
        name $textType,
        description $textTypeNull,
        barcode $textType,
        quantity $integerType,
        min_stock_level $integerType,
        bin_id $textTypeNull,
        weight $realType,
        dimensions $textTypeNull,
        created_at $textType,
        updated_at $textType
      )
    ''');

    await db.execute('''
      CREATE TABLE bins (
        id $textType PRIMARY KEY,
        code $textType,
        zone $textType,
        aisle $integerType,
        shelf $integerType,
        level $integerType,
        capacity_m3 $realType,
        created_at $textType,
        updated_at $textType
      )
    ''');

    await db.execute('''
      CREATE TABLE barcode_history (
        id $textType PRIMARY KEY,
        scanned_barcode $textType,
        product_id $textTypeNull,
        scanned_by $textType,
        scan_status $textType,
        device_info $textTypeNull,
        created_at $textType
      )
    ''');

    await db.execute('''
      CREATE TABLE audits (
        id $textType PRIMARY KEY,
        title $textType,
        scheduled_date $textType,
        status $textType,
        assigned_to $textType,
        details $textType, -- Stored as stringified JSON
        created_at $textType,
        updated_at $textType
      )
    ''');

    await db.execute('''
      CREATE TABLE issues (
        id $textType PRIMARY KEY,
        product_id $textType,
        reported_by $textType,
        audit_id $textTypeNull,
        issue_type $textType,
        severity $textType,
        description $textType,
        status $textType,
        created_at $textType,
        updated_at $textType
      )
    ''');

    await db.execute('''
      CREATE TABLE settings (
        id $textType PRIMARY KEY,
        employee_id $textType,
        language $textType,
        theme $textType,
        scanner_beep $integerType, -- 0 for false, 1 for true
        biometrics_enabled $integerType,
        sync_interval_mins $integerType,
        updated_at $textType
      )
    ''');

    await db.execute('''
      CREATE TABLE sync_queue (
        id $textType PRIMARY KEY,
        table_name $textType,
        action_type $textType,
        record_id $textType,
        payload $textType, -- Stored as stringified JSON
        created_at $textType,
        retry_count $integerType DEFAULT 0,
        last_error $textTypeNull
      )
    ''');

    // Create indexes for local search speed (<100ms)
    await db.execute('CREATE INDEX idx_products_sku ON products(sku)');
    await db.execute('CREATE INDEX idx_products_barcode ON products(barcode)');
    await db.execute('CREATE INDEX idx_products_name ON products(name)');
    await db.execute('CREATE INDEX idx_sync_queue_created ON sync_queue(created_at)');
  }

  // CRUD Helpers for Generic Local Sync caching
  Future<void> cacheProducts(List<dynamic> productList) async {
    final db = await instance.database;
    await db.transaction((txn) async {
      for (var p in productList) {
        await txn.insert(
          'products',
          {
            'id': p['id'],
            'sku': p['sku'],
            'name': p['name'],
            'description': p['description'] ?? '',
            'barcode': p['barcode'],
            'quantity': p['quantity'] ?? 0,
            'min_stock_level': p['min_stock_level'] ?? 10,
            'bin_id': p['bin_id'] ?? '',
            'weight': (p['weight'] as num?)?.toDouble() ?? 0.0,
            'dimensions': p['dimensions'] ?? '',
            'created_at': p['created_at'] ?? DateTime.now().toIso8601String(),
            'updated_at': p['updated_at'] ?? DateTime.now().toIso8601String(),
          },
          conflictAlgorithm: ConflictAlgorithm.replace,
        );
      }
    });
  }

  Future<void> cacheBins(List<dynamic> binList) async {
    final db = await instance.database;
    await db.transaction((txn) async {
      for (var b in binList) {
        await txn.insert(
          'bins',
          {
            'id': b['id'],
            'code': b['code'],
            'zone': b['zone'],
            'aisle': b['aisle'] ?? 1,
            'shelf': b['shelf'] ?? 1,
            'level': b['level'] ?? 1,
            'capacity_m3': (b['capacity_m3'] as num?)?.toDouble() ?? 0.0,
            'created_at': b['created_at'] ?? DateTime.now().toIso8601String(),
            'updated_at': b['updated_at'] ?? DateTime.now().toIso8601String(),
          },
          conflictAlgorithm: ConflictAlgorithm.replace,
        );
      }
    });
  }

  Future<void> cacheAudits(List<dynamic> auditList) async {
    final db = await instance.database;
    await db.transaction((txn) async {
      for (var a in auditList) {
        await txn.insert(
          'audits',
          {
            'id': a['id'],
            'title': a['title'],
            'scheduled_date': a['scheduled_date'],
            'status': a['status'],
            'assigned_to': a['assigned_to'],
            'details': jsonEncode(a['details']),
            'created_at': a['created_at'] ?? DateTime.now().toIso8601String(),
            'updated_at': a['updated_at'] ?? DateTime.now().toIso8601String(),
          },
          conflictAlgorithm: ConflictAlgorithm.replace,
        );
      }
    });
  }

  Future<void> close() async {
    final db = await instance.database;
    db.close();
  }
}
