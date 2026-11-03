# Pietro Rocchi — Portfolio

Portfolio con nebulosa viola interattiva, animazioni allo scroll e MotoLink in primo piano. Tema chiaro/scuro, layout responsive e pannello riservato `/admin` con salvataggi persistenti.

Questa versione è autonoma da ChatGPT Sites. Usa **Cloudflare Workers Free + D1 Free** e il codice può essere mantenuto interamente in questa repository. Non usa il login ChatGPT né richiede un PC sempre acceso.

## Pubblicazione da iPhone

1. In Cloudflare apri **Workers & Pages → Create application → Import a repository**.
2. Collega questa repository e seleziona il branch **main**.
3. Nome del Worker: **pietro-rocchi-portfolio** (deve corrispondere a `wrangler.jsonc`).
4. Comando di build: `npm run build`.
5. Comando di deploy: **`npm run deploy`**, non il solo `npx wrangler deploy`.
6. Root directory: lascia vuota o `/`. Mantieni il piano Free.
7. Avvia il deploy. Lo script trova o crea il database D1 chiamato `pietro-portfolio-content`, applica le migrazioni e pubblica il Worker con il binding `DB`.
8. Dopo la pubblicazione apri **Settings → Variables and Secrets → Add** e inserisci come **Secret**:
   - `ADMIN_PASSWORD`: password personale lunga almeno 16 caratteri, preferibilmente generata dal gestore password.
   - `SESSION_SECRET`: valore casuale distinto, lungo almeno 32 caratteri; usa un altro valore generato dal gestore password.
9. Salva e applica le modifiche. Apri l’indirizzo `workers.dev` mostrato da Cloudflare e aggiungi `/admin` per accedere.

Non inserire le password nella repository, nelle variabili pubbliche o nella chat. Prima di configurarle, il portfolio è comunque leggibile e l’admin rimane bloccato.

Il token di deploy Cloudflare deve poter leggere/creare database D1 e pubblicare Workers. Se il deploy riporta un errore di permessi, correggi il token in Settings → Builds invece di riprovare alla cieca. Non acquistare piani a pagamento per risolvere un errore di configurazione.

I file statici sono serviti direttamente come asset; il Worker viene usato per `/api/*` e `/admin`. Non è configurato alcun prodotto a pagamento. I limiti del piano Free restano quelli applicati da Cloudflare.

## Gestione contenuti

- `/admin` non è linkato dal portfolio.
- Puoi aggiornare testi, social, GitHub, descrizioni e collegamenti di MotoLink.
- Il sito MotoLink resta “Coming soon” finché non configuri il suo URL nell’admin.
- Le modifiche sono salvate nel database e visibili su tutti i dispositivi dopo il caricamento della pagina.
- Esporta/importa un backup JSON dal pannello. I contenuti salvati nel vecchio Site non vengono copiati automaticamente: esportali dal vecchio admin e importali qui se hai già fatto modifiche.
- Config e sorgenti contengono solo i testi iniziali; i successivi salvataggi admin non producono commit su GitHub.

## Sicurezza admin

Sessione firmata di 8 ore con cookie `Secure`, `HttpOnly`, `SameSite=Strict`. Password e chiave di firma sono segreti server. I salvataggi controllano sessione, origine, formato e destinazioni dei link. I tentativi di login sono limitati con contatori D1; gli indirizzi IP non sono conservati in chiaro. Cambiare password o chiave invalida le vecchie sessioni. Due schede non possono sovrascrivere senza avviso la stessa revisione.

## Sviluppo

Richiede Node.js 22.13+ (Node 24 consigliato).

```sh
npm ci
npm run check
npm run dev
```

Per provare il login in locale copia `.dev.vars.example` in `.dev.vars` e imposta valori solo locali. Non caricare mai `.dev.vars` su GitHub.

- `web/`: HTML, CSS e JavaScript del portfolio e dell’admin.
- `config/`: testi iniziali e definizione dei campi.
- `src/worker.js`: API e pagine protette.
- `src/auth.js`: login e sessioni.
- `migrations/`: schema D1 versionato; non modificare migrazioni già applicate.
- `scripts/deploy.mjs`: creazione/risoluzione D1, migrazioni, deploy.
- `public/`: file statici aggiuntivi, inclusi i file di verifica preesistenti.
- `tests/`: test di autorizzazione, persistenza, conflitti e validazione.

`npm run build` genera `dist/` e `src/pages.js`. `npm run check` esegue test e compilazione Worker senza pubblicare. `npm run deploy` richiede accesso al tuo account Cloudflare.

## Migrazione dal vecchio portfolio

Il precedente frontend Vite e il workflow GitHub Pages vengono sostituiti da questa versione. GitHub Pages non può eseguire il backend: usa l’URL Cloudflare. Una copia della vecchia versione va mantenuta nel branch `backup/portfolio-prima-cloudflare-2026-11-03` prima della sostituzione del branch main.
