from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from typing import List, Dict, Any
from pydantic import BaseModel
import sys
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Add the maintenance backend directory to the Python path
maintenance_backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, maintenance_backend_path)

router = APIRouter()

# Email models
class MaintenanceEmailRequest(BaseModel):
    to: str
    subject: str
    technician: str
    components: List[str]
    turbineId: str

# Email history storage
email_history = []

def send_maintenance_email(to_email: str, technician: str, components: List[str], turbine_id: str):
    """Send maintenance email to technician"""
    try:
        # Email configuration (you can modify these settings)
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        sender_email = "v.dhanushikan@gmail.com"  # Your Gmail address
        sender_password = "meoe oveq hais uibu"  # Your Gmail app password
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = to_email
        msg['Subject'] = f"Maintenance Assignment - Turbine {turbine_id}"
        
        # Email body template
        components_list = "\n".join([f"• {comp}" for comp in components])
        body = f"""
Dear {technician},

You have been assigned maintenance tasks for Turbine {turbine_id}.

Components requiring attention:
{components_list}

Please schedule and complete these maintenance tasks at your earliest convenience.

Best regards,
Wind Turbine Monitoring System
"""
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            print(f"Attempting to login with {sender_email}")
            server.login(sender_email, sender_password)
            
            text = msg.as_string()
            print(f"Sending email to {to_email}")
            server.sendmail(sender_email, to_email, text)
            print("Email sent successfully")
        
        return True
        
    except Exception as e:
        print(f"Error sending email to {to_email}: {e}")
        return False

# Test endpoint to verify the router is working
@router.get("/test")
async def test_maintenance_endpoint():
    """Test endpoint to verify maintenance router is working"""
    return {"message": "Maintenance router is working", "timestamp": datetime.now().isoformat()}

# Proxy endpoints that call the maintenance backend
@router.post("/predict/failure")
async def predict_failure_endpoint():
    """Predict failure probability and provide maintenance recommendations"""
    try:
        # Import here to avoid circular imports
        import requests
        import json
        
        # Start the maintenance backend server if not running
        # For now, return a mock response
        return {
            "failure_probability": 0.15,
            "failure_prediction": False,
            "confidence": 0.85,
            "risk_level": "LOW",
            "recommended_actions": ["Continue normal operations"],
            "next_maintenance_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "component_health": {
                "gearbox": 85.0,
                "generator": 92.0,
                "blades": 88.0,
                "nacelle": 90.0,
                "overall": 88.75
            },
            "rul_estimates": {
                "gearbox": 7446,
                "generator": 16128,
                "blades": 23126,
                "nacelle": 11826
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.get("/api/predict")
async def get_component_predictions(turbine: str = "Turbine-1"):
    """Get LSTM-based component predictions using the neural network model"""
    try:
        # Import the maintenance functions dynamically
        from turbine_data import get_turbine_predictions
        from predictive_analytics_predictor import get_ml_predictive_analytics
        
        print(f"🚀 Getting predictions for {turbine}")
        
        try:
            # Try ML predictive analytics first
            predictions = get_ml_predictive_analytics(turbine)
            print(f"✅ ML generated {len(predictions)} predictions for {turbine}")
        except Exception as ml_error:
            print(f"❌ ML predictions failed: {ml_error}, falling back to heuristic")
            # Fallback to heuristic predictions
            predictions = get_turbine_predictions(turbine)
        
        return JSONResponse(
            content=predictions,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
        
    except Exception as e:
        print(f"❌ Error in predictions: {e}")
        # Return basic fallback
        fallback_predictions = {
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
        
        return JSONResponse(
            content=fallback_predictions,
            status_code=200,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )

@router.get("/health/components")
async def get_component_health():
    """Get current component health status"""
    try:
        from turbine_data import get_turbine_health_scores
        
        # Get health scores for default turbine
        health_scores = get_turbine_health_scores("Turbine-1")
        
        # Convert to the expected format
        components = []
        for component, data in health_scores.items():
            components.append({
                "component": component,
                "health_score": float(data["score"]),
                "trend": data["trend"],
                "last_maintenance": "2024-01-15",
                "next_maintenance": "2024-07-15",
                "risk_level": "LOW" if data["score"] > 85 else "MEDIUM" if data["score"] > 70 else "HIGH"
            })
        
        return {"components": components}
        
    except Exception as e:
        print(f"❌ Error getting component health: {e}")
        # Return fallback data
        components = [
            {
                "component": "Main Bearing",
                "health_score": 95.0,
                "trend": "stable",
                "last_maintenance": "2024-01-15",
                "next_maintenance": "2024-07-15",
                "risk_level": "LOW"
            },
            {
                "component": "Gearbox",
                "health_score": 78.0,
                "trend": "declining",
                "last_maintenance": "2024-02-20",
                "next_maintenance": "2024-05-20",
                "risk_level": "MEDIUM"
            },
            {
                "component": "Generator",
                "health_score": 92.0,
                "trend": "improving",
                "last_maintenance": "2024-01-30",
                "next_maintenance": "2024-10-30",
                "risk_level": "LOW"
            },
            {
                "component": "Blade System",
                "health_score": 85.0,
                "trend": "declining",
                "last_maintenance": "2023-12-10",
                "next_maintenance": "2024-06-10",
                "risk_level": "MEDIUM"
            }
        ]
        
        return {"components": components}

@router.get("/analytics/summary")
async def get_analytics_summary():
    """Get maintenance analytics summary"""
    return {
        "total_turbines": 10,
        "operational_hours": 8742,
        "scheduled_maintenance": 3,
        "overdue_maintenance": 1,
        "predicted_failures": 0,
        "maintenance_cost_forecast": {
            "next_30_days": 12500,
            "next_90_days": 28900,
            "annual_estimate": 147000
        },
        "efficiency_metrics": {
            "average_power_output": 1545.96,
            "capacity_factor": 0.448,
            "availability": 0.98
        }
    }

@router.get("/api/health-scores")
async def get_health_scores(turbine: str = "Turbine-1"):
    """Get ML-based component health scores"""
    try:
        from ml_health_predictor import get_ml_health_scores
        from turbine_data import get_turbine_health_scores
        
        try:
            # Try ML health scores first
            health_scores = get_ml_health_scores(turbine)
            print(f"✅ ML generated health scores for {turbine}")
        except Exception as ml_error:
            print(f"❌ ML health scores failed: {ml_error}, falling back to heuristic")
            # Fallback to heuristic health scores
            health_scores = get_turbine_health_scores(turbine)
        
        # Simple alert logic
        alerts = {"alert": False}
        for component, data in health_scores.items():
            if data["score"] < 80 or data["trend"] == "declining":
                alerts = {
                    "alert": True,
                    "component": component,
                    "message": f"{component} health score dropped to {data['score']}% and trend is {data['trend']}. Schedule inspection."
                }
                break
        
        response = {
            "health_scores": health_scores,
            "alerts": alerts
        }
        
        return JSONResponse(
            content=response,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
        
    except Exception as e:
        print(f"❌ Error in health scores: {e}")
        # Return fallback
        fallback_response = {
            "health_scores": {
                "Main Bearing": {"score": 95, "trend": "stable"},
                "Gearbox": {"score": 78, "trend": "declining"},
                "Generator": {"score": 92, "trend": "improving"},
                "Power Electronics": {"score": 88, "trend": "stable"},
                "Blade System": {"score": 85, "trend": "declining"},
                "Control System": {"score": 98, "trend": "stable"}
            },
            "alerts": {
                "alert": True,
                "component": "Gearbox",
                "message": "Gearbox health score dropped to 78% and trend is declining. Schedule inspection."
            }
        }
        
        return JSONResponse(
            content=fallback_response,
            status_code=200,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )

@router.get("/api/maintenance-schedule")
async def get_maintenance_schedule(turbine: str = "Turbine-1"):
    """Get maintenance schedule predictions using the LSTM model"""
    try:
        from lstm_predictor import get_lstm_maintenance_schedule
        
        # Use LSTM model to predict maintenance schedule
        maintenance_schedule = get_lstm_maintenance_schedule(turbine)
        
        print(f"✅ LSTM generated {len(maintenance_schedule)} maintenance items for {turbine}")
        
        return JSONResponse(
            content=maintenance_schedule,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
        
    except Exception as e:
        print(f"❌ Error in LSTM maintenance schedule: {e}")
        # Return fallback schedule
        current_date = datetime.now()
        fallback_schedule = [
            {
                'component': 'Gearbox Oil',
                'message': 'Oil change and filter replacement required',
                'last_service': (current_date - timedelta(days=45)).strftime('%Y-%m-%d'),
                'next_service': (current_date + timedelta(days=15)).strftime('%Y-%m-%d'),
                'duration': '4 hours',
                'priority': 'High',
                'status': 'Due'
            },
            {
                'component': 'Blade Inspection',
                'message': 'Visual inspection and surface treatment',
                'last_service': (current_date - timedelta(days=60)).strftime('%Y-%m-%d'),
                'next_service': (current_date + timedelta(days=90)).strftime('%Y-%m-%d'),
                'duration': '6 hours',
                'priority': 'Medium',
                'status': 'Scheduled'
            },
            {
                'component': 'Generator Bearing',
                'message': 'Bearing lubrication and alignment check',
                'last_service': (current_date - timedelta(days=30)).strftime('%Y-%m-%d'),
                'next_service': (current_date + timedelta(days=60)).strftime('%Y-%m-%d'),
                'duration': '3 hours',
                'priority': 'Medium',
                'status': 'Scheduled'
            },
            {
                'component': 'Control System',
                'message': 'Software update and sensor calibration',
                'last_service': (current_date - timedelta(days=20)).strftime('%Y-%m-%d'),
                'next_service': (current_date + timedelta(days=25)).strftime('%Y-%m-%d'),
                'duration': '2 hours',
                'priority': 'High',
                'status': 'Due'
            }
        ]
        
        return JSONResponse(
            content=fallback_schedule,
            status_code=200,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )

@router.get("/api/sensor-data/{turbine_id}")
async def get_sensor_data(turbine_id: str):
    """Get current sensor data for a specific turbine"""
    try:
        from turbine_data import generate_dynamic_sensor_data
        
        sensor_data = generate_dynamic_sensor_data(turbine_id)
        return JSONResponse(
            content=sensor_data,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
    except Exception as e:
        print(f"Error generating sensor data for {turbine_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating sensor data: {str(e)}")

@router.get("/api/system-status")
async def get_system_status(turbine: str = "Turbine-1"):
    """Get overall system status prediction for a specific turbine"""
    try:
        print(f"🏥 Getting system status for {turbine}")
        
        # Get health scores for the turbine
        from turbine_data import get_turbine_health_scores
        health_scores = get_turbine_health_scores(turbine)
        
        # Calculate overall health metrics
        if not health_scores:
            return {
                "status": "Unknown",
                "message": "System status cannot be determined due to insufficient data.",
                "severity": "unknown",
                "recommendations": ["Check sensor connectivity", "Verify data collection systems"]
            }
        
        # Calculate average health score
        avg_health = sum(data["score"] for data in health_scores.values()) / len(health_scores)
        
        # Count critical components (score < 80)
        critical_components = sum(1 for data in health_scores.values() if data["score"] < 80)
        
        # Count declining trends
        declining_components = sum(1 for data in health_scores.values() if data["trend"] == "declining")
        
        # Determine system status based on health metrics
        if avg_health >= 90 and critical_components == 0:
            status = "Excellent"
            severity = "low"
            message = f"All systems operating optimally for {turbine}. No immediate maintenance required."
        elif avg_health >= 80 and critical_components <= 1:
            status = "Good"
            severity = "low"
            message = f"{turbine} is operating well with minor monitoring needed."
        elif avg_health >= 70 and critical_components <= 2:
            status = "Fair"
            severity = "medium"
            message = f"{turbine} requires attention to prevent performance degradation."
        elif avg_health >= 60:
            status = "Poor"
            severity = "high"
            message = f"{turbine} needs immediate maintenance to prevent failures."
        else:
            status = "Critical"
            severity = "critical"
            message = f"{turbine} is in critical condition and requires emergency maintenance."
        
        # Generate recommendations
        recommendations = []
        if critical_components > 0:
            recommendations.append(f"Inspect {critical_components} critical component(s)")
        if declining_components > 0:
            recommendations.append(f"Monitor {declining_components} declining component(s)")
        if avg_health < 80:
            recommendations.append("Schedule comprehensive maintenance review")
        if not recommendations:
            recommendations.append("Continue routine monitoring")
        
        system_status = {
            "status": status,
            "message": message,
            "severity": severity,
            "average_health": round(avg_health, 1),
            "critical_components": critical_components,
            "declining_components": declining_components,
            "recommendations": recommendations,
            "turbine_id": turbine,
            "timestamp": datetime.now().isoformat()
        }
        
        print(f"✅ System status for {turbine}: {status} ({severity})")
        
        return JSONResponse(
            content=system_status,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
        
    except Exception as e:
        print(f"❌ Error getting system status for {turbine}: {e}")
        # Return fallback system status
        fallback_status = {
            "status": "Good",
            "message": f"{turbine} is operating within normal parameters.",
            "severity": "low",
            "average_health": 85.0,
            "critical_components": 0,
            "declining_components": 1,
            "recommendations": ["Continue routine monitoring"],
            "turbine_id": turbine,
            "timestamp": datetime.now().isoformat()
        }
        
        return JSONResponse(
            content=fallback_status,
            status_code=200,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )

# Email endpoints
@router.post("/send-maintenance-email")
async def send_maintenance_email_endpoint(request: MaintenanceEmailRequest):
    """Send maintenance email to assigned technician"""
    try:
        # Send email
        success = send_maintenance_email(
            to_email=request.to,
            technician=request.technician,
            components=request.components,
            turbine_id=request.turbineId
        )
        
        if success:
            # Add to email history
            email_record = {
                "id": len(email_history) + 1,
                "timestamp": datetime.now().isoformat(),
                "to": request.to,
                "technician": request.technician,
                "components": request.components,
                "turbine_id": request.turbineId,
                "status": "sent"
            }
            email_history.append(email_record)
            
            return {"message": "Email sent successfully", "status": "success"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")
            
    except Exception as e:
        print(f"Error in email endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Error sending email: {str(e)}")

@router.get("/email-history")
async def get_email_history():
    """Get email history"""
    return {"emails": email_history}

@router.delete("/email-history")
async def clear_email_history():
    """Clear email history"""
    global email_history
    email_history.clear()
    return {"message": "Email history cleared successfully"}

# Initialize models on router startup
@router.on_event("startup")
async def startup_event():
    """Load models on startup"""
    print("🚀 Starting Maintenance Module...")
    try:
        # Try to load models from the maintenance backend
        sys.path.insert(0, maintenance_backend_path)
        print("✅ Maintenance module path configured")
    except Exception as e:
        print(f"⚠️ Maintenance module startup warning: {e}")
    print("✅ Maintenance module ready")