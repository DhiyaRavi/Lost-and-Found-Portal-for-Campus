# Campus Lost & Found Portal

A modern web application for managing lost and found items on campus.

## Features

- 🔐 User Authentication (Signup/Login)
- 📝 Report Lost or Found Items
- 🖼️ Image Upload for Items
- 🔍 Search and Filter Items
- 📱 Responsive Design
- 🎨 Modern UI with Animations

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **File Upload**: Multer

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup PostgreSQL Database

#### Option A: Using psql (Command Line)

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE campus_lost_found;

# Exit psql
\q
```

#### Option B: Using pgAdmin

1. Open pgAdmin
2. Right-click on "Databases" → "Create" → "Database"
3. Name it `campus_lost_found`
4. Click "Save"

### 3. Configure Environment Variables

Create a `.env` file in the root directory (or copy from `.env.example`):

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campus_lost_found
DB_USER=postgres
DB_PASSWORD=your_postgres_password
PORT=3000
```

**Important**: Update `DB_PASSWORD` with your actual PostgreSQL password!

### 4. Create Uploads Directory

```bash
mkdir uploads
```

### 5. Run the Server

```bash
npm start
```

The server will automatically create the required tables on first run.

### 6. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user

### Items
- `GET /api/items` - Get all items (with optional query params: status, category, search)
- `POST /api/items` - Create new item report (requires authentication)
- `GET /api/items/:id` - Get single item by ID
- `PATCH /api/items/:id/resolve` - Mark item as resolved

### Health Check
- `GET /api/health` - Check server and database status

## Database Schema

### Users Table
- `id` (UUID) - Primary key
- `username` (VARCHAR) - Unique username
- `email` (VARCHAR) - Unique email
- `password` (TEXT) - Hashed password
- `profile_pic` (TEXT) - Profile picture URL
- `created_at` (TIMESTAMP) - Account creation date

### Items Table
- `id` (UUID) - Primary key
- `title` (VARCHAR) - Item title
- `description` (TEXT) - Item description
- `category` (VARCHAR) - Item category
- `location` (VARCHAR) - Location where item was lost/found
- `date` (DATE) - Date when item was lost/found
- `status` (VARCHAR) - 'lost' or 'found'
- `image_url` (TEXT) - Image URL
- `reporter_id` (UUID) - Foreign key to users table
- `contact_info` (VARCHAR) - Contact information
- `is_resolved` (BOOLEAN) - Resolution status
- `created_at` (TIMESTAMP) - Report creation date

## Troubleshooting

### Database Connection Issues

1. **Check PostgreSQL is running:**
   ```bash
   # Windows
   services.msc (look for PostgreSQL service)
   
   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. **Verify database exists:**
   ```bash
   psql -U postgres -l
   ```

3. **Check credentials in .env file**

### Port Already in Use

If port 3000 is already in use, change the `PORT` in `.env` file.

### Image Upload Issues

- Ensure `uploads` directory exists
- Check file permissions
- Verify file size is under 5MB

## Development

The application uses:
- **Express.js** for the backend server
- **PostgreSQL** with connection pooling
- **bcrypt** for password hashing
- **Multer** for file uploads
- **CORS** enabled for cross-origin requests

## Security Notes

- Passwords are hashed using bcrypt (10 salt rounds)
- File uploads are limited to 5MB
- Only image files are accepted
- SQL injection protection via parameterized queries

## License

ISC
