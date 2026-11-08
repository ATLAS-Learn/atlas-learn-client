# Mobile preview builds

## GitHub Actions preview APK

The repository includes a manually triggered workflow at
`.github/workflows/mobile-preview-apk.yml`. It runs a local EAS Android build and
uploads the APK as a GitHub Actions artifact.

### Required repository secret

Add `EXPO_TOKEN` under **Settings → Secrets and variables → Actions**. Create an
Expo access token from the Expo dashboard:

1. Sign in at [expo.dev](https://expo.dev).
2. Open **Account settings → Access tokens**.
3. Create a token and copy it immediately.
4. Add it to the repository as the `EXPO_TOKEN` Actions secret.

The token's Expo account must have permission to access the Apex Learn project.
`eas token:create` is not available in all EAS CLI versions; the dashboard is
the supported fallback when that command is missing.

The Android keystore and push-notification credentials shown by
`eas credentials` remain stored in EAS. The workflow reuses them and passes
`--freeze-credentials`, so it will fail rather than replace them if they are
missing or inaccessible.

### Firebase credentials

For the current Expo Push setup, configure the Android Google service account
through EAS:

```bash
eas credentials --platform android
```

Choose **Google Service Account** and configure the FCM v1 credential in EAS.
The **Push Notifications (Legacy) API Key** option is not needed for the
current FCM v1 setup.

If the Android build specifically requires Firebase's
`google-services.json`, add `GOOGLE_SERVICES_JSON` as an Actions secret
containing the complete file contents. The workflow writes it only during the
build and removes it afterward. Never commit that file or a Firebase
service-account private key.

### Run the build

1. Open the repository's **Actions** tab.
2. Select **Mobile Preview APK**.
3. Click **Run workflow**.
4. Open the completed run and download the
   `apex-learn-preview-apk-<run number>` artifact.
5. Install the APK on a physical Android device.

The workflow uses the existing `mobile/eas.json` `preview` profile and the
production API URL configured for preview builds.

### Local equivalent

From the repository root:

```bash
cd mobile
EXPO_TOKEN=your-token pnpm exec eas build \
  --local \
  --non-interactive \
  --profile preview \
  --platform android \
  --output ./artifacts/apex-learn-preview.apk
```

Local EAS builds require a compatible Java/Android SDK environment. GitHub-hosted
Ubuntu runners provide the standard Android tooling used by this workflow.

This workflow creates a preview APK only. Production AAB builds and OTA update
publishing require separate release workflows and signing/release policies.
