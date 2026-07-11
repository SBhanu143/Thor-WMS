import 'package:flutter/material.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../data/repositories/wms_repository.dart';

class AuthViewModel extends ChangeNotifier {
  final WMSRepository _repo = WMSRepository();
  final LocalAuthentication _localAuth = LocalAuthentication();

  bool _isLoading = false;
  String? _error;
  Map<String, dynamic>? _currentUser;
  bool _biometricEnabled = false;

  bool get isLoading => _isLoading;
  String? get error => _error;
  Map<String, dynamic>? get currentUser => _currentUser;
  bool get biometricEnabled => _biometricEnabled;

  AuthViewModel() {
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    _biometricEnabled = prefs.getBool('biometric_enabled') ?? false;
    
    final username = prefs.getString('logged_in_username');
    if (username != null) {
      _currentUser = {
        'username': username,
        'full_name': prefs.getString('logged_in_user_name') ?? 'Offline Worker',
        'role': prefs.getString('logged_in_user_role') ?? 'Picker',
      };
      notifyListeners();
    }
  }

  Future<bool> login(String username, String password, String apiBase) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final result = await _repo.login(username, password, apiBase);
    _isLoading = false;

    if (result['success']) {
      _currentUser = result['employee'];
      _error = null;
      notifyListeners();
      return true;
    } else {
      _error = result['error'] ?? 'Login failed.';
      notifyListeners();
      return false;
    }
  }

  Future<bool> loginWithPin(String username, String pin, String apiBase) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final result = await _repo.pinLogin(username, pin, apiBase);
    _isLoading = false;

    if (result['success']) {
      _error = null;
      await _loadPreferences(); // reload profile details cached locally
      return true;
    } else {
      _error = result['error'] ?? 'Invalid PIN.';
      notifyListeners();
      return false;
    }
  }

  Future<bool> authenticateBiometrics() async {
    try {
      final canAuthenticate = await _localAuth.canCheckBiometrics || await _localAuth.isDeviceSupported();
      if (!canAuthenticate) return false;

      final authenticated = await _localAuth.authenticate(
        localizedReason: 'Authenticate to access WMS terminal',
        options: const AuthenticationOptions(
          biometricOnly: true,
          stickyAuth: true,
        ),
      );

      if (authenticated) {
        final prefs = await SharedPreferences.getInstance();
        final username = prefs.getString('logged_in_username');
        if (username != null) {
          _currentUser = {
            'username': username,
            'full_name': prefs.getString('logged_in_user_name') ?? 'Offline Worker',
            'role': prefs.getString('logged_in_user_role') ?? 'Picker',
          };
          notifyListeners();
          return true;
        }
      }
    } catch (e) {
      print('Biometrics Authentication failure: $e');
    }
    return false;
  }

  Future<void> toggleBiometrics(bool enabled) async {
    _biometricEnabled = enabled;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('biometric_enabled', enabled);
    notifyListeners();
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    _currentUser = null;
    notifyListeners();
  }
}
