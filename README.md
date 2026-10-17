# Vật Lý Example24

Website học tập môn Vật lý cho học sinh THCS, THPT, ôn thi ĐH/HSG và sinh viên (Vật lý đại cương).

**Tính năng**

- Bài giảng theo cấp học → chương → bài, công thức hiển thị bằng KaTeX
- Trắc nghiệm chấm điểm ngay, hiện lời giải từng câu
- 3 mô phỏng tương tác: con lắc đơn, chuyển động ném xiên, định luật Ohm
- Tài khoản học sinh, lưu điểm và tiến độ (đạt ≥ 80% tự đánh dấu hoàn thành bài)
- Trang quản trị cho giáo viên: soạn bài bằng Markdown + LaTeX có xem trước trực tiếp, quản lý chương, câu hỏi, phân quyền người dùng

**Công nghệ:** Node.js 18+ · Express 5 · EJS · MySQL/MariaDB. KaTeX và font chữ được phục vụ từ chính server, không cần CDN.

---

## Chạy trên máy cá nhân

1. Cài [Node.js 18+](https://nodejs.org) và MySQL (hoặc MariaDB).
2. Tạo cơ sở dữ liệu:
   ```sql
   CREATE DATABASE vatly_example24 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Cài đặt và cấu hình:
   ```bash
   npm install
   cp .env.example .env      # rồi sửa thông tin DB_*, SESSION_SECRET, ADMIN_*
   npm run dev
   ```
4. Mở http://localhost:3000 và đăng nhập bằng `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

Ở lần chạy đầu tiên, server tự tạo các bảng, tạo tài khoản admin và thêm 6 bài học mẫu (chỉ khi chưa có chương nào).

| Lệnh | Tác dụng |
|---|---|
| `npm start` | Chạy server (production) |
| `npm run dev` | Chạy và tự khởi động lại khi sửa code |
| `npm run migrate` | Tạo/cập nhật bảng cơ sở dữ liệu |
| `npm run seed` | Tạo admin + nội dung mẫu nếu chưa có |
| `npm test` | Chạy kiểm thử |

---

## Deploy lên Hostinger

Website cần **server Node.js + MySQL**, nên phải dùng gói **Business Web Hosting**, **Cloud** (có mục *Node.js Apps*) hoặc **VPS**. Gói Single/Premium shared hosting không chạy được ứng dụng Node.js.

### Cách 1 — Business / Cloud hosting (khuyên dùng)

**Bước 1. Tạo cơ sở dữ liệu MySQL**

hPanel → **Databases → MySQL Databases** → tạo database và user. Ghi lại tên database, tên user, mật khẩu (dạng `u123456789_vatly`). Host thường là `localhost`.

**Bước 2. Tạo ứng dụng Node.js từ GitHub**

1. hPanel → **Websites → Add website → Node.js Apps** (hoặc mở website → **Node.js**).
2. Chọn **Import Git repository**, kết nối tài khoản GitHub và chọn repo `Vat--ly`, nhánh `main`.
3. Thiết lập build:
   - Framework: **Express** (hoặc *Other*)
   - Node.js version: **20** hoặc mới hơn
   - Entry file: `server.js`
   - Install command: `npm install` · Start command: `npm start`

**Bước 3. Khai báo biến môi trường** (mục *Environment variables*)

| Biến | Giá trị |
|---|---|
| `NODE_ENV` | `production` |
| `DB_HOST` | `localhost` |
| `DB_PORT` | `3306` |
| `DB_USER` | user MySQL ở bước 1 |
| `DB_PASSWORD` | mật khẩu MySQL |
| `DB_NAME` | tên database |
| `SESSION_SECRET` | chuỗi ngẫu nhiên ≥ 32 ký tự |
| `ADMIN_EMAIL` | email đăng nhập quản trị |
| `ADMIN_PASSWORD` | mật khẩu quản trị (đổi ngay sau lần đầu) |

Không cần đặt `PORT`, Hostinger tự cấp.

**Bước 4. Deploy** → bấm **Deploy**. Sau khi chạy xong, gắn tên miền và bật SSL (hPanel → **Security → SSL**).

Mỗi lần push code mới lên nhánh `main`, vào ứng dụng trong hPanel và bấm **Redeploy** (hoặc bật tự động deploy nếu có).

> Tạo chuỗi `SESSION_SECRET` ngẫu nhiên: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Cách 2 — VPS (Ubuntu)

```bash
# Cài Node.js 20, MySQL, Nginx, PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs mysql-server nginx
sudo npm install -g pm2

# Lấy code
git clone https://github.com/tvtmta992000-eng/Vat--ly.git vatly && cd vatly
npm ci --omit=dev
cp .env.example .env && nano .env    # điền thông tin

# Chạy nền và tự khởi động cùng máy
pm2 start server.js --name vatly
pm2 save && pm2 startup
```

Cấu hình Nginx làm reverse proxy (`/etc/nginx/sites-available/vatly`):

```nginx
server {
    server_name vatlyexample24.com www.vatlyexample24.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Rồi bật SSL miễn phí: `sudo apt install certbot python3-certbot-nginx && sudo certbot --nginx`.

Cập nhật code: `git pull && npm ci --omit=dev && pm2 restart vatly`.

---

## Soạn nội dung

1. Đăng nhập tài khoản admin → **Quản trị**.
2. **Chương** → tạo chương cho từng cấp học.
3. **Thêm bài học** → viết nội dung bằng Markdown, khung bên phải hiển thị bản xem trước.
   - Công thức trong dòng: `$v = \frac{s}{t}$`
   - Công thức riêng dòng: `$$T = 2\pi\sqrt{\frac{l}{g}}$$`
   - Ảnh: `![mô tả](https://link-anh.jpg)`
4. Sau khi lưu bài, thêm câu hỏi trắc nghiệm (2–6 lựa chọn, chọn đáp án đúng, có thể kèm lời giải).
5. Ở **Người dùng**, admin có thể nâng tài khoản lên **Giáo viên** để cùng soạn bài.

## Cấu trúc thư mục

```
server.js            Điểm khởi động: migrate, seed, chạy server
src/
  app.js             Cấu hình Express, bảo mật, session
  config.js          Đọc biến môi trường
  schema.js          Định nghĩa bảng MySQL
  seed.js            Tạo admin + nội dung mẫu
  seed-data.js       6 bài học mẫu kèm câu hỏi
  levels.js          Danh sách cấp học
  simulations.js     Danh sách mô phỏng
  lib/               Markdown, chấm điểm, middleware, truy vấn nội dung
  routes/            public, auth, learning (nộp bài, tiến độ), admin
views/               Giao diện EJS
public/              CSS, JS, mô phỏng (canvas)
test/                Kiểm thử (node --test)
```

## Bảo mật

- Mật khẩu băm bằng bcrypt; phiên đăng nhập lưu trong MySQL, cookie `httpOnly` + `secure` khi production
- Chống CSRF cho mọi form, giới hạn số lần đăng nhập/đăng ký, Content-Security-Policy qua Helmet
- Nội dung Markdown được lọc HTML (sanitize-html) trước khi hiển thị
