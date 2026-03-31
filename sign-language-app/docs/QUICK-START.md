# ⚡ Quick Start Guide

**Bắt Đầu Nhanh trong 5 Phút**

## 🎯 Tối Thiểu Yêu Cầu
- Docker & Docker Compose
- PowerShell hoặc Terminal

---

## 🚀 5 Bước Khởi Động

### Bước 1: Mở PowerShell
```powershell
cd d:/GitHub/HCL/sign-language-app
```

### Bước 2: Tạo Environment Files
```powershell
# Windows
Copy-Item "backend\.env.example" -Destination "backend\.env"
Copy-Item "frontend\.env.example" -Destination "frontend\.env"
```

### Bước 3: Chạy Docker
```powershell
docker-compose up -d
```

### Bước 4: Chờ Services Khởi Động
```powershell
# Kiểm tra status
docker-compose ps

# Xem logs
docker-compose logs -f
```

### Bước 5: Truy Cập Ứng Dụng
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## ✅ Success Checklist

- [ ] Docker containers running (`docker-compose ps`)
- [ ] Frontend loads without error
- [ ] API docs accessible
- [ ] Database initialized

---

## 📚 Hướng Dẫn Tiếp Theo

1. Đọc [GUIDE.md](GUIDE.md) để hiểu chi tiết
2. Xem [API.md](API.md) để test endpoints
3. Refer to [STRUCTURE.md](STRUCTURE.md) cho cấu trúc project

---

## 🆘 Nếu Có Lỗi

```powershell
# 1. Check Docker running
docker --version

# 2. View error logs
docker-compose logs backend
docker-compose logs frontend

# 3. Rebuild containers
docker-compose down
docker-compose up -d --build

# 4. Reset everything
docker-compose down -v
docker-compose up -d
```

---

**Done! Bạn đã sẵn sàng phát triển! 🎉**
