import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

import 'app_config.dart';

/// Route paths that rely on `window.print()` / `window.close()` (the report
/// and prescription print views). Android/iOS WebViews don't implement
/// `window.print()`, so these are opened in the system browser instead,
/// where "Print / Save as PDF" works via the browser's own share sheet.
bool _isPrintReliantPath(String path) {
  return path.endsWith('/print') || path.contains('/report');
}

class WebViewPage extends StatefulWidget {
  const WebViewPage({super.key});

  @override
  State<WebViewPage> createState() => _WebViewPageState();
}

class _WebViewPageState extends State<WebViewPage> {
  late final WebViewController _controller;
  final Connectivity _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;

  bool _isLoading = true;
  double _progress = 0;
  String? _loadError;
  bool _offline = false;

  @override
  void initState() {
    super.initState();
    _controller = _buildController();
    _connectivitySub = _connectivity.onConnectivityChanged.listen((results) {
      final hasConnection = results.any((r) => r != ConnectivityResult.none);
      if (hasConnection && _offline) {
        setState(() => _offline = false);
        _controller.reload();
      } else if (!hasConnection) {
        setState(() => _offline = true);
      }
    });
  }

  @override
  void dispose() {
    _connectivitySub?.cancel();
    super.dispose();
  }

  WebViewController _buildController() {
    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFF0F4F8))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) setState(() => _isLoading = true);
          },
          onPageFinished: (_) {
            if (mounted) setState(() => _isLoading = false);
          },
          onProgress: (progress) {
            if (mounted) setState(() => _progress = progress / 100);
          },
          onWebResourceError: (error) {
            // Only surface errors for the main frame; ignore failed
            // sub-resources (fonts, analytics, etc.) so a single broken
            // asset doesn't take over the whole screen.
            if (error.isForMainFrame == false) return;
            if (mounted) {
              setState(() => _loadError = error.description);
            }
          },
          onNavigationRequest: (request) => _handleNavigation(request),
        ),
      )
      ..loadRequest(AppConfig.baseUri);

    if (controller.platform is AndroidWebViewController) {
      final androidController = controller.platform as AndroidWebViewController;
      androidController.setOnShowFileSelector(_onShowFileSelector);
    }

    return controller;
  }

  Future<NavigationDecision> _handleNavigation(NavigationRequest request) async {
    final uri = Uri.tryParse(request.url);
    if (uri == null) return NavigationDecision.navigate;

    // Non-http(s) schemes (mailto:, tel:, sms:) can't be handled in-app.
    if (uri.scheme != 'http' && uri.scheme != 'https') {
      await _launchExternally(uri);
      return NavigationDecision.prevent;
    }

    // Keep same-origin navigation inside the WebView.
    if (uri.host == AppConfig.baseUri.host) {
      if (_isPrintReliantPath(uri.path)) {
        await _launchExternally(uri);
        return NavigationDecision.prevent;
      }
      return NavigationDecision.navigate;
    }

    // Everything else (Supabase storage links, external docs, OAuth
    // providers) opens in the system browser rather than inside the shell.
    await _launchExternally(uri);
    return NavigationDecision.prevent;
  }

  Future<void> _launchExternally(Uri uri) async {
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<List<String>> _onShowFileSelector(FileSelectorParams params) async {
    // Backs `<input type="file">` on report/record upload forms with the
    // platform's native picker (Android's Storage Access Framework chooser).
    final List<String?> paths;
    if (params.mode == FileSelectorMode.openMultiple) {
      final files = await FilePicker.pickFiles(type: FileType.any);
      paths = files.map((f) => f.path).toList();
    } else {
      final file = await FilePicker.pickFile(type: FileType.any);
      paths = [file?.path];
    }
    return paths.whereType<String>().map((path) => Uri.file(path).toString()).toList();
  }

  Future<bool> _handleBack() async {
    if (await _controller.canGoBack()) {
      await _controller.goBack();
      return false;
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final shouldPop = await _handleBack();
        if (shouldPop && context.mounted) {
          Navigator.of(context).maybePop();
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF0F4F8),
        body: SafeArea(
          child: Stack(
            children: [
              if (_offline)
                _OfflineView(onRetry: () {
                  setState(() => _offline = false);
                  _controller.reload();
                })
              else if (_loadError != null)
                _ErrorView(
                  message: _loadError!,
                  onRetry: () {
                    setState(() => _loadError = null);
                    _controller.reload();
                  },
                )
              else
                WebViewWidget(controller: _controller),
              if (_isLoading && _loadError == null && !_offline)
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: LinearProgressIndicator(
                    value: _progress > 0 && _progress < 1 ? _progress : null,
                    minHeight: 3,
                    backgroundColor: Colors.transparent,
                    color: const Color(0xFF0891B2),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OfflineView extends StatelessWidget {
  const _OfflineView({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return _StatusView(
      icon: Icons.wifi_off_rounded,
      title: 'No internet connection',
      message: 'Check your connection and try again.',
      onRetry: onRetry,
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return _StatusView(
      icon: Icons.error_outline_rounded,
      title: 'Something went wrong',
      message: message,
      onRetry: onRetry,
    );
  }
}

class _StatusView extends StatelessWidget {
  const _StatusView({
    required this.icon,
    required this.title,
    required this.message,
    required this.onRetry,
  });

  final IconData icon;
  final String title;
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 56, color: const Color(0xFF0891B2)),
            const SizedBox(height: 16),
            Text(title, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            FilledButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
