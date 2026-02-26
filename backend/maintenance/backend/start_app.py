#!/usr/bin/env python3
"""
Startup script for the Wind Turbine ML API
Handles model loading gracefully and starts the application
"""

import os
import sys
import uvicorn
from pathlib import Path

def main():
    """Start the application with proper error handling"""
    print("🚀 Starting Wind Turbine ML API...")
    
    try:
        # Import the app
        from main import app
        
        print("✅ Application imported successfully")
        print("🔧 Starting server...")
        
        # Start the server
        uvicorn.run(
            app, 
            host="0.0.0.0", 
            port=8000,
            log_level="info",
            reload=False  # Set to True for development
        )
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("💡 Make sure all dependencies are installed:")
        print("   pip3 install -r requirements.txt")
        return 1
        
    except Exception as e:
        print(f"❌ Startup error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)

