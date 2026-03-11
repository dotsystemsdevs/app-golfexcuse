<p align="center">
  <img src="assets/logo.png" alt="Bogey Blamer" width="120" height="120" />
</p>

<h1 align="center">Bogey Blamer</h1>

<p align="center">
  <strong>Bad shot? Blame everything but yourself.</strong><br/>
  A golf excuse generator built with React Native.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.3.0-1A1A1A?style=for-the-badge" alt="Version" />
  &nbsp;
  <img src="https://img.shields.io/badge/license-MIT-1A1A1A?style=for-the-badge" alt="License" />
  &nbsp;
  <img src="https://img.shields.io/badge/platform-Android%20%7C%20iOS-1A1A1A?style=for-the-badge&logo=apple&logoColor=white" alt="Platform" />
</p>

---

## Screenshots

<p align="center">
  <img src="screenshots/ios/1.jpg" alt="Generate excuse" width="140" />
  <img src="screenshots/ios/2.jpg" alt="Categories" width="140" />
  <img src="screenshots/ios/3.jpg" alt="Leaderboard" width="140" />
  <img src="screenshots/ios/4.jpg" alt="Submit excuse" width="140" />
  <img src="screenshots/ios/5.jpg" alt="Settings" width="140" />
  <img src="screenshots/ios/6.jpg" alt="Shake to generate" width="140" />
</p>

---

## What It Does

Tap or shake your phone to generate a random golf excuse. Copy it, share it, blame anything but your swing.

- **219 excuses** across 7 categories (Weather, Equipment, Course, Body, Mental, Blame, Luck)
- **Shake to generate** — just shake your phone for a new excuse
- **Copy & share** — one tap to clipboard
- **Community leaderboard** — vote on the best excuses, see weekly/monthly/all-time rankings
- **Submit your own** — send excuses for community review
- **Haptic feedback** — satisfying vibrations on every action
- **Privacy-first analytics** — TelemetryDeck, no personal data collected
- **In-app updates** — always the latest excuses via Expo Updates
- **100% offline capable** — works without internet, syncs when connected

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo SDK 54 |
| Language | JavaScript |
| Backend | Supabase (leaderboard, votes, submissions) |
| Storage | AsyncStorage |
| Haptics | Expo Haptics |
| Sensors | Expo Sensors (shake detection) |
| Analytics | TelemetryDeck (privacy-first) |
| Testing | Jest |

---

## Getting Started

```bash
git clone https://github.com/dotsystemsdevs/app-golfexcuse.git
cd app-golfexcuse
npm install
npm start
```

```bash
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run web        # Browser
```

**Requirements:** Node.js 18+, Expo CLI

---

## Project Structure

```
App.js              Main single-file app component
src/
  constants.js      Config, palette, spacing, fonts
  excuses.js        219 excuses with categories & tags
  utils.js          pickRandom, pickWeighted helpers
  supabase.js       Supabase client & API helpers
assets/             Icons, logo, splash screen
screenshots/        App Store & Play Store screenshots
backend/            Supabase schema & setup
```

---

## Privacy & Data

**No accounts. No tracking. No ads.**

Anonymous usage analytics via [TelemetryDeck](https://telemetrydeck.com) — no personal data collected. Leaderboard votes use anonymous device IDs.

---

## Legal

- [Privacy Policy](https://dotsystemsdevs.github.io/app-legal-docs/app-golfexcuse/privacy.html)
- [Terms of Service](https://dotsystemsdevs.github.io/app-legal-docs/app-golfexcuse/terms.html)

## License

MIT
