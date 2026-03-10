#!/bin/bash
# SPDX-License-Identifier: AGPL-3.0-or-later
# This file is part of MLX DeepSeek-OCR.
# Copyright (C) 2025 MLX DeepSeek-OCR contributors
# Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).
# See the LICENSE file in the project root for full license text:
# https://www.gnu.org/licenses/agpl-3.0.en.html

# MLX DeepSeek-OCR Ultimate Startup Script (Force kill zombies + Direct port passing + No conflicts)

echo "Starting MLX DeepSeek-OCR application..."
echo ""

cd "$(dirname "$0")"

echo "Checking Python version..."
python3 --version

# 檢查 uv 是否安裝
if ! command -v uv &> /dev/null; then
    echo ""
    echo "⚠️  uv is not installed!"
    echo ""
    echo "Please install uv first:"
    echo "  curl -LsSf https://astral.sh/uv/install.sh | sh"
    echo ""
    echo "Or use Homebrew:"
    echo "  brew install uv"
    echo ""
    exit 1
fi

echo "uv 版本: $(uv --version)"
echo ""

# Virtual environment
if [ -d ".venv" ]; then
    echo "Found virtual environment, activating..."
    source .venv/bin/activate
else
    echo "Creating virtual environment (using uv)..."
    uv venv
    source .venv/bin/activate
fi

# Check dependencies
echo ""
echo "Checking dependencies..."
MISSING=false
python3 -c "import flask" 2>/dev/null || MISSING=true
python3 -c "import mlx_vlm" 2>/dev/null || MISSING=true
python3 -c "from PIL import Image" 2>/dev/null || MISSING=true
python3 -c "import fitz" 2>/dev/null || MISSING=true  # Required for PDF parsing

if [ "$MISSING" = true ]; then
    echo "Missing dependencies, installing (using uv)..."
    uv pip install -r requirements.txt
    [ $? -eq 0 ] && echo "Dependencies installed successfully" || { echo "Installation failed"; exit 1; }
else
    echo "Dependencies already installed"
fi

# Auto-find available port + Force kill zombie processes
PORT=8080
MAX_PORT=8090
echo ""
echo "Finding available port and cleaning up zombie processes..."

while [ $PORT -le $MAX_PORT ]; do
    if lsof -i:$PORT >/dev/null 2>&1; then
        echo "Port $PORT is occupied, attempting to kill process..."
        lsof -i:$PORT | grep python | awk '{print $2}' | xargs kill -9 2>/dev/null || true
        if lsof -i:$PORT >/dev/null 2>&1; then
            echo "Cannot free port $PORT, trying next..."
            ((PORT++))
        else
            echo "Successfully freed and using port: $PORT"
            break
        fi
    else
        echo "Found available port: $PORT"
        break
    fi
done

if [ $PORT -gt $MAX_PORT ]; then
    echo "Error: Cannot find available port (8080-8090)"
    exit 1
fi

echo ""
echo "Force starting Flask application (direct port passing, ignoring app.py hardcoded port)"
echo "Access at: http://localhost:$PORT"
echo "Press Ctrl+C to stop safely"
echo ""

# Force listen on all interfaces + Disable reload (avoid dual processes)
PORT=$PORT python3 app.py
