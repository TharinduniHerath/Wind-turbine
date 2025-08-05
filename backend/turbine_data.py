import random
from datetime import datetime, timedelta

def get_turbine_specific_data(turbine_id: str):
    """Generate turbine-specific data for demonstration"""
    
    # Base data for all turbines
    base_data = {
        "timestamp": datetime.now().isoformat(),
        "power_output": 2.3,
        "wind_speed": 12.5,
        "rotor_rpm": 18.2,
        "nacelle": {
            "yaw": 245,
            "temperature": 65,
        },
        "blades": {
            "pitch": 3.2,
            "vibration": 0.8,
        },
        "noise": {
            "level": 42.3,
            "frequency": 125,
        },
        "weather": {
            "temperature": 18,
            "humidity": 62,
            "pressure": 1013.2,
            "windDirection": 245,
        },
        "maintenance": {
            "nextService": "2024-03-15",
            "operatingHours": 8742,
            "alerts": [],
        },
    }
    
    # Turbine-specific variations
    if turbine_id == "Turbine-1":
        # Turbine-1: Normal operation
        return {
            **base_data,
            "power_output": 2.3,
            "wind_speed": 12.5,
            "rotor_rpm": 18.2,
            "noise": {"level": 42.3, "frequency": 125},
        }
    elif turbine_id == "Turbine-2":
        # Turbine-2: Slightly higher power output, some issues
        return {
            **base_data,
            "power_output": 2.8,
            "wind_speed": 15.2,
            "rotor_rpm": 22.1,
            "noise": {"level": 48.7, "frequency": 135},
            "maintenance": {
                "nextService": "2024-02-28",
                "operatingHours": 9120,
                "alerts": [{"id": "alert-1", "type": "warning", "message": "Gearbox temperature elevated"}],
            },
        }
    elif turbine_id == "Turbine-3":
        # Turbine-3: Lower efficiency, maintenance needed
        return {
            **base_data,
            "power_output": 1.7,
            "wind_speed": 10.8,
            "rotor_rpm": 14.5,
            "noise": {"level": 52.1, "frequency": 145},
            "maintenance": {
                "nextService": "2024-02-15",
                "operatingHours": 7890,
                "alerts": [
                    {"id": "alert-2", "type": "error", "message": "Blade vibration above threshold"},
                    {"id": "alert-3", "type": "warning", "message": "Oil pressure dropping"}
                ],
            },
        }
    else:
        return base_data

def get_turbine_health_scores(turbine_id: str):
    """Generate turbine-specific health scores"""
    
    if turbine_id == "Turbine-1":
        return {
            "Main Bearing": {"score": 95, "trend": "stable"},
            "Gearbox": {"score": 88, "trend": "stable"},
            "Generator": {"score": 92, "trend": "improving"},
            "Power Electronics": {"score": 90, "trend": "stable"},
            "Blade System": {"score": 87, "trend": "stable"},
            "Control System": {"score": 98, "trend": "stable"}
        }
    elif turbine_id == "Turbine-2":
        return {
            "Main Bearing": {"score": 82, "trend": "declining"},
            "Gearbox": {"score": 75, "trend": "declining"},
            "Generator": {"score": 89, "trend": "stable"},
            "Power Electronics": {"score": 85, "trend": "stable"},
            "Blade System": {"score": 78, "trend": "declining"},
            "Control System": {"score": 94, "trend": "stable"}
        }
    elif turbine_id == "Turbine-3":
        return {
            "Main Bearing": {"score": 68, "trend": "declining"},
            "Gearbox": {"score": 72, "trend": "declining"},
            "Generator": {"score": 81, "trend": "stable"},
            "Power Electronics": {"score": 79, "trend": "declining"},
            "Blade System": {"score": 65, "trend": "declining"},
            "Control System": {"score": 88, "trend": "stable"}
        }
    else:
        return {
            "Main Bearing": {"score": 85, "trend": "stable"},
            "Gearbox": {"score": 80, "trend": "stable"},
            "Generator": {"score": 87, "trend": "stable"},
            "Power Electronics": {"score": 83, "trend": "stable"},
            "Blade System": {"score": 82, "trend": "stable"},
            "Control System": {"score": 90, "trend": "stable"}
        }

def get_turbine_predictions(turbine_id: str):
    """Generate turbine-specific predictions"""
    
    if turbine_id == "Turbine-1":
        return {
            "Gearbox": {
                "status": "Normal",
                "message": "Gearbox operating within normal parameters.",
                "confidence": "92%",
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
                "confidence": "94%",
                "based_on": "2 months of telemetry"
            },
            "Rotors": {
                "status": "Normal",
                "message": "Rotor balance is optimal for current conditions.",
                "confidence": "89%",
                "based_on": "3 months of sensor data"
            },
            "Blades": {
                "status": "Normal",
                "message": "Blade aerodynamics are stable and efficient.",
                "confidence": "91%",
                "based_on": "60 days of telemetry"
            },
            "Temperature Sensors": {
                "status": "Normal",
                "message": "Temperature sensors operating within calibration range.",
                "confidence": "90%",
                "based_on": "90 days of data"
            }
        }
    elif turbine_id == "Turbine-2":
        return {
            "Gearbox": {
                "status": "Warning",
                "message": "Oil temperature trending higher than normal. Schedule inspection soon.",
                "confidence": "76%",
                "based_on": "3 months of sensor data"
            },
            "Bearings": {
                "status": "Warning",
                "message": "Abnormal vibration pattern detected. Schedule service soon.",
                "confidence": "74%",
                "based_on": "30 days of logs"
            },
            "Generator": {
                "status": "Normal",
                "message": "Generator operating efficiently with stable output.",
                "confidence": "89%",
                "based_on": "6 weeks of data"
            },
            "Rotors": {
                "status": "Warning",
                "message": "Rotor balance showing slight deviation. Monitor closely.",
                "confidence": "68%",
                "based_on": "30 days of logs"
            },
            "Blades": {
                "status": "Warning",
                "message": "Blade efficiency slightly reduced. Monitor closely.",
                "confidence": "72%",
                "based_on": "6 weeks of data"
            },
            "Temperature Sensors": {
                "status": "Normal",
                "message": "Temperature sensors operating within calibration range.",
                "confidence": "85%",
                "based_on": "6 weeks of data"
            }
        }
    elif turbine_id == "Turbine-3":
        return {
            "Gearbox": {
                "status": "Critical",
                "message": "Gearbox showing signs of wear. Immediate inspection required.",
                "confidence": "82%",
                "based_on": "3 months of sensor data"
            },
            "Bearings": {
                "status": "Critical",
                "message": "Bearing failure predicted within 2 weeks. Urgent maintenance needed.",
                "confidence": "79%",
                "based_on": "30 days of logs"
            },
            "Generator": {
                "status": "Warning",
                "message": "Generator efficiency declining. Schedule maintenance.",
                "confidence": "71%",
                "based_on": "6 weeks of data"
            },
            "Rotors": {
                "status": "Critical",
                "message": "Rotor imbalance detected. Immediate attention required.",
                "confidence": "85%",
                "based_on": "30 days of logs"
            },
            "Blades": {
                "status": "Critical",
                "message": "Blade damage detected. Immediate inspection required.",
                "confidence": "88%",
                "based_on": "6 weeks of data"
            },
            "Temperature Sensors": {
                "status": "Warning",
                "message": "Temperature sensors showing calibration drift.",
                "confidence": "73%",
                "based_on": "6 weeks of data"
            }
        }
    else:
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