# Wind Turbine ML API

A FastAPI-based application for wind turbine failure prediction and maintenance analytics using machine learning models.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install Python dependencies
pip3 install -r requirements.txt

# Or if you prefer pip
pip install -r requirements.txt
```

### 2. Run the Application

```bash
# Option 1: Use the startup script (recommended)
python3 start_app.py

# Option 2: Run directly
python3 main.py

# Option 3: Use uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 3. Access the API

- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/
- **Alternative Docs**: http://localhost:8000/redoc

## 📁 Project Structure

```
backend/
├── main.py                 # FastAPI application with API endpoints
├── maintenance.py          # Business logic and ML functions
├── start_app.py           # Startup script with error handling
├── requirements.txt       # Python dependencies
├── test_startup.py       # Test script to verify setup
├── turbine_data.py       # Turbine data utilities
├── lstm_predictor.py     # LSTM model for maintenance prediction
├── ml_health_predictor.py # ML-based health scoring
├── predictive_analytics_predictor.py # Predictive analytics
└── README.md             # This file
```

## 🔧 API Endpoints

### Core Endpoints
- `GET /` - Health check and API status
- `POST /predict/failure` - Predict turbine failure probability
- `GET /api/predict` - Get component-specific predictions
- `GET /health/components` - Get component health status
- `GET /analytics/summary` - Get maintenance analytics summary

### Advanced Endpoints
- `GET /api/health-scores` - Get ML-based health scores
- `GET /api/maintenance-schedule` - Get LSTM-based maintenance schedule
- `GET /api/system-status` - Get overall system status
- `POST /send-maintenance-email` - Send maintenance emails
- `GET /email-history` - Get email history
- `DELETE /email-history` - Clear email history

## 🧪 Testing

### Run Startup Tests
```bash
python3 test_startup.py
```

This will verify:
- ✅ All imports work correctly
- ✅ Model loading (with graceful fallbacks)
- ✅ Basic functions operate properly

### Test API Endpoints
```bash
# Test health endpoint
curl http://localhost:8000/

# Test prediction endpoint
curl http://localhost:8000/api/predict
```

## ⚠️ Important Notes

### Model Loading
- The application will try to load pre-trained ML models from `../BD/models/`
- If models can't be loaded, it will use fallback predictions
- This ensures the API works even without the full model set

### Dependencies
- **Python 3.8+** required
- **TensorFlow 2.13.0** for compatibility with existing models
- **NumPy 1.24.3** for compatibility

### Fallback Mode
When models can't be loaded, the application provides:
- Mock predictions based on realistic turbine data
- Component health scores using heuristic algorithms
- Maintenance schedules with simulated LSTM predictions
- Full API functionality with fallback data

## 🐛 Troubleshooting

### Common Issues

1. **Import Errors**
   ```bash
   pip3 install -r requirements.txt
   ```

2. **Model Loading Warnings**
   - These are normal if models don't exist
   - Application will work in fallback mode

3. **Port Already in Use**
   ```bash
   # Change port in start_app.py or use different port
   uvicorn main:app --host 0.0.0.0 --port 8001
   ```

4. **Permission Issues**
   ```bash
   # Make startup script executable
   chmod +x start_app.py
   ```

### Debug Mode
```bash
# Enable debug logging
uvicorn main:app --host 0.0.0.0 --port 8000 --log-level debug
```

## 🔒 Security Notes

- The API runs on `0.0.0.0:8000` by default
- For production, consider:
  - Using environment variables for sensitive data
  - Implementing authentication
  - Running behind a reverse proxy
  - Using HTTPS

## 📊 Performance

- **Startup Time**: ~2-5 seconds (depending on model loading)
- **API Response Time**: <100ms for most endpoints
- **Memory Usage**: ~200-500MB (varies with models)
- **Concurrent Requests**: Handles multiple requests efficiently

## 🚀 Production Deployment

### Using Gunicorn
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Using Docker
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "start_app.py"]
```

## 📞 Support

If you encounter issues:
1. Check the startup test: `python3 test_startup.py`
2. Review the logs for specific error messages
3. Verify all dependencies are installed
4. Check file permissions and paths

---

**Status**: ✅ Ready to run with graceful fallbacks
**Last Updated**: December 2024
**Version**: 1.0.0

