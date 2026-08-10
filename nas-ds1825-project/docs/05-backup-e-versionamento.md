# 5. Backup e versionamento

## Snapshot Replication (versionamento local dos ramos)

App **Snapshot Replication** (nativo do DSM, requer Btrfs):

1. Criar uma política de snapshot por pasta compartilhada importante
   (`Departamentos/*`, `Publico`, `Usuarios`).
2. Frequência sugerida:
   - `Departamentos/Financeiro`, `Departamentos/RH`: snapshot a cada 4h,
     retenção de 30 dias.
   - `Publico`, `Departamentos/Comercial`, `Departamentos/Operacoes`:
     snapshot diário, retenção de 14 dias.
   - `Usuarios/*`: snapshot diário, retenção de 7 dias.
3. Snapshots protegem contra exclusão/edição acidental e ransomware (permitem
   reverter para uma versão anterior de qualquer arquivo/pasta).

## Hyper Backup (backup externo/off-site)

App **Hyper Backup**:

1. Configurar destino externo — HD USB conectado ao DS1825+, outro NAS
   Synology remoto, ou nuvem (Backblaze B2, S3, Synology C2).
2. Seguir a regra **3-2-1**: 3 cópias dos dados, em 2 mídias diferentes, 1
   fora do local físico.
3. Agendar backup incremental diário (fora do horário comercial, ex.: 02:00),
   com retenção de versões configurável (ex.: manter últimas 30 versões
   diárias + 12 mensais).
4. Fazer backup também da **configuração do DSM** (Hyper Backup permite
   incluir configurações do sistema, não só dados) — facilita recuperação em
   caso de falha de hardware.

## Backup das 15 estações no NAS

- Pasta `Backups/Estacoes/` recebe backups das máquinas clientes.
- Windows: usar o cliente **Synology Active Backup for Business** (gratuito,
  agente instalado em cada PC) — faz imagem incremental automática.
- macOS: **Time Machine** pode apontar para uma pasta compartilhada do NAS
  habilitada como destino Time Machine (Painel de Controle > Serviço de
  Arquivos > Serviço Time Machine).
- Linux: `rsync` agendado via cron para `Backups/Estacoes/<hostname>/`.

## Teste de restauração

Agende testes periódicos (ex.: trimestral) de restauração de um snapshot e de
um backup do Hyper Backup, para garantir que os backups realmente funcionam
quando forem necessários.
