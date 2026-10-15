@echo off
start /min cmd /k "cd server && node server.js"
start /min cmd /k "cd client && npm run dev"
timeout /t 3 >nul
start http://localhost:5173