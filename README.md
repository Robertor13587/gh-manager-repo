# GitHub Project Manager

Una piattaforma web per gestire e monitorare automaticamente i tuoi progetti GitHub, tracciando lo stato (MVP vs Completato) basandosi sulla presenza di file specifici di documentazione.

## Caratteristiche

- 🔐 **Autenticazione GitHub OAuth**: Accedi in sicurezza con il tuo account GitHub
- 📦 **Sincronizzazione automatica**: Monitora i tuoi repository in background
- 📊 **Dashboard interattiva**: Visualizza tutti i tuoi progetti con il loro stato
- 🏷️ **Status tracking**: Rileva automaticamente se un progetto è MVP, Completato o In Progress
- 📄 **Analisi file**: Legge README, CHANGELOG e altri file per determinare lo stato
- 🔄 **Sincronizzazione manuale**: Aggiorna i tuoi progetti on-demand

## Tech Stack

- **Frontend**: Next.js 13+ (React)
- **Backend**: Next.js API Routes
- **Database**: SQLite (file-based, senza server!)
- **Autenticazione**: NextAuth.js con GitHub OAuth
- **Styling**: Tailwind CSS
- **API GitHub**: Octokit

## Setup Rapido

### 1. Configura le variabili d'ambiente

Crea un file `.env.local`:

```bash
# GitHub OAuth (crea app su https://github.com/settings/apps)
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# NextAuth (genera con: openssl rand -base64 32)
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000

NODE_ENV=development
```

**Nota**: Il database SQLite verrà creato automaticamente in `data/github-manager.db` al primo avvio. Non serve configurazione!

### 2. Avvia il server di sviluppo

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

## Come funziona

1. **Login con GitHub**: Autorizza l'app per accedere ai tuoi repository pubblici
2. **Sincronizza**: Clicca "Sync Now" per recuperare i tuoi progetti
3. **Analizza**: L'app legge README, CHANGELOG, MVP.md e RELEASE.md per determinare lo stato
4. **Visualizza**: Guarda la dashboard con tutti i progetti e il loro stato

## Determinazione dello Stato

L'app automaticamente assegna uno stato basandosi su:

- **COMPLETED**: File `RELEASE.md` o versione >= 1.0.0
- **MVP**: File `MVP.md` o versione < 1.0.0 (0.x.x)
- **IN_PROGRESS**: Nessuno dei file precedenti

## Struttura del Progetto

```
├── app/
│   ├── page.tsx              # Login page
│   ├── dashboard/page.tsx    # Dashboard
│   ├── dashboard/[repoId]/   # Dettagli progetto
│   └── api/repos/            # API endpoints
├── lib/
│   ├── db.ts                 # Prisma client
│   ├── github.ts             # GitHub API
│   ├── status.ts             # Status detection
│   └── sync-cron.ts          # Background sync
├── prisma/schema.prisma      # Database schema
└── public/                   # Static files
```

## API Endpoints

### GET /api/repos
Lista di repository con status

### POST /api/repos
Sincronizza i repository da GitHub

### GET /api/repos/[id]
Dettagli di un repository specifico

## Deployment

### Su Vercel
```bash
# Push su GitHub, connetti in Vercel Dashboard
# Configura le variabili d'ambiente (GITHUB_CLIENT_ID, etc) e deploy
# SQLite verrà creato automaticamente nel filesystem di Vercel
```

### Su un Server/VPS
```bash
npm install
npm run build
npm start
```

**Nota**: SQLite salva i dati nel filesystem. Assicurati di fare backup della cartella `data/` se usi questo su un server di produzione.

## Sincronizzazione Automatica

### Option 1: Node-cron (attivo in produzione)
Il file `lib/sync-cron.ts` è configurato per sincronizzare ogni 6 ore

### Option 2: Vercel Crons
Crea `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/sync",
    "schedule": "0 */6 * * *"
  }]
}
```

## Troubleshooting

**Database connection failed**
- Verifica che PostgreSQL è in esecuzione
- Controlla `DATABASE_URL` in `.env.local`

**GitHub token not found**
- Accedi di nuovo
- Verifica credenziali GitHub OAuth

**Repository non si sincronizza**
- Clicca "Sync Now"
- Verifica i log della console per errori

## License

MIT
