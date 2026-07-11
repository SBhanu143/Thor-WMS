import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/localization/app_localizations.dart';
import '../viewmodels/home_viewmodel.dart';

class AuditView extends StatefulWidget {
  const AuditView({Key? key}) : super(key: key);

  @override
  State<AuditView> createState() => _AuditViewState();
}

class _AuditViewState extends State<AuditView> {
  Map<String, dynamic>? _selectedAudit;
  List<dynamic> _currentDetails = [];

  void _startAudit(Map<String, dynamic> audit) {
    setState(() {
      _selectedAudit = audit;
      _currentDetails = jsonDecode(audit['details']);
    });
  }

  void _updateCount(int index, int value) {
    setState(() {
      _currentDetails[index]['counted'] = value;
    });
  }

  void _submitAudit(HomeViewModel vm) async {
    if (_selectedAudit == null) return;
    
    await vm.submitAuditResults(_selectedAudit!['id'], _currentDetails);
    
    setState(() {
      _selectedAudit = null;
      _currentDetails = [];
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Audit reconciliations logged locally and queued for synchronization.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final localizations = Provider.of<AppLocalizations>(context);
    final homeVm = Provider.of<HomeViewModel>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(_selectedAudit == null ? localizations.translate('cycleCount') : 'Perform Audit'),
        leading: _selectedAudit != null
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () {
                  setState(() {
                    _selectedAudit = null;
                    _currentDetails = [];
                  });
                },
              )
            : null,
      ),
      body: SafeArea(
        child: _selectedAudit == null
            ? _buildAuditList(homeVm, localizations)
            : _buildCountingSheet(homeVm, localizations),
      ),
    );
  }

  Widget _buildAuditList(HomeViewModel vm, AppLocalizations localizations) {
    final pendingAudits = vm.audits;

    if (pendingAudits.isEmpty) {
      return const Center(
        child: Text(
          'No cycle counts assigned to you.',
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: pendingAudits.length,
      itemBuilder: (ctx, index) {
        final a = pendingAudits[index];
        final isComp = a['status'] == 'Completed';

        return Card(
          color: Theme.of(context).cardColor,
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            title: Text(a['title'], style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text('Schedule: ${a['scheduled_date']}'),
            trailing: isComp
                ? const Icon(Icons.check_circle, color: Colors.green)
                : const Icon(Icons.chevron_right),
            onTap: isComp ? null : () => _startAudit(a),
          ),
        );
      },
    );
  }

  Widget _buildCountingSheet(HomeViewModel vm, AppLocalizations localizations) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _selectedAudit!['title'],
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              itemCount: _currentDetails.length,
              itemBuilder: (ctx, index) {
                final item = _currentDetails[index];
                final expected = item['expected'] as int;
                final counted = item['counted'] as int;

                return Card(
                  color: Theme.of(context).cardColor,
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item['name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        Text('SKU: ${item['sku']}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('${localizations.translate('expected')}: $expected'),
                            Row(
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.remove_circle_outline),
                                  onPressed: () {
                                    if (counted > 0) _updateCount(index, counted - 1);
                                  },
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  decoration: BoxDecoration(
                                    border: Border.all(color: Colors.white24),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    counted.toString(),
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.add_circle_outline),
                                  onPressed: () {
                                    _updateCount(index, counted + 1);
                                  },
                                ),
                              ],
                            )
                          ],
                        )
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          ElevatedButton(
            onPressed: () => _submitAudit(vm),
            child: Text(localizations.translate('submit')),
          ),
        ],
      ),
    );
  }
}
