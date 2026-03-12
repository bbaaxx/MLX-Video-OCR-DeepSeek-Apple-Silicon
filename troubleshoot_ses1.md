# PDF OCR Troubleshooting Session Summary

**Date**: 2026-03-09

## Problem
PDF batch processing failed with error: `Model not ready. Please check server status.`

## Root Cause Analysis

1. **Model status object isolation**: Python module imports created separate `model_loaded_status` objects instead of sharing one `multiprocessing.Value`. When `routes_pdf.py` imported via `from app import model_loaded_status`, it received a different object than what `app.py` created, resulting in `value=0` (False) even though the health endpoint showed `value=1` (True).

2. **Debug evidence**: 
   - Startup: `model_loaded_status.value = 1, id = 4448962576`
   - Batch endpoint: `model_loaded_status.value = 0, id = 4773460944`
   - Object IDs differed, confirming separate instances

3. **Secondary issues discovered**:
   - OCR timeout too short (160s) for model loading in subprocess
   - Missing dependencies: `addict`, `matplotlib`, `torch`, `torchvision`, `einops`

## Solution Implemented

### 1. Created shared state module (`shared_state.py`)
```python
import multiprocessing
import tempfile

UPLOAD_FOLDER = tempfile.gettempdir()
model_loaded_status = multiprocessing.Value("b", False)
pdf_tasks = {}
preprocess_tasks = {}
video_tasks = {}
```

All modules now import from `shared_state` instead of `from app import` to ensure single shared instance.

### 2. Updated imports in route files
- `routes_pdf.py`: Removed 5 `from app import` statements
- `routes_ocr.py`: Removed 1 `from app import` statement  
- `routes_video.py`: Removed 3 `from app import` statements
- `routes_preprocessing.py`: Removed 4 `from app import` statements

- All now use `from shared_state import model_loaded_status, pdf_tasks, preprocess_tasks, video_tasks, UPLOAD_FOLDER`

### 3. Fixed app.py imports
- Removed local definitions of shared state variables
- Added import from `shared_state`
- Restored missing `multiprocessing` import

### 4. Increased OCR timeout
Changed from 160s to 300s in:
- `routes_pdf.py` (2 occurrences)
- `routes_ocr.py` (1 occurrence)

### 5. Installed missing dependencies
```bash
uv pip install addict matplotlib torch torchvision einops
```

## Files Modified
- `app.py` - Updated imports, restored multiprocessing import
- `shared_state.py` - **NEW** centralized shared state
- `routes_pdf.py` - Updated imports, removed inline imports
- `routes_ocr.py` - Updated imports
- `routes_video.py` - Updated imports
- `routes_preprocessing.py` - Updated imports
- `api_utils.py` - Removed debug logging

- `requirements.txt` - Consider adding: `addict`, `matplotlib`, `torch`, `torchvision`, `einops`

## Testing
After all fixes, the PDF batch OCR processing should work correctly. The model loads in subprocess with sufficient timeout (300s) and all dependencies available.
