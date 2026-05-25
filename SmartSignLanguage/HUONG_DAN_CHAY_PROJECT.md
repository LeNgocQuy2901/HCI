# Huong Dan Chay Project SmartSignLanguage

## 1. Yeu Cau

- Node.js va npm da cai san.
- Python da cai san.
- Webcam neu muon dung chuc nang nhan dien sign-to-text.
- Chay lenh trong PowerShell hoac Command Prompt tren Windows.

## 2. Cai Dependency Frontend/Backend Web

Mo terminal tai thu muc:

```powershell
cd D:\GitHub\HCL\SmartSignLanguage
npm install
```

Kiem tra TypeScript:

```powershell
npm run typecheck
```

## 2.1. Chay Nhanh Toan Bo Project

Co the chay mot file duy nhat:

```powershell
cd D:\GitHub\HCL\SmartSignLanguage
.\run-project.bat
```

File nay se mo 2 terminal rieng:

- Web app: `http://localhost:8080`
- AI server sign-to-text: `http://localhost:8000`

Dong 2 terminal do de dung project.

## 3. Chay Web App

Tai thu muc:

```powershell
cd D:\GitHub\HCL\SmartSignLanguage
npm run dev
```

Mo trinh duyet:

```text
http://localhost:8080/
```

Neu Vite hien port khac trong terminal, dung dung port Vite thong bao.

## 4. Chay AI Server Sign-To-Text

Tai terminal khac:

```powershell
cd D:\GitHub\HCL\SmartSignLanguage\ai-model
.\start-inference-server.bat
```

AI server chay tai:

```text
http://localhost:8000
```

Kiem tra server:

```text
http://localhost:8000/health
```

Neu dung dung model moi, health se hien:

```text
backend: wlasl-hands-pose-sequence
model: WLASL 8-source 10-word Landmark Keras
num_gestures: 10
```

## 5. File Model Dang Duoc Su Dung

Dat trong:

```text
D:\GitHub\HCL\SmartSignLanguage\ai-model\model
```

Can co cac file:

```text
model_landmarks.keras
mapping.json
hand_landmarker.task
pose_landmarker.task
```

Khong can cac model cu nhu `gesture_model.h5`, `mobilenet*.n2x`, `model_weights.pkl`.

## 6. Mo Trang Nhan Dien Sign-To-Text

Sau khi ca web app va AI server deu dang chay, mo:

```text
http://localhost:8080/recognition
```

Model hien tai chi nhan dien 10 tu:

```text
book, finish, go, good, help, like, mother, what, who, yes
```

Luu y:

- Dua tay vao khung hinh ro rang.
- Giu ky hieu it nhat khoang 20 frame de model gom du chuoi.
- Neu doi ky hieu, nen dua tay ra khoi khung mot luc hoac bam Reset Session.
- Dung `Ctrl + F5` neu trinh duyet van hien code cu.

## 7. Text-To-Sign

Trang text-to-sign dung file:

```text
D:\GitHub\HCL\SmartSignLanguage\public\data\combined_avg_landmarks.json
```

Khong xoa file nay neu muon chay chuc nang Translate.

Mo trang:

```text
http://localhost:8080/translate
```

## 8. Loi Thuong Gap

### Khong vao duoc web

Kiem tra terminal `npm run dev` xem Vite dang chay port nao.

### Recognition bao mat ket noi server

Kiem tra AI server:

```text
http://localhost:8000/health
```

Neu khong truy cap duoc, chay lai:

```powershell
cd D:\GitHub\HCL\SmartSignLanguage\ai-model
.\start-inference-server.bat
```

### Model nhan dien sai

- Chi test trong 10 tu model ho tro.
- Dam bao anh sang tot, tay nam gon trong camera.
- Bam Reset Session truoc khi test lai mot ky hieu moi.
- Khong dung ky hieu ngoai mapping vi model se van ep doan thanh 1 trong 10 tu.

### Port 8000 da bi chiem

Tim process dang dung port:

```powershell
netstat -ano | findstr :8000
```

Tat process theo PID:

```powershell
taskkill /PID <PID> /F
```

Sau do chay lai AI server.
