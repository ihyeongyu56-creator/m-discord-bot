#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: ./deploy.sh <user@host> <remote-path>"
  echo "Example: ./deploy.sh ubuntu@123.45.67.89 /opt/m-discord-bot"
  exit 1
fi

REMOTE_USER_HOST="$1"
REMOTE_PATH="$2"

ssh "$REMOTE_USER_HOST" "sudo apt update && sudo apt install -y docker.io docker-compose-plugin && sudo systemctl enable --now docker"

scp -r . "$REMOTE_USER_HOST:$REMOTE_PATH"

ssh "$REMOTE_USER_HOST" "cd '$REMOTE_PATH' && cat > .env <<'EOF'
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_id
EOF
sudo docker compose up -d --build
sudo docker compose ps
sudo docker compose logs --tail=30 discord-bot"

printf '\nDeployment finished.\n'
printf 'Check with: ssh %s "cd %s && sudo docker compose logs -f discord-bot"\n' "$REMOTE_USER_HOST" "$REMOTE_PATH"
