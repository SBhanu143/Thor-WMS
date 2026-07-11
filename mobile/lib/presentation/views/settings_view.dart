import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/localization/app_localizations.dart';
import '../viewmodels/auth_viewmodel.dart';
import 'login_view.dart';

class SettingsView extends StatelessWidget {
  const SettingsView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final localizations = Provider.of<AppLocalizations>(context);
    final authVm = Provider.of<AuthViewModel>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(localizations.translate('settings')),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16.0),
          children: [
            // Language Swapper
            Card(
              color: Theme.of(context).cardColor,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: Colors.white10),
              ),
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.language),
                      title: const Text('Bilingual Localization'),
                      subtitle: Text('Current: ${localizations.locale.languageCode == 'en' ? "English" : "తెలుగు"}'),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            minimumSize: const Size(120, 40),
                            backgroundColor: localizations.locale.languageCode == 'en'
                                ? Theme.of(context).primaryColor
                                : Colors.white10,
                          ),
                          onPressed: () => localizations.setLocale(const Locale('en')),
                          child: const Text('English'),
                        ),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            minimumSize: const Size(120, 40),
                            backgroundColor: localizations.locale.languageCode == 'te'
                                ? Theme.of(context).primaryColor
                                : Colors.white10,
                          ),
                          onPressed: () => localizations.setLocale(const Locale('te')),
                          child: const Text('తెలుగు'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Biometrics settings toggles
            Card(
              color: Theme.of(context).cardColor,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: Colors.white10),
              ),
              child: SwitchListTile(
                secondary: const Icon(Icons.fingerprint),
                title: Text(localizations.translate('biometrics')),
                value: authVm.biometricEnabled,
                onChanged: (val) {
                  authVm.toggleBiometrics(val);
                },
              ),
            ),
            const SizedBox(height: 16),

            // Logout card links
            Card(
              color: Theme.of(context).cardColor,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: Colors.white10),
              ),
              child: ListTile(
                leading: const Icon(Icons.exit_to_app, color: Colors.red),
                title: Text(
                  localizations.translate('logout'),
                  style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
                ),
                onTap: () async {
                  await authVm.logout();
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const LoginView()),
                    (route) => false,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
