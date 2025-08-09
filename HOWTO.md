# Install and Run qibliah on a Physical iPhone

This guide explains how to install and launch the app on a real iPhone using a free or paid Apple ID, without TestFlight or the App Store.

## 1) Trust the developer profile on the iPhone

- Open: Settings → General → VPN & Device Management
- Under Developer App, tap your Apple Development identity
- Tap Trust, then Verify if prompted

Why: iOS blocks apps signed with a developer certificate until you explicitly trust the developer. Trusting the profile allows iOS to launch the installed build.

## 2) Enable Developer Mode on the iPhone

- Open: Settings → Privacy & Security → Developer Mode
- Toggle Developer Mode → Restart if prompted → Confirm after reboot

Why: On iOS 16+, Developer Mode must be enabled to run locally built apps and use debugging features.

## 3) Connect and run the app from your Mac

- Unlock your iPhone and connect it via USB (or trusted Wi‑Fi debugging)
- From the project root on your Mac, run:

```bash
npm run ios:device
```

What happens: Xcode builds and installs the app on your device, then attempts to launch it. Keep the phone unlocked during install and first launch.

## 4) If the app fails to launch (code signing or trust issues)

Open the Xcode workspace and confirm signing:

- Open `ios/qibliah.xcworkspace` in Xcode
- Select the target `qibliah` → Signing & Capabilities
  - Automatically manage signing: ON
  - Team: `622769S2AN`
  - Bundle Identifier: `net.codesapien.qibliah`

Why: The installed app’s signature and entitlements must match the selected team and bundle identifier. If these differ, iOS will refuse to launch the app.

## 5) Reinstall and relaunch if needed

- Delete the app from your iPhone
- Re-run the install:

```bash
npm run ios:device
```

Why: After adjusting signing or trust, a clean reinstall ensures the latest, correctly signed build is on the device.

## 6) As a last resort, restart both devices

- Restart your iPhone and your Mac
- Reconnect the device (approve Trust Computer prompts if shown)
- Run `npm run ios:device` again

Why: USB pairing, developer services, and code signing caches can get into a bad state and are often resolved by a reboot.

---

### Extra tips and notes

- Free Apple ID provisioning: Installs expire after 7 days. Rebuild/reinstall any time.
- Keep device unlocked during build/install and first launch.
- Developer profile changes: If you switch Apple IDs or teams, re‑trust the new developer profile under Settings → General → VPN & Device Management.
- Common iOS launch error text:
  - “Unable to launch … because it has an invalid code signature, inadequate entitlements or its profile has not been explicitly trusted by the user.”
  - Fix by completing steps 1–4 above and reinstalling.
- Xcode version vs iOS version: Make sure your Xcode supports your device iOS version.
