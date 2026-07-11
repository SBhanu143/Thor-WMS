import 'package:flutter/material.dart';

class AppLocalizations extends ChangeNotifier {
  Locale _locale = const Locale('en');

  Locale get locale => _locale;

  void toggleLanguage() {
    _locale = _locale.languageCode == 'en' ? const Locale('te') : const Locale('en');
    notifyListeners();
  }

  void setLocale(Locale newLocale) {
    _locale = newLocale;
    notifyListeners();
  }

  static final Map<String, Map<String, String>> _localizedValues = {
    'en': {
      'loginTitle': 'Thor WMS Portal',
      'loginSubtitle': 'Warehouse Productivity Platform',
      'username': 'Username',
      'password': 'Password',
      'loginBtn': 'Login',
      'pinLoginBtn': 'Login via PIN Code',
      'enterPin': 'Enter 4-Digit Security PIN',
      'welcome': 'Welcome',
      'dashboard': 'Dashboard',
      'startPick': 'Start Picking',
      'verifyBin': 'Verify Bin Code',
      'cycleCount': 'Cycle Count Audit',
      'logIssue': 'Log Stock Issue',
      'syncSuccess': 'Sync Completed Successfully',
      'syncFailed': 'Sync Failed, Offline changes queued',
      'settings': 'Settings & Config',
      'themeMode': 'Dark Theme Mode',
      'biometrics': 'Enable Biometric Fingerprint',
      'syncInterval': 'Auto Sync Interval',
      'logout': 'Logout',
      'expected': 'Expected',
      'counted': 'Counted',
      'submit': 'Submit Results',
      'barcodeInput': 'Scan or Enter Barcode',
      'matching': 'Checking Barcode...',
      'scanMatch': 'Barcode Match Found!',
      'scanMismatch': 'Barcode Mismatch Alert!',
    },
    'te': {
      'loginTitle': 'థోర్ WMS పోర్టల్',
      'loginSubtitle': 'వేర్‌హౌస్ ఉత్పాదకత ప్లాట్‌ఫారమ్',
      'username': 'వినియోగదారు పేరు',
      'password': 'పాస్‌వర్డ్',
      'loginBtn': 'లాగిన్ అవ్వండి',
      'pinLoginBtn': 'PIN ద్వారా లాగిన్ చేయండి',
      'enterPin': '4-అంకెల పిన్ నమోదు చేయండి',
      'welcome': 'స్వాగతం',
      'dashboard': 'డాష్‌బోర్డ్',
      'startPick': 'పికప్ ప్రారంభించండి',
      'verifyBin': 'బిన్ కోడ్ ధృవీకరించు',
      'cycleCount': 'సైకిల్ కౌంట్ ఆడిట్',
      'logIssue': 'స్టాక్ సమస్య నమోదు చేయి',
      'syncSuccess': 'సింక్ విజయవంతంగా పూర్తయింది',
      'syncFailed': 'సింక్ విఫలమైంది, స్థానిక క్యూ సేవ్ చేయబడింది',
      'settings': 'సెట్టింగులు',
      'themeMode': 'డార్క్ థీమ్ మోడ్',
      'biometrics': 'బయోమెట్రిక్ వేలిముద్ర ఆన్ చేయి',
      'syncInterval': 'ఆటో సింక్ సమయం',
      'logout': 'లాగ్ అవుట్',
      'expected': 'ఆశించిన పరిమాణం',
      'counted': 'లెక్కింపబడినది',
      'submit': 'లెక్కింపును సమర్పించు',
      'barcodeInput': 'బార్‌కోడ్ స్కాన్ చేయండి లేదా నమోదు చేయండి',
      'matching': 'బార్‌కోడ్ సరిచూస్తోంది...',
      'scanMatch': 'బార్‌కోడ్ మ్యాచ్ దొరికింది!',
      'scanMismatch': 'బార్‌కోడ్ మ్యాచ్ కాలేదు!',
    }
  };

  String translate(String key) {
    return _localizedValues[_locale.languageCode]?[key] ?? key;
  }
}
