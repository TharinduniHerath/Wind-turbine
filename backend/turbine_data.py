import random
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List

def get_turbine_health_scores(turbine_id: str) -> Dict[str, Dict[str, Any]]:
    """Get health scores for a specific turbine"""
    try:
        # Generate mock health scores for different components
        components = {
            "Main Bearing": {
                "base_score": 95,
                "factors": ["vibration", "temperature", "rpm"]
            },
            "Gearbox": {
                "base_score": 85,
                "factors": ["oil_temp", "oil_pressure", "vibration"]
            },
            "Generator": {
                "base_score": 90,
                "factors": ["temperature", "voltage", "current"]
            },
            "Power Electronics": {
                "base_score": 88,
                "factors": ["voltage", "current", "temperature"]
            },
            "Blade System": {
                "base_score": 87,
                "factors": ["pitch", "wind_speed", "vibration"]
            },
            "Control System": {
                "base_score": 95,
                "factors": ["yaw_angle", "nacelle_temp", "voltage"]
            }
        }
        
        health_scores = {}
        
        for component, config in components.items():
            # Generate realistic health scores with some randomness
            base_score = config["base_score"]
            # Add some variation based on turbine ID and component
            variation = random.uniform(-10, 5)
            final_score = max(0, min(100, base_score + variation))
            
            # Determine trend
            trends = ["stable", "improving", "declining"]
            trend = random.choice(trends)
            
            health_scores[component] = {
                "score": int(final_score),
                "trend": trend
            }
        
        return health_scores
        
    except Exception as e:
        print(f"Error generating health scores for {turbine_id}: {e}")
        # Return fallback scores
        return {
            "Main Bearing": {"score": 95, "trend": "stable"},
            "Gearbox": {"score": 78, "trend": "declining"},
            "Generator": {"score": 92, "trend": "improving"},
            "Power Electronics": {"score": 88, "trend": "stable"},
            "Blade System": {"score": 85, "trend": "declining"},
            "Control System": {"score": 98, "trend": "stable"}
        }

def get_turbine_predictions(turbine_id: str) -> Dict[str, Dict[str, str]]:
    """Get predictions for a specific turbine"""
    try:
        # Generate mock predictions for different components
        component_messages = {
            "Gearbox": {
                "Critical": "Oil pressure dropping rapidly. Immediate inspection needed.",
                "Warning": "Oil temperature trending higher than normal. Schedule inspection soon.",
                "Normal": "Gearbox operating within normal parameters."
            },
            "Bearings": {
                "Critical": "Vibration intensity exceeding safety limits. Immediate shutdown required.",
                "Warning": "Abnormal vibration pattern detected. Schedule service soon.",
                "Normal": "Bearing vibration levels are stable and within range."
            },
            "Generator": {
                "Critical": "Voltage fluctuations outside operational safety margin.",
                "Warning": "Generator temperature approaching upper limits.",
                "Normal": "Generator operating efficiently with stable output."
            },
            "Rotors": {
                "Critical": "Rotor imbalance detected. Performance severely affected.",
                "Warning": "Rotor imbalance detected. Performance affected.",
                "Normal": "Rotor balance is optimal for current conditions."
            },
            "Blades": {
                "Critical": "Blade damage detected. Immediate inspection required.",
                "Warning": "Blade efficiency slightly reduced. Monitor closely.",
                "Normal": "Blade aerodynamics are stable and efficient."
            },
            "Temperature Sensors": {
                "Critical": "Multiple temperature sensors showing abnormal readings.",
                "Warning": "Some temperature sensors approaching limits.",
                "Normal": "Temperature sensors operating within calibration range."
            }
        }
        
        predictions = {}
        
        for component, messages in component_messages.items():
            # Generate status based on turbine ID and component
            statuses = ["Critical", "Warning", "Normal"]
            weights = [0.1, 0.2, 0.7]  # 70% normal, 20% warning, 10% critical
            status = random.choices(statuses, weights=weights)[0]
            
            confidence = random.randint(75, 95)
            data_periods = ["30 days of logs", "6 weeks of data", "2 months of telemetry", 
                          "3 months of sensor data", "60 days of telemetry", "90 days of data"]
            
            predictions[component] = {
                "status": status,
                "message": messages[status],
                "confidence": f"{confidence}%",
                "based_on": random.choice(data_periods)
            }
        
        return predictions
        
    except Exception as e:
        print(f"Error generating predictions for {turbine_id}: {e}")
        # Return fallback predictions
        return {
            "Gearbox": {
                "status": "Normal",
                "message": "Gearbox operating within normal parameters.",
                "confidence": "85%",
                "based_on": "30 days of logs"
            },
            "Bearings": {
                "status": "Normal",
                "message": "Bearing vibration levels are stable and within range.",
                "confidence": "88%",
                "based_on": "6 weeks of data"
            },
            "Generator": {
                "status": "Normal",
                "message": "Generator operating efficiently with stable output.",
                "confidence": "92%",
                "based_on": "2 months of telemetry"
            },
            "Rotors": {
                "status": "Normal",
                "message": "Rotor balance is optimal for current conditions.",
                "confidence": "87%",
                "based_on": "3 months of sensor data"
            },
            "Blades": {
                "status": "Normal",
                "message": "Blade aerodynamics are stable and efficient.",
                "confidence": "90%",
                "based_on": "60 days of telemetry"
            },
            "Temperature Sensors": {
                "status": "Normal",
                "message": "Temperature sensors operating within calibration range.",
                "confidence": "89%",
                "based_on": "90 days of data"
            }
        }

def generate_dynamic_sensor_data(turbine_id: str) -> Dict[str, Any]:
    """Generate dynamic sensor data for a specific turbine"""
    try:
        # Generate realistic sensor data based on turbine ID
        base_values = {
            'wind_speed': random.uniform(5, 25),
            'power_output': random.uniform(1000, 3000),
            'rotor_rpm': random.uniform(10, 30),
            'nacelle_temp': random.uniform(50, 90),
            'gear_oil_temp': random.uniform(60, 100),
            'generator_temp': random.uniform(70, 110),
            'blade_pitch': random.uniform(-5, 90),
            'yaw_angle': random.uniform(0, 360),
            'voltage_l1': random.uniform(350, 400),
            'voltage_l2': random.uniform(350, 400),
            'voltage_l3': random.uniform(350, 400),
            'current_l1': random.uniform(100, 200),
            'current_l2': random.uniform(100, 200),
            'current_l3': random.uniform(100, 200),
            'gear_oil_pressure': random.uniform(1.5, 3.0),
            'ambient_temp': random.uniform(10, 35),
            'humidity': random.uniform(30, 80),
            'wind_direction': random.uniform(0, 360),
        }
        
        # Add some variation based on turbine ID
        turbine_number = int(turbine_id.split('-')[1]) if '-' in turbine_id else 1
        variation_factor = 1 + (turbine_number - 1) * 0.1
        
        sensor_data = {}
        for key, value in base_values.items():
            # Add some realistic variation
            variation = random.uniform(-0.1, 0.1) * variation_factor
            sensor_data[key] = round(value * (1 + variation), 2)
        
        # Add timestamp
        sensor_data['timestamp'] = datetime.now().isoformat()
        sensor_data['turbine_id'] = turbine_id
        
        return sensor_data
        
    except Exception as e:
        print(f"Error generating sensor data for {turbine_id}: {e}")
        # Return fallback sensor data
        return {
            'wind_speed': 15.0,
            'power_output': 2000.0,
            'rotor_rpm': 20.0,
            'nacelle_temp': 70.0,
            'gear_oil_temp': 80.0,
            'generator_temp': 85.0,
            'blade_pitch': 45.0,
            'yaw_angle': 180.0,
            'voltage_l1': 380.0,
            'voltage_l2': 380.0,
            'voltage_l3': 380.0,
            'current_l1': 150.0,
            'current_l2': 150.0,
            'current_l3': 150.0,
            'gear_oil_pressure': 2.5,
            'ambient_temp': 25.0,
            'humidity': 60.0,
            'wind_direction': 180.0,
            'timestamp': datetime.now().isoformat(),
            'turbine_id': turbine_id
        }
