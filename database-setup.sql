-- PostgreSQL Database Setup Script for Campus Lost & Found Portal
-- Run this script to create the database and tables manually if needed

-- Create database (run this as superuser)
-- CREATE DATABASE campus_lost_found;

-- Connect to the database
-- \c campus_lost_found;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    profile_pic TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    location VARCHAR(100),
    date DATE,
    status VARCHAR(10) CHECK (status IN ('lost', 'found')),
    image_url TEXT,
    reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contact_info VARCHAR(100),
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_reporter ON items(reporter_id);
CREATE INDEX IF NOT EXISTS idx_items_resolved ON items(is_resolved);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Sample data (optional - for testing)
-- Note: Passwords should be hashed using bcrypt in production
