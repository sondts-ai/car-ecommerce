# CI với Jenkins (Docker) — Car E-commerce

Tài liệu này ghi lại **toàn bộ file liên quan tới Jenkins/CI**, cách chạy, cách
cấu hình job và cách deploy lên EC2. Đọc từ trên xuống là làm được.

---

## 1. Kiến trúc

```
┌──────────────────────── LAPTOP ────────────────────────┐
│  Jenkins container (http://localhost:9090)             │
│   ├─ JDK 17 + Maven 3.9 + Node 20                      │
│   ├─ Docker CLI  ──► /var/run/docker.sock              │
│   └─ Pipeline: checkout → test → build → push          │
└───────────────────────────┬────────────────────────────┘
                            │ push image
                            ▼
                    Docker Hub (registry)
                            │ pull image
                            ▼
┌──────────────────────── EC2 ───────────────────────────┐
│  docker compose -f docker-compose.yml                  │
│                 -f docker-compose.prod.yml             │
│   mysql + 6 service + nginx gateway + frontend         │
└─────────────────────────────────────────────────────────┘
```

- **Jenkins chỉ build/test/push**, không chạy app production.
- **EC2 chỉ pull image và chạy compose** (`--no-build`).
- Admin UI (nếu làm sau) chỉ là thêm 1 image; pipeline hiện tại không phụ thuộc.

---

## 2. Danh sách file — đọc file nào, để làm gì

| File | Vai trò | Khi nào cần đọc |
|---|---|---|
| `Jenkinsfile` | Định nghĩa pipeline: stage, tham số, build/test/push/deploy | Muốn sửa luồng CI |
| `jenkins/Dockerfile` | Image Jenkins: JDK17 + Maven 3.9 + Node 20 + Docker CLI | Muốn thêm tool vào CI |
| `jenkins/plugins.txt` | Danh sách plugin Jenkins cài sẵn | Plugin thiếu/lỗi |
| `docker-compose.jenkins.yml` | Chạy Jenkins container, map cổng 9090, mount `docker.sock` | Khởi động/tắt Jenkins |
| `scripts/deploy.sh` | Chạy **trên EC2**: pull image, `up --wait`, smoke test | Deploy / rollback thủ công |
| `docker-compose.yml` | Compose gốc (dev + build local) | Hiểu service/port/healthcheck |
| `docker-compose.prod.yml` | Overlay production: pull image, restart, log | Sửa hành vi trên cloud |
| `.env.prod.example` | Mẫu biến môi trường production | Tạo `.env` trên EC2 |
| `Dockerfile` | Image frontend Next.js (nhận `NEXT_PUBLIC_*` qua build-arg) | Sửa build frontend |
| `*/Dockerfile` | Image 6 service Spring Boot | Sửa build backend |

---

## 3. Yêu cầu

- Docker Engine + Docker Compose v2 (`docker compose version` ≥ 2.20).
- RAM laptop ≥ 8 GB (Jenkins ~1.5 GB + build Maven/Node).
- Repo đã clone, có `package-lock.json` (đã có).
- Tài khoản Docker Hub + **Access Token** (không dùng mật khẩu thường).
- (Tuỳ chọn) EC2 Ubuntu đã cài Docker + Compose, repo clone tại `/opt/car-ecommerce`.

---

## 4. Chạy Jenkins container

```bash
cd /home/sonkk/Monhoc/car-ecommerce

# GID của docker.sock để user jenkins trong container dùng được Docker
export DOCKER_GID=$(stat -c '%g' /var/run/docker.sock)

docker compose -f docker-compose.jenkins.yml up -d --build

# Xem log lần đầu (cài plugin, khởi động)
docker logs -f jenkins

# Lấy mật khẩu admin ban đầu
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Mở **http://localhost:9090**:

1. Nhập mật khẩu vừa lấy.
2. Chọn **Install suggested plugins** (các plugin trong `plugins.txt` đã cài sẵn,
   bước này chỉ bổ sung phần còn thiếu).
3. Tạo user admin.
4. Vào **Manage Jenkins → Tools**, kiểm tra:
   - JDK 17 (có sẵn trong image)
   - Maven → có thể để trống vì pipeline gọi `mvn` trực tiếp
   - NodeJS → có thể để trống vì pipeline gọi `npm` trực tiếp

> Cổng **9090** được chọn vì gateway của app đang dùng **8080**.

---

## 5. Tạo Credentials

**Manage Jenkins → Credentials → System → Global credentials → Add Credentials**

### 5.1. Docker Hub — ID: `dockerhub-credentials`

| Trường | Giá trị |
|---|---|
| Kind | Username with password |
| Username | Docker Hub username |
| Password | **Access Token** (Docker Hub → Account Settings → Security) |
| ID | `dockerhub-credentials` |

### 5.2. SSH key EC2 — ID: `ec2-ssh-key` (chỉ cần nếu deploy tự động)

| Trường | Giá trị |
|---|---|
| Kind | SSH Username with private key |
| Username | `ubuntu` (hoặc user EC2 của bạn) |
| Private Key | Enter directly → dán nội dung private key `.pem` |
| ID | `ec2-ssh-key` |

> ID phải khớp với `environment` trong `Jenkinsfile`. Nếu đổi ID, sửa cả 2 nơi.

---

## 6. Tạo job

1. **New Item → Multibranch Pipeline**, tên `car-ecommerce`.
2. **Branch Sources → Git**:
   - Repository URL: repo của bạn.
   - Credentials: thêm nếu repo private.
3. **Build Configuration**: Mode = `by Jenkinsfile`, Script Path = `Jenkinsfile`.
4. **Scan Multibranch Pipeline Triggers**: bật nếu muốn tự build khi push.
5. Save → **Scan Repository Now**.

Pipeline sẽ tự build các branch (`main`, `User`, `beadmin`, `userFrondend`).
Chỉ branch `main` mới push image và deploy.

---

## 7. Tham số pipeline

| Tham số | Mặc định | Ý nghĩa |
|---|---|---|
| `IMAGE_PREFIX` | `your-dockerhub-user` | Docker Hub namespace. Image: `<prefix>/auth-service`... |
| `PUBLIC_API_BASE_URL` | `http://localhost:8080/api/v1` | URL API **trình duyệt** gọi, được nướng vào frontend lúc build |
| `USE_MOCK_API` | `false` | Bật mock API trong frontend |
| `PUSH_IMAGES` | `true` | Push Docker Hub (chỉ `main`) |
| `DEPLOY` | `false` | Deploy EC2 sau khi push |
| `DEPLOY_USER` | `ubuntu` | SSH user EC2 |
| `DEPLOY_HOST` | (trống) | IP/DNS EC2 |
| `PUBLIC_URL` | (trống) | URL public để smoke test |

**Lần chạy đầu nên để `PUSH_IMAGES=false`** để kiểm tra build/test, sau đó:
- Sửa `IMAGE_PREFIX` thành username Docker Hub của bạn (trong Jenkinsfile hoặc
  khi bấm **Build with Parameters**).
- Bật `PUSH_IMAGES=true` và chạy lại.

> Pipeline **không push** nếu `IMAGE_PREFIX` vẫn là `your-dockerhub-user`
> (tránh fail do tài khoản không tồn tại).

---

## 8. Các stage pipeline làm gì

| Stage | Nội dung |
|---|---|
| `Prepare` | Tính `IMAGE_TAG = <BUILD_NUMBER>-<git-sha7>` |
| `Frontend: install, typecheck, build` | `npm ci` → `npm run typecheck` → `npm run build` |
| `Backend: test (parallel)` | Chạy `mvn test` song song cho 6 service (H2, không cần MySQL) |
| `Docker: build images (parallel)` | Build 7 image, frontend nhận `NEXT_PUBLIC_*` qua build-arg |
| `Docker: push to Docker Hub` | Push tag `<BUILD_NUMBER>-<sha>` + `latest` (chỉ main) |
| `Deploy to EC2` | SSH → `scripts/deploy.sh` (chỉ main + `DEPLOY=true`) |
| `Smoke test` | `curl <PUBLIC_URL>/api/health` |

Kết quả test JUnit được archive ở `**/target/surefire-reports/*.xml`.

---

## 9. Chuẩn bị EC2 (một lần)

```bash
# trên EC2
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2 git curl
sudo usermod -aG docker $USER   # logout/login lại

sudo mkdir -p /opt/car-ecommerce
sudo chown $USER:$USER /opt/car-ecommerce
git clone <repo-url> /opt/car-ecommerce
cd /opt/car-ecommerce

cp .env.prod.example .env
nano .env
#   IMAGE_PREFIX=<dockerhub-username>
#   IMAGE_TAG=latest
#   JWT_SECRET=<chuỗi ngẫu nhiên >= 32 bytes>
#   DB_PASSWORD=...
#   CORS_ALLOWED_ORIGINS=http://<EC2-IP>:3000
#   NEXT_PUBLIC_*_API_URL=http://<EC2-IP>:8080/api/v1
#   NEXT_PUBLIC_USE_MOCK_API=false

chmod +x scripts/deploy.sh
./scripts/deploy.sh latest   # test thủ công trước khi cho Jenkins deploy
```

Lưu ý: `NEXT_PUBLIC_*` trong `.env` phải trùng với tham số
`PUBLIC_API_BASE_URL` khi Jenkins build frontend. Nếu không, trình duyệt sẽ gọi
sai địa chỉ (xem mục 12).

---

## 10. Deploy / rollback

**Tự động**: chạy pipeline `main` với:
- `IMAGE_PREFIX=<username>`
- `PUSH_IMAGES=true`
- `DEPLOY=true`
- `DEPLOY_HOST=<IP EC2>`
- `PUBLIC_URL=http://<IP EC2>:3000`

**Thủ công trên EC2**:

```bash
cd /opt/car-ecommerce
IMAGE_TAG=12-a1b2c3d ./scripts/deploy.sh
```

**Rollback**: chạy lại tag cũ (tag in trong log Jenkins hoặc file `image-tag.txt`):

```bash
IMAGE_TAG=11-9f8e7d6 ./scripts/deploy.sh
```

> `deploy.sh` dùng `--wait` nên chỉ trả về khi tất cả healthcheck xanh.
> Nếu một service không lên, script fail ngay.

---

## 11. Lệnh quản lý Jenkins

```bash
# trạng thái
docker compose -f docker-compose.jenkins.yml ps

# log
docker logs -f jenkins

# restart
docker compose -f docker-compose.jenkins.yml restart

# tắt (giữ dữ liệu)
docker compose -f docker-compose.jenkins.yml down

# xoá sạch (mất job/credential)
docker compose -f docker-compose.jenkins.yml down -v

# rebuild image Jenkins (sau khi sửa jenkins/Dockerfile hoặc plugins.txt)
docker compose -f docker-compose.jenkins.yml up -d --build
```

---

## 12. Troubleshooting

| Lỗi | Nguyên nhân / cách sửa |
|---|---|
| `permission denied while trying to connect to the Docker daemon socket` | Chưa set `DOCKER_GID`. Chạy `export DOCKER_GID=$(stat -c '%g' /var/run/docker.sock)` rồi `up -d` lại |
| Không mở được `localhost:9090` | Cổng bị chiếm: đổi `"9090:8080"` trong `docker-compose.jenkins.yml` |
| `jenkins-plugin-cli` fail khi build image | Mở `jenkins/plugins.txt`, bỏ plugin gây lỗi, build lại; cài tay trong UI |
| Build image in ra `Security warnings` của plugin | Chỉ là cảnh báo từ Jenkins Update Center, **không làm fail build**. Có thể bỏ qua hoặc cập nhật plugin sau trong UI |
| Push lỗi `unauthorized` | Dùng **Access Token**, không dùng mật khẩu; kiểm tra ID credential đúng `dockerhub-credentials` |
| `npm ci` lỗi | Đảm bảo `package-lock.json` có trong repo và không bị `.dockerignore` loại |
| Maven tải dependency chậm | `~/.m2` nằm trong volume `jenkins_home`, chỉ tải lần đầu |
| Frontend gọi `localhost:8081` dù đã deploy | `NEXT_PUBLIC_*` là **build-time**. Phải build lại frontend với `PUBLIC_API_BASE_URL` đúng; sửa `.env` runtime không có tác dụng |
| CORS lỗi trên trình duyệt | `CORS_ALLOWED_ORIGINS` trên EC2 phải đúng origin frontend (`http://<IP>:3000`) |
| Deploy SSH lỗi host key | Pipeline dùng `StrictHostKeyChecking=accept-new`; chạy SSH tay 1 lần nếu cần |
| `--wait` không được hỗ trợ | Nâng Docker Compose lên ≥ 2.20 trên EC2 |
| Đầy ổ đĩa | `docker system prune -af --volumes` (cẩn thận: xoá cả volume không dùng) |

---

## 13. Bảo mật — nên nhớ

- Không commit `.env`; `.env.prod.example` chỉ chứa placeholder.
- `JWT_SECRET` ≥ 32 byte, khác hoàn toàn giá trị dev.
- Jenkins không mở ra Internet; nếu cần webhook, dùng Cloudflare Tunnel + Access.
- Mount `docker.sock` tương đương quyền root trên host → chỉ dùng máy cá nhân/CI nội bộ.
- Docker Hub nên dùng Access Token có scope `read/write` tối thiểu.
- Sau buổi bảo vệ: tắt EC2 (terminate), xoá EBS/volume không dùng.

---

## 14. Ghi chú phạm vi

- Tài liệu này **chỉ** cho CI/CD. Admin UI chưa có — không ảnh hưởng pipeline.
- Khi làm admin UI:
  - Nếu nằm trong app Next.js hiện tại (`/admin`): không cần sửa Jenkinsfile.
  - Nếu tách app riêng: thêm 1 service vào `docker-compose*.yml`, 1 dòng trong
    `SERVICES`/`IMAGES` của `Jenkinsfile`, và 1 route Nginx.
- Nginx đã route các API `/api/v1/admin/*` cần bởi admin UI.
