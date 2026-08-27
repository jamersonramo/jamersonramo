# Teleprompter Server

Servidor standalone (Node.js puro, sem Electron, sem interface gráfica) do
Teleprompter. Roda como um serviço sempre ligado em **qualquer máquina da
sua rede interna** — um PC velho, um Raspberry Pi, um NAS, uma VPS, um
contêiner Docker — e qualquer dispositivo (celular, tablet, notebook)
acessa pelo navegador, sem instalar nada.

Diferente do mirror de rede embutido no app desktop (que só existe
enquanto o Electron está aberto naquele notebook específico), este
servidor é independente: fica no ar o tempo que você quiser, na máquina
que você escolher, e não depende de nenhum notebook estar ligado.

Qualquer aparelho conectado pode virar tela de controle (editor +
play/pause) ou tela de espelho a qualquer momento — não existe um "dono"
fixo da sessão.

## Rodar com Node.js direto

```bash
cd teleprompter/server
npm install
PORT=4000 npm start
```

O terminal mostra o(s) endereço(s) IP da máquina — acesse esse endereço
(`http://<ip>:4000`) de qualquer outro dispositivo na mesma rede.

## Rodar com Docker (recomendado para deixar sempre ligado)

```bash
cd teleprompter/server
docker compose up -d --build
```

Ou sem compose:

```bash
docker build -t teleprompter-server .
docker run -d --name teleprompter --restart unless-stopped -p 4000:4000 teleprompter-server
```

Funciona em qualquer máquina com Docker: Linux, um NAS (Synology/QNAP),
ou um Raspberry Pi (a imagem `node:20-alpine` tem build para ARM).

## Deixar sempre ligado sem Docker (systemd, Linux)

Crie `/etc/systemd/system/teleprompter.service`:

```ini
[Unit]
Description=Teleprompter Server
After=network.target

[Service]
WorkingDirectory=/caminho/para/teleprompter/server
ExecStart=/usr/bin/node index.js
Environment=PORT=4000
Restart=always
User=seu-usuario

[Install]
WantedBy=multi-user.target
```

Depois:

```bash
sudo systemctl enable --now teleprompter
```

## Limitações

- Sem autenticação: qualquer dispositivo que alcançar o endereço/porta na
  rede pode controlar. Adequado pra rede interna confiável; se for expor
  na internet, coloque atrás de VPN ou de um proxy com autenticação.
- Importar roteiro só aceita `.txt`/`.md` (lido no navegador). PDF/Word
  continuam exclusivos do app desktop.
- **O app desktop (Electron) ainda não se conecta a este servidor** — ele
  continua com seu próprio estado local e seu próprio mirror de rede
  embutido (janela "Mirror de rede"). Este servidor standalone serve
  qualquer dispositivo *via navegador*; integrá-lo como cliente do app
  desktop também é possível, mas é trabalho adicional — avise se quiser.
