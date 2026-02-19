#!/bin/bash
# ═══════════════════════════════════════════════
# KurTech Heizungs-Monitoring → GitHub Push
# ═══════════════════════════════════════════════

echo "🚀 Pushe KurTech Heizungs-Monitoring zu GitHub..."

# Git init falls nötig
git init
git branch -M main
git add -A
git commit -m "🚀 KurTech Heizungs-Monitoring v2.0 – Initial Release"

# Remote setzen
git remote remove origin 2>/dev/null
git remote add origin https://github.com/support-star/kurtech-heizungsmonitoring.git

# Push
git push -u origin main

echo ""
echo "✅ Fertig! Dein Repo: https://github.com/support-star/kurtech-heizungsmonitoring"
echo ""
echo "📦 Jetzt GitHub Pages aktivieren:"
echo "   1. Gehe zu: https://github.com/support-star/kurtech-heizungsmonitoring/settings/pages"
echo "   2. Source → 'GitHub Actions' auswählen"
echo "   3. Warte 2 Min → Live unter: https://support-star.github.io/kurtech-heizungsmonitoring/"
