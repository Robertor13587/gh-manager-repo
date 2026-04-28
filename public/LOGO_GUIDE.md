# GitHub Project Manager - Logo Guide

## Overview

Il branding del progetto **GitHub Project Manager** combina due concetti chiave:
- **Octopus di GitHub**: rappresenta la connessione con l'ecosistema GitHub
- **Dashboard Grid**: rappresenta il monitoraggio e l'organizzazione dei progetti

## Logo Files

### 1. **logo.svg** (Light Theme)
Logo principale per utilizzo generale
- Background bianco con accenti blu
- Perfetto per sfondi chiari
- Dimensioni: 200x200px (scalabile)
- Uso: header, branding, landing page

### 2. **logo-dark.svg** (Dark Theme)
Variante per tema scuro
- Background scuro con accenti blu luminosi
- Perfetto per sfondi scuri
- Dimensioni: 200x200px (scalabile)
- Uso: theme selector, dark mode

### 3. **favicon.svg** (Favicon)
Versione piccola e semplificata
- Ottimizzata per visualizzazione a piccole dimensioni
- Registrata nel metadata del layout (app/layout.tsx)
- Dimensioni: 180x180px
- Uso: browser tab, bookmarks, social media

## Color Palette

- **Primary Dark**: #1f2937 (octopus head)
- **Primary Light**: #60a5fa (light blue for dark theme)
- **Accent**: #3b82f6 (bright blue for dashboard elements)
- **Background**: #ffffff (light mode), #1f2937 (dark mode)

## Design Features

### Octopus Character
- 8 tentacoli che rappresentano le 8 braccia dell'Octocat di GitHub
- Gradiente morbido dal grigio scuro al nero
- Occhi espressivi con pupille blu
- Stile moderno e friendly

### Dashboard Elements
- Griglia di 4 punti negli angoli
- Rappresenta il concetto di monitoraggio multiplo
- Opacità variabile per effetto di profondità
- Comunica "organizzazione" e "tracciamento"

## Usage

### Import in Components
```jsx
// Logo light
<img src="/logo.svg" alt="GitHub Project Manager" />

// Logo dark
<img src="/logo-dark.svg" alt="GitHub Project Manager" />

// Favicon (automaticamente nel browser tab)
```

### CSS Classes
```css
/* Se vuoi usare i loghi come background */
.logo-light {
  background-image: url('/logo.svg');
}

.logo-dark {
  background-image: url('/logo-dark.svg');
}
```

### Responsive Sizing
```jsx
<img 
  src="/logo.svg" 
  alt="GitHub Project Manager"
  style={{ maxWidth: '100%', height: 'auto' }}
  className="w-32 h-32 md:w-48 md:h-48"
/>
```

## Theme Integration

Il favicon è automaticamente integrato in `app/layout.tsx`:
```typescript
icons: {
  icon: "/favicon.svg",
  apple: "/favicon.svg",
}
```

Se vuoi supportare light/dark theme per il logo principale, puoi usare:
```jsx
<picture>
  <source media="(prefers-color-scheme: dark)" srcSet="/logo-dark.svg" />
  <img src="/logo.svg" alt="GitHub Project Manager" />
</picture>
```

## Future Enhancements

Potenziali miglioramenti:
- [ ] Versione PNG rasterizzata (1024x1024px) per social media
- [ ] Versione icona rotonda (per favicon a tema)
- [ ] Variante monocolore per stampa B/W
- [ ] Animated logo per loading state
- [ ] SVG con animazione CSS per hero section

## Brand Guidelines

- Mantenere sempre il rapporto di aspetto 1:1
- Non modificare i colori senza approvazione
- Utilizzare almeno 30px di spazio attorno al logo
- Non ruotare il logo oltre 90 gradi
- Utilizzare contro background minimo 50% di contrasto

---

Created: 2026-04-28
Design: Modern, minimal, GitHub-aligned
Status: Ready for production use ✅
