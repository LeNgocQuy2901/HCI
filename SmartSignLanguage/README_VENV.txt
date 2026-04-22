╔════════════════════════════════════════════════════════════════════════════╗
║         SMART SIGN LANGUAGE - PROJECT SETUP WITH VIRTUAL ENVIRONMENT        ║
╚════════════════════════════════════════════════════════════════════════════╝

📍 QUICK REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 START PROJECT (5 seconds):
┌─────────────────────────────────────────────────────────────────────────┐
│ WINDOWS:                                                                │
│ > start-dev.bat                                                         │
│                                                                         │
│ MAC/LINUX:                                                              │
│ $ ./start-dev.sh                                                        │
│                                                                         │
│ Then open: http://localhost:8080/                                       │
└─────────────────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 PROJECT STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

E:\CodeFiles\TTNM_BTL\HCL-main\SmartSignLanguage/
├── venv/                    ← Virtual Environment (node_modules sẽ ở đây)
├── client/                  ← React Frontend
├── server/                  ← Express Backend
├── shared/                  ← Shared Types
├── public/                  ← Static files
├── start-dev.bat            ← Run script (Windows) ⭐ CLICK HERE
├── start-dev.sh             ← Run script (Mac/Linux)
├── HUONG_DAN_SETUP_CHAY.txt ← Full guide in Vietnamese
├── SETUP_GOOGLE_DRIVE.md    ← Google Drive integration guide
└── GOOGLE_DRIVE_QUICK_START.txt ← Quick setup for Google Drive videos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 MANUAL COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACTIVATE VIRTUAL ENVIRONMENT:
  WINDOWS: > venv\Scripts\activate.bat
  MAC:     $ source venv/bin/activate

START DEV SERVER:
  > npm run dev
  → http://localhost:8080/

STOP SERVER:
  Ctrl + C

DEACTIVATE VENV:
  > deactivate

BUILD FOR PRODUCTION:
  > npm run build

RUN PRODUCTION:
  > npm start

RUN TESTS:
  > npm test

FORMAT CODE:
  > npm run format.fix

TYPE CHECK:
  > npm run typecheck

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Q: Port 8080 is already in use?
A: > netstat -ano | findstr :8080
   Kill the process or change port in vite.config.ts

Q: "npm: command not found"?
A: Install Node.js from https://nodejs.org/

Q: venv not found?
A: Create it: python -m venv venv

Q: Dependencies not installed?
A: > npm install
   or use script: start-dev.bat

Q: Changes not showing in browser?
A: Refresh: Ctrl+F5 or Cmd+Shift+R

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 DOCUMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Full Guide (Vietnamese):     HUONG_DAN_SETUP_CHAY.txt
Google Drive Integration:    SETUP_GOOGLE_DRIVE.md
Google Drive Quick Start:    GOOGLE_DRIVE_QUICK_START.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️ WHAT IS VIRTUAL ENVIRONMENT (venv)?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Virtual Environment isolates project dependencies:
✓ node_modules installed in venv folder (not C: drive)
✓ Each project can have different versions of packages
✓ Easy to delete and recreate (just rm -rf venv)
✓ No conflict with system packages

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📞 NEED HELP?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Check browser DevTools (F12) for errors
2. Check terminal output for logs
3. Read full guide in HUONG_DAN_SETUP_CHAY.txt
4. Common issues are documented in "GIẢI QUYẾT VẤN ĐỀ" section

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Updated: 2026-04-22
Environment: Windows 10+, Node.js v24.13.0, Python 3.8+
Status: ✅ READY TO USE!
