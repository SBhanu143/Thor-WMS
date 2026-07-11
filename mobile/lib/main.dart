import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/localization/app_localizations.dart';
import 'core/theme/app_theme.dart';
import 'presentation/viewmodels/auth_viewmodel.dart';
import 'presentation/viewmodels/home_viewmodel.dart';
import 'presentation/views/login_view.dart';
import 'presentation/views/home_view.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppLocalizations()),
        ChangeNotifierProvider(create: (_) => AuthViewModel()),
        ChangeNotifierProvider(create: (_) => HomeViewModel()),
      ],
      child: const WmsApp(),
    ),
  );
}

class WmsApp extends StatelessWidget {
  const WmsApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final localizations = Provider.of<AppLocalizations>(context);
    final authVm = Provider.of<AuthViewModel>(context);

    // Dynamic app routing coordinator
    return MaterialApp(
      title: 'Thor WMS',
      themeMode: ThemeMode.dark, // Default dark layout
      darkTheme: AppTheme.darkTheme,
      theme: AppTheme.lightTheme,
      debugShowCheckedModeBanner: false,
      locale: localizations.locale,
      home: authVm.currentUser == null ? const LoginView() : const HomeView(),
    );
  }
}
