#!/usr/bin/env python
"""
Wrapper script to properly initialize Python path and start FastAPI backend
"""
import sys
import os

# Add the backend directory to Python path so imports work
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

# Now we can import and run uvicorn
if __name__ == "__main__":
    import uvicorn
    
    # Use import string for reload to work
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )
