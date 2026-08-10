# 4. Segurança

## Acesso e contas

- **Desative a conta `admin` padrão** (Painel de Controle > Usuário) e crie um
  administrador com outro nome de login.
- Ative **autenticação de dois fatores (2FA)** para todas as contas
  administrativas (Painel de Controle > Segurança > Conta > 2FA).
- Ative **bloqueio automático de conta** após N tentativas de login inválidas
  (Painel de Controle > Segurança > Proteção contra Ataque).
- Não exponha o DSM diretamente à internet. Se precisar de acesso remoto, use
  **VPN (Synology VPN Server / WireGuard)** em vez de abrir portas 5000/5001
  no roteador.

## Firewall do DSM

**Painel de Controle > Segurança > Firewall**:

- Criar regra permitindo SMB (445), administração (5000/5001) e SSH (22, se
  usado) **apenas para a sub-rede local** (`192.168.1.0/24`).
- Bloquear todo o restante por padrão ("deny all" implícito ao final da
  lista de regras).

## Atualizações

- Ativar atualização automática de patches de segurança do DSM (Painel de
  Controle > Atualizar e Restaurar > Atualização do DSM).
- Rodar periodicamente o **Security Advisor** (app nativo do DSM) e corrigir
  os itens apontados.

## Auditoria

- Ativar **Log Center** para registrar acessos SMB (leitura/escrita/exclusão)
  por pasta compartilhada — importante em `Departamentos/Financeiro` e
  `Departamentos/RH`.
- Revisar logs periodicamente ou configurar alerta por e-mail para eventos
  críticos (login falho repetido, exclusão em massa).

## Boas práticas para os clientes

- Nunca gravar a senha do NAS em scripts em texto plano (ver scripts em
  `scripts/`, que usam o Gerenciador de Credenciais do Windows / Keychain do
  macOS / `pass`/prompt no Linux, em vez de senha fixa no arquivo).
- Manter antivírus atualizado nas 15 estações — o NAS pode ser vetor de
  propagação de ransomware se uma estação estiver comprometida e tiver
  permissão de escrita em pastas compartilhadas.
- Ativar o pacote **Synology Antivirus Essential** para varrer os
  compartilhamentos.
