import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/localization/app_localizations.dart';
import '../viewmodels/auth_viewmodel.dart';
import 'home_view.dart';

class LoginView extends StatefulWidget {
  const LoginView({Key? key}) : super(key: key);

  @override
  State<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _apiBaseController = TextEditingController(text: 'http://10.0.2.2:5000/api');
  
  bool _isPinMode = false;
  final List<String> _pinDigits = [];

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _apiBaseController.dispose();
    super.dispose();
  }

  void _onKeyPress(String value) {
    if (_pinDigits.length < 4) {
      setState(() {
        _pinDigits.add(value);
      });
      if (_pinDigits.length == 4) {
        _submitPin();
      }
    }
  }

  void _onBackspace() {
    if (_pinDigits.isNotEmpty) {
      setState(() {
        _pinDigits.removeLast();
      });
    }
  }

  Future<void> _submitCredentials() async {
    final authVm = Provider.of<AuthViewModel>(context, listen: false);
    final localizations = Provider.of<AppLocalizations>(context, listen: false);

    if (_usernameController.text.isEmpty || _passwordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all credentials.')),
      );
      return;
    }

    final success = await authVm.login(
      _usernameController.text,
      _passwordController.text,
      _apiBaseController.text,
    );

    if (success) {
      _navigateToHome();
    } else {
      _showErrorSnackBar(authVm.error ?? localizations.translate('invalidCreds'));
    }
  }

  Future<void> _submitPin() async {
    final authVm = Provider.of<AuthViewModel>(context, listen: false);
    final localizations = Provider.of<AppLocalizations>(context, listen: false);
    final pinStr = _pinDigits.join();

    if (_usernameController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Username required for PIN login.')),
      );
      setState(() => _pinDigits.clear());
      return;
    }

    final success = await authVm.loginWithPin(
      _usernameController.text,
      pinStr,
      _apiBaseController.text,
    );

    setState(() => _pinDigits.clear());

    if (success) {
      _navigateToHome();
    } else {
      _showErrorSnackBar(authVm.error ?? localizations.translate('invalidCreds'));
    }
  }

  void _navigateToHome() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const HomeView()),
    );
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Theme.of(context).colorScheme.error,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final localizations = Provider.of<AppLocalizations>(context);
    final authVm = Provider.of<AuthViewModel>(context);

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 40),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Theme.of(context).primaryColor.withOpacity(0.1),
                ),
                child: Icon(
                  Icons.warehouse,
                  size: 64,
                  color: Theme.of(context).primaryColor,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                localizations.translate('loginTitle'),
                style: Theme.of(context).textTheme.headlineLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
              Text(
                localizations.translate('loginSubtitle'),
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),

              // Configuration API server
              TextField(
                controller: _apiBaseController,
                decoration: const InputDecoration(
                  labelText: 'WMS Server Endpoint',
                  prefixIcon: Icon(Icons.dns),
                ),
              ),
              const SizedBox(height: 16),

              TextField(
                controller: _usernameController,
                decoration: InputDecoration(
                  labelText: localizations.translate('username'),
                  prefixIcon: const Icon(Icons.person),
                ),
              ),
              const SizedBox(height: 16),

              if (!_isPinMode) ...[
                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: localizations.translate('password'),
                    prefixIcon: const Icon(Icons.lock),
                  ),
                ),
                const SizedBox(height: 24),
                authVm.isLoading
                    ? const CircularProgressIndicator()
                    : ElevatedButton(
                        onPressed: _submitCredentials,
                        child: Text(localizations.translate('loginBtn')),
                      ),
              ] else ...[
                Text(
                  localizations.translate('enterPin'),
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(4, (index) {
                    final hasDigit = index < _pinDigits.length;
                    return Container(
                      margin: const EdgeInsets.symmetric(horizontal: 10),
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: hasDigit ? Theme.of(context).primaryColor : Colors.white10,
                        border: Border.all(color: Colors.white24),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 24),
                _buildPinKeyboard(),
              ],

              const SizedBox(height: 20),
              TextButton(
                onPressed: () {
                  setState(() {
                    _isPinMode = !_isPinMode;
                    _pinDigits.clear();
                  });
                },
                child: Text(_isPinMode ? 'Use Standard Password' : localizations.translate('pinLoginBtn')),
              ),

              if (authVm.biometricEnabled) ...[
                const SizedBox(height: 10),
                IconButton(
                  icon: const Icon(Icons.fingerprint, size: 50),
                  onPressed: () async {
                    final success = await authVm.authenticateBiometrics();
                    if (success) _navigateToHome();
                  },
                ),
              ]
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPinKeyboard() {
    return Column(
      children: [
        for (var row in [
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9']
        ])
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: row.map((val) => _buildKey(val)).toList(),
          ),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(width: 70, height: 70), // spacer
            _buildKey('0'),
            IconButton(
              icon: const Icon(Icons.backspace, size: 28),
              onPressed: _onBackspace,
              style: IconButton.styleFrom(minimumSize: const Size(70, 70)),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildKey(String value) {
    return Container(
      margin: const EdgeInsets.all(6),
      child: OutlinedButton(
        onPressed: () => _onKeyPress(value),
        style: OutlinedButton.styleFrom(
          fixedSize: const Size(70, 70),
          shape: const CircleBorder(),
          side: const BorderSide(color: Colors.white12),
        ),
        child: Text(
          value,
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
        ),
      ),
    );
  }
}
