import 'package:flutter/material.dart';

import 'webview_page.dart';

void main() {
  runApp(const FriendlyHealthyApp());
}

class FriendlyHealthyApp extends StatelessWidget {
  const FriendlyHealthyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FriendlyHealthy',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF0891B2),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF0F4F8),
      ),
      home: const WebViewPage(),
    );
  }
}
