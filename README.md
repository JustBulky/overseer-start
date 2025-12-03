# Overseerr-StartPage

A single-page React 18 experience for quickly chatting with a Gemini-powered assistant that can route movie and TV requests to your Overseerr instance through a configurable proxy.

## Getting Started

This project is dependency-free: just serve the `index.html` from any static server.

```bash
# from the repo root
python -m http.server 4173
# then open http://localhost:4173
```

> All runtime dependencies are loaded from `esm.sh` via the import map in `index.html`.

## Features

- Clean chat interface that differentiates movies vs. TV shows and asks clarifying questions for ambiguous titles (like US vs. UK versions of "The Office").
- Settings modal with Overseerr URL/API key, Gemini API key, proxy controls, a "Test Connection" button that pings `/api/v1/auth/me`, and a debug view showing the exact resolved URL.
- Token usage + estimated cost tracker for the active session.
- Overseerr request routing that respects the proxy settings to avoid mixed-content errors.

## File Overview

- `index.html` – Import map, Tailwind CDN, and root mount point.
- `main.js` – React entry point.
- `src/App.js` – UI, chat flow, and settings modal.
- `src/services/geminiService.js` – Lightweight Gemini-style chat logic and tool-calling stub.
- `src/services/overseerService.js` – Overseerr proxy routing, connection testing, and request submission helpers.

Gemini and Overseerr services also ship with `.ts` re-export stubs (`geminiService.ts`, `overseerService.ts`) for compatibility.
