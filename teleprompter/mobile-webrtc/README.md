# Teleprompter P2P (sem notebook)

Página web estática e independente do app desktop. Dois aparelhos (ex: um
iPad e um iPhone) conectam **diretamente entre si** via WebRTC, sem precisar
de nenhum computador rodando o Electron. Qualquer um dos dois pode virar
tela de controle (editor + play/pause) ou tela de espelho, e trocar de
papel a qualquer momento.

Não depende do resto do projeto Electron — pode ser publicada sozinha em
qualquer hospedagem de arquivo estático.

## Como funciona

- Um aparelho toca em "Criar sessão" e recebe um código de 5 letras.
- O outro toca em "Entrar em uma sessão" e digita esse código.
- A conexão de dados é estabelecida diretamente entre os dois navegadores
  (WebRTC via [PeerJS](https://peerjs.com/)), usando o broker público
  gratuito do PeerJS só para o pareamento inicial (trocar o "endereço" de
  cada aparelho) — depois disso o tráfego (texto do roteiro, play/pause,
  velocidade) vai direto de um aparelho pro outro.
- Isso significa que a etapa de pareamento precisa de internet nos dois
  aparelhos (para alcançar o broker), mesmo que depois eles fiquem na
  mesma rede local.

## Publicar no GitHub Pages

1. No GitHub, vá em **Settings → Pages** do repositório.
2. Em "Build and deployment", escolha **Deploy from a branch**.
3. Branch: a branch onde este código está (ex: a branch atual), pasta:
   `/teleprompter/mobile-webrtc` — se o GitHub não permitir escolher uma
   subpasta tão profunda, a alternativa é publicar a partir da raiz do
   repositório e acessar via `.../teleprompter/mobile-webrtc/`.
4. Salve. O GitHub publica em alguns minutos numa URL do tipo
   `https://jamersonramo.github.io/jamersonramo/teleprompter/mobile-webrtc/`.
5. Abra essa URL no Safari do iPad e do iPhone.

## Limitações desta primeira versão

- Importar roteiro no modo P2P só aceita `.txt`/`.md` (lido direto no
  navegador). PDF/Word só estão disponíveis no app desktop por enquanto.
- Sem controle remoto configurável (teclado/gamepad) — isso é específico
  do app desktop, que registra atalhos no sistema operacional.
- O pareamento depende do broker público do PeerJS estar no ar; é um
  serviço de terceiros gratuito, sem garantia de SLA.
