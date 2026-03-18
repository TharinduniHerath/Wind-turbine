# Real-Time Optimization and Maintenance of Wind Turbine Performance (Digital Twin)

## Introduction
This project presents a Digital Twin–based system for real-time optimization and maintenance of wind turbine performance. It integrates IoT sensor data, machine learning models, and real-time visualization to enhance efficiency, reduce downtime, and support data-driven decision-making.

The system combines weather risk forecasting, power optimization, noise analysis, and predictive maintenance into a unified platform.


## System Overview
The system follows a modular microservices-like architecture:

- IoT sensors collect real-time turbine and environmental data  
- IoT Gateway publishes data via MQTT  
- Backend processes real-time data and runs machine learning models  
- PostgreSQL database stores processed and historical data  
- Frontend dashboard visualizes insights in real-time  
- Digital Twin provides 3D simulation of turbine behavior  


## Technologies Used
- **Frontend:** TypeScript, Three.js  
- **Backend:** Python (Flask)  
- **Database:** PostgreSQL  
- **Messaging:** MQTT, IoT Gateway  
- **Machine Learning:** XGBoost, Random Forest, Gradient Boosting, LSTM  
- **3D Modeling:** Blender 


## Clone the Repository
```bash
git clone https://github.com/TharinduniHerath/Wind-turbine.git
cd Wind-turbine
```


## Running the Project (Frontend)

```bash
npm install
npm run dev
```


## Running the Project (Backend)

```bash
cd backend
python main.py
```

## Research Paper
Real-Time Optimization and Maintenance of Wind Turbine Performance Using Digital Twin Technology https://ieeexplore.ieee.org/document/11361537
