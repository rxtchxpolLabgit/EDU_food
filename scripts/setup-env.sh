#!/usr/bin/env sh
set -eu

if [ -e .env ]; then
  echo '.env already exists. Keep the current secrets and edit it directly if needed.' >&2
  exit 1
fi

command -v openssl >/dev/null 2>&1 || { echo 'OpenSSL is required to generate private secrets.' >&2; exit 1; }
DB_PASSWORD="$(openssl rand -hex 32)"
JWT_SECRET="$(openssl rand -hex 32)"
ADMIN_DEFAULT_PASSWORD="$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9_-')"
cat > .env <<EOF
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=$JWT_SECRET
ADMIN_DEFAULT_PASSWORD=$ADMIN_DEFAULT_PASSWORD
CORS_ORIGIN=http://localhost
DOMAIN=localhost
EOF
chmod 600 .env
printf 'Created .env with private random secrets.\nAdmin phone: 0812345678\nAdmin password: %s\nKeep this password private. It is saved in .env.\n' "$ADMIN_DEFAULT_PASSWORD"
