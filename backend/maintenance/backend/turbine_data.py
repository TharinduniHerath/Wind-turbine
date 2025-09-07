import random
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List
import os
import sys

# Import ML predictors
try:
    from ml_health_predictor import get_ml_health_scores
    ML_HEALTH_AVAILABLE = True
    print("✅ ML Health Predictor loaded successfully")
except ImportError as e:
    ML_HEALTH_AVAILABLE = False
    print(f"⚠️ ML Health Predictor not available: {e}")

try:
    from lstm_predictor import get_lstm_maintenance_schedule
    LSTM_AVAILABLE = True
    print("✅ LSTM Predictor loaded successfully")
except ImportError as e:
    LSTM_AVAILABLE = False
    print(f"⚠️ LSTM Predictor not available: {e}")

try:
    from predictive_analytics_predictor import get_ml_predictive_analytics
    PREDICTIVE_ANALYTICS_AVAILABLE = True
    print("✅ Predictive Analytics loaded successfully")
except ImportError as e:
    PREDICTIVE_ANALYTICS_AVAILABLE = False
    print(f"⚠️ Predictive Analytics not available: {e}")

def get_turbine_health_scores(turbine_id: str) -> Dict[str, Dict[str, Any]]:
    """Get health scores for a specific turbine using ML models when available"""
    try:
        print(f"🤖 Getting ML-based health scores for {turbine_id}")
        
        # Try to use ML health predictor first
        if ML_HEALTH_AVAILABLE:
            try:
                ml_health_scores = get_ml_health_scores(turbine_id)
                print(f"✅ ML health scores generated for {turbine_id}")
                
                # Convert ML format to expected format if needed
                formatted_scores = {}
                for component, data in ml_health_scores.items():
                    if isinstance(data, dict) and 'score' in data and 'trend' in data:
                        formatted_scores[component] = {
                            "score": int(data['score']),
                            "trend": data['trend']
                        }
                    else:
                        # Handle different ML output formats
                        formatted_scores[component] = {
                            "score": int(data) if isinstance(data, (int, float)) else 85,
                            "trend": "stable"
                        }
                
                return formatted_scores
                
            except Exception as ml_error:
                print(f"⚠️ ML health prediction failed: {ml_error}, falling back to heuristic")
        
        # Fallback to enhanced heuristic method
        print(f"📊 Using enhanced heuristic health scores for {turbine_id}")
        
        # Check if this is Turbine-1 for happy path data
        is_turbine_1 = turbine_id == "Turbine-1"
        
        # Generate enhanced mock health scores with more realistic variations
        components = {
            "Main Bearing": {
                "base_score": 95 if is_turbine_1 else 85,
                "factors": ["vibration", "temperature", "rpm"]
            },
            "Gearbox": {
                "base_score": 92 if is_turbine_1 else 78,
                "factors": ["oil_temp", "oil_pressure", "vibration"]
            },
            "Generator": {
                "base_score": 96 if is_turbine_1 else 88,
                "factors": ["temperature", "voltage", "current"]
            },
            "Power Electronics": {
                "base_score": 94 if is_turbine_1 else 85,
                "factors": ["voltage", "current", "temperature"]
            },
            "Blade System": {
                "base_score": 93 if is_turbine_1 else 82,
                "factors": ["pitch", "wind_speed", "vibration"]
            },
            "Control System": {
                "base_score": 98 if is_turbine_1 else 90,
                "factors": ["yaw_angle", "nacelle_temp", "voltage"]
            }
        }
        
        health_scores = {}
        
        for component, config in components.items():
            base_score = config["base_score"]
            
            if is_turbine_1:
                # Turbine-1: Only positive variations and improving trends
                variation = random.uniform(0, 5)  # Only positive variation
                final_score = max(90, min(100, base_score + variation))  # Keep scores high
                trend = random.choice(["stable", "improving"])  # Only positive trends
            else:
                # Other turbines: Normal variation with more realistic degradation
                variation = random.uniform(-10, 5)
                final_score = max(0, min(100, base_score + variation))
                
                # More realistic trend distribution
                if final_score < 70:
                    trend = random.choice(["declining", "declining", "stable"])  # More likely declining
                elif final_score > 90:
                    trend = random.choice(["stable", "improving"])
                else:
                    trend = random.choice(["stable", "improving", "declining"])
            
            health_scores[component] = {
                "score": int(final_score),
                "trend": trend
            }
        
        return health_scores
        
    except Exception as e:
        print(f"❌ Error generating health scores for {turbine_id}: {e}")
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
    """Get predictions for a specific turbine using ML models when available"""
    try:
        print(f"🔮 Getting ML-based predictions for {turbine_id}")
        
        # Try to use Predictive Analytics ML model first
        if PREDICTIVE_ANALYTICS_AVAILABLE:
            try:
                ml_predictions = get_ml_predictive_analytics(turbine_id)
                print(f"✅ ML predictions generated for {turbine_id}")
                
                # If ML predictions are in expected format, return them
                if isinstance(ml_predictions, dict) and len(ml_predictions) > 0:
                    # Validate that predictions have required fields
                    first_key = next(iter(ml_predictions))
                    if isinstance(ml_predictions[first_key], dict) and 'status' in ml_predictions[first_key]:
                        return ml_predictions
                
            except Exception as ml_error:
                print(f"⚠️ ML predictions failed: {ml_error}, falling back to heuristic")
        
        # Fallback to enhanced heuristic method
        print(f"📊 Using enhanced heuristic predictions for {turbine_id}")
        
        # Get health scores to inform predictions
        health_scores = get_turbine_health_scores(turbine_id)
        
        # Generate enhanced predictions based on health scores
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
        
        # Check if this is Turbine-1 for happy path data
        is_turbine_1 = turbine_id == "Turbine-1"
        
        for component, messages in component_messages.items():
            if is_turbine_1:
                # Turbine-1: Only Normal status (100% positive)
                status = "Normal"
                confidence = random.randint(92, 98)  # High confidence for Turbine-1
            else:
                # Other turbines: Use health scores to determine status
                # Map component names to health score components
                health_component_map = {
                    "Gearbox": "Gearbox",
                    "Bearings": "Main Bearing",
                    "Generator": "Generator",
                    "Rotors": "Blade System",
                    "Blades": "Blade System",
                    "Temperature Sensors": "Control System"
                }
                
                # Get health score for this component
                health_component = health_component_map.get(component, "Main Bearing")
                health_data = health_scores.get(health_component, {"score": 85, "trend": "stable"})
                health_score = health_data["score"]
                health_trend = health_data["trend"]
                
                # Determine status based on health score and trend
                if health_score < 70 or health_trend == "declining":
                    if health_score < 60:
                        status = "Critical"
                        confidence = random.randint(85, 95)
                    else:
                        status = "Warning"
                        confidence = random.randint(80, 90)
                elif health_score > 90 and health_trend in ["stable", "improving"]:
                    status = "Normal"
                    confidence = random.randint(90, 98)
                else:
                    # Mixed status based on weighted probability
                    statuses = ["Critical", "Warning", "Normal"]
                    if health_score < 75:
                        weights = [0.2, 0.4, 0.4]  # More warnings/critical
                    else:
                        weights = [0.05, 0.15, 0.8]  # Mostly normal
                    
                    status = random.choices(statuses, weights=weights)[0]
                    confidence = random.randint(75, 92)
            
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
        print(f"❌ Error generating predictions for {turbine_id}: {e}")
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
        # Check if this is Turbine-1 for happy path data
        is_turbine_1 = turbine_id == "Turbine-1"
        
        # Generate realistic sensor data based on turbine ID
        if is_turbine_1:
            # Turbine-1: Optimistic values (optimal operating conditions)
            base_values = {
                'wind_speed': random.uniform(12, 22),  # Optimal wind range
                'power_output': random.uniform(2500, 3000),  # High power output
                'rotor_rpm': random.uniform(18, 25),  # Optimal RPM range
                'nacelle_temp': random.uniform(45, 65),  # Lower, optimal temps
                'gear_oil_temp': random.uniform(55, 75),  # Lower, optimal temps
                'generator_temp': random.uniform(65, 85),  # Lower, optimal temps
                'blade_pitch': random.uniform(15, 75),  # Optimal pitch range
                'yaw_angle': random.uniform(0, 360),
                'voltage_l1': random.uniform(375, 395),  # Optimal voltage
                'voltage_l2': random.uniform(375, 395),  # Optimal voltage
                'voltage_l3': random.uniform(375, 395),  # Optimal voltage
                'current_l1': random.uniform(120, 160),  # Optimal current
                'current_l2': random.uniform(120, 160),  # Optimal current
                'current_l3': random.uniform(120, 160),  # Optimal current
                'gear_oil_pressure': random.uniform(2.2, 2.8),  # Optimal pressure
                'ambient_temp': random.uniform(15, 28),  # Pleasant ambient
                'humidity': random.uniform(40, 65),  # Optimal humidity
                'wind_direction': random.uniform(0, 360),
            }
        else:
            # Other turbines: Normal variation
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
            if is_turbine_1:
                # Turbine-1: Minimal variation (stable operation)
                variation = random.uniform(-0.05, 0.05) * variation_factor
            else:
                # Other turbines: Normal variation
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

def get_turbine_maintenance_schedule(turbine_id: str) -> List[Dict[str, Any]]:
    """Get maintenance schedule for a specific turbine using LSTM model when available"""
    try:
        print(f"📅 Getting ML-based maintenance schedule for {turbine_id}")
        
        # Try to use LSTM model first
        if LSTM_AVAILABLE:
            try:
                lstm_schedule = get_lstm_maintenance_schedule(turbine_id)
                print(f"✅ LSTM maintenance schedule generated for {turbine_id}")
                
                # Validate LSTM output format
                if isinstance(lstm_schedule, list) and len(lstm_schedule) > 0:
                    # Check if first item has required fields
                    first_item = lstm_schedule[0]
                    required_fields = ['component', 'message', 'priority', 'status']
                    if isinstance(first_item, dict) and all(field in first_item for field in required_fields):
                        return lstm_schedule
                
            except Exception as lstm_error:
                print(f"⚠️ LSTM maintenance schedule failed: {lstm_error}, falling back to heuristic")
        
        # Fallback to enhanced heuristic method
        print(f"📊 Using enhanced heuristic maintenance schedule for {turbine_id}")
        
        # Get health scores to inform maintenance schedule
        health_scores = get_turbine_health_scores(turbine_id)
        
        current_date = datetime.now()
        is_turbine_1 = turbine_id == "Turbine-1"
        
        # Generate maintenance schedule based on health scores
        schedule = []
        
        for component, health_data in health_scores.items():
            health_score = health_data["score"]
            health_trend = health_data["trend"]
            
            # Determine maintenance priority and timing based on health
            if is_turbine_1:
                # Turbine-1: Only low priority, routine maintenance
                priority = "Low"
                days_until_service = random.randint(90, 180)  # Long intervals
                status = "Monitoring"
                message = f"Excellent condition - {component} operating optimally"
            else:
                # Other turbines: Health-based scheduling
                if health_score < 70 or health_trend == "declining":
                    if health_score < 60:
                        priority = "High"
                        days_until_service = random.randint(1, 14)  # Urgent
                        status = "Due"
                        message = f"Critical maintenance required - {component} showing significant wear"
                    else:
                        priority = "Medium"
                        days_until_service = random.randint(15, 45)  # Soon
                        status = "Scheduled"
                        message = f"Preventive maintenance recommended for {component}"
                else:
                    priority = "Low"
                    days_until_service = random.randint(60, 120)  # Routine
                    status = "Monitoring"
                    message = f"Routine inspection for {component} - operating normally"
            
            # Calculate dates
            last_service = current_date - timedelta(days=random.randint(30, 90))
            next_service = current_date + timedelta(days=days_until_service)
            
            # Duration based on component and priority
            duration_map = {
                "High": random.randint(4, 8),
                "Medium": random.randint(2, 4),
                "Low": random.randint(1, 2)
            }
            duration = f"{duration_map[priority]} hours"
            
            # Assign technician
            technician = f"Technician-{random.randint(1, 3)}"
            
            schedule.append({
                'component': component,
                'message': message,
                'last_service': last_service.strftime('%Y-%m-%d'),
                'next_service': next_service.strftime('%Y-%m-%d'),
                'duration': duration,
                'priority': priority,
                'status': status,
                'assignedTechnician': technician,
                'health_score': health_score,
                'health_trend': health_trend
            })
        
        # Sort by priority and next service date
        priority_order = {"High": 0, "Medium": 1, "Low": 2}
        schedule.sort(key=lambda x: (priority_order[x['priority']], x['next_service']))
        
        return schedule
        
    except Exception as e:
        print(f"❌ Error generating maintenance schedule for {turbine_id}: {e}")
        # Return fallback schedule
        current_date = datetime.now()
        return [
            {
                'component': 'Gearbox Oil',
                'message': 'Routine oil analysis - excellent condition',
                'last_service': (current_date - timedelta(days=30)).strftime('%Y-%m-%d'),
                'next_service': (current_date + timedelta(days=120)).strftime('%Y-%m-%d'),
                'duration': '2 hours',
                'priority': 'Low',
                'status': 'Scheduled',
                'assignedTechnician': 'Technician-1'
            },
            {
                'component': 'Blade Inspection',
                'message': 'Preventive maintenance - blades in good condition',
                'last_service': (current_date - timedelta(days=45)).strftime('%Y-%m-%d'),
                'next_service': (current_date + timedelta(days=135)).strftime('%Y-%m-%d'),
                'duration': '4 hours',
                'priority': 'Medium',
                'status': 'Scheduled',
                'assignedTechnician': 'Technician-2'
            }
        ]
