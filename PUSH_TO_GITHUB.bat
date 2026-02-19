@echo off
echo Pushe KurTech Heizungs-Monitoring zu GitHub...

git init
git branch -M main
git add -A
git commit -m "KurTech Heizungs-Monitoring v2.0 - Initial Release"

git remote remove origin 2>nul
git remote add origin https://github.com/support-star/kurtech-heizungsmonitoring.git

git push -u origin main

echo.
echo Fertig! Dein Repo: https://github.com/support-star/kurtech-heizungsmonitoring
echo.
echo Jetzt GitHub Pages aktivieren:
echo   1. Gehe zu: https://github.com/support-star/kurtech-heizungsmonitoring/settings/pages
echo   2. Source: GitHub Actions auswaehlen
echo   3. Live unter: https://support-star.github.io/kurtech-heizungsmonitoring/
pause
