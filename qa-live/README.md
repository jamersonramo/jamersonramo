# Palco Q&A — MVP de interação com o público

MVP de Q&A com moderação para eventos ao vivo (telão do produtor + celular do
público), implementado a partir do briefing técnico do projeto. Identidade
visual e código próprios; o comportamento de referência (estados de
pergunta, upvote sem login, etc.) foi inspirado na análise funcional do
Mentimeter, mas nada do código ou visual é derivado dele.

Prioridade #1 (esta entrega): **Q&A com moderação**. Enquete ao vivo e nuvem
de palavras ficam para as próximas fases (o modelo de dados já reserva
lugar para elas).

## Telas

Três rotas independentes, servidas pelo mesmo servidor:

| Tela | Rota | Papel |
|---|---|---|
| Painel | `/painel` (depois `/painel/:codigo`) | Produtor: cria a sessão, modera a fila, controla o que vai pro telão. |
| Telão | `/telao/:codigo` | Somente exibição — sem nenhum controle. Pensada para ser capturada como fonte de tela/navegador no OBS/vMix. |
| Participante | `/entrar` → `/participante/:codigo` | Mobile-first. Sem cadastro: entra com o código de 6 dígitos ou QR code. |

## Fluxo

1. Produtor cria a sessão no Painel → recebe código de 6 dígitos + QR code.
2. Produtor abre `/telao/:codigo` numa janela/fonte separada.
3. Produtor clica **Iniciar sessão** (a sessão vai de `draft` para `live` —
   só aceita perguntas novas nesse estado).
4. Público entra em `/entrar`, digita o código (ou escaneia o QR) e cai em
   `/participante/:codigo`.
5. Pergunta enviada nasce `pending` e só aparece na fila de moderação do
   Painel.
6. Produtor aprova/rejeita. Aprovada, a pergunta some da fila e passa a
   aparecer para o público (ranking por votos) e pode ser **destacada**
   (`highlighted`) para ocupar a tela cheia do Telão, ou marcada como
   **respondida** (`answered`).
7. Participantes dão upvote em perguntas já aprovadas — 1 voto por pessoa,
   controlado por um `fingerprint` anônimo salvo no `localStorage`
   (mesmo princípio usado por produtos como o Mentimeter: não é infalível,
   mas é o padrão de mercado para esse tipo de uso sem login).

Máquina de estados da pergunta: `pending → approved/rejected`,
`approved ⇄ highlighted`, `approved/highlighted → answered`.

## Arquitetura

- **Backend**: Node.js + Express + Socket.IO. Persistência em SQLite via o
  módulo nativo `node:sqlite` (sem dependência nativa para compilar — só
  precisa do Node ≥ 22.5). Banco fica em `data/qa-live.sqlite` (git-ignored,
  criado automaticamente no primeiro boot).
- **Realtime**: uma sessão tem duas salas Socket.IO — `session:{codigo}:painel`
  (só o produtor, vê tudo inclusive pendentes) e `session:{codigo}:public`
  (Telão + Participantes, só vê o que já foi moderado). Isso evita vazar
  perguntas não aprovadas para o público.
  - Escritas (nova pergunta, moderação, upvote) chegam por **REST**, e o
    servidor propaga o resultado por **Socket.IO** para as salas
    interessadas — mistura pragmática do modelo de eventos do briefing com
    APIs HTTP simples de validar/testar.
  - Eventos: `session:state` (snapshot ao entrar), `question:new` (fila do
    painel), `question:status_changed`, `question:upvoted`.
- **Frontend**: HTML/CSS/JS puro (sem framework/build step), um app por
  tela em `public/<tela>/`, com um `public/shared/` para CSS/JS comuns
  (fingerprint, chamada de API, toast).

## Modelo de dados

Ver `server/db/index.js`. Implementado nesta entrega: `sessions`,
`questions`, `upvotes` (schema conforme o briefing). `polls`,
`poll_votes` e `word_cloud_entries` ficam para as próximas fases.

## Rodando localmente

Requer **Node.js ≥ 22.5** (usa o módulo nativo `node:sqlite`).

```bash
cd qa-live
npm install
npm start          # ou: npm run dev (com --watch)
```

Acesse `http://localhost:3000`:

- `/painel` — criar/gerenciar uma sessão.
- `/telao/<codigo>` — abrir numa segunda janela/fonte de captura.
- `/entrar` — simular o acesso do público.

Em produção, seria necessário expor a URL pública em vez de `localhost` para
o QR code e o link do participante funcionarem no celular do público.

## Próximos passos sugeridos

1. **Enquete ao vivo** — reaproveitar a mesma sala pública/painel; novo par
   de eventos `poll:started` / `poll:vote` / `poll:results`.
2. **Nuvem de palavras** — mesma ideia, com agregação de contagem por
   palavra no servidor.
3. Autenticação simples do produtor (hoje qualquer um com o link `/painel/:codigo`
   modera — ok para MVP de uso único, mas vale revisar antes de produção).
4. Customização de tema por sessão (`theme_id` já reservado no modelo).
