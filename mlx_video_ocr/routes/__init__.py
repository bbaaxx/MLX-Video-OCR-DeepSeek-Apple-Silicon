"""Route blueprints for Flask application"""

from .ocr import ocr_bp
from .pdf import pdf_bp
from .preprocessing import preprocessing_bp
from .video import video_bp

__all__ = ["ocr_bp", "pdf_bp", "preprocessing_bp", "video_bp"]
