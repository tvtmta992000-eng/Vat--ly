#!/usr/bin/env bash
# Cài đặt Vật Lý Example24 trên VPS Ubuntu 22.04/24.04 (chạy bằng root).
#
#   curl -fsSL https://raw.githubusercontent.com/tvtmta992000-eng/Vat--ly/main/deploy/setup-vps.sh -o setup-vps.sh
#   sudo bash setup-vps.sh
#
# Có thể đặt trước biến môi trường để bỏ qua câu hỏi:
#   DOMAIN=vatlyexample24.com ADMIN_EMAIL=ban@gmail.com sudo -E bash setup-vps.sh
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/tvtmta992000-eng/Vat--ly.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/var/www/vatly}"
APP_USER="vatly"
APP_PORT="${APP_PORT:-3000}"
DB_NAME="vatly_example24"
DB_USER="vatly"

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }
random() { openssl rand -hex "${1:-24}"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "Vui lòng chạy bằng root: sudo bash setup-vps.sh" >&2
  exit 1
fi

# ---------- Thông tin cấu hình ----------
if [ -z "${DOMAIN:-}" ]; then
  read -rp "Tên miền (vd: vatlyexample24.com, để trống nếu chưa có): " DOMAIN
fi
while [ -z "${ADMIN_EMAIL:-}" ]; do
  read -rp "Email tài khoản quản trị (bắt buộc): " ADMIN_EMAIL
done
ADMIN_PASSWORD="${ADMIN_PASSWORD:-$(random 6)}"

export DEBIAN_FRONTEND=noninteractive

step "Cập nhật hệ thống và cài gói cần thiết"
apt-get update -y
apt-get install -y curl git nginx mariadb-server openssl ufw ca-certificates

step "Cài Node.js 20 và PM2"
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 18 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
command -v pm2 >/dev/null || npm install -g pm2
node -v

step "Tạo người dùng chạy ứng dụng"
id "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --shell /bin/bash "$APP_USER"

step "Tải mã nguồn"
if [ -d "$APP_DIR/.git" ]; then
  sudo -u "$APP_USER" git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
else
  mkdir -p "$(dirname "$APP_DIR")"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  chown -R "$APP_USER:$APP_USER" "$APP_DIR"
fi

step "Tạo cơ sở dữ liệu MariaDB"
systemctl enable --now mariadb
if [ -f "$APP_DIR/.env" ]; then
  echo "Đã có file .env — giữ nguyên cấu hình cũ."
  NEW_ENV=0
else
  NEW_ENV=1
  DB_PASSWORD="$(random 16)"
  mysql <<SQL
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
ALTER USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
SQL
  cat > "$APP_DIR/.env" <<ENV
PORT=$APP_PORT
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
SESSION_SECRET=$(random 32)
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
ADMIN_NAME=Quản trị viên
AUTO_MIGRATE=true
SEED_SAMPLE_CONTENT=true
ENV
  chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
fi

step "Cài thư viện và khởi động ứng dụng bằng PM2"
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && npm ci --omit=dev"
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && (pm2 describe vatly >/dev/null 2>&1 && pm2 reload vatly --update-env || pm2 start server.js --name vatly) && pm2 save"
env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" >/dev/null

step "Cấu hình Nginx"
SERVER_NAMES="_"
[ -n "$DOMAIN" ] && SERVER_NAMES="$DOMAIN www.$DOMAIN"
cat > /etc/nginx/sites-available/vatly <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $SERVER_NAMES;
    client_max_body_size 5m;

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/vatly /etc/nginx/sites-enabled/vatly
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

step "Tường lửa"
ufw allow OpenSSH >/dev/null
ufw allow 'Nginx Full' >/dev/null
ufw --force enable >/dev/null

if [ -n "$DOMAIN" ]; then
  step "Cài chứng chỉ SSL (HTTPS) cho $DOMAIN"
  apt-get install -y certbot python3-certbot-nginx
  if ! certbot --nginx --non-interactive --agree-tos -m "$ADMIN_EMAIL" -d "$DOMAIN" -d "www.$DOMAIN" --redirect; then
    echo "!! Chưa cài được SSL. Hãy kiểm tra tên miền đã trỏ về IP VPS chưa, rồi chạy lại:"
    echo "   certbot --nginx -d $DOMAIN -d www.$DOMAIN"
  fi
fi

sleep 2
IP="$(curl -fsS https://api.ipify.org || hostname -I | awk '{print $1}')"
URL="http://$IP"
[ -n "$DOMAIN" ] && URL="https://$DOMAIN"

printf '\n\033[1;32m✔ Hoàn tất!\033[0m\n'
echo "Website:        $URL"
if [ "$NEW_ENV" = "1" ]; then
  echo "Đăng nhập admin: $ADMIN_EMAIL"
  echo "Mật khẩu admin:  $ADMIN_PASSWORD   (hãy lưu lại!)"
fi
echo "Xem log:        sudo -u $APP_USER pm2 logs vatly"
echo "Cập nhật code:  sudo bash $APP_DIR/deploy/update.sh"
