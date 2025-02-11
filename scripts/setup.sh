#!/bin/bash

# Supabase Backup Tool Setup Script

set -e

echo "🚀 Setting up Supabase Backup Tool"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI is not installed"
    echo "   Installing Supabase CLI..."
    npm install -g supabase
else
    echo "✅ Supabase CLI version: $(supabase --version)"
fi

# Check if PostgreSQL client is installed
if ! command -v pg_dump &> /dev/null; then
    echo "⚠️  PostgreSQL client tools (pg_dump) not found"
    echo ""
    echo "   Please install PostgreSQL client:"
    echo "   - macOS: brew install postgresql"
    echo "   - Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "   - Windows: Download from https://www.postgresql.org/download/"
    echo ""
else
    echo "✅ PostgreSQL client version: $(pg_dump --version | head -n 1)"
fi

# Install npm dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your Supabase credentials"
else
    echo "✅ .env file already exists"
fi

# Create backups directory
mkdir -p backups
echo "✅ Created backups directory"

echo ""
echo "==================================================="
echo "✅ Setup complete!"
echo "==================================================="
echo ""
echo "Next steps:"
echo "1. Edit .env with your Supabase credentials"
echo "2. Run 'npm run backup' to create your first backup"
echo "3. Check README.md for full documentation"
echo ""
