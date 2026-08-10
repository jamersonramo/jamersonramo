#!/bin/bash
# Monta os compartilhamentos do NAS DS1825+ no macOS via SMB.
# Uso: ajustar NAS_HOST e a lista SHARES, depois executar
# (pode ser adicionado em Preferencias do Sistema > Itens de Login).
#
# A senha nao fica no script: o macOS usa o Keychain apos a primeira
# autenticacao manual, ou solicita a senha interativamente via osascript.

set -euo pipefail

NAS_HOST="nas-central"   # ou IP fixo: 192.168.1.10
USUARIO="${USER}"
SHARES=("Publico" "Departamentos" "Usuarios/${USUARIO}")

for share in "${SHARES[@]}"; do
    mount_point="/Volumes/${share##*/}"

    if mount | grep -q "on ${mount_point} "; then
        echo "Ja montado: ${mount_point}"
        continue
    fi

    echo "Montando smb://${NAS_HOST}/${share} em ${mount_point}..."
    open "smb://${NAS_HOST}/${share}"
done
