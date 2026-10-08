# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Ouvidoria Unlockify: a static feedback site (complaints and compliments) for Unlockify's clients. See `README.md`.

- `index.html`: the whole site (HTML + CSS + JS inline, no build step, no dependencies besides Google Fonts). Copy is in Brazilian Portuguese.
- `automacao/montar-mensagem.js`: source of the "Montar Mensagem" Code node in the n8n workflow `{UNLOCKIFY} - Ouvidoria (reclamações e elogios)` (id `Go5usgZI4uItTUMe`). If you change it, update the node in n8n too.

## Conventions

- Brand: the Unlockify mark is the open "U" path `M18 16 V37 A14 14 0 0 0 46 37 V26` plus a dot at (46,20); accent `#9184D9` / `#5D5294`, fonts Inter + Instrument Serif (same as diagnostico.unlockify.com.br).
- The form POSTs JSON `{tipo, nome, empresa, whatsapp, assunto, nota, mensagem, site_url}` to `/webhook/ouvidoria-unlockify`. `site_url` is a honeypot.
- Don't test with real submissions: they post to the company WhatsApp group. Intercept the webhook (e.g. Playwright `page.route`) or send `site_url` filled.
