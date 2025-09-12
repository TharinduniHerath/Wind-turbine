from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import joblib
import logging
import threading
import time
import schedule

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AutoWindLossAPI:
    """
    Automatic Wind Loss Prediction API
    - Always uses current date/time
    - Maps to 2024 parallel data
    - Updates predictions every hour automatically
    """
    
    def __init__(self, weather_data_path, model_files):
        self.weather_data_path = weather_data_path
        self.model_files = model_files
        self.weather_data = None
        self.model = None
        self.scaler = None
        self.label_encoders = None
        self.config = None
        self.feature_columns = None
        
        # Cache for latest predictions
        self.latest_predictions = None
        self.last_update_time = None
        self.update_lock = threading.Lock()
        
        # Load everything at startup
        self.load_weather_data()
        self.load_model_components()
        
        # Start automatic updates
        self.start_auto_updates()
    
    def load_weather_data(self):
        """Load weather data from CSV file"""
        try:
            logger.info(f"Loading weather data from {self.weather_data_path}")
            self.weather_data = pd.read_csv(self.weather_data_path)
            self.weather_data['datetime_utc'] = pd.to_datetime(self.weather_data['datetime_utc'])
            logger.info(f"Weather data loaded: {len(self.weather_data)} records")
        except Exception as e:
            logger.error(f"Failed to load weather data: {e}")
            self.weather_data = None
    
    def load_model_components(self):
        """Load trained ML model components"""
        try:
            logger.info("Loading ML model components...")
            
            # Load model
            self.model = joblib.load(self.model_files['model'])
            logger.info(f"Model loaded: {self.model_files['model']}")
            
            # Load scaler
            self.scaler = joblib.load(self.model_files['scaler'])
            logger.info(f"Scaler loaded: {self.model_files['scaler']}")
            
            # Load encoders
            self.label_encoders = joblib.load(self.model_files['encoders'])
            logger.info(f"Encoders loaded: {self.model_files['encoders']}")
            
            # Load configuration
            with open(self.model_files['config'], 'r') as f:
                self.config = json.load(f)
            self.feature_columns = self.config['feature_columns']
            logger.info(f"Config loaded: {len(self.feature_columns)} features")
            
            logger.info("All ML components loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load ML components: {e}")
            self.model = None
    
    def start_auto_updates(self):
        """Start automatic hourly updates"""
        def run_scheduler():
            # Schedule hourly updates
            schedule.every().hour.at(":00").do(self.update_predictions_automatically)
            
            # Initial prediction
            self.update_predictions_automatically()
            
            while True:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
        
        # Run scheduler in background thread
        scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
        scheduler_thread.start()
        logger.info("Automatic hourly updates started")
    
    def update_predictions_automatically(self):
        """Update predictions automatically using current time"""
        try:
            with self.update_lock:
                current_time = datetime.now()
                logger.info(f"Auto-updating predictions for current time: {current_time}")
                
                result = self.predict_wind_losses_internal(current_time, 48)
                
                if result['success']:
                    self.latest_predictions = result
                    self.last_update_time = current_time
                    logger.info(f"Predictions updated successfully at {current_time}")
                    
                    # Log summary for monitoring
                    summary = result['wind_loss_summary']
                    logger.info(f"Wind loss periods detected: {summary['total_periods']}")
                    if summary['has_wind_losses']:
                        logger.info(f"Total power loss: {summary['total_power_loss_kw']} kW")
                else:
                    logger.error(f"Failed to update predictions: {result.get('message', 'Unknown error')}")
                    
        except Exception as e:
            logger.error(f"Error in automatic update: {e}")
    
    def get_current_datetime_forecast(self):
        """Get current date/time and map to 2024 equivalent"""
        current_time = datetime.now()
        
        # Map to 2024 equivalent for weather lookup
        weather_lookup_time = current_time.replace(year=2024)
        
        return current_time, weather_lookup_time
    
    def get_sri_lankan_season(self, month):
        """Get season based on Sri Lankan monsoon patterns"""
        if month in [12, 1, 2]:
            return 'NE_Monsoon_Peak'
        elif month in [3, 4]:
            return 'Inter_Monsoon_1'
        elif month in [5, 6, 7, 8, 9]:
            return 'SW_Monsoon_Dry'
        else:
            return 'Inter_Monsoon_2'
    
    def get_wind_forecast_current(self, hours=48):
        """Get wind forecast for current time using 2024 equivalent data"""
        if self.weather_data is None:
            return None
        
        current_time, lookup_time = self.get_current_datetime_forecast()
        
        # Find closest time in weather data
        time_diff = abs(self.weather_data['datetime_utc'] - lookup_time)
        start_idx = time_diff.idxmin()
        start_weather_time = self.weather_data.loc[start_idx, 'datetime_utc']
        
        # Get forecast period from weather data
        end_weather_time = start_weather_time + timedelta(hours=hours)
        forecast_weather = self.weather_data[
            (self.weather_data['datetime_utc'] >= start_weather_time) & 
            (self.weather_data['datetime_utc'] < end_weather_time)
        ].copy()
        
        if len(forecast_weather) == 0:
            return None
        
        # Create forecast for all turbines with variations
        turbines = [f'WTG{i:02d}' for i in range(1, 11)]
        turbine_variations = {
            'WTG01': 1.02, 'WTG02': 0.98, 'WTG03': 1.01, 'WTG04': 0.99, 'WTG05': 1.03,
            'WTG06': 0.97, 'WTG07': 1.01, 'WTG08': 0.98, 'WTG09': 1.02, 'WTG10': 0.96
        }
        
        forecast_data = []
        for _, row in forecast_weather.iterrows():
            base_wind = row['WS50M']
            # Use current time progression, not 2024 times
            time_offset = row['datetime_utc'] - start_weather_time
            forecast_timestamp = current_time + time_offset
            
            for turbine in turbines:
                adjusted_wind = base_wind * turbine_variations[turbine]
                forecast_data.append({
                    'Timestamp': forecast_timestamp.isoformat(),
                    'Turbine_ID': turbine,
                    'Wind_Speed_Forecast': round(adjusted_wind, 1)
                })
        
        return forecast_data, current_time
    
    def prepare_ml_features(self, wind_forecast_data):
        """Prepare features for ML model prediction"""
        if isinstance(wind_forecast_data, list):
            forecast_df = pd.DataFrame(wind_forecast_data)
        else:
            forecast_df = wind_forecast_data.copy()
        
        forecast_df['Timestamp'] = pd.to_datetime(forecast_df['Timestamp'])
        
        # Time-based features
        forecast_df['Hour'] = forecast_df['Timestamp'].dt.hour
        forecast_df['DayOfWeek'] = forecast_df['Timestamp'].dt.dayofweek
        forecast_df['Month'] = forecast_df['Timestamp'].dt.month
        forecast_df['Season'] = forecast_df['Month'].apply(self.get_sri_lankan_season)
        
        # Wind features
        forecast_df['Wind_Speed'] = forecast_df['Wind_Speed_Forecast']
        forecast_df['Wind_Speed_Squared'] = forecast_df['Wind_Speed'] ** 2
        forecast_df['Wind_Speed_Cubed'] = forecast_df['Wind_Speed'] ** 3
        
        # Sort for lag calculations
        forecast_df = forecast_df.sort_values(['Turbine_ID', 'Timestamp'])
        
        # Create lag features
        forecast_df['Wind_Speed_1h_Lag'] = forecast_df.groupby('Turbine_ID')['Wind_Speed'].shift(1)
        forecast_df['Wind_Speed_1h_Lag'] = forecast_df['Wind_Speed_1h_Lag'].fillna(forecast_df['Wind_Speed'])
        
        # Rolling features
        forecast_df['Wind_Speed_3h_Mean'] = forecast_df.groupby('Turbine_ID')['Wind_Speed'].rolling(window=3, min_periods=1).mean().reset_index(0, drop=True)
        forecast_df['Wind_Speed_3h_Std'] = forecast_df.groupby('Turbine_ID')['Wind_Speed'].rolling(window=3, min_periods=1).std().reset_index(0, drop=True)
        forecast_df['Wind_Speed_3h_Std'] = forecast_df['Wind_Speed_3h_Std'].fillna(0)
        
        # Wind change
        forecast_df['Wind_Speed_Change'] = forecast_df.groupby('Turbine_ID')['Wind_Speed'].diff()
        forecast_df['Wind_Speed_Change'] = forecast_df['Wind_Speed_Change'].fillna(0)
        
        # Default values for other features
        forecast_df['Active_Power_1h_Lag'] = 1200  # Typical operation
        
        # Expected power estimation
        forecast_df['Expected_Power'] = forecast_df.apply(
            lambda row: self.estimate_expected_power(row['Hour'], row['Season']), axis=1
        )
        
        # Encode categorical features
        for feature in ['Season', 'Turbine_ID']:
            if feature in self.label_encoders:
                forecast_df[f'{feature}_Encoded'] = forecast_df[feature].apply(
                    lambda x: self.safe_encode(x, feature)
                )
            else:
                forecast_df[f'{feature}_Encoded'] = 0
        
        return forecast_df
    
    def safe_encode(self, value, feature):
        """Safely encode categorical values"""
        try:
            if value in self.label_encoders[feature].classes_:
                return self.label_encoders[feature].transform([value])[0]
            else:
                return 0
        except:
            return 0
    
    def estimate_expected_power(self, hour, season):
        """Estimate expected power for given hour and season"""
        hourly_factors = {
            0: 0.7, 1: 0.6, 2: 0.5, 3: 0.5, 4: 0.6, 5: 0.7,
            6: 0.8, 7: 0.9, 8: 1.0, 9: 1.1, 10: 1.2, 11: 1.3,
            12: 1.4, 13: 1.4, 14: 1.3, 15: 1.2, 16: 1.1, 17: 1.0,
            18: 0.9, 19: 0.8, 20: 0.8, 21: 0.8, 22: 0.7, 23: 0.7
        }
        
        seasonal_factors = {
            'NE_Monsoon_Peak': 1.2,
            'SW_Monsoon_Dry': 0.8,
            'Inter_Monsoon_1': 1.0,
            'Inter_Monsoon_2': 1.1
        }
        
        base_power = 1200
        hourly_factor = hourly_factors.get(hour, 1.0)
        seasonal_factor = seasonal_factors.get(season, 1.0)
        
        return base_power * hourly_factor * seasonal_factor
    
    def make_ml_predictions(self, wind_forecast_data):
        """Make ML predictions using trained model"""
        if self.model is None:
            return {'success': False, 'message': 'ML model not loaded'}
        
        try:
            # Prepare features
            feature_df = self.prepare_ml_features(wind_forecast_data)
            
            # Extract features in correct order
            X = feature_df[self.feature_columns].copy()
            
            # Handle missing features
            for col in self.feature_columns:
                if col not in X.columns:
                    X[col] = 0
            
            # Ensure feature order
            X = X[self.feature_columns]
            
            # Scale features
            X_scaled = self.scaler.transform(X)
            
            # Make predictions
            power_loss_predictions = self.model.predict(X_scaled)
            power_loss_predictions = np.maximum(0, power_loss_predictions)
            
            # Add predictions to dataframe
            result_df = feature_df[['Timestamp', 'Turbine_ID', 'Wind_Speed_Forecast', 'Expected_Power']].copy()
            result_df['Predicted_Power_Loss_kW'] = power_loss_predictions
            result_df['Actual_Power_kW'] = result_df['Expected_Power'] - result_df['Predicted_Power_Loss_kW']
            result_df['Actual_Power_kW'] = np.maximum(0, result_df['Actual_Power_kW'])
            
            # Classify loss reasons
            result_df['Loss_Reason'] = result_df.apply(self.classify_loss_reason, axis=1)
            result_df['Risk_Level'] = result_df.apply(self.classify_risk_level, axis=1)
            
            return {
                'success': True,
                'predictions': result_df
            }
            
        except Exception as e:
            logger.error(f"ML prediction error: {e}")
            return {'success': False, 'message': f'Prediction failed: {str(e)}'}
    
    def classify_loss_reason(self, row):
        """Classify the reason for power loss"""
        wind_speed = row['Wind_Speed_Forecast']
        power_loss = row['Predicted_Power_Loss_kW']
        
        if power_loss < 50:
            return "Normal Operation"
        elif wind_speed < 3.0:
            return "Low Wind Speed"
        elif wind_speed > 25.0:
            return "High Wind Speed (Safety Shutdown)"
        elif power_loss > 500:
            return "Significant Power Loss"
        else:
            return "Minor Power Loss"
    
    def classify_risk_level(self, row):
        """Classify risk level"""
        power_loss = row['Predicted_Power_Loss_kW']
        
        if power_loss < 50:
            return "Low"
        elif power_loss < 500:
            return "Medium"
        elif power_loss < 1500:
            return "High"
        else:
            return "Critical"
    
    def analyze_wind_loss_periods(self, predictions_df):
        """Analyze predictions to identify wind loss periods"""
        # Filter for wind-related power loss only
        wind_loss_events = predictions_df[
            (predictions_df['Loss_Reason'].isin(['Low Wind Speed', 'High Wind Speed (Safety Shutdown)'])) &
            (predictions_df['Predicted_Power_Loss_kW'] > 100)
        ].copy()
        
        if len(wind_loss_events) == 0:
            return []
        
        # Group by hour and loss reason
        hourly_loss = wind_loss_events.groupby(['Timestamp', 'Loss_Reason']).agg({
            'Predicted_Power_Loss_kW': 'sum',
            'Wind_Speed_Forecast': ['mean', 'min', 'max'],
            'Turbine_ID': lambda x: list(x)
        }).reset_index()
        
        hourly_loss.columns = ['Timestamp', 'Loss_Reason', 'Total_Power_Loss_kW', 
                              'Avg_Wind_Speed', 'Min_Wind_Speed', 'Max_Wind_Speed', 'Affected_Turbines']
        
        # Identify consecutive periods
        periods = []
        for loss_reason in ['Low Wind Speed', 'High Wind Speed (Safety Shutdown)']:
            reason_events = hourly_loss[hourly_loss['Loss_Reason'] == loss_reason].sort_values('Timestamp')
            
            if len(reason_events) == 0:
                continue
            
            current_period = None
            
            for _, event in reason_events.iterrows():
                if current_period is None:
                    current_period = {
                        'loss_reason': loss_reason,
                        'start_time': event['Timestamp'].isoformat(),
                        'end_time': event['Timestamp'].isoformat(),
                        'duration_hours': 1,
                        'total_power_loss_kw': event['Total_Power_Loss_kW'],
                        'wind_speeds': [event['Avg_Wind_Speed']],
                        'all_turbines': event['Affected_Turbines']
                    }
                else:
                    current_dt = pd.to_datetime(current_period['end_time'])
                    new_dt = event['Timestamp']
                    time_diff = (new_dt - current_dt).total_seconds() / 3600
                    
                    if time_diff <= 1.5:  # Consecutive
                        current_period['end_time'] = event['Timestamp'].isoformat()
                        current_period['duration_hours'] += 1
                        current_period['total_power_loss_kw'] += event['Total_Power_Loss_kW']
                        current_period['wind_speeds'].append(event['Avg_Wind_Speed'])
                        current_period['all_turbines'].extend(event['Affected_Turbines'])
                    else:
                        self.finalize_period(current_period)
                        periods.append(current_period)
                        
                        current_period = {
                            'loss_reason': loss_reason,
                            'start_time': event['Timestamp'].isoformat(),
                            'end_time': event['Timestamp'].isoformat(),
                            'duration_hours': 1,
                            'total_power_loss_kw': event['Total_Power_Loss_kW'],
                            'wind_speeds': [event['Avg_Wind_Speed']],
                            'all_turbines': event['Affected_Turbines']
                        }
            
            if current_period is not None:
                self.finalize_period(current_period)
                periods.append(current_period)
        
        return sorted(periods, key=lambda x: x['start_time'])
    
    def finalize_period(self, period):
        """Add calculated fields to period"""
        period['affected_turbines'] = list(set(period['all_turbines']))
        period['turbine_count'] = len(period['affected_turbines'])
        period['min_wind_speed'] = min(period['wind_speeds'])
        period['max_wind_speed'] = max(period['wind_speeds'])
        period['avg_wind_speed'] = round(sum(period['wind_speeds']) / len(period['wind_speeds']), 1)
        period['total_power_loss_kw'] = round(period['total_power_loss_kw'], 1)
        
        # Remove temporary fields
        del period['wind_speeds']
        del period['all_turbines']
    
    def predict_wind_losses_internal(self, current_datetime, hours=48):
        """Internal prediction function using current datetime"""
        try:
            logger.info(f"Predicting wind losses from current time: {current_datetime} for {hours} hours")
            
            # Get wind forecast using current time
            wind_forecast_result = self.get_wind_forecast_current(hours)
            if not wind_forecast_result:
                return {
                    'success': False,
                    'message': 'Unable to get wind forecast data for current time'
                }
            
            wind_forecast, actual_current_time = wind_forecast_result
            
            # Make ML predictions
            ml_result = self.make_ml_predictions(wind_forecast)
            if not ml_result['success']:
                return ml_result
            
            predictions_df = ml_result['predictions']
            
            # Analyze wind loss periods (only wind-related)
            wind_periods = self.analyze_wind_loss_periods(predictions_df)
            
            # Format wind loss periods
            wind_loss_periods = []
            for period in wind_periods:
                wind_condition = "Low Wind Speed" if 'Low Wind' in period['loss_reason'] else "High Wind Speed"
                impact = "Turbines cannot operate" if 'Low Wind' in period['loss_reason'] else "Safety shutdown required"
                
                wind_loss_periods.append({
                    'id': len(wind_loss_periods) + 1,
                    'wind_condition': wind_condition,
                    'start_time': period['start_time'],
                    'end_time': period['end_time'],
                    'duration_hours': period['duration_hours'],
                    'power_loss_kw': period['total_power_loss_kw'],
                    'avg_wind_speed': period['avg_wind_speed'],
                    'min_wind_speed': period['min_wind_speed'],
                    'max_wind_speed': period['max_wind_speed'],
                    'affected_turbines': period['affected_turbines'],
                    'turbine_count': period['turbine_count'],
                    'impact_description': impact,
                    'severity': 'High' if period['total_power_loss_kw'] > 10000 else 'Medium'
                })
            
            # Create summary
            total_loss = sum([p['power_loss_kw'] for p in wind_loss_periods])
            low_wind_periods = [p for p in wind_loss_periods if p['wind_condition'] == 'Low Wind Speed']
            high_wind_periods = [p for p in wind_loss_periods if p['wind_condition'] == 'High Wind Speed']
            
            summary = {
                'total_periods': len(wind_loss_periods),
                'low_wind_periods': len(low_wind_periods),
                'high_wind_periods': len(high_wind_periods),
                'total_power_loss_kw': round(total_loss, 1),
                'low_wind_loss_kw': round(sum([p['power_loss_kw'] for p in low_wind_periods]), 1),
                'high_wind_loss_kw': round(sum([p['power_loss_kw'] for p in high_wind_periods]), 1),
                'estimated_revenue_impact_usd': round(total_loss * 0.12, 2),
                'has_wind_losses': len(wind_loss_periods) > 0
            }
            
            # Daily breakdown
            daily_data = {}
            for period in wind_loss_periods:
                start_date = pd.to_datetime(period['start_time']).date()
                if start_date not in daily_data:
                    daily_data[start_date] = 0
                daily_data[start_date] += period['power_loss_kw']
            
            daily_breakdown = [
                {
                    'date': date.isoformat(),
                    'wind_loss_kw': round(loss, 1)
                }
                for date, loss in sorted(daily_data.items())
            ]
            
            return {
                'success': True,
                'current_time': actual_current_time.isoformat(),
                'forecast_info': {
                    'start_time': actual_current_time.isoformat(),
                    'end_time': (actual_current_time + timedelta(hours=hours)).isoformat(),
                    'duration_hours': hours,
                    'total_predictions': len(wind_forecast),
                    'weather_source': '2024 parallel data'
                },
                'model_info': {
                    'model_type': self.config.get('model_type', 'XGBoost'),
                    'training_r2': self.config.get('training_metrics', {}).get('r2_score', 0.986),
                    'training_samples': self.config.get('training_samples', 524260),
                    'last_updated': self.last_update_time.isoformat() if self.last_update_time else None
                },
                'wind_loss_summary': summary,
                'wind_loss_periods': wind_loss_periods,
                'daily_breakdown': daily_breakdown,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in wind loss prediction: {e}")
            return {
                'success': False,
                'message': f'Prediction failed: {str(e)}'
            }
    
    def get_latest_predictions(self):
        """Get latest cached predictions"""
        with self.update_lock:
            if self.latest_predictions is None:
                # Force an update if no predictions exist
                self.update_predictions_automatically()
            
            return self.latest_predictions


# Create Flask app
app = Flask(__name__)
CORS(app)

# Configuration - UPDATE THESE PATHS
CONFIG = {
    'weather_data_path': '2024_weather_processed.csv',
    'model_files': {
        'model': 'wind_power_loss_model_20250907_163805.pkl',
        'scaler': 'wind_power_loss_scaler_20250907_163805.pkl',
        'encoders': 'wind_power_loss_encoders_20250907_163805.pkl',
        'config': 'wind_power_loss_config_20250907_163805.json'
    }
}

# Initialize API
try:
    wind_api = AutoWindLossAPI(CONFIG['weather_data_path'], CONFIG['model_files'])
    logger.info("Auto Wind Loss API initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize API: {e}")
    wind_api = None

# API Endpoints
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Auto Wind Loss Prediction API',
        'timestamp': datetime.now().isoformat(),
        'weather_data_loaded': wind_api.weather_data is not None if wind_api else False,
        'model_loaded': wind_api.model is not None if wind_api else False,
        'last_prediction_update': wind_api.last_update_time.isoformat() if wind_api and wind_api.last_update_time else None,
        'auto_updates': 'enabled'
    })

@app.route('/api/wind-loss/current', methods=['GET'])
def get_current_wind_losses():
    """Get current wind loss predictions (automatically updated)"""
    try:
        if not wind_api:
            return jsonify({
                'success': False,
                'message': 'API not properly initialized'
            }), 500
        
        result = wind_api.get_latest_predictions()
        
        if result and result['success']:
            return jsonify(result)
        else:
            return jsonify({
                'success': False,
                'message': 'No predictions available'
            }), 500
            
    except Exception as e:
        logger.error(f"Error in current endpoint: {e}")
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/api/wind-loss/summary', methods=['GET'])
def get_wind_loss_summary():
    """Get quick summary of current predictions"""
    try:
        if not wind_api:
            return jsonify({
                'success': False,
                'message': 'API not properly initialized'
            }), 500
        
        result = wind_api.get_latest_predictions()
        
        if result and result['success']:
            summary_response = {
                'success': True,
                'current_time': result['current_time'],
                'forecast_period': f"{result['forecast_info']['start_time']} to {result['forecast_info']['end_time']}",
                'summary': result['wind_loss_summary'],
                'periods_count': len(result['wind_loss_periods']),
                'next_wind_event': None,
                'last_updated': result['model_info'].get('last_updated'),
                'auto_update_status': 'active'
            }
            
            if result['wind_loss_periods']:
                next_event = result['wind_loss_periods'][0]
                summary_response['next_wind_event'] = {
                    'condition': next_event['wind_condition'],
                    'start_time': next_event['start_time'],
                    'duration_hours': next_event['duration_hours'],
                    'power_loss_kw': next_event['power_loss_kw']
                }
            
            return jsonify(summary_response)
        else:
            return jsonify({
                'success': False,
                'message': 'No predictions available'
            }), 500
            
    except Exception as e:
        logger.error(f"Error in summary endpoint: {e}")
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/api/wind-loss/force-update', methods=['POST'])
def force_update():
    """Force an immediate prediction update"""
    try:
        if not wind_api:
            return jsonify({
                'success': False,
                'message': 'API not properly initialized'
            }), 500
        
        wind_api.update_predictions_automatically()
        
        return jsonify({
            'success': True,
            'message': 'Predictions updated successfully',
            'updated_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in force update endpoint: {e}")
        return jsonify({
            'success': False,
            'message': f'Update failed: {str(e)}'
        }), 500

@app.route('/api/wind-loss/status', methods=['GET'])
def get_system_status():
    """Get system status and update information"""
    try:
        if not wind_api:
            return jsonify({
                'success': False,
                'message': 'API not properly initialized'
            }), 500
        
        current_time = datetime.now()
        next_update = None
        
        if wind_api.last_update_time:
            next_update = wind_api.last_update_time.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
        
        return jsonify({
            'success': True,
            'system_status': {
                'current_time': current_time.isoformat(),
                'last_update': wind_api.last_update_time.isoformat() if wind_api.last_update_time else None,
                'next_scheduled_update': next_update.isoformat() if next_update else None,
                'auto_updates': 'enabled',
                'weather_data_records': len(wind_api.weather_data) if wind_api.weather_data is not None else 0,
                'model_loaded': wind_api.model is not None,
                'predictions_available': wind_api.latest_predictions is not None
            }
        })
        
    except Exception as e:
        logger.error(f"Error in status endpoint: {e}")
        return jsonify({
            'success': False,
            'message': f'Status check failed: {str(e)}'
        }), 500

@app.route('/api/test/wind-scenario', methods=['POST'])
def test_wind_scenario():
    """Test with specific wind scenario for demonstration"""
    try:
        if not wind_api:
            return jsonify({'success': False, 'message': 'API not initialized'}), 500
        
        data = request.get_json() or {}
        scenario = data.get('scenario', 'mixed')  # 'low', 'high', 'mixed', 'normal'
        
        current_time = datetime.now()
        turbines = [f'WTG{i:02d}' for i in range(1, 11)]
        
        # Create test wind data based on scenario
        forecast_data = []
        for hour in range(48):
            timestamp = current_time + timedelta(hours=hour)
            
            if scenario == 'low':
                # Low wind scenario
                if 0 <= hour <= 5:  # First 6 hours low wind
                    base_wind = np.random.uniform(1.5, 2.8)
                else:
                    base_wind = np.random.uniform(6, 12)
                    
            elif scenario == 'high':
                # High wind scenario  
                if 20 <= hour <= 23:  # Hours 20-23 high wind
                    base_wind = np.random.uniform(26, 28)
                else:
                    base_wind = np.random.uniform(8, 15)
                    
            elif scenario == 'mixed':
                # Mixed scenario with both low and high wind
                if 2 <= hour <= 5:  # Early morning low wind
                    base_wind = np.random.uniform(1.8, 2.9)
                elif 30 <= hour <= 32:  # Day 2 afternoon high wind
                    base_wind = np.random.uniform(25.5, 27.5)
                else:
                    base_wind = np.random.uniform(6, 15)
                    
            else:  # normal
                base_wind = np.random.uniform(6, 15)
            
            # Create data for all turbines
            for turbine in turbines:
                variation = np.random.uniform(0.95, 1.05)  # Small turbine variations
                adjusted_wind = base_wind * variation
                
                forecast_data.append({
                    'Timestamp': timestamp.isoformat(),
                    'Turbine_ID': turbine,
                    'Wind_Speed_Forecast': round(adjusted_wind, 1)
                })
        
        # Make ML predictions with test data
        ml_result = wind_api.make_ml_predictions(forecast_data)
        if not ml_result['success']:
            return jsonify({'success': False, 'message': ml_result['message']}), 500
        
        predictions_df = ml_result['predictions']
        
        # Analyze wind loss periods
        wind_periods = wind_api.analyze_wind_loss_periods(predictions_df)
        
        # Format results
        wind_loss_periods = []
        for period in wind_periods:
            wind_condition = "Low Wind Speed" if 'Low Wind' in period['loss_reason'] else "High Wind Speed"
            impact = "Turbines cannot operate" if 'Low Wind' in period['loss_reason'] else "Safety shutdown required"
            
            wind_loss_periods.append({
                'id': len(wind_loss_periods) + 1,
                'wind_condition': wind_condition,
                'start_time': period['start_time'],
                'end_time': period['end_time'],
                'duration_hours': period['duration_hours'],
                'power_loss_kw': period['total_power_loss_kw'],
                'avg_wind_speed': period['avg_wind_speed'],
                'min_wind_speed': period['min_wind_speed'],
                'max_wind_speed': period['max_wind_speed'],
                'affected_turbines': period['affected_turbines'],
                'turbine_count': period['turbine_count'],
                'impact_description': impact,
                'severity': 'High' if period['total_power_loss_kw'] > 10000 else 'Medium'
            })
        
        # Create summary
        total_loss = sum([p['power_loss_kw'] for p in wind_loss_periods])
        low_wind_periods = [p for p in wind_loss_periods if p['wind_condition'] == 'Low Wind Speed']
        high_wind_periods = [p for p in wind_loss_periods if p['wind_condition'] == 'High Wind Speed']
        
        summary = {
            'total_periods': len(wind_loss_periods),
            'low_wind_periods': len(low_wind_periods),
            'high_wind_periods': len(high_wind_periods),
            'total_power_loss_kw': round(total_loss, 1),
            'low_wind_loss_kw': round(sum([p['power_loss_kw'] for p in low_wind_periods]), 1),
            'high_wind_loss_kw': round(sum([p['power_loss_kw'] for p in high_wind_periods]), 1),
            'estimated_revenue_impact_usd': round(total_loss * 0.12, 2),
            'has_wind_losses': len(wind_loss_periods) > 0
        }
        
        return jsonify({
            'success': True,
            'test_scenario': scenario,
            'current_time': current_time.isoformat(),
            'forecast_info': {
                'start_time': current_time.isoformat(),
                'end_time': (current_time + timedelta(hours=48)).isoformat(),
                'duration_hours': 48,
                'total_predictions': len(forecast_data)
            },
            'wind_loss_summary': summary,
            'wind_loss_periods': wind_loss_periods,
            'message': f'Test scenario "{scenario}" executed successfully'
        })
        
    except Exception as e:
        logger.error(f"Test scenario error: {e}")
        return jsonify({
            'success': False,
            'message': f'Test failed: {str(e)}'
        }), 500

@app.route('/api/debug/wind-forecast', methods=['GET'])
def debug_wind_forecast():
    """Debug endpoint to see raw wind forecast data"""
    try:
        if not wind_api:
            return jsonify({'success': False, 'message': 'API not initialized'}), 500
        
        # Get wind forecast for current time
        wind_forecast_result = wind_api.get_wind_forecast_current(48)
        if not wind_forecast_result:
            return jsonify({'success': False, 'message': 'No wind forecast data'}), 500
        
        wind_forecast, current_time = wind_forecast_result
        
        # Analyze wind speeds
        wind_speeds = [item['Wind_Speed_Forecast'] for item in wind_forecast]
        
        # Count low/high wind events
        low_wind_count = sum(1 for ws in wind_speeds if ws < 3.0)
        high_wind_count = sum(1 for ws in wind_speeds if ws > 25.0)
        
        # Sample of forecast data (first 10 records)
        sample_data = wind_forecast[:10]
        
        return jsonify({
            'success': True,
            'debug_info': {
                'current_time': current_time.isoformat(),
                'total_forecast_points': len(wind_forecast),
                'wind_speed_stats': {
                    'min_wind': min(wind_speeds),
                    'max_wind': max(wind_speeds),
                    'avg_wind': round(sum(wind_speeds) / len(wind_speeds), 2),
                    'low_wind_events': low_wind_count,
                    'high_wind_events': high_wind_count
                },
                'sample_forecast': sample_data,
                'weather_mapping': f"Current {current_time.year} mapped to 2024 data"
            }
        })
        
    except Exception as e:
        logger.error(f"Debug forecast error: {e}")
        return jsonify({
            'success': False,
            'message': f'Debug failed: {str(e)}'
        }), 500

@app.route('/api/debug/ml-predictions', methods=['GET'])
def debug_ml_predictions():
    """Debug endpoint to see ML model predictions"""
    try:
        if not wind_api:
            return jsonify({'success': False, 'message': 'API not initialized'}), 500
        
        # Get wind forecast
        wind_forecast_result = wind_api.get_wind_forecast_current(48)
        if not wind_forecast_result:
            return jsonify({'success': False, 'message': 'No wind forecast data'}), 500
        
        wind_forecast, current_time = wind_forecast_result
        
        # Make ML predictions
        ml_result = wind_api.make_ml_predictions(wind_forecast)
        if not ml_result['success']:
            return jsonify({'success': False, 'message': ml_result['message']}), 500
        
        predictions_df = ml_result['predictions']
        
        # Analyze predictions
        total_predictions = len(predictions_df)
        power_losses = predictions_df['Predicted_Power_Loss_kW'].values
        loss_reasons = predictions_df['Loss_Reason'].value_counts().to_dict()
        
        # Sample predictions
        sample_predictions = predictions_df.head(10)[['Timestamp', 'Turbine_ID', 'Wind_Speed_Forecast', 
                                                     'Predicted_Power_Loss_kW', 'Loss_Reason']].to_dict('records')
        
        return jsonify({
            'success': True,
            'debug_info': {
                'total_predictions': total_predictions,
                'power_loss_stats': {
                    'min_loss': float(min(power_losses)),
                    'max_loss': float(max(power_losses)),
                    'avg_loss': float(power_losses.mean()),
                    'total_loss': float(power_losses.sum())
                },
                'loss_reason_counts': loss_reasons,
                'sample_predictions': sample_predictions
            }
        })
        
    except Exception as e:
        logger.error(f"Debug ML error: {e}")
        return jsonify({
            'success': False,
            'message': f'Debug failed: {str(e)}'
        }), 500

@app.route('/api/model/info', methods=['GET'])
def get_model_info():
    """Get model information"""
    try:
        if not wind_api or not wind_api.config:
            return jsonify({
                'success': False,
                'message': 'Model not loaded'
            }), 500
        
        return jsonify({
            'success': True,
            'model_info': {
                'model_type': wind_api.config.get('model_type', 'XGBoost'),
                'training_r2': wind_api.config.get('training_metrics', {}).get('r2_score', 'Unknown'),
                'training_samples': wind_api.config.get('training_samples', 'Unknown'),
                'training_timestamp': wind_api.config.get('training_timestamp', 'Unknown'),
                'features_count': len(wind_api.feature_columns) if wind_api.feature_columns else 0,
                'turbines': wind_api.config.get('turbines', list(range(1, 11))),
                'update_frequency': 'hourly',
                'weather_source': '2024 parallel data mapping'
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error getting model info: {str(e)}'
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'Endpoint not found',
        'available_endpoints': [
            'GET /api/health',
            'GET /api/wind-loss/current',
            'GET /api/wind-loss/summary',
            'POST /api/wind-loss/force-update',
            'GET /api/wind-loss/status',
            'GET /api/model/info'
        ]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': 'Internal server error'
    }), 500

def run_server():
    """Run the development server"""
    print("Starting Auto Wind Loss Prediction API...")
    print("=" * 55)
    
    if wind_api and wind_api.weather_data is not None and wind_api.model is not None:
        print("API initialized successfully")
        print(f"Weather data loaded: {len(wind_api.weather_data)} records")
        print("ML model loaded and ready")
        print("Automatic hourly updates: ENABLED")
    else:
        print("API initialization issues detected")
    
    print("\nAvailable Endpoints:")
    print("  GET  /api/health                     - Health check")
    print("  GET  /api/wind-loss/current          - Current predictions (auto-updated)")
    print("  GET  /api/wind-loss/summary          - Quick summary")
    print("  POST /api/wind-loss/force-update     - Force immediate update")
    print("  GET  /api/wind-loss/status           - System status")
    print("  GET  /api/model/info                 - Model information")
    
    print("\nSystem Features:")
    print("  Automatic hourly predictions using current date/time")
    print("  Maps current time to 2024 parallel weather data")
    print("  Focuses only on wind-related power losses")
    print("  Provides exact time periods and power loss amounts")
    
    print("\nServer starting at: http://localhost:5000")
    print("=" * 55)
    
    app.run(debug=True, host='0.0.0.0', port=5000)

if __name__ == "__main__":
    # Install schedule if not available
    try:
        import schedule
    except ImportError:
        print("Installing required package 'schedule'...")
        import subprocess
        subprocess.check_call(['pip', 'install', 'schedule'])
        import schedule
    
    run_server()