/// Build-time configuration for the WebView shell.
class AppConfig {
  AppConfig._();

  /// The FriendlyHealthy web app's origin. Override at build/run time:
  ///
  ///   flutter run --dart-define=APP_BASE_URL=https://your-deployment.vercel.app
  ///   flutter build apk --dart-define=APP_BASE_URL=https://your-deployment.vercel.app
  ///
  /// Defaults to the local Next.js dev server. On an Android emulator
  /// "localhost" refers to the emulator itself, not the host machine — use
  /// 10.0.2.2 (already the default below) or your machine's LAN IP on a
  /// physical device.
  static const String baseUrl = String.fromEnvironment(
    'APP_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  static Uri get baseUri => Uri.parse(baseUrl);
}
