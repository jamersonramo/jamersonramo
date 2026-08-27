# Teleprompter

App desktop de teleprompter (Electron) com:

- Editor de roteiro com importação de arquivo `.txt`, `.md`, `.pdf` e `.docx`.
- Rolagem automática com velocidade e tamanho de fonte ajustáveis.
- Janela de exibição em tela cheia, detecta automaticamente um segundo
  monitor e abre nela; modo espelhado (`scaleX(-1)`) para uso com vidro
  refletor (beam splitter).
- Controle remoto **configurável**, por teclado ou controle de videogame:
  - Pedal/clicker Bluetooth: pareia no sistema operacional como um teclado
    comum, então basta parear e usar — não é necessário driver específico.
  - Controle PlayStation/Xbox (USB ou Bluetooth pareado no sistema):
    reconhecido automaticamente via Gamepad API.
  - Cada ação (play/pause, velocidade, avançar/voltar, reiniciar, espelhar)
    pode ser vinculada a qualquer tecla ou botão pela própria interface,
    na seção "Controle remoto" da janela de controle.
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

## Controle remoto

Os vínculos abaixo são os padrões de fábrica; todos podem ser remapeados na
seção "Controle remoto" da janela de controle (clique em "Definir" e
pressione a tecla ou o botão desejado). Os atalhos de teclado ficam ativos
globalmente (mesmo com outro app em foco) enquanto a tela de exibição está
aberta — pensado para pedais/clickers Bluetooth que emulam teclado.

| Ação | Teclado (padrão) | Controle (padrão)\* |
| --- | --- | --- |
| Play / pause | Espaço | Botão 0 (A / Cross) |
| Aumentar velocidade | ↑ | D-pad cima |
| Diminuir velocidade | ↓ | D-pad baixo |
| Voltar um trecho | ← | D-pad esquerda |
| Avançar um trecho | → | D-pad direita |
| Reiniciar do topo | Shift+R | Botão 3 (Y / Triangle) |
| Espelhar texto | Shift+M | Botão 1 (B / Circle) |

\* Índices do "standard gamepad mapping" do navegador — compatível com a
maioria dos controles PlayStation e Xbox.

## Estrutura

```
teleprompter/
  src/
    main.js               processo principal: janelas, atalhos globais, IPC
    preload.js             ponte segura (contextBridge) para os renderers
    server.js               servidor local (Express + WebSocket) do mirror de rede
    settings-store.js        persistência dos vínculos de controle remoto
    renderer/
      control/               janela de controle (editor + painel)
      display/                janela de exibição (Electron, tela cheia/segunda tela)
      network/                página servida na rede local para tablets/celulares
      shared/
        scroll-engine.js       motor de rolagem usado por display/ e network/
        remote-control.js      captura/leitura de teclado e Gamepad API
```

## Como funciona a sincronização

O processo principal mantém o estado (texto, velocidade, fonte, espelhado,
play/pause) e o retransmite por IPC para as janelas Electron e por
WebSocket para os clientes de rede. Cada tela roda seu próprio loop de
animação (`requestAnimationFrame`) e só recebe comandos pontuais (reiniciar,
avançar/voltar) do processo principal — assim a rolagem continua suave
mesmo com latência de rede.
