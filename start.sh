#!/bin/bash
# SPDX-License-Identifier: AGPL-3.0-or-later
# This file is part of MLX DeepSeek-OCR.
# Copyright (C) 2025 MLX DeepSeek-OCR contributors
# Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).
# See the LICENSE file in the project root for full license text:
# https://www.gnu.org/licenses/agpl-3.0.en.html

echo "Starting MLX DeepSeek-OCR application..."
echo ""
cd "$(dirname "$0")"

# Check uv
if ! command -v uv &> /dev/null; then
    echo "⚠️ uv is not installed!"
    echo "Install: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

echo "uv: $(uv --version)"
echo ""

# Create/use venv with Python 3.14
if [ -d ".venv" ]; then
    echo "Found .venv, using existing environment..."
else
    echo "Creating .venv with Python 3.14..."
    uv venv --python 3.14
fi

# Check dependencies
echo "Checking dependencies..."
MISSING=false
uv run python -c "import flask" 2>/dev/null || MISSING=true
uv run python -c "import mlx_vlm" 2>/dev/null || MISSING=true
uv run python -c "from PIL import Image" 2>/dev/null || MISSING=true
uv run python -c "import fitz" 2>/dev/null || MISSING=true

if [ "$MISSING" = true ]; then
    echo "Installing dependencies..."
    uv pip install -r requirements.txt
fi

# Find available port
PORT=8080
MAX_PORT=8090
echo "Finding available port..."
while [ $PORT -le $MAX_PORT ]; do
    if ! lsof -i:$PORT >/dev/null 2>&1; then
        echo "Using port: $PORT"
        break
    fi
    echo "Port $PORT occupied, trying next..."
    ((PORT++))
done

if [ $PORT -gt $MAX_PORT ]; then
    echo "Error: No available port"
    exit 1
fi

echo ""
echo "Starting Flask at http://localhost:$PORT"
echo "Press Ctrl+C to stop"
echo ""

# Run with uv
PORT=$PORT uv run python app.py
