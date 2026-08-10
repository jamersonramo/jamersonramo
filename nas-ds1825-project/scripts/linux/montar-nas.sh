#!/bin/bash
# Monta os compartilhamentos do NAS DS1825+ no Linux via CIFS (SMB).
# Requer: pacote cifs-utils (sudo apt install cifs-utils / dnf install cifs-utils).
#
# Uso manual (monta na sessao atual, pede senha na hora, nao grava em disco):
#   ./montar-nas.sh
#
# Para montagem persistente no boot, use o arquivo fstab-exemplo.txt e um
# arquivo de credenciais com permissao 600 (nunca a senha direto no fstab).

set -euo pipefail

NAS_HOST="nas-central"   # ou IP fixo: 192.168.1.10
USUARIO_SMB="${1:-$USER}"
SHARES=("Publico" "Departamentos" "Usuarios/${USUARIO_SMB}")
BASE_MOUNT="/mnt/nas"

sudo mkdir -p "${BASE_MOUNT}"

for share in "${SHARES[@]}"; do
    destino="${BASE_MOUNT}/${share##*/}"
    sudo mkdir -p "${destino}"

    if mountpoint -q "${destino}"; then
        echo "Ja montado: ${destino}"
        continue
    fi

    echo "Montando //${NAS_HOST}/${share} em ${destino}..."
    sudo mount -t cifs "//${NAS_HOST}/${share}" "${destino}" \
        -o username="${USUARIO_SMB}",vers=3.0,uid="$(id -u)",gid="$(id -g)"
done
