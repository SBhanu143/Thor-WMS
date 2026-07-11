import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/localization/app_localizations.dart';
import '../viewmodels/auth_viewmodel.dart';
import '../viewmodels/home_viewmodel.dart';
import 'scanner_view.dart';
import 'audit_view.dart';
import 'settings_view.dart';

class HomeView extends StatefulWidget {
  const HomeView({Key? key}) : super(key: key);

  @override
  State<HomeView> createState() => _HomeViewState();
}

class _HomeViewState extends State<HomeView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<HomeViewModel>(context, listen: false).loadLocalData();
    });
  }

  void _triggerSync(BuildContext context) async {
    final homeVm = Provider.of<HomeViewModel>(context, listen: false);
    final localizations = Provider.of<AppLocalizations>(context, listen: false);
    
    final success = await homeVm.triggerSync();
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(localizations.translate('syncSuccess')), backgroundColor: Colors.green),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(localizations.translate('syncFailed')), backgroundColor: Colors.amber),
      );
    }
  }

  void _showLogIssueDialog(BuildContext context) {
    final homeVm = Provider.of<HomeViewModel>(context, listen: false);
    final products = homeVm.products;
    
    if (products.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No cached products available. Perform sync first.')),
      );
      return;
    }

    String selectedProdId = products.first['id'];
    String issueType = 'Damaged';
    String severity = 'Medium';
    final descController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Log Stock Issue'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    DropdownButtonFormField<String>(
                      value: selectedProdId,
                      decoration: const InputDecoration(labelText: 'Target Product'),
                      items: products.map((p) {
                        return DropdownMenuItem<String>(
                          value: p['id'],
                          child: Text(p['name']),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setDialogState(() => selectedProdId = val);
                      },
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: issueType,
                      decoration: const InputDecoration(labelText: 'Issue Category'),
                      items: ['Damaged', 'Missing', 'Mismatch'].map((t) {
                        return DropdownMenuItem<String>(value: t, child: Text(t));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setDialogState(() => issueType = val);
                      },
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: severity,
                      decoration: const InputDecoration(labelText: 'Severity'),
                      items: ['Low', 'Medium', 'Critical'].map((s) {
                        return DropdownMenuItem<String>(value: s, child: Text(s));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setDialogState(() => severity = val);
                      },
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: descController,
                      decoration: const InputDecoration(labelText: 'Detailed Description'),
                      maxLines: 2,
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () {
                    if (descController.text.isEmpty) return;
                    homeVm.logIssue(
                      selectedProdId,
                      issueType,
                      severity,
                      descController.text,
                    );
                    Navigator.of(context).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Issue logged. Syncing in background...')),
                    );
                  },
                  child: const Text('Report Issue'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final localizations = Provider.of<AppLocalizations>(context);
    final authVm = Provider.of<AuthViewModel>(context);
    final homeVm = Provider.of<HomeViewModel>(context);
    
    final employeeName = authVm.currentUser?['full_name'] ?? 'Warehouse Employee';
    final employeeRole = authVm.currentUser?['role'] ?? 'Picker';

    return Scaffold(
      appBar: AppBar(
        title: Text(localizations.translate('dashboard')),
        actions: [
          IconButton(
            icon: homeVm.isSyncing
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.sync),
            onPressed: () => _triggerSync(context),
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const SettingsView()),
              );
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // User header profile
              Row(
                children: [
                  CircleAvatar(
                    backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
                    radius: 26,
                    child: Icon(Icons.account_circle, color: Theme.of(context).primaryColor, size: 36),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${localizations.translate('welcome')}, $employeeName',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                      ),
                      Text(
                        'Role: $employeeRole',
                        style: TextStyle(color: Theme.of(context).colorScheme.secondary, fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Operations grid
              Expanded(
                child: GridView.count(
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  children: [
                    _buildGridCard(
                      context,
                      title: localizations.translate('startPick'),
                      icon: Icons.shopping_basket,
                      color: Colors.indigo,
                      onTap: () {
                        // Mock Picking action, open scanner
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const ScannerView()),
                        );
                      },
                    ),
                    _buildGridCard(
                      context,
                      title: localizations.translate('verifyBin'),
                      icon: Icons.qr_code_scanner,
                      color: Colors.cyan,
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const ScannerView()),
                        );
                      },
                    ),
                    _buildGridCard(
                      context,
                      title: localizations.translate('cycleCount'),
                      icon: Icons.checklist_rounded,
                      color: Colors.amber,
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const AuditView()),
                        );
                      },
                    ),
                    _buildGridCard(
                      context,
                      title: localizations.translate('logIssue'),
                      icon: Icons.error_outline,
                      color: Colors.red,
                      onTap: () => _showLogIssueDialog(context),
                    ),
                  ],
                ),
              ),

              // Statistics summary
              Card(
                color: Theme.of(context).cardColor,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: const BorderSide(color: Colors.white10),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildStatColumn('Products', homeVm.products.length.toString()),
                      _buildStatColumn('Bins', homeVm.bins.length.toString()),
                      _buildStatColumn('Pending Audits', homeVm.audits.where((a) => a['status'] != 'Completed').length.toString()),
                    ],
                  ),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatColumn(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 22),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(color: Colors.grey, fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildGridCard(
    BuildContext context, {
    required String title,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Ink(
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          border: Border.all(color: color.withOpacity(0.2)),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, size: 36, color: color),
              Text(
                title,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
