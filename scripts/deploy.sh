#!/usr/bin/env bash
# =============================================================
# Deploy Car E-commerce trên EC2 bằng Docker Compose.
#
# Chạy trên server (sau khi đã clone repo và tạo .env):
#   IMAGE_TAG=12-a1b2c3d ./scripts/deploy.sh
#   ./scripts/deploy.sh 12-a1b2c3d
#
# Yêu cầu: Docker Engine + Docker Compose v2 (>= 2.20 để có --wait).
# =============================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TAG="${IMAGE_TAG:-${1:-latest}}"
export IMAGE_TAG="$TAG"

COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.prod.yml)

if [[ ! -f .env ]]; then
    echo "ERROR: thiếu file .env. Tạo từ .env.prod.example trước khi deploy." >&2
    exit 1
fi

read_env() {
    # Đọc giá trị từ .env (không export toàn bộ file để tránh lộ secret ra log)
    grep -E "^$1=" .env | tail -n 1 | cut -d= -f2- || true
}

FRONTEND_PORT="$(read_env FRONTEND_PORT)"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
GATEWAY_PORT="$(read_env GATEWAY_PORT)"
GATEWAY_PORT="${GATEWAY_PORT:-8080}"

echo "==> Deploy image tag: ${IMAGE_TAG}"
echo "==> Thư mục: ${ROOT_DIR}"

echo "==> Pull image"
docker compose "${COMPOSE_FILES[@]}" pull

echo "==> Khởi động container và chờ healthy"
docker compose "${COMPOSE_FILES[@]}" up -d --no-build --remove-orphans --wait --wait-timeout 300

echo "==> Trạng thái container"
docker compose "${COMPOSE_FILES[@]}" ps

echo "==> Smoke test"
curl -fsS "http://127.0.0.1:${GATEWAY_PORT}/healthz" >/dev/null
echo "  gateway  : OK (port ${GATEWAY_PORT})"
curl -fsS "http://127.0.0.1:${FRONTEND_PORT}/api/health" >/dev/null
echo "  frontend : OK (port ${FRONTEND_PORT})"

echo "==> Deploy xong: ${IMAGE_TAG}"
