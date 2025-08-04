#!/usr/bin/env python3

import uvicorn
from main import app

if __name__ == "__main__":
    print("🚀 Starting Wind Turbine ML API...")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info") 