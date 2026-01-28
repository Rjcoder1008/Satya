import sys
import os

# Add the project root and backend directory to sys.path
# This ensures that imports relative to the project root work correctly on Vercel
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)
sys.path.append(os.path.join(project_root, "backend"))

try:
    from backend.main import app
except ImportError as e:
    print(f"ImportError in api/index.py: {e}")
    # Fallback to direct import if necessary
    try:
        from main import app
    except ImportError:
        raise e

# This is required for Vercel's Python runtime
handler = app
