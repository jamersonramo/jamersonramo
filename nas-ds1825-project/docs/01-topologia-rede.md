# 1. Topologia de rede

## Requisitos mínimos

- Switch **Gigabit** dedicado (o DS1825+ tem múltiplas portas LAN — recomenda-se
  usar **Link Aggregation (802.3ad)** com 2 portas se o switch suportar, para
  aumentar throughput agregado com várias máquinas acessando ao mesmo tempo).
- Cabeamento Cat5e/Cat6.
- Uma sub-rede local única para o NAS e as 15 estações (ex.: `192.168.1.0/24`).

## Endereçamento IP

| Item | Endereço | Observação |
|---|---|---|
| Gateway/roteador | 192.168.1.1 | |
| **Synology DS1825+** | **192.168.1.10** (fixo) | Configurar IP estático na interface de rede do DSM |
| Faixa DHCP para clientes | 192.168.1.100 – 192.168.1.199 | Ou reservas fixas por MAC (recomendado, ver `06-mapa-maquinas.md`) |
| DNS | 192.168.1.1 ou interno | |

Recomenda-se **reservar IP por MAC address** no roteador/DHCP para cada uma das
15 máquinas, para que o hostname/IP não mude — facilita scripts de mapeamento
de unidade e regras de firewall.

## Nome do servidor

Defina um nome de host fácil de lembrar no DSM (**Painel de Controle > Nome do
Servidor**), por exemplo `nas-central`. Com isso os clientes podem acessar por
`\\nas-central\<pasta>` (Windows) ou `smb://nas-central/<pasta>` (macOS/Linux),
sem depender do IP fixo — desde que a resolução de nome NetBIOS/mDNS funcione
na rede local (normalmente funciona automaticamente).

## VLAN (opcional, recomendado se houver > 1 setor sensível)

Se quiser isolar tráfego de setores diferentes (ex.: Financeiro/RH separados
do restante), configure VLANs no switch e ative múltiplas interfaces de rede
no DSM, uma por VLAN, cada uma com suas próprias regras de firewall.

## Portas usadas pelo protocolo SMB (cliente → NAS)

| Porta | Protocolo | Uso |
|---|---|---|
| 445/TCP | SMB | Compartilhamento de arquivos (Windows, macOS, Linux) |
| 139/TCP | NetBIOS | Compatibilidade com clientes antigos (opcional) |
| 5000/TCP | DSM HTTP | Administração web |
| 5001/TCP | DSM HTTPS | Administração web (recomendado) |

Essas portas só precisam estar liberadas **dentro da LAN**. Não exponha o
DS1825+ diretamente à internet (ver `04-seguranca.md`).
