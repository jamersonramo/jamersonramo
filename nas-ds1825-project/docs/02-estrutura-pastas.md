# 2. Estrutura de pastas (ramificação)

A "ramificação" do sistema é a árvore de pastas compartilhadas no volume do
NAS. Cada ramo tem um propósito e um grupo de acesso associado (ver matriz de
permissões em `config/matriz-permissoes.csv`).

```
/volume1/
├── Publico/                  # Leitura/escrita para todos os 15 usuários
│
├── Departamentos/            # Um ramo por setor — acesso restrito ao grupo do setor
│   ├── Financeiro/
│   ├── RH/
│   ├── Comercial/
│   ├── TI/
│   └── Operacoes/
│
├── Usuarios/                 # Pasta pessoal por máquina/usuário (privada)
│   ├── pc01_nome/
│   ├── pc02_nome/
│   ├── ...
│   └── pc15_nome/
│
├── Backups/                  # Somente TI escreve; demais sem acesso
│   ├── Servidores/
│   └── Estacoes/
│
└── ArquivoMorto/             # Leitura para todos, escrita só para TI
    └── (documentos históricos/encerrados)
```

## Por que essa estrutura

- **Publico**: evita que arquivos de uso comum (modelos, formulários, avisos)
  fiquem espalhados em pastas departamentais.
- **Departamentos**: isola dados sensíveis (ex.: RH e Financeiro) do resto da
  empresa — cada ramo vira uma **Shared Folder** própria no DSM com sua
  permissão.
- **Usuarios**: espaço pessoal de cada uma das 15 máquinas/usuários, sem
  visibilidade cruzada entre eles (permissão individual, não por grupo).
- **Backups**: destino de rotinas de backup das estações e de outros
  servidores — acesso restrito para não ser apagado/alterado por engano.
- **ArquivoMorto**: dados antigos que precisam ficar disponíveis para consulta
  mas não devem mais ser editados no dia a dia.

## Convenção de nomes

- Sem espaços ou acentos nos nomes de pasta de topo (evita problemas de
  compatibilidade entre Windows/macOS/Linux via SMB) — use `_` ou `-`.
- Nomes de subpastas de `Usuarios/` seguem o padrão `pcNN_usuario`, casando
  com o inventário em `docs/06-mapa-maquinas.md`.

> Ajuste os nomes de `Departamentos/` para os setores reais do seu ambiente.
> Esta estrutura é um ponto de partida, não uma imposição.
