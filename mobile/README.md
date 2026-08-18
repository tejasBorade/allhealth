# FriendlyHealthy — hybrid mobile app

A thin Flutter WebView shell around the FriendlyHealthy Next.js web app
(`../` at the repo root). It's a "hybrid" app in the classic sense: all the
UI, auth, roles, and business logic stay in the existing web app — this
project just packages it as an installable Android/iOS app with a few
native affordances the browser can't give you:

- App icon + splash screen instead of a browser tab.
- Back button navigates web history before exiting the app.
- Links that aren't part of the web app (`mailto:`, `tel:`, Supabase storage
  file links, anything off the app's origin) open in the system browser/mail
  /dialer instead of hijacking the in-app view.
- Native file picker wired up for `<input type="file">` (report/record
  uploads).
- Offline/error screens with retry, driven by real connectivity state.

It does **not** reimplement any screen in Flutter — there is exactly one
Dart-side "feature," the WebView shell itself (`lib/webview_page.dart`).

## Why some pages open in the system browser

`/prescriptions/[id]/print` and `/appointments/[id]/report` call
`window.print()` / `window.close()`. Neither Android's nor iOS's WebView
implements `window.print()`, so the shell detects those paths and hands them
to the system browser instead (see `_isPrintReliantPath` in
`lib/webview_page.dart`), where "Print / Save as PDF" works exactly like it
does today on desktop.

## Setup

1. Install the [Flutter SDK](https://docs.flutter.dev/get-started/install)
   (this was built and tested against Flutter 3.47 stable) plus Android
   Studio (Android SDK) and/or Xcode, depending on which platform you're
   targeting.
2. `cd mobile && flutter pub get`.
3. Point the app at your deployment — see **Configuring the target URL**
   below.
4. `flutter run` (with an emulator/simulator or device attached).

## Configuring the target URL

The app never hardcodes an origin — it's passed in at build/run time via
`--dart-define`:

```bash
# Point at a deployed instance
flutter run --dart-define=APP_BASE_URL=https://your-deployment.vercel.app

# Point at the Next.js dev server (`npm run dev` in the repo root) —
# 10.0.2.2 is the Android emulator's alias for the host machine
flutter run --dart-define=APP_BASE_URL=http://10.0.2.2:3000

# iOS Simulator can use localhost directly
flutter run --dart-define=APP_BASE_URL=http://localhost:3000
```

With no `--dart-define`, it defaults to `http://10.0.2.2:3000` (the Android
emulator dev-server default) — see `lib/app_config.dart`. Cleartext HTTP is
only allowed to `localhost`/`127.0.0.1`/`10.0.2.2` (Android:
`android/app/src/main/res/xml/network_security_config.xml`; iOS: the
`NSAppTransportSecurity` exception in `ios/Runner/Info.plist`) — a real
deployment must be served over HTTPS.

For a release build, bake the production URL in instead of passing it every
time:

```bash
flutter build apk --release --dart-define=APP_BASE_URL=https://your-deployment.vercel.app
flutter build ipa --release --dart-define=APP_BASE_URL=https://your-deployment.vercel.app
```

## Known limitations

- **No app icon / splash art yet** — ships with Flutter's default icon.
  Before a store submission, drop a real icon into
  `android/app/src/main/res/mipmap-*` and `ios/Runner/Assets.xcassets`, or
  wire up `flutter_launcher_icons`/`flutter_native_splash` with real source
  images.
- **No push notifications.** The web app's own "Web push remains unbuilt"
  limitation (see the repo root README) applies here too — there's no FCM/
  APNs wiring. Adding it would need a Firebase project and native
  configuration this shell doesn't have.
- **No pull-to-refresh gesture.** `webview_flutter`'s platform view consumes
  touch input directly, so a `RefreshIndicator` swipe gesture doesn't
  reliably compose with it. Reload happens automatically when connectivity
  is restored after being offline; there's no manual pull gesture.
- **Deep links aren't registered.** Opening `https://your-domain/...` links
  from outside the app (e.g. an emailed appointment link) opens the system
  browser, not this app, since no Android App Links / iOS Universal Links
  are configured. Add those (`android/app/src/main/AndroidManifest.xml`
  intent filters + `assetlinks.json`; iOS associated domains +
  `apple-app-site-association`) if that matters for your rollout.
- **Android SDK / Xcode weren't available in the environment this was
  built in** (no `dl.google.com` access, no macOS), so `flutter analyze` and
  `flutter test` were used to validate the Dart code, but an actual
  `flutter build apk`/`ipa` hasn't been run end-to-end. Run one locally
  before shipping — this is standard Flutter project boilerplate underneath
  (generated with `flutter create`), so it should build cleanly once the SDKs
  are present.
