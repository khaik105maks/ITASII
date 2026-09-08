#!/usr/bin/env bash
set -euo pipefail

# Upload only the allowlisted package. Server setup is performed separately.
: "${DEPLOY_HOST:?Set DEPLOY_HOST}"
: "${DEPLOY_USER:?Set DEPLOY_USER}"
: "${DEPLOY_SSH_KEY:?Set DEPLOY_SSH_KEY}"
: "${DEPLOY_KNOWN_HOSTS:?Set DEPLOY_KNOWN_HOSTS}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
[[ "$DEPLOY_HOST" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*$ ]] || { echo 'Use a hostname or IPv4 for DEPLOY_HOST'; exit 1; }
[[ "$DEPLOY_USER" =~ ^[a-z_][a-z0-9_-]*$ ]] || { echo 'Invalid SSH user'; exit 1; }
[[ "$DEPLOY_PORT" =~ ^[0-9]{1,5}$ ]] && ((10#$DEPLOY_PORT > 0 && 10#$DEPLOY_PORT <= 65535)) || { echo 'Invalid SSH port'; exit 1; }

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"
test -f dist/itasii-site.zip
umask 077
deploy_tmp="$(mktemp -d)"
trap 'rm -rf -- "$deploy_tmp"' EXIT
printf '%s\n' "$DEPLOY_SSH_KEY" > "$deploy_tmp/key"
printf '%s\n' "$DEPLOY_KNOWN_HOSTS" > "$deploy_tmp/known_hosts"
cat > "$deploy_tmp/config" <<EOF
Host netcup-deploy
    HostName $DEPLOY_HOST
    User $DEPLOY_USER
    Port $DEPLOY_PORT
    IdentityFile "$deploy_tmp/key"
    UserKnownHostsFile "$deploy_tmp/known_hosts"
    StrictHostKeyChecking yes
    IdentitiesOnly yes
    BatchMode yes
    ConnectTimeout 15
EOF
python3 -m zipfile -e dist/itasii-site.zip "$deploy_tmp/public"
# Public files must remain readable by Nginx despite the private local umask.
find "$deploy_tmp/public" -type d -exec chmod 755 {} +
find "$deploy_tmp/public" -type f -exec chmod 644 {} +
cd "$deploy_tmp/public"
sftp -F "$deploy_tmp/config" -b - netcup-deploy <<'EOF'
cd /public
put -R *
ls -l index.html
ls -l script.js
EOF
