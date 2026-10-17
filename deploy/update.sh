#!/usr/bin/env bash
# Cập nhật website sau khi có code mới trên GitHub: sudo bash /var/www/vatly/deploy/update.sh
set -euo pipefail
APP_DIR="${APP_DIR:-/var/www/vatly}"
APP_USER="vatly"
BRANCH="${BRANCH:-main}"

sudo -u "$APP_USER" bash -c "
  set -e
  cd '$APP_DIR'
  git pull --ff-only origin '$BRANCH'
  npm ci --omit=dev
  pm2 reload vatly --update-env
  pm2 save
"
echo "Đã cập nhật lên phiên bản: $(sudo -u "$APP_USER" git -C "$APP_DIR" log -1 --format='%h %s')"
