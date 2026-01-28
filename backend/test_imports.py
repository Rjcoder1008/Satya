import sys
import os

print("Testing imports...")
try:
    from models.image_detector import ImageDetector
    print("ImageDetector imported successfully.")
    from models.video_detector import VideoDetector
    print("VideoDetector imported successfully.")
    from api.routes import router
    print("Routes imported successfully.")
except Exception as e:
    print(f"IMPORT ERROR: {e}")
    import traceback
    traceback.print_exc()
except SyntaxError as e:
    print(f"SYNTAX ERROR: {e}")
except ImportError as e:
    print(f"IMPORT ERROR: {e}")

print("Import test complete.")
