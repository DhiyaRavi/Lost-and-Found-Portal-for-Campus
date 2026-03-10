# Quick Setup Guide

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Create PostgreSQL Database

### Using Command Line:
```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE campus_lost_found;

# Exit
\q
```

### Or using pgAdmin:
1. Open pgAdmin
2. Right-click "Databases" → Create → Database
3. Name: `campus_lost_found`
4. Click Save

## Step 3: Create .env File

Create a file named `.env` in the root directory with:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campus_lost_found
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here
PORT=3000
```

**⚠️ IMPORTANT:** Replace `your_postgres_password_here` with your actual PostgreSQL password!

## Step 4: Create Uploads Folder
```bash
mkdir uploads
```

## Step 5: Start the Server
```bash
npm start
```

The server will automatically create all required tables on first run.

## Step 6: Open Browser
Go to: http://localhost:3000

## Troubleshooting

### Can't connect to database?
- Make sure PostgreSQL is running
- Check your password in `.env` file
- Verify database name is correct

### Port 3000 already in use?
- Change `PORT=3000` to another port in `.env` file

### Tables not created?
- Check database connection in `.env`
- Look at server console for error messages
