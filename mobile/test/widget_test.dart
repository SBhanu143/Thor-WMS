import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:mobile/main.dart';
import 'package:mobile/core/localization/app_localizations.dart';
import 'package:mobile/presentation/viewmodels/auth_viewmodel.dart';
import 'package:mobile/presentation/viewmodels/home_viewmodel.dart';

void main() {
  testWidgets('WMS Application smoke test', (WidgetTester tester) async {
    // Build our WmsApp inside MultiProvider.
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AppLocalizations()),
          ChangeNotifierProvider(create: (_) => AuthViewModel()),
          ChangeNotifierProvider(create: (_) => HomeViewModel()),
        ],
        child: const WmsApp(),
      ),
    );

    // Verify that the login portal loads
    expect(find.byIcon(Icons.warehouse), findsOneWidget);
    expect(find.text('Thor WMS Portal'), findsOneWidget);
    expect(find.text('Login'), findsOneWidget);
  });
}
