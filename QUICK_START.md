# 🚀 Quick Start Guide

## Prerequisites
- ✅ Node.js installed
- ✅ PostgreSQL installed and running
- ✅ PostgreSQL password ready

## Setup Steps (5 minutes)

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Create Database
Open PostgreSQL (psql or pgAdmin) and run:
```sql
CREATE DATABASE campus_lost_found;
```

### 3️⃣ Create .env File
Create a file named `.env` in the root folder with:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campus_lost_found
DB_USER=postgres
DB_PASSWORD=your_password_here
PORT=3000
```
**⚠️ Replace `your_password_here` with your PostgreSQL password!**

### 4️⃣ Create Uploads Folder
```bash
# Windows
mkdir uploads

# Linux/Mac
mkdir -p uploads
```

### 5️⃣ Start Server
```bash
npm start
```

You should see:
```
✅ Connected to PostgreSQL database
✅ Database tables initialized successfully
🚀 Server running at http://localhost:3000
```

### 6️⃣ Open Browser
Go to: **http://localhost:3000**

## Test It Out! 🎉

1. **Sign Up**: Create a new account
2. **Login**: Use your credentials
3. **Report Item**: Click "Report Item" and fill the form
4. **View Items**: Browse the portal feed

## Common Issues

### ❌ "Cannot connect to database"
- Check PostgreSQL is running
- Verify password in `.env` file
- Make sure database `campus_lost_found` exists

### ❌ "Port 3000 already in use"
- Change `PORT=3000` to `PORT=3001` in `.env`
- Or stop the other service using port 3000

### ❌ "Tables not created"
- Check server console for errors
- Verify database connection in `.env`

## Need Help?
Check `README.md` for detailed documentation.
