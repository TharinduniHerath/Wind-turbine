# Wind Turbine Predictive Maintenance System - Project Structure

## 📁 **Root Directory**
```
Wind-turbine/
├── 📁 Data/                          # ML Models & Datasets
├── 📁 backend/                       # FastAPI Backend
├── 📁 src/                          # React Frontend
├── 📄 package.json                  # Frontend Dependencies
├── 📄 vite.config.ts               # Vite Configuration
└── 📄 index.html                   # Main HTML Entry
```

---

## 🧠 **Data/ - Machine Learning & Analytics**
```
Data/
├── 📁 Analysis/                     # Data Analysis Reports
│   ├── 📄 Wind_Turbine_Data_Analysis_Report.md
│   ├── 📄 analysis_report.md
│   ├── 📄 preprocessed_data_analysis.md
│   ├── 📄 preprocessing_summary_report.md
│   ├── 📄 data_analysis.py
│   └── 📄 detailed_analysis.py
│
├── 📁 models/                       # Trained ML Models
│   ├── 📄 random_forest_model.pkl   # Main Prediction Model
│   ├── 📄 lstm_model.h5            # LSTM Neural Network
│   ├── 📄 scaler.pkl               # Feature Scaler
│   ├── 📄 feature_importance.png   # Model Insights
│   ├── 📄 roc_curves.png          # Model Performance
│   ├── 📄 confusion_matrices.png   # Model Accuracy
│   └── 📄 failure_prediction_report.md
│
├── 📁 preprocessed_data/            # Processed Datasets
│   ├── 📄 processed_data_v1.csv    # Complete Dataset (331.7 MB)
│   ├── 📄 processed_data_v1.parquet # Compressed Dataset (45.2 MB)
│   ├── 📄 feature_names.json       # Feature Names Reference
│   ├── 📄 preprocessing_config.json # Pipeline Configuration
│   ├── 📄 X_train_failure_prediction.csv
│   ├── 📄 X_test_failure_prediction.csv
│   ├── 📄 y_train_failure_prediction.csv
│   ├── 📄 y_test_failure_prediction.csv
│   ├── 📄 X_train_performance_prediction.csv
│   ├── 📄 X_test_performance_prediction.csv
│   ├── 📄 y_train_performance_prediction.csv
│   ├── 📄 y_test_performance_prediction.csv
│   ├── 📄 X_train_rul_prediction.csv
│   ├── 📄 X_test_rul_prediction.csv
│   ├── 📄 y_train_rul_prediction.csv
│   └── 📄 y_test_rul_prediction.csv
│
├── 📄 simplified_failure_prediction.py    # ML Training Script
├── 📄 unrivaled_failure_prediction.py     # Advanced ML Script
├── 📄 Power-curve baseline.xlsx           # Raw Data Files
├── 📄 D1.xlsx                            # Grid Production Power
├── 📄 D2.xlsx                            # Additional Power Data
├── 📄 D3 Temperature.xlsx                 # Temperature Sensors
├── 📄 D4 Wind Speed and Voltage.xlsx      # Wind & Electrical Data
├── 📄 D5 Wind Speed.xlsx                  # Wind Speed Data
├── 📄 D6 Pitch Sensors and Yaw sensors.xlsx
├── 📄 Ambient temperature and humidity.xlsx
├── 📄 Blade-pitch angle.xlsx
├── 📄 Gear-oil pressure.xlsx
├── 📄 Generator Phase-2 and Phase-3 temperatures.xlsx
├── 📄 nacelle vs. wind direction.xlsx
└── 📄 Rotor RPM.xlsx
```

---

## ⚙️ **backend/ - FastAPI ML Service**
```
backend/
├── 📄 main.py                       # Main FastAPI Application
├── 📄 test_server.py                # Server Startup Script
├── 📄 requirements.txt              # Python Dependencies
│
├── 🔧 **API Endpoints:**
│   ├── GET /                        # Health Check
│   ├── GET /api/predict             # Component Predictions
│   ├── POST /predict/failure        # Failure Prediction
│   ├── GET /health/components       # Component Health
│   └── GET /analytics/summary       # Analytics Summary
│
├── 🧠 **ML Functions:**
│   ├── load_models()                # Load Trained Models
│   ├── prepare_features()           # Feature Engineering
│   ├── predict_failure()            # ML Prediction
│   ├── calculate_component_health() # Health Scoring
│   ├── estimate_rul()              # Remaining Useful Life
│   └── generate_component_predictions() # Component Predictions
│
└── 📊 **Data Models:**
    ├── TurbineData                  # Sensor Data Structure
    ├── PredictionResponse           # ML Prediction Response
    └── HealthScore                  # Component Health Data
```

---

## 🎨 **src/ - React Frontend**
```
src/
├── 📄 main.tsx                     # React Entry Point
├── 📄 App.tsx                      # Main Application Component
├── 📄 index.css                    # Global Styles
├── 📄 vite-env.d.ts               # Vite Type Definitions
│
├── 📁 types/                       # TypeScript Definitions
│   └── 📄 index.ts                 # Interface Definitions
│
├── 📁 store/                       # State Management
│   └── 📄 turbineStore.ts          # Zustand Store
│
├── 📁 data/                        # Mock Data
│   └── 📄 mockData.ts              # Simulated Sensor Data
│
├── 📁 components/                   # React Components
│   ├── 📁 Charts/                  # Data Visualization
│   │   └── 📄 TimeSeriesChart.tsx  # Time Series Charts
│   │
│   ├── 📁 Common/                  # Reusable Components
│   │   ├── 📄 AlertPanel.tsx       # Alert Display
│   │   ├── 📄 KPICard.tsx          # KPI Cards
│   │   └── 📄 PredictiveAlert.tsx  # ML Prediction Alerts
│   │
│   ├── 📁 Layout/                  # UI Layout Components
│   │   ├── 📄 Header.tsx           # Application Header
│   │   └── 📄 Sidebar.tsx          # Navigation Sidebar
│   │
│   ├── 📁 Modules/                 # Main Application Modules
│   │   ├── 📄 Overview.tsx         # Dashboard Overview
│   │   ├── 📄 Maintenance.tsx      # Predictive Maintenance
│   │   ├── 📄 NoiseMonitoring.tsx  # Noise Analysis
│   │   ├── 📄 PowerOptimization.tsx # Power Optimization
│   │   └── 📄 WeatherImpact.tsx    # Weather Impact Analysis
│   │
│   ├── 📁 Simulation/              # 3D Visualization
│   │   └── 📄 TurbineSimulation.tsx # 3D Turbine Animation
│   │
│   └── 📄 Sidebar.tsx              # Navigation Component
│
└── 📁 vite-env.d.ts               # Vite Environment Types
```

---

## 🔧 **Configuration Files**
```
├── 📄 package.json                 # Frontend Dependencies
├── 📄 package-lock.json            # Dependency Lock File
├── 📄 vite.config.ts               # Vite Build Configuration
├── 📄 tsconfig.json                # TypeScript Configuration
├── 📄 tsconfig.app.json            # App TypeScript Config
├── 📄 tsconfig.node.json           # Node TypeScript Config
├── 📄 tailwind.config.js           # Tailwind CSS Configuration
├── 📄 postcss.config.js            # PostCSS Configuration
├── 📄 eslint.config.js             # ESLint Configuration
└── 📄 .gitignore                   # Git Ignore Rules
```

---

## 🚀 **Application Architecture**

### **Frontend (React + TypeScript)**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React

### **Backend (FastAPI + Python)**
- **Framework**: FastAPI
- **Server**: Uvicorn
- **ML Libraries**: scikit-learn, TensorFlow
- **Data Processing**: Pandas, NumPy
- **Model Storage**: joblib, pickle

### **Data Flow**
```
Real-time Sensors → Mock Data → ML Model → API → Frontend → UI Display
```

### **Key Features**
- ✅ **Real-time Predictions**: Every 3 seconds
- ✅ **Component Health Monitoring**: 6 turbine components
- ✅ **Predictive Alerts**: Color-coded status alerts
- ✅ **3D Visualization**: Interactive turbine simulation
- ✅ **Responsive Design**: Mobile-friendly interface
- ✅ **Error Handling**: Graceful fallback predictions

---

## 📊 **ML Model Performance**
- **Random Forest**: AUC 0.8166, Accuracy 0.8562
- **Dataset**: 52,705 samples, 331 features
- **Failure Rate**: 19.1% in training data
- **Components**: 6 turbine components monitored
- **Refresh Rate**: 3-second intervals

---

## 🔄 **Deployment Structure**
```
Production/
├── 📁 frontend/                    # React Build
├── 📁 backend/                     # FastAPI Service
├── 📁 ml-models/                   # Trained Models
├── 📁 data/                        # Real-time Data
└── 📄 docker-compose.yml           # Container Orchestration
```

This structure provides a complete predictive maintenance system with real-time ML predictions, dynamic UI updates, and comprehensive data analysis capabilities. 