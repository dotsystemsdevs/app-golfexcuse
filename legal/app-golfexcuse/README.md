# app-golfexcuse — Legal docs

**Allt klart:** Appen länkar till Privacy och Terms på GitHub Pages. För att länkarna ska fungera måste denna mapp publiceras i repo **app-legal-docs**. Följ stegen nedan så är legal omhändertagen.

---

## Steg 1: Var källkoden ligger

- **I detta repo:** `legal/app-golfexcuse/` (denna mapp).
- **Filer:** `privacy.md`, `terms.md`, `README.md`.

---

## Steg 2: Var det ska publiceras

1. Öppna repo [app-legal-docs](https://github.com/dotsystemsdevs/app-legal-docs).
2. Skapa eller använd mappen **`app-golfexcuse`** i root (samma namn som i denna mapp).
3. Kopiera innehållet: `privacy.md`, `terms.md` (och ev. konverterade `.html` om ni använder egen build). Om app-legal-docs bygger HTML från `.md` behöver du bara kopiera `.md`-filerna.

**Sökväg i app-legal-docs:** `app-legal-docs/app-golfexcuse/`

---

## Steg 3: Vilka URL:er appen använder

Efter deploy (GitHub Pages) måste dessa URL:er vara nåbara:

| Sidor | URL |
|-------|-----|
| Privacy Policy | https://dotsystemsdevs.github.io/app-legal-docs/app-golfexcuse/privacy.html |
| Terms of Service | https://dotsystemsdevs.github.io/app-legal-docs/app-golfexcuse/terms.html |

Appen öppnar dessa från footern (Privacy · Terms). Om URL:erna inte fungerar får användaren ett fel när de trycker på länkarna.

---

## Sammanfattning

- **Kopiera:** denna mapp (`legal/app-golfexcuse/`) → till app-legal-docs som mappen **`app-golfexcuse`**.
- **Deploy:** enligt app-legal-docs (t.ex. GitHub Pages på main).
- **Kontrollera:** att båda URL:erna ovan laddar rätt sida.
