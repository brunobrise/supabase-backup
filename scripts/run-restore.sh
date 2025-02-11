#!/bin/bash
# Wrapper script to ensure correct PostgreSQL version is used

# Add PostgreSQL 15 to PATH
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"

# Get the script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Run the restore script
cd "$PROJECT_ROOT" && node src/restore.js "$@"
