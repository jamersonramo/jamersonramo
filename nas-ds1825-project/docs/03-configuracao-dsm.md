# 3. Configuração do DSM (Synology DS1825+)

Passo a passo para preparar o servidor. Assume DSM 7.x.

## 3.1 Armazenamento

1. **Painel de Controle > Storage Manager** → criar **Storage Pool** em RAID
   adequado ao número de discos instalados (RAID 5/6 ou SHR-2 recomendado para
   tolerância a falha com ambiente de produção).
2. Criar um **Volume** (Btrfs recomendado — habilita snapshots e checksums).

## 3.2 Rede

1. **Painel de Controle > Rede > Interface de Rede** → configurar IP estático
   conforme `01-topologia-rede.md` (192.168.1.10).
2. Se for usar Link Aggregation: selecionar as duas portas LAN físicas e
   configurar modo IEEE 802.3ad (requer suporte no switch).
3. **Painel de Controle > Nome do Servidor** → definir hostname (`nas-central`).

## 3.3 Pastas compartilhadas

Para cada ramo do `02-estrutura-pastas.md`, criar uma **Shared Folder** em
**Painel de Controle > Pastas Compartilhadas**:

| Nome da pasta | Criptografia | Lixeira de reciclagem | Snapshot |
|---|---|---|---|
| Publico | Não | Sim | Sim |
| Departamentos (uma por setor) | Sim (Financeiro/RH) | Sim | Sim |
| Usuarios | Não | Sim | Sim |
| Backups | Não | Não (evita duplicar versão) | Sim |
| ArquivoMorto | Não | Sim | Sim |

- Ative **"Ativar Lixeira de Reciclagem"** em cada pasta — protege contra
  exclusão acidental pelos 15 usuários.
- Ative **"Ativar cota de pasta compartilhada"** se quiser limitar espaço por
  departamento.

## 3.4 Usuários e grupos

1. **Painel de Controle > Grupo** → criar um grupo por setor/perfil:
   `grp_financeiro`, `grp_rh`, `grp_comercial`, `grp_ti`, `grp_operacoes`,
   `grp_todos` (todos os 15 usuários).
2. **Painel de Controle > Usuário** → criar uma conta por pessoa/máquina
   (15 contas), associando cada uma ao(s) grupo(s) correspondente(s).
   - Evite contas compartilhadas — cada máquina/usuário deve ter login próprio
     para rastreabilidade (logs de acesso, permissões finas).
3. Aplique a política de senha forte em **Painel de Controle > Segurança >
   Conta** (mínimo 8-12 caracteres, complexidade obrigatória, expiração
   periódica opcional).

## 3.5 Permissões

Em cada Shared Folder → **Editar > Permissão**, conceder acesso conforme
`config/matriz-permissoes.csv`. Regra geral:

- Configure permissões por **grupo**, nunca por usuário individual (exceto
  `Usuarios/pcNN_usuario`, que é por conta).
- Use **"Negar"** explicitamente para grupos que não devem ver a pasta, ou
  simplesmente não conceda acesso (mais simples de manter).

## 3.6 Protocolo de compartilhamento (SMB)

Como o ambiente tem Windows + macOS + Linux misturados, SMB3 atende todos:

1. **Painel de Controle > Serviço de Arquivos > SMB** → habilitar.
   - Nível mínimo do protocolo: **SMB2** (compatibilidade); máximo **SMB3**
     (performance/segurança).
   - Ativar **"Transporte SMB via QUIC"** não é necessário em LAN.
   - Ativar **"Ativar oportunidade de bloqueio local"** (padrão) para melhor
     performance de cache no Windows.
2. Não é necessário habilitar AFP (obsoleto, macOS moderno usa SMB
   nativamente) nem NFS, a menos que algum cliente Linux prefira NFS por
   performance — nesse caso, habilite **NFS** apenas para os hosts Linux
   específicos, restringindo por IP em **Painel de Controle > Serviço de
   Arquivos > NFS > Regra**.

## 3.7 Indexação e Universal Search

Desative indexação em pastas com muitos arquivos pequenos e uso intenso de
leitura/escrita (ex.: `Backups/`) para não competir por I/O — mantenha ativa
apenas em `Publico/` e `Departamentos/`, se a busca por conteúdo for útil.
