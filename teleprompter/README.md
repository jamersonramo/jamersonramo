# Teleprompter

App desktop de teleprompter (Electron) com:

- Editor de roteiro com importação de arquivo `.txt`/`.md`.
- Rolagem automática com velocidade e tamanho de fonte ajustáveis.
- Janela de exibição em tela cheia, detecta automaticamente um segundo
  monitor e abre nela; modo espelhado (`scaleX(-1)`) para uso com vidro
  refletor (beam splitter).
- Controle remoto via pedal/clicker Bluetooth: qualquer dispositivo desse
  tipo é pareado no sistema operacional como um teclado comum, então basta
  parear e usar — não é necessário nenhum driver específico no app.
- Mirror de rede: liga um servidor local que qualquer tablet/celular na
  mesma Wi-Fi pode abrir no navegador, para montar um rig de gravação com
  câmera móvel sem precisar de um segundo monitor físico.

## Requisitos

- Node.js 18+

## Desenvolvimento

```bash
cd teleprompter
npm install
npm start
```

## Gerar instalador (Windows/Mac/Linux)

```bash
npm run dist
```

Os artefatos ficam em `teleprompter/dist/`.

## Atalhos de controle remoto

Ativos globalmente (mesmo com outro app em foco) enquanto a tela de
exibição está aberta — pensados para pedais/clickers Bluetooth que emulam
teclado:

| Tecla | Ação |
| --- | --- |
| Espaço | Play / pause |
| ↑ ou Page Up | Aumentar velocidade |
| ↓ ou Page Down | Diminuir velocidade |
| ← | Voltar um trecho |
| → | Avançar um trecho |
| Shift+R | Reiniciar do topo |
| Shift+M | Espelhar texto |

## Estrutura

```
teleprompter/
  src/
    main.js               processo principal: janelas, atalhos globais, IPC
    preload.js             ponte segura (contextBridge) para os renderers
    server.js               servidor local (Express + WebSocket) do mirror de rede
    renderer/
      control/               janela de controle (editor + painel)
      display/                janela de exibição (Electron, tela cheia/segunda tela)
      network/                página servida na rede local para tablets/celulares
      shared/scroll-engine.js  motor de rolagem usado por display/ e network/
```

## Como funciona a sincronização

O processo principal mantém o estado (texto, velocidade, fonte, espelhado,
play/pause) e o retransmite por IPC para as janelas Electron e por
WebSocket para os clientes de rede. Cada tela roda seu próprio loop de
animação (`requestAnimationFrame`) e só recebe comandos pontuais (reiniciar,
avançar/voltar) do processo principal — assim a rolagem continua suave
mesmo com latência de rede.
