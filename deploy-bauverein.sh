#!/bin/bash
# Bauverein AG Deployment Script
# Führe dies auf der VPS aus: bash deploy-bauverein.sh

set -e

echo "🚀 Starte Deployment für Bauverein AG..."

# 1. Alten Container stoppen
echo "📦 Stoppe alten Container..."
if [ -d /docker/bauverein-heizung ]; then
  cd /docker/bauverein-heizung && docker compose down 2>/dev/null || true
  cd /
  mv /docker/bauverein-heizung /docker/bauverein-heizung.backup.$(date +%s) 2>/dev/null || true
fi

# 2. Neues Verzeichnis erstellen
mkdir -p /docker/bauverein-app
cd /docker/bauverein-app

# 3. GitHub SSH-Key vorbereiten
if [ ! -f ~/.ssh/github_deploy ]; then
  echo "🔑 Erstelle temporären GitHub Key..."
  ssh-keygen -t ed25519 -C "deploy@bauverein" -f ~/.ssh/github_deploy -N ""
  echo "⚠️  Füge diesen Key zu GitHub hinzu:"
  cat ~/.ssh/github_deploy.pub
  echo ""
  read -p "Drücke Enter wenn der Key hinzugefügt ist..."
fi

# 4. App klonen
echo "📥 Klone App..."
ssh-agent bash -c "ssh-add ~/.ssh/github_deploy && git clone git@github.com:support-star/kurtech-heizungsmonitoring.git app"

# 5. Build
echo "🔨 Baue App..."
cd app
npm install
npm run build

# 6. Docker-Compose erstellen
echo "🐳 Erstelle Docker-Compose..."
cat > /docker/bauverein-app/docker-compose.yml << 'EOF'
version: "3.8"

services:
  app:
    image: nginx:alpine
    container_name: bauverein-heizung
    ports:
      - "3001:80"
    volumes:
      - ./app/dist:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    restart: unless-stopped
EOF

# 7. Nginx Config
cat > /docker/bauverein-app/nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 8. Starten
echo "🚀 Starte Container..."
docker compose up -d

# 9. Status prüfen
echo "✅ Deployment abgeschlossen!"
echo ""
echo "📊 Status:"
docker ps | grep bauverein-heizung
echo ""
echo "🌐 App läuft auf: http://localhost:3001"
echo ""
echo "⚠️  Vergiss nicht:"
echo "   1. nginx-proxy-manager: Proxy Host für bauverein.kurtech.shop → localhost:3001"
echo "   2. SSL-Zertifikat in nginx-proxy-manager aktivieren"
