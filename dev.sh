#!/usr/bin/env bash
#
# Lanzador local de Citylife.
# Uso: ./dev.sh [--no-open]
#
# Variables opcionales:
#   CITYLIFE_BACKEND_PORT   Puerto del backend (por defecto 8080)
#   CITYLIFE_FRONTEND_PORT  Puerto del frontend (por defecto 5173)
#
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

BACKEND_PORT="${CITYLIFE_BACKEND_PORT:-8080}"
FRONTEND_PORT="${CITYLIFE_FRONTEND_PORT:-5173}"
LOG_DIR="$ROOT/.local"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
BACKEND_PID=""
FRONTEND_PID=""
CLEANED=0
OPEN_BROWSER=1

for arg in "$@"; do
  case "$arg" in
    --no-open) OPEN_BROWSER=0 ;;
    -h|--help)
      sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "Opción desconocida: $arg (usa --help)" >&2; exit 2 ;;
  esac
done

log() { printf '\033[1;32m[citylife]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[citylife]\033[0m %s\n' "$*" >&2; }
fail() { printf '\033[1;31m[citylife]\033[0m %s\n' "$*" >&2; exit 1; }

cleanup() {
  [[ "$CLEANED" -eq 1 ]] && return
  CLEANED=1
  if [[ -n "$FRONTEND_PID" || -n "$BACKEND_PID" ]]; then
    log "Deteniendo servicios…"
  fi
  if [[ -n "$FRONTEND_PID" ]]; then kill_tree "$FRONTEND_PID"; fi
  if [[ -n "$BACKEND_PID" ]]; then kill_tree "$BACKEND_PID"; fi
  wait 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 130' INT TERM

kill_tree() {
  local pid="$1" child
  [[ -z "$pid" ]] && return
  for child in $(pgrep -P "$pid" 2>/dev/null || true); do
    kill_tree "$child"
  done
  kill "$pid" 2>/dev/null || true
}

port_pids() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | sort -u
  elif command -v fuser >/dev/null 2>&1; then
    fuser "$port/tcp" 2>/dev/null | tr ' ' '\n' | sed '/^$/d' | sort -u
  elif command -v ss >/dev/null 2>&1; then
    ss -H -ltnp "sport = :$port" 2>/dev/null | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u
  else
    fail "No se encontró lsof, fuser ni ss para comprobar los puertos."
  fi
}

owns_port() {
  local pid="$1" kind="$2" args lower cwd
  args="$(ps -p "$pid" -o args= 2>/dev/null || true)"
  lower="${args,,}"
  cwd="$(readlink -f "/proc/$pid/cwd" 2>/dev/null || true)"
  [[ "$lower" == *citylife* || "$cwd" == *citylife* ]] && return 0
  [[ "$kind" == "backend" && "$lower" == *spring-boot* ]] && return 0
  return 1
}

stop_previous() {
  local port="$1" kind="$2" label="$3" pids pid
  pids="$(port_pids "$port" || true)"
  [[ -z "$pids" ]] && return 0

  for pid in $pids; do
    if ! owns_port "$pid" "$kind"; then
      fail "El puerto $port está ocupado por otro proceso (PID $pid): $(ps -p "$pid" -o args= 2>/dev/null)"
    fi
  done

  log "Detectado $label anterior en el puerto $port; reiniciándolo…"
  for pid in $pids; do kill "$pid" 2>/dev/null || true; done
  for _ in $(seq 1 20); do
    [[ -z "$(port_pids "$port")" ]] && return 0
    sleep 0.5
  done
  for pid in $(port_pids "$port"); do kill -9 "$pid" 2>/dev/null || true; done
  sleep 0.5
  [[ -z "$(port_pids "$port")" ]] || fail "No se pudo liberar el puerto $port."
}

wait_for_http() {
  local url="$1" pid="$2" log_file="$3" label="$4"
  for _ in $(seq 1 240); do
    if ! kill -0 "$pid" 2>/dev/null; then
      tail -n 40 "$log_file" >&2 || true
      fail "$label se ha detenido durante el arranque. Revisa $log_file"
    fi
    if curl -fsS --max-time 2 "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  tail -n 40 "$log_file" >&2 || true
  fail "$label no ha respondido en $url. Revisa $log_file"
}

for cmd in docker java mvn node npm curl pgrep; do
  command -v "$cmd" >/dev/null 2>&1 || fail "Falta el comando '$cmd'. Revisa los requisitos en README.md."
done
docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 no está disponible."
docker info >/dev/null 2>&1 || fail "Docker no está en marcha. Inícialo y vuelve a ejecutar ./dev.sh."

mkdir -p "$LOG_DIR"
: >"$BACKEND_LOG"
: >"$FRONTEND_LOG"

if [[ ! -f .env ]]; then
  cp .env.example .env
  log "Creado .env a partir de .env.example."
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

export DEMO_USER_PASSWORD="${DEMO_USER_PASSWORD:-Citylife123!}"
[[ -n "${JWT_SECRET_BASE64:-}" ]] || fail "Falta JWT_SECRET_BASE64 en .env."

if [[ "$FRONTEND_PORT" != "5173" ]]; then
  export CORS_ALLOWED_ORIGINS="${CORS_ALLOWED_ORIGINS:-http://localhost:5173},http://localhost:${FRONTEND_PORT},http://127.0.0.1:${FRONTEND_PORT}"
fi

log "Levantando PostgreSQL…"
docker compose up -d postgres >/dev/null
for _ in $(seq 1 60); do
  status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.State}}{{end}}' citylife-postgres 2>/dev/null || true)"
  [[ "$status" == "healthy" || "$status" == "running" ]] && break
  sleep 1
done
[[ "${status:-}" == "healthy" || "${status:-}" == "running" ]] || {
  docker compose logs --tail=40 postgres >&2 || true
  fail "PostgreSQL no ha arrancado correctamente."
}

stop_previous "$BACKEND_PORT" backend "backend"
stop_previous "$FRONTEND_PORT" frontend "frontend"

log "Arrancando backend en http://localhost:${BACKEND_PORT} …"
(
  cd backend
  exec mvn spring-boot:run \
    -Dspring-boot.run.profiles=local \
    -Dspring-boot.run.arguments="--server.port=${BACKEND_PORT}"
) >"$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
wait_for_http "http://127.0.0.1:${BACKEND_PORT}/actuator/health" "$BACKEND_PID" "$BACKEND_LOG" "El backend"

if [[ ! -d frontend/node_modules ]]; then
  log "Instalando dependencias del frontend (solo la primera vez)…"
  (cd frontend && npm install) || fail "No se pudieron instalar las dependencias del frontend."
fi

log "Arrancando frontend en http://localhost:${FRONTEND_PORT} …"
if [[ "$BACKEND_PORT" == "8080" ]]; then
  (
    cd frontend
    exec npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort
  ) >"$FRONTEND_LOG" 2>&1 &
else
  (
    cd frontend
    export VITE_API_URL="http://127.0.0.1:${BACKEND_PORT}"
    exec npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort
  ) >"$FRONTEND_LOG" 2>&1 &
fi
FRONTEND_PID=$!
wait_for_http "http://127.0.0.1:${FRONTEND_PORT}" "$FRONTEND_PID" "$FRONTEND_LOG" "El frontend"

if [[ "$OPEN_BROWSER" -eq 1 ]] && command -v xdg-open >/dev/null 2>&1 && [[ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]]; then
  xdg-open "http://localhost:${FRONTEND_PORT}" >/dev/null 2>&1 || true
fi

cat <<EOF

  Citylife está listo.

  App:      http://localhost:${FRONTEND_PORT}
  API:      http://localhost:${BACKEND_PORT}
  Swagger:  http://localhost:${BACKEND_PORT}/swagger-ui

  Usuarios demo (contraseña ${DEMO_USER_PASSWORD}):
    citizen@example.com      Ciudadanía
    operator@example.com     Operación
    technician@example.com   Técnico

  Logs: .local/backend.log y .local/frontend.log
  Pulsa Ctrl+C para detener backend y frontend.

EOF

while kill -0 "$BACKEND_PID" 2>/dev/null && kill -0 "$FRONTEND_PID" 2>/dev/null; do
  sleep 1
done

warn "Uno de los servicios se ha detenido. Últimas líneas del backend:"
tail -n 20 "$BACKEND_LOG" >&2 || true
warn "Últimas líneas del frontend:"
tail -n 20 "$FRONTEND_LOG" >&2 || true
exit 1
