// The WebView shell talks to platform channels as soon as it builds, which
// aren't available under `flutter test`'s default bindings without extra
// mocking. Rather than fake that out, this just covers the one pure-Dart
// piece: AppConfig's URL parsing.

import 'package:flutter_test/flutter_test.dart';

import 'package:friendlyhealthy_app/app_config.dart';

void main() {
  test('AppConfig.baseUri parses the configured base URL', () {
    expect(AppConfig.baseUri.scheme, isIn(['http', 'https']));
    expect(AppConfig.baseUri.host, isNotEmpty);
  });
}
