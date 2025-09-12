import pandas as pd
import numpy as np
import joblib
import json
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
import threading
import time
from flask_cors import CORS

class CalibratedLightningBackend:
    """
    Lightning forecast backend with rolling 6-hour windows
    Always shows current 6-hour period + next 3 periods (24 hours total)
    Updates at each 6-hour boundary: 00:00, 06:00, 12:00, 18:00
    """
    
    def __init__(self):
        self.weather_data = None
        self.model = None
        self.feature_list = None
        self.training_stats = None
        self.current_forecast = None
        self.last_update_time = None
        
        # Auto-update settings
        self.auto_update_enabled = False
        self.auto_update_thread = None
        
        # 6-hour boundaries
        self.six_hour_boundaries = [0, 6, 12, 18]  # 00:00, 06:00, 12:00, 18:00
        
        # Load everything
        self.load_data()
        self.load_training_statistics()
        
        # Adjusted risk thresholds
        self.thresholds = {
            'normal': 0.15,
            'elevated': 0.30,
            'high': 0.50
        }
        
        # Generate initial forecast
        self.update_forecast()
        
        print(f"Lightning Backend initialized with rolling 6-hour forecast")
        print(f"Update boundaries: {', '.join([f'{h:02d}:00' for h in self.six_hour_boundaries])}")
    
    def load_data(self):
        """Load weather data, model, and feature list"""
        print("Loading weather data...")
        self.weather_data = pd.read_csv('2024_weather_processed.csv')
        self.weather_data['datetime_utc'] = pd.to_datetime(self.weather_data['datetime_utc'])
        print(f"Loaded {len(self.weather_data)} weather records")
        
        print("Loading model...")
        self.model = joblib.load('enhanced_enhanced_rf_model.pkl')
        print("Model loaded successfully")
        
        print("Loading feature list...")
        with open('enhanced_6hour_model_results.json', 'r') as f:
            results = json.load(f)
        self.feature_list = results['features_selected']
        print(f"Model requires {len(self.feature_list)} features")
    
    def load_training_statistics(self):
        """Load training data statistics for feature calibration"""
        try:
            training_data = pd.read_csv('lightning_6hour_risk_assessment_COMPLETE.csv')
            self.training_stats = {}
            for feature in self.feature_list:
                if feature in training_data.columns:
                    self.training_stats[feature] = {
                        'mean': training_data[feature].mean(),
                        'std': training_data[feature].std(),
                        'min': training_data[feature].min(),
                        'max': training_data[feature].max(),
                        'median': training_data[feature].median()
                    }
            print(f"Loaded training statistics for {len(self.training_stats)} features")
        except FileNotFoundError:
            print("Warning: Training data not found, using default feature scaling")
            self.training_stats = {}
    
    def get_current_6hour_period(self, current_time=None):
        """Find which 6-hour period the current time falls into"""
        if current_time is None:
            current_time = datetime.now()
        
        current_hour = current_time.hour
        
        # Find the 6-hour period that contains current hour
        for i, boundary in enumerate(self.six_hour_boundaries):
            next_boundary = self.six_hour_boundaries[(i + 1) % len(self.six_hour_boundaries)]
            
            # Handle wrap-around at midnight
            if boundary == 18:  # 18:00-00:00 case
                if current_hour >= boundary or current_hour < next_boundary:
                    return boundary
            else:  # All other cases
                if boundary <= current_hour < next_boundary:
                    return boundary
        
        return 0  # Fallback to midnight
    
    def get_next_update_time(self, current_time=None):
        """Get the next 6-hour boundary when forecast should update"""
        if current_time is None:
            current_time = datetime.now()
        
        current_period_start = self.get_current_6hour_period(current_time)
        
        # Find next boundary
        current_index = self.six_hour_boundaries.index(current_period_start)
        next_boundary_hour = self.six_hour_boundaries[(current_index + 1) % len(self.six_hour_boundaries)]
        
        # Calculate next update time
        if next_boundary_hour > current_time.hour:
            # Same day
            next_update = current_time.replace(hour=next_boundary_hour, minute=0, second=0, microsecond=0)
        else:
            # Next day (handles 18:00 -> 00:00 transition)
            next_update = (current_time + timedelta(days=1)).replace(
                hour=next_boundary_hour, minute=0, second=0, microsecond=0
            )
        
        return next_update
    
    def get_forecast_periods(self, current_time=None):
        """Get the 4 consecutive 6-hour periods starting from current period"""
        if current_time is None:
            current_time = datetime.now()
        
        current_period_start = self.get_current_6hour_period(current_time)
        current_index = self.six_hour_boundaries.index(current_period_start)
        
        periods = []
        
        for i in range(4):  # Current + next 3 periods = 24 hours
            boundary_index = (current_index + i) % len(self.six_hour_boundaries)
            start_hour = self.six_hour_boundaries[boundary_index]
            end_hour = self.six_hour_boundaries[(boundary_index + 1) % len(self.six_hour_boundaries)]
            
            # Calculate actual datetime for this period
            period_start = current_time.replace(hour=start_hour, minute=0, second=0, microsecond=0)
            
            # Handle day transitions
            if i > 0 and start_hour < self.six_hour_boundaries[current_index]:
                period_start += timedelta(days=1)
            elif i == 0 and start_hour > current_time.hour:
                period_start -= timedelta(days=1)
            
            # Period end time
            if end_hour > start_hour:
                period_end = period_start.replace(hour=end_hour)
            else:
                period_end = (period_start + timedelta(days=1)).replace(hour=end_hour)
            
            period_label = "CURRENT" if i == 0 else f"NEXT_{i}"
            
            periods.append({
                'label': period_label,
                'start_time': period_start,
                'end_time': period_end,
                'start_hour': start_hour,
                'end_hour': end_hour
            })
        
        return periods
    
    def calculate_6hour_features_exact(self, weather_window):
        """Calculate features exactly as they were computed during training"""
        if len(weather_window) == 0:
            return None
        
        features = {}
        
        # Basic aggregations matching training data
        features['T2M_mean'] = weather_window['T2M'].mean()
        features['T2M_max'] = weather_window['T2M'].max()
        features['T2M_std'] = weather_window['T2M'].std()
        features['T2MDEW_mean'] = weather_window['T2MDEW'].mean()
        features['T2MWET_mean'] = weather_window['T2MWET'].mean()
        features['QV2M_mean'] = weather_window['QV2M'].mean()
        features['QV2M_max'] = weather_window['QV2M'].max()
        features['RH2M_mean'] = weather_window['RH2M'].mean()
        features['RH2M_max'] = weather_window['RH2M'].max()
        
        # Precipitation features (most important)
        features['PRECTOTCORR_sum'] = weather_window['PRECTOTCORR'].sum()
        features['PRECTOTCORR_max'] = weather_window['PRECTOTCORR'].max()
        
        # Pressure features
        features['PS_mean'] = weather_window['PS'].mean()
        features['PS_min'] = weather_window['PS'].min()
        features['PS_std'] = weather_window['PS'].std()
        
        # Wind features
        features['WS10M_mean'] = weather_window['WS10M'].mean()
        features['WS10M_max'] = weather_window['WS10M'].max()
        features['WD10M_mean'] = weather_window['WD10M'].mean()
        features['WS50M_mean'] = weather_window['WS50M'].mean()
        features['WS50M_max'] = weather_window['WS50M'].max()
        features['WD50M_mean'] = weather_window['WD50M'].mean()
        features['WSC_mean'] = weather_window['WS10M'].mean() * 1.05
        features['WSC_max'] = weather_window['WS10M'].max() * 1.05
        
        # Derived features
        temp_dewpoint_diff = weather_window['T2M'] - weather_window['T2MDEW']
        features['temp_dewpoint_diff_mean'] = temp_dewpoint_diff.mean()
        features['temp_dewpoint_diff_max'] = temp_dewpoint_diff.max()
        
        temp_wetbulb_diff = weather_window['T2M'] - weather_window['T2MWET']
        features['temp_wetbulb_diff_mean'] = temp_wetbulb_diff.mean()
        features['temp_wetbulb_diff_max'] = temp_wetbulb_diff.max()
        
        # Wind shear
        wind_shear = weather_window['WS50M'] - weather_window['WS10M']
        features['wind_shear_mean'] = wind_shear.mean()
        features['wind_shear_max'] = wind_shear.max()
        
        # Atmospheric instability indices
        instability = features['temp_dewpoint_diff_mean'] * features['RH2M_mean'] / 100
        features['instability_score_mean'] = instability
        features['instability_score_max'] = features['temp_dewpoint_diff_max'] * features['RH2M_max'] / 100
        
        features['convective_potential_mean'] = features['temp_dewpoint_diff_mean'] * (features['RH2M_mean'] > 70)
        features['convective_potential_max'] = features['temp_dewpoint_diff_max'] * (features['RH2M_max'] > 70)
        
        features['atmospheric_instability_mean'] = features['instability_score_mean']
        features['atmospheric_instability_max'] = features['instability_score_max']
        
        features['moisture_flux_mean'] = features['QV2M_mean'] * features['WS10M_mean']
        features['moisture_flux_max'] = features['QV2M_max'] * features['WS10M_max']
        
        features['thermal_instability_mean'] = features['T2M_std'] * features['T2M_mean']
        features['thermal_instability_max'] = features['T2M_std'] * features['T2M_max']
        
        # Combined risk score
        risk_components = [
            features['convective_potential_max'],
            features['wind_shear_max'],
            features['PRECTOTCORR_max']
        ]
        features['combined_risk_score_mean'] = np.mean(risk_components)
        features['combined_risk_score_max'] = np.max(risk_components)
        
        # Binary indicators
        features['relative_humidity_high_sum'] = (weather_window['RH2M'] > 80).sum()
        features['temperature_high_sum'] = (weather_window['T2M'] > 30).sum()
        features['pressure_low_sum'] = (weather_window['PS'] < 1010).sum()
        features['wind_strong_sum'] = (weather_window['WS10M'] > 8).sum()
        features['has_precipitation_sum'] = (weather_window['PRECTOTCORR'] > 0.1).sum()
        
        # Temporal features
        first_time = weather_window['datetime_utc'].iloc[0]
        features['month'] = first_time.month
        features['day'] = first_time.day
        features['day_of_year'] = first_time.timetuple().tm_yday
        features['week_of_year'] = first_time.isocalendar()[1]
        
        # Seasonal indicators
        features['is_dry_season_max'] = 1 if first_time.month in [12, 1, 2, 3, 4] else 0
        features['is_monsoon_season_max'] = 1 if first_time.month in [6, 7, 8, 9] else 0
        features['is_transition_month_max'] = 1 if first_time.month in [5, 10, 11] else 0
        features['afternoon_peak_sum'] = 1 if 12 <= first_time.hour <= 17 else 0
        features['high_risk_months_max'] = 1 if first_time.month in [3, 4, 10, 11] else 0
        features['weekend_max'] = 1 if first_time.weekday() >= 5 else 0
        
        # Trigonometric features
        features['month_sin'] = np.sin(2 * np.pi * first_time.month / 12)
        features['month_cos'] = np.cos(2 * np.pi * first_time.month / 12)
        features['hour_sin_mean'] = np.sin(2 * np.pi * first_time.hour / 24)
        features['hour_cos_mean'] = np.cos(2 * np.pi * first_time.hour / 24)
        features['day_of_year_sin'] = np.sin(2 * np.pi * first_time.timetuple().tm_yday / 365)
        features['day_of_year_cos'] = np.cos(2 * np.pi * first_time.timetuple().tm_yday / 365)
        
        features['hour_block'] = first_time.hour // 6
        
        # Enhanced features
        if 'wind_shear_max' in features:
            if 'wind_shear_max' in self.training_stats:
                mean_val = self.training_stats['wind_shear_max']['mean']
                std_val = self.training_stats['wind_shear_max']['std']
                features['wind_shear_max_normalized'] = (features['wind_shear_max'] - mean_val) / std_val if std_val > 0 else 0
            else:
                features['wind_shear_max_normalized'] = features['wind_shear_max'] / 10.0
        
        features['moderate_rain_indicator'] = 1 if 2.0 < features['PRECTOTCORR_max'] <= 10.0 else 0
        
        instability_components = [
            features.get('atmospheric_instability_max', 0),
            features.get('convective_potential_max', 0),
            features.get('thermal_instability_max', 0),
            features.get('wind_shear_max', 0)
        ]
        features['composite_instability_index'] = np.mean([x for x in instability_components if x > 0])
        
        return features
    
    def predict_lightning_risk(self, features_dict):
        """Predict lightning risk with feature validation"""
        feature_vector = []
        missing_count = 0
        
        for feature_name in self.feature_list:
            if feature_name in features_dict and not pd.isna(features_dict[feature_name]):
                feature_vector.append(float(features_dict[feature_name]))
            else:
                if feature_name in self.training_stats:
                    feature_vector.append(self.training_stats[feature_name]['median'])
                else:
                    feature_vector.append(0.0)
                missing_count += 1
        
        if missing_count > 0:
            print(f"Warning: {missing_count}/{len(self.feature_list)} features missing")
        
        X = np.array(feature_vector).reshape(1, -1)
        probability = self.model.predict_proba(X)[0, 1]
        
        return probability
    
    def classify_risk_level(self, probability):
        """Convert probability to risk level"""
        if probability < self.thresholds['normal']:
            return {
                'level': 'NORMAL',
                'color': 'green',
                'guidance': 'Standard operations'
            }
        elif probability < self.thresholds['elevated']:
            return {
                'level': 'ELEVATED',
                'color': 'yellow', 
                'guidance': 'Monitor conditions'
            }
        else:
            return {
                'level': 'HIGH',
                'color': 'red',
                'guidance': 'Restrict outdoor work'
            }
    
    def update_forecast(self, current_time=None):
        """Update forecast for current 6-hour period + next 3 periods"""
        if current_time is None:
            current_time = datetime.now()
        
        # Get the 4 consecutive 6-hour periods
        periods = self.get_forecast_periods(current_time)
        
        forecasts = []
        
        for period in periods:
            # Map to 2024 weather data
            weather_start = period['start_time'].replace(year=2024)
            weather_end = period['end_time'].replace(year=2024)
            
            try:
                # Get weather data for this period
                mask = (self.weather_data['datetime_utc'] >= weather_start) & \
                       (self.weather_data['datetime_utc'] < weather_end)
                window_data = self.weather_data[mask]
                
                if len(window_data) < 3:
                    forecast = {
                        'period_type': period['label'],
                        'time_range': f"{period['start_hour']:02d}:00-{period['end_hour']:02d}:00",
                        'full_time': f"{period['start_time'].strftime('%H:%M %m-%d')} to {period['end_time'].strftime('%H:%M %m-%d')}",
                        'risk_percent': 0.0,
                        'risk_level': 'NO_DATA',
                        'max_precipitation': '0.0mm/h',
                        'guidance': 'Insufficient weather data'
                    }
                else:
                    # Calculate features
                    features = self.calculate_6hour_features_exact(window_data)
                    
                    if features is None:
                        raise Exception("Feature calculation failed")
                    
                    # Predict risk
                    probability = self.predict_lightning_risk(features)
                    risk_info = self.classify_risk_level(probability)
                    
                    # Get precipitation info
                    max_precip = features.get('PRECTOTCORR_max', 0.0)
                    
                    forecast = {
                        'period_type': period['label'],
                        'time_range': f"{period['start_hour']:02d}:00-{period['end_hour']:02d}:00",
                        'full_time': f"{period['start_time'].strftime('%H:%M %m-%d')} to {period['end_time'].strftime('%H:%M %m-%d')}",
                        'risk_percent': round(probability * 100, 1),
                        'risk_level': risk_info['level'],
                        'max_precipitation': f"{max_precip:.1f}mm/h",
                        'guidance': risk_info['guidance']
                    }
                
            except Exception as e:
                print(f"Error in forecast period {period['label']}: {e}")
                forecast = {
                    'period_type': period['label'],
                    'time_range': f"{period['start_hour']:02d}:00-{period['end_hour']:02d}:00",
                    'full_time': f"{period['start_time'].strftime('%H:%M %m-%d')} to {period['end_time'].strftime('%H:%M %m-%d')}",
                    'risk_percent': 0.0,
                    'risk_level': 'ERROR',
                    'max_precipitation': '0.0mm/h',
                    'guidance': 'Calculation error'
                }
            
            forecasts.append(forecast)
        
        current_period_start = self.get_current_6hour_period(current_time)
        next_update_time = self.get_next_update_time(current_time)
        
        self.current_forecast = {
            'current_time': current_time.strftime('%Y-%m-%d %H:%M:%S'),
            'current_period_start': f"{current_period_start:02d}:00",
            'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'next_update': next_update_time.strftime('%Y-%m-%d %H:%M:%S'),
            'forecasts': forecasts,
            'model_info': {
                'update_boundaries': [f'{h:02d}:00' for h in self.six_hour_boundaries],
                'thresholds_used': self.thresholds,
                'features_calculated': len(self.feature_list),
                'forecast_explanation': 'Shows current 6-hour period + next 3 periods (24 hours total)'
            }
        }
        
        self.last_update_time = datetime.now()
        print(f"Forecast updated at {self.last_update_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Current period: {current_period_start:02d}:00-{(current_period_start+6)%24:02d}:00")
        print(f"Next update: {next_update_time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        return self.current_forecast
    
    def auto_update_worker(self):
        """Background worker for 6-hour boundary updates"""
        while self.auto_update_enabled:
            try:
                current_time = datetime.now()
                next_update_time = self.get_next_update_time(current_time)
                
                # Calculate wait time
                wait_seconds = (next_update_time - current_time).total_seconds()
                
                if wait_seconds > 0:
                    print(f"Next forecast update in {wait_seconds/3600:.1f} hours at {next_update_time.strftime('%H:%M')}")
                    time.sleep(wait_seconds)
                
                if self.auto_update_enabled:
                    print(f"Auto-update triggered at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                    self.update_forecast()
                    
            except Exception as e:
                print(f"Auto-update error: {e}")
                time.sleep(300)  # Wait 5 minutes before retrying
    
    def start_auto_updates(self):
        """Start the auto-update system"""
        if not self.auto_update_enabled:
            self.auto_update_enabled = True
            self.auto_update_thread = threading.Thread(target=self.auto_update_worker, daemon=True)
            self.auto_update_thread.start()
            
            next_update = self.get_next_update_time()
            print(f"Auto-update started. Next update: {next_update.strftime('%Y-%m-%d %H:%M:%S')}")
            return True
        return False
    
    def stop_auto_updates(self):
        """Stop the auto-update system"""
        self.auto_update_enabled = False
        return True
    
    def get_current_forecast(self):
        """Get the current cached forecast"""
        if self.current_forecast is None:
            self.update_forecast()
        return self.current_forecast

# Initialize backend
try:
    print("Initializing Lightning Backend...")
    backend = CalibratedLightningBackend()
    print("Lightning Backend initialized successfully")
except Exception as e:
    print(f"Lightning Backend initialization failed: {e}")
    backend = None

# Flask app
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

@app.route('/health')
def health():
    if backend is None:
        return jsonify({'error': 'Lightning system not initialized'}), 500
    
    current_time = datetime.now()
    current_period = backend.get_current_6hour_period(current_time)
    next_update = backend.get_next_update_time(current_time)
    
    return jsonify({
        'status': 'healthy',
        'current_time': current_time.strftime('%Y-%m-%d %H:%M:%S'),
        'current_6hour_period': f"{current_period:02d}:00-{(current_period+6)%24:02d}:00",
        'weather_records': len(backend.weather_data),
        'model_loaded': backend.model is not None,
        'auto_update_enabled': backend.auto_update_enabled,
        'last_update': backend.last_update_time.strftime('%Y-%m-%d %H:%M:%S') if backend.last_update_time else 'Never',
        'next_update': next_update.strftime('%Y-%m-%d %H:%M:%S'),
        'update_boundaries': [f'{h:02d}:00' for h in backend.six_hour_boundaries],
        'risk_thresholds': backend.thresholds
    })

@app.route('/forecast')
def forecast():
    if backend is None:
        return jsonify({'error': 'Lightning system not initialized'}), 500
    
    try:
        # Return current cached forecast (always shows current period + next 3)
        result = backend.get_current_forecast()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/forecast/update')
def force_update():
    """Force an immediate forecast update"""
    if backend is None:
        return jsonify({'error': 'Lightning system not initialized'}), 500
    
    try:
        result = backend.update_forecast()
        return jsonify({
            'status': 'updated',
            'message': 'Forecast updated successfully',
            'forecast': result
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/auto-update/start')
def start_auto_update():
    """Start automatic 6-hour boundary updates"""
    if backend is None:
        return jsonify({'error': 'Lightning system not initialized'}), 500
    
    if backend.start_auto_updates():
        return jsonify({
            'status': 'started',
            'message': 'Auto-update started - will update at each 6-hour boundary',
            'boundaries': [f'{h:02d}:00' for h in backend.six_hour_boundaries],
            'next_update': backend.get_next_update_time().strftime('%Y-%m-%d %H:%M:%S')
        })
    else:
        return jsonify({
            'status': 'already_running',
            'message': 'Auto-update is already active'
        })

@app.route('/auto-update/stop')
def stop_auto_update():
    """Stop automatic updates"""
    if backend is None:
        return jsonify({'error': 'Lightning system not initialized'}), 500
    
    backend.stop_auto_updates()
    return jsonify({
        'status': 'stopped',
        'message': 'Auto-update stopped'
    })

@app.route('/current-period')
def current_period_info():
    """Get detailed information about the current 6-hour period"""
    if backend is None:
        return jsonify({'error': 'Lightning system not initialized'}), 500
    
    current_time = datetime.now()
    current_period_start = backend.get_current_6hour_period(current_time)
    next_update = backend.get_next_update_time(current_time)
    periods = backend.get_forecast_periods(current_time)
    
    return jsonify({
        'current_time': current_time.strftime('%Y-%m-%d %H:%M:%S'),
        'current_period': f"{current_period_start:02d}:00-{(current_period_start+6)%24:02d}:00",
        'next_update': next_update.strftime('%Y-%m-%d %H:%M:%S'),
        'time_until_update': str(next_update - current_time),
        'all_periods': [
            {
                'label': p['label'],
                'range': f"{p['start_hour']:02d}:00-{p['end_hour']:02d}:00",
                'start_time': p['start_time'].strftime('%Y-%m-%d %H:%M:%S'),
                'end_time': p['end_time'].strftime('%Y-%m-%d %H:%M:%S')
            } for p in periods
        ],
        'auto_update_enabled': backend.auto_update_enabled
    })

if __name__ == '__main__':
    if backend:
        print("Starting Lightning Forecast API with rolling 6-hour windows...")
        print("Available endpoints:")
        print("- GET /health - System status")
        print("- GET /forecast - Current period + next 3 periods forecast")
        print("- GET /forecast/update - Force forecast update")
        print("- GET /auto-update/start - Start auto-updates")
        print("- GET /auto-update/stop - Stop auto-updates")
        print("- GET /current-period - Current period details")
        print(f"Server starting on port 5001...")
        app.run(debug=True, host='0.0.0.0', port=5001)
    else:
        print("Failed to initialize lightning backend")