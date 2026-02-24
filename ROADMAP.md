# Roadmap

**Aktuell version:** `v1.0.0` · **Nästa planerade:** `v1.1.0`

**Var version sätts:** `app.json` (expo.version), `package.json` (version), `app.json` (android.versionCode endast för Android).

---

## Released

### v1.0.0 — Feb 2026

Första release (App Store & Google Play).

| Ändring | Typ |
|--------|------|
| Slumpmässig golfursäkt från 150+ alternativ | Feature |
| Kopiera till urklipp med "Copied!"-feedback | Feature |
| Uppmaning att betygsätta efter 3 genereringar | Feature |
| In-app uppdateringskontroll (Expo Updates) med reload-banner | Feature |
| Länkar till Privacy & Terms i sidfot (app-legal-docs) | Legal |
| VoiceOver / TalkBack och reduce-motion | Polish |
| EAS Build (iOS bundleIdentifier, Android package) | Build |
| 100 % offline — inga konton, ingen spårning | Privacy |

---

## Bugs

| Bug | Prioritet | Status |
|-----|-----------|--------|
| *(inga öppna)* | — | — |

---

## Build-checklista (före varje release)

**iOS:** Gå igenom [IOS_APP_STORE_CHECKLIST.md](IOS_APP_STORE_CHECKLIST.md) innan submission.

1. **Höj version** i `app.json` och `package.json` (t.ex. 1.0.0 → 1.1.0).
2. **Android:** Sätt `android.versionCode` i `app.json` till ett högre heltal än föregående release.
3. **Kör:** `npx expo-doctor` och åtgärda eventuella fel.
4. **Bygg:** `eas build --platform all --profile production`
5. **Ladda upp:** Till App Store Connect (iOS) och Google Play Console (Android), eller använd `eas submit`.

**Aktuellt versionCode (Android):** `1` (v1.0.0)

---

## Planerat — v1.1.0

| Feature | Prioritet | Typ |
|---------|-----------|------|
| *(TBD)* | — | — |

---

## Community Requests — v1.1.0+

Önskemål från användare. Nice to have.

| Feature | Prioritet | Typ | Källa |
|---------|-----------|-----|--------|
| *(inga än)* | — | — | — |

---

## Framtida idéer

| Idé | Prioritet | Notering |
|-----|-----------|----------|
| Fler kategorier/teman för ursäkter | P3 | Mer innehåll |
| Dela ursäkt som bild / socialt kort | P3 | Delning |
| Lokalisering (t.ex. svenska) | P3 | Större reach |
| Valfri ljud/haptik vid generering | P3 | Polish |

---

## Community Highlights

*(Citat från användare efter release.)*

---

## Prioritetsguide

| Nivå | Betydelse |
|------|-----------|
| **P1** | Kritisk — fixa före nästa release |
| **P2** | Viktig — sikta på aktuell milstolpe |
| **P3** | Nice to have — framtida backlog |
