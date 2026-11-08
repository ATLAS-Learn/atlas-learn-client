# Mobile preview builds

## GitHub Actions preview APK

The repository includes a manually triggered workflow at
`.github/workflows/mobile-preview-apk.yml`. It runs a local EAS Android build and
uploads the APK as a GitHub Actions artifact.

### Required repository secret

Add `EXPO_TOKEN` under **Settings → Secrets and variables → Actions**. Create the
token with:

```bash
eas login
eas token:create
```

The token must have permission to access the Apex Learn Expo project.

### Optional Firebase secret

If Android FCM credentials are needed for the preview build, add
`GOOGLE_SERVICES_JSON` as a repository Actions secret containing the complete
contents of Firebase's `google-services.json`. The workflow writes it only
during the build and removes it afterward. Never commit that file or a Firebase
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
