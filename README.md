# GitHub Project Manager

Una piattaforma web moderna per gestire e monitorare automaticamente i tuoi progetti GitHub, tracciando lo stato (MVP vs Completato) basandosi sulla presenza di file specifici di documentazione e metriche.

## ✨ Caratteristiche Principali

- 🔐 **Autenticazione GitHub OAuth** - Accedi in sicurezza con il tuo account GitHub
- 📦 **Sincronizzazione automatica** - Monitora i tuoi repository in background
- 📊 **Dashboard interattiva** - Visualizza tutti i tuoi progetti con il loro stato e progress
- 🏷️ **Status tracking automatico** - Rileva automaticamente se un progetto è MVP, Completato o In Progress
- 📈 **Progress bars MVP** - Traccia il completamento delle checklist MVP con barre di progresso visive
- 📄 **Analisi file avanzata** - Legge README, CHANGELOG, MVP.md e RELEASE.md per determinare lo stato
- 🎨 **Interfaccia responsive** - Design moderno con temi light/dark
- 🔄 **Sincronizzazione manuale** - Aggiorna i tuoi progetti on-demand
- 📱 **Full-width detail pages** - Visualizzazione dettagliata con timeline changelog e MVP checklist

## 🛠️ Tech Stack

- **Frontend**: Next.js 16.2 (React 19)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL con Postgres client
- **Autenticazione**: NextAuth.js 4.24 con GitHub OAuth
- **Styling**: Tailwind CSS 4
- **API GitHub**: Octokit 5.0
- **TypeScript**: Per type safety completo

## 🚀 Setup Rapido

### 1. Configura le variabili d'ambiente

Crea un file `.env.local`:

```bash
# GitHub OAuth (crea app su https://github.com/settings/apps)
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# NextAuth (genera con: openssl rand -base64 32)
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000

# Database PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/github_manager

NODE_ENV=development
```

### 2. Installa le dipendenze

```bash
npm install
```

### 3. Avvia il server di sviluppo

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

## 📖 Come funziona

1. **Login con GitHub** - Autorizza l'app per accedere ai tuoi repository pubblici
2. **Sincronizza** - Clicca "Sync Now" per recuperare i tuoi progetti
3. **Analizza** - L'app legge README, CHANGELOG, MVP.md e RELEASE.md per determinare lo stato
4. **Visualizza** - Guarda la dashboard con tutti i progetti raggruppati per stato

## 🎯 Determinazione dello Stato

L'app automaticamente assegna uno stato basandosi su:

- **COMPLETED** ✅ - File `RELEASE.md` presente oppure versione >= 1.0.0
- **MVP** 🚀 - File `MVP.md` presente oppure versione < 1.0.0 (0.x.x)
- **IN_PROGRESS** ⚙️ - Nessuno dei file precedenti

### MVP Checklist
Quando un progetto è in stato MVP, l'app calcola automaticamente la percentuale di completamento basata su:
- Numero di task completate nella checklist MVP.md
- Visualizzazione come barra di progresso sulla dashboard e nella pagina di dettaglio

## 📁 Struttura del Progetto

```
├── app/
│   ├── page.tsx                    # Login page
│   ├── layout.tsx                  # Root layout
│   ├── dashboard/
│   │   ├── page.tsx               # Dashboard principale (lista progetti)
│   │   └── [repoId]/
│   │       └── page.tsx           # Dettagli progetto
│   └── api/
│       ├── auth/[...nextauth]/    # NextAuth routes
│       └── repos/                 # Repository API endpoints
├── lib/
│   ├── auth.ts                    # NextAuth configuration
│   ├── db.ts                      # Database client
│   ├── github.ts                  # GitHub API utilities
│   └── status.ts                  # Status detection logic
├── components/                    # React components
├── public/                        # Static files (logos, favicon)
├── prisma/                        # Database schema
└── docs/                          # Documentation files
```

## 🔌 API Endpoints

### Repository Management

**GET /api/repos**
- Lista tutti i repository con status
- Returns: Array di repository con status, mvp_done, mvp_total

**POST /api/repos**
- Sincronizza i repository da GitHub
- Analizza file e calcola progress
- Returns: Array di repository sincronizzati

**GET /api/repos/[id]**
- Dettagli di un repository specifico
- Include: README, CHANGELOG, MVP checklist
- Returns: Repository details con contenuti dei file

## 🎨 Dashboard Features

- **Raggruppamento per status** - Sezioni separate per In Progress, MVP, Completed
- **Card progressive** - Mini progress bar per progetti MVP
- **Ordinamento** - Progetti ordinati per data ultimo sync
- **Responsive grid** - Layout da 1 a 5 colonne a seconda della risoluzione
- **Tema light/dark** - Logo brandizzato responsive

## 📄 Detail Page Features

- **Full-width layout** - 2 colonne: MVP checklist + Changelog timeline
- **MVP Checklist** - Visualizzazione dei task con checkbox, progress bar
- **Changelog Timeline** - Timeline visuale di tutti i release
- **README Summary** - Anteprima del README principale
- **GitHub Links** - Link diretti al repository

## 🚀 Deployment

### Su Vercel

```bash
# 1. Connetti il repo su Vercel Dashboard
# 2. Configura le variabili d'ambiente
# 3. Configura il database PostgreSQL (es: Vercel Postgres)
# 4. Deploy
```

### Su un Server/VPS

```bash
npm install
npm run build
npm start
```

**Nota**: PostgreSQL deve essere disponibile. Assicurati di gestire backups regolari del database.

## 🔄 Sincronizzazione Automatica

L'app supporta la sincronizzazione automatica tramite:

- **Manual sync**: Button "Sync Now" sulla dashboard
- **API sync**: POST /api/repos
- **NextAuth hooks**: Token refresh automatico al re-login

## 🐛 Troubleshooting

### Database connection failed
- Verifica che PostgreSQL è in esecuzione
- Controlla `DATABASE_URL` in `.env.local`
- Verifica credenziali database

### GitHub token not found
- Accedi di nuovo
- Verifica credenziali GitHub OAuth
- Controlla scopes dell'app GitHub

### Repository non si sincronizza
- Clicca "Sync Now"
- Verifica i log della console per errori
- Controlla che il token GitHub ha permessi sufficienti

### Timestamp non visualizzati correttamente
- L'app converte automaticamente epoch seconds a Date
- Verifica che lastSyncedAt sia in secondi (epoch)

## 📊 Monitoraggio

- Tutti i repository sincronizzati vengono salvati nel database
- Tracking di: status, versione, data ultimo sync, MVP progress
- API ready per integrazioni esterne

## 📝 License

MIT

## 👤 Autore

Rob

---

**Ultima modifica**: 2026-04-28
**Versione**: 0.1.0 (MVP)
