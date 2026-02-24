# iOS App Store — Full Release Checklist

Kontrollera alla punkter innan submission så att appen **inte blir rejected**. Baserat på Apple App Store Review Guidelines 2025.

---

## 1. Snabba rejection-orsaker (fixa dessa först)

| ✓ | Krav | Golf Excuse Generator | Åtgärd |
|---|------|----------------------|--------|
| ✓ | **Appen kraschar inte** | Inga placeholder-flöden, inga "coming soon" | Testa på riktig enhet, TestFlight |
| ✓ | **Privacy Policy länkad** | In-app: sidfot "Privacy" → öppnar URL | Verifiera att länken fungerar |
| ✓ | **Privacy Policy i App Store Connect** | Metadata → Privacy Policy URL | Sätt: `https://dotsystemsdevs.github.io/app-legal-docs/app-golfexcuse/privacy.html` |
| ✓ | **Inga IAP utan Restore** | Appen har inga köp | N/A — ingen Restore behövs |
| ✓ | **Inga konton utan Delete** | Appen kräver inget konto | N/A — ingen Delete behövs |
| ✓ | **Ingen UGC utan moderation** | Appen har ingen användargenererad innehåll | N/A |

---

## 2. Metadata — måste matcha appen (Guideline 2.3)

| ✓ | Vad | Status | Notering |
|---|-----|--------|----------|
| ✓ | App name (max 30 tecken) | "Golf Excuse Generator" (22) | OK |
| ✓ | Beskrivning = faktiska funktioner | Uppdaterad i PLAYSTORE_LISTING.md | Inga löften om väder-prefix (finns inte) |
| ✓ | Screenshots = faktisk UI | Ta nya vid build | Visa: splash, huvudvy, genererad ursäkt, kopierat |
| ✓ | Ingen "wife"-referens i beskrivning | Uppdaterad | Ändrad till "maintenance staff" |

---

## 3. Legal & Privacy (Guideline 5.1.1)

| ✓ | Krav | URL / Plats |
|---|------|-------------|
| ✓ | Privacy Policy in-app | Sidfot → "Privacy" → `LEGAL_BASE_URL/privacy.html` |
| ✓ | Terms of Service in-app | Sidfot → "Terms" → `LEGAL_BASE_URL/terms.html` |
| ✓ | Privacy Policy i App Store Connect | App Information → Privacy Policy URL |
| ✓ | Support URL (rekommenderat) | Sätt i App Store Connect: `https://dotsystemsdevs.github.io/app-legal-docs/` eller `mailto:support@dotsystems.se` |

**LEGAL_BASE_URL:** `https://dotsystemsdevs.github.io/app-legal-docs/app-golfexcuse`  
Verifiera att båda sidor laddas: `/privacy.html` och `/terms.html`.

---

## 4. Tekniska inställningar

| ✓ | Inställning | Plats | Värde |
|---|-------------|-------|-------|
| ✓ | bundleIdentifier | app.json → ios | `com.dotsystems.appgolfexcuse` |
| ✓ | usesNonExemptEncryption | app.json → ios.config | `false` (ingen egen kryptering) |
| ✓ | EAS projectId | app.json → extra.eas | `app-golfexcuse` |

---

## 5. Innehåll — ingen stötande content (Guideline 1.1)

| ✓ | Kontroll |
|---|----------|
| ✓ | Alla ursäkter i `src/excuses.js` är okej för 4+ |
| ✓ | Ingen personangrepp, hat, eller olagligt innehåll |

Ursäkterna är golf-humor (väder, klubb, bollar, etc.). Ingen explicit eller stötande text.

---

## 6. Pre-build (innan `eas build`)

```bash
npx expo-doctor
```

Åtgärda alla varningar och fel.

---

## 7. Build för iOS

```bash
eas build --platform ios --profile production
```

Efter build: ladda ner .ipa eller använd `eas submit` till App Store Connect.

---

## 8. App Store Connect — innan submission

| ✓ | Steg |
|---|------|
| ✓ | Skapa app (om inte finns) med bundle ID `com.dotsystems.appgolfexcuse` |
| ✓ | Sätt Privacy Policy URL i App Information |
| ✓ | Sätt Support URL (App Information eller Contact) |
| ✓ | Ladda upp screenshots (6.7", 6.5", 5.5" etc. enligt krav) |
| ✓ | App Description — kopiera från PLAYSTORE_LISTING.md |
| ✓ | Keywords (max 100 tecken) |
| ✓ | Kategori: t.ex. Entertainment eller Sports |
| ✓ | Åldersgräns: 4+ (ingen stötande innehåll) |

---

## 9. App Review Notes (viktigt)

Klistra in i fältet "Notes" när du skickar till review:

```
Golf Excuse Generator — Random golf excuses, one tap. No account, no purchases.

How to test:
1. Open app
2. Tap "Generate Excuse" — a random excuse appears
3. Tap copy icon — excuse copies to clipboard ("Copied!" shows)
4. Tap "Privacy" or "Terms" in footer — opens web pages
5. Tap "Rate the app" — opens App Store review (if available)

The app works fully offline. No login, no ads, no in-app purchases.
Privacy Policy: https://dotsystemsdevs.github.io/app-legal-docs/app-golfexcuse/privacy.html
```

---

## 10. Efter godkännande

1. Uppdatera `appStoreUrl` i `app.json` med riktig App Store-länk (t.ex. `https://apps.apple.com/app/idXXXXXXXXX`).
2. Uppdatera `ROADMAP.md` med release-datum.

---

## Vanliga rejection-orsaker (undvik dessa)

| Orsak | Hur vi undviker |
|-------|-----------------|
| Krasch eller trasig funktion | Testa på fysisk enhet, TestFlight |
| Privacy Policy svår att hitta | Synlig länk i sidfot, URL i metadata |
| Metadata matchar inte appen | Inga löften om väder-prefix (finns inte) |
| Saknad Support-URL | Sätt i App Store Connect |
| Export compliance | `usesNonExemptEncryption: false` i app.json |
