# Ouvidoria Unlockify

Site onde os clientes da Unlockify mandam **elogios** e **reclamações**. Cada envio cai na hora no grupo de WhatsApp **Unlockify Geral**, com o nome do cliente.

## Como funciona

```
index.html  ──POST JSON──▶  n8n: {UNLOCKIFY} - Ouvidoria (reclamações e elogios)
                              │  /webhook/ouvidoria-unlockify
                              ├─ Montar Mensagem  (valida + formata; código em automacao/montar-mensagem.js)
                              ├─ Responder ao Site ({ ok: true })
                              └─ Avisar Unlockify Geral → /webhook/enviar-wpp-grupo (Evolution, instância bm-advocacia)
```

- Workflow n8n: https://n8n-n8n.aalmzr.easypanel.host/workflow/Go5usgZI4uItTUMe (ativo)
- Grupo: Unlockify Geral (`120363425028018361@g.us`)
- A chave da Evolution fica só no sub-workflow `enviar-wpp-grupo`; este fluxo não guarda credencial.
- Anti-spam: o campo escondido `site_url` é uma armadilha. Se vier preenchido (robô), nada é enviado ao grupo.

## O site

Um único arquivo, `index.html`, sem build. Intro com a logo animada (o "U" se desenha e o ponto cai), partículas, cards com efeito 3D, estrelas animadas, tema roxo para elogio e coral para reclamação, e confete no envio de elogio. Respeita "reduzir movimento" do sistema. A intro aparece uma vez por sessão.

**Link personalizado** (já preenche o nome e o tipo):

```
https://SEU-DOMINIO/?nome=Maria%20Souza&empresa=Souza%20Advocacia&tipo=elogio
```

`tipo` aceita `elogio` ou `reclamacao`.

## Publicar

Qualquer hospedagem estática serve (Netlify, Vercel, GitHub Pages, EasyPanel). Basta subir o `index.html`. O webhook aceita qualquer origem (CORS `*`). Para travar no domínio final, troque `allowedOrigins` no nó "Receber Ouvidoria" e o header `Access-Control-Allow-Origin` no nó "Responder ao Site".

## Testar sem mandar mensagem no grupo

```bash
curl -X POST https://n8n-n8n.aalmzr.easypanel.host/webhook/ouvidoria-unlockify \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Teste","tipo":"elogio","mensagem":"teste","site_url":"x"}'
# → 400 {"ok":false}  (armadilha preenchida, não envia)
```

Sem o `site_url`, o envio é real e aparece no grupo.
