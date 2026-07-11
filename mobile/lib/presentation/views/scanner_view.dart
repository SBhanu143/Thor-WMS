import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/localization/app_localizations.dart';
import '../viewmodels/scanner_viewmodel.dart';

class ScannerView extends StatefulWidget {
  const ScannerView({Key? key}) : super(key: key);

  @override
  State<ScannerView> createState() => _ScannerViewState();
}

class _ScannerViewState extends State<ScannerView> {
  final _barcodeInputController = TextEditingController();

  @override
  void dispose() {
    _barcodeInputController.dispose();
    super.dispose();
  }

  void _triggerScan(String code, ScannerViewModel vm) {
    if (code.isEmpty) return;
    vm.scanBarcode(code);
    _barcodeInputController.clear();
  }

  @override
  Widget build(BuildContext context) {
    final localizations = Provider.of<AppLocalizations>(context);
    
    return ChangeNotifierProvider(
      create: (_) => ScannerViewModel(),
      child: Consumer<ScannerViewModel>(
        builder: (context, vm, child) {
          return Scaffold(
            appBar: AppBar(
              title: const Text('WMS Barcode Scanner'),
              actions: [
                IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: () => vm.reset(),
                ),
              ],
            ),
            body: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    // Mock Camera Scanner Frame
                    Expanded(
                      flex: 4,
                      child: Container(
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.black,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: vm.scanResult == null
                                ? Colors.grey
                                : (vm.isMatch ? Colors.green : Colors.red),
                            width: 3,
                          ),
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            // Scanner lines
                            Container(
                              width: double.infinity,
                              height: 2,
                              color: Colors.red,
                            ),
                            
                            Positioned(
                              top: 20,
                              child: Text(
                                vm.isLoading 
                                    ? localizations.translate('matching')
                                    : 'POINT CAMERA AT BARCODE',
                                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 13),
                              ),
                            ),
                            
                            // Scan Result Cards
                            if (vm.scanResult != null)
                              Positioned(
                                bottom: 20,
                                left: 20,
                                right: 20,
                                child: Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: vm.isMatch ? Colors.green.withOpacity(0.9) : Colors.red.withOpacity(0.9),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        vm.isMatch 
                                            ? localizations.translate('scanMatch')
                                            : localizations.translate('scanMismatch'),
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                                      ),
                                      if (vm.isMatch && vm.matchedProduct != null) ...[
                                        const SizedBox(height: 6),
                                        Text(
                                          'Item: ${vm.matchedProduct!['name']}',
                                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                                        ),
                                        Text(
                                          'SKU: ${vm.matchedProduct!['sku']} | Bin: ${vm.matchedProduct!['bin_id'] ?? 'N/A'}',
                                          style: const TextStyle(color: Colors.white70, fontSize: 12),
                                        ),
                                        Text(
                                          'Current Qty: ${vm.matchedProduct!['quantity']}',
                                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                                        ),
                                      ]
                                    ],
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Barcode input simulator
                    Expanded(
                      flex: 2,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            localizations.translate('barcodeInput'),
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: TextField(
                                  controller: _barcodeInputController,
                                  decoration: const InputDecoration(
                                    hintText: 'e.g. TH-HAMMER-001',
                                  ),
                                  onSubmitted: (val) => _triggerScan(val, vm),
                                ),
                              ),
                              const SizedBox(width: 12),
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  minimumSize: const Size(60, 50),
                                  backgroundColor: Theme.of(context).primaryColor,
                                ),
                                onPressed: () => _triggerScan(_barcodeInputController.text, vm),
                                child: const Icon(Icons.arrow_forward),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          // Simulated Test buttons
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: [
                              _buildMockBadgeButton('Hammer Scan', 'TH-HAMMER-001', vm),
                              _buildMockBadgeButton('Bolt Scan', 'TI-BOLT-100', vm),
                              _buildMockBadgeButton('Invalid Code', 'WRONG-BARCODE', vm),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildMockBadgeButton(String label, String code, ScannerViewModel vm) {
    return ActionChip(
      label: Text(label),
      onPressed: () {
        vm.scanBarcode(code);
      },
    );
  }
}
