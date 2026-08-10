# Projeto NAS — Synology DS1825+ para 15 estações

Projeto de infraestrutura para um **Synology DS1825+** atuando como servidor de
arquivos central em rede local, distribuindo uma estrutura de pastas
compartilhadas (departamentos, público, pessoal, backups) para **15 máquinas
clientes** com sistemas operacionais mistos (Windows + macOS/Linux).

## Visão geral

```
                       ┌───────────────────────────┐
                       │   Synology DS1825+ (NAS)  │
                       │   IP: 192.168.1.10        │
                       │   Protocolo: SMB3         │
                       └─────────────┬─────────────┘
                                     │
                          Switch Gigabit (LAN)
                                     │
      ┌───────────┬───────────┬─────┴─────┬───────────┬───────────┐
      │           │           │           │           │           │
   PC-01       PC-02       PC-03   ...  PC-13       PC-14       PC-15
  (Windows)   (Windows)    (macOS)     (Linux)     (Windows)   (macOS)
```

## Estrutura do projeto

| Pasta/Arquivo | Conteúdo |
|---|---|
| `docs/01-topologia-rede.md` | Endereçamento IP, VLAN opcional, requisitos de rede |
| `docs/02-estrutura-pastas.md` | A "ramificação" de pastas compartilhadas e para que serve cada ramo |
| `docs/03-configuracao-dsm.md` | Passo a passo de configuração do DSM (pastas, usuários, grupos, SMB) |
| `docs/04-seguranca.md` | Firewall, 2FA, contas, boas práticas de acesso |
| `docs/05-backup-e-versionamento.md` | Snapshot Replication + Hyper Backup |
| `docs/06-mapa-maquinas.md` | Tabela das 15 máquinas (hostname, IP, SO, grupo, unidade mapeada) |
| `config/matriz-permissoes.csv` | Matriz pasta × grupo × permissão, pronta para importar/conferir no DSM |
| `scripts/windows/mapear-unidades.ps1` | Mapeia as unidades de rede automaticamente (Windows) |
| `scripts/macos/montar-nas.sh` | Monta os compartilhamentos via SMB no macOS |
| `scripts/linux/montar-nas.sh` + `fstab-exemplo.txt` | Monta via CIFS no Linux (manual ou fstab) |

## Como usar

1. Leia `docs/01-topologia-rede.md` e `docs/03-configuracao-dsm.md` e configure o DS1825+.
2. Ajuste `config/matriz-permissoes.csv` com os nomes reais dos setores/usuários.
3. Preencha `docs/06-mapa-maquinas.md` com o inventário real das 15 máquinas.
4. Distribua o script correspondente ao SO de cada máquina (pasta `scripts/`).

> Os nomes de departamentos, usuários e IPs neste projeto são **placeholders**.
> Substitua pelos valores reais do seu ambiente antes de aplicar em produção.
