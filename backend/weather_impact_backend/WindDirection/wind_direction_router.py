from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import pandas as pd
import numpy as np
import joblib
import json
import io
import logging
from datetime import datetime, timedelta
import os
import warnings
from typing import Dict, List
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

class WindFarmPipeline:
    """
    Unified ML pipeline for 10-turbine wind farm power loss prediction
    Matches the exact training approach from HourlyPowerLossModel
    """
    
    def __init__(self):
        # ML components
        self.model = None
        self.scaler = None
        self.wind_corrections = {}
        self.is_loaded = False
        
        # Weather data
        self.weather_data = None
        self.data_start_date = None
        self.data_end_date = None
        
        # Prediction cache
        self.cached_predictions = {}
        self.last_prediction_time = None
        
        # 10 turbines configuration
        self.turbine_list = ['WTG01', 'WTG02', 'WTG03', 'WTG04', 'WTG05', 
                           'WTG06', 'WTG07', 'WTG08', 'WTG09', 'WTG10']
    
    def load_models(self, model_path: str, scaler_path: str, corrections_path: str):
        """Load ML models and turbine corrections"""
        try:
            self.model = joblib.load(model_path)
            logger.info(f"Model loaded: {model_path}")
            
            self.scaler = joblib.load(scaler_path)
            logger.info(f"Scaler loaded: {scaler_path}")
            
            # Load corrections for 10 turbines only
            with open(corrections_path, 'r') as f:
                corrections_data = json.load(f)
                all_corrections = corrections_data['corrections']
                
                # Filter to only our 10 turbines
                self.wind_corrections = {
                    turbine: all_corrections[turbine] 
                    for turbine in self.turbine_list 
                    if turbine in all_corrections
                }
            
            logger.info(f"Wind corrections loaded: {len(self.wind_corrections)} turbines")
            self.is_loaded = True
            return True
            
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            return False
    
    def load_weather_data(self, csv_file_path: str):
        """Load weather data from 2024 CSV file"""
        try:
            self.weather_data = pd.read_csv(csv_file_path)
            logger.info(f"CSV file loaded with {len(self.weather_data)} rows")
            
            # Detect datetime column
            datetime_column = self._detect_datetime_column()
            if datetime_column:
                self.weather_data['datetime'] = pd.to_datetime(self.weather_data[datetime_column])
            else:
                self._create_hourly_timestamps_2024()
            
            # Standardize column names
            self._standardize_column_names()
            
            # Sort by datetime
            self.weather_data = self.weather_data.sort_values('datetime').reset_index(drop=True)
            
            # Store date range
            self.data_start_date = self.weather_data['datetime'].min()
            self.data_end_date = self.weather_data['datetime'].max()
            
            logger.info(f"Weather data loaded: {len(self.weather_data)} records")
            logger.info(f"  Date range: {self.data_start_date} to {self.data_end_date}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error loading weather data: {e}")
            return False
    
    def _detect_datetime_column(self):
        """Detect datetime column in CSV file"""
        possible_names = ['datetime', 'timestamp', 'date', 'time', 'DATE', 'DATETIME']
        
        for col in self.weather_data.columns:
            if col in possible_names:
                return col
            if self.weather_data[col].dtype in ['object', 'datetime64[ns]']:
                try:
                    pd.to_datetime(self.weather_data[col].head())
                    return col
                except:
                    continue
        return None
    
    def _create_hourly_timestamps_2024(self):
        """Create hourly timestamps starting from 2024 data if no datetime column exists"""
        # Start from January 1, 2024 for demo purposes
        start_date = datetime(2024, 1, 1, 0, 0, 0)
        timestamps = [start_date + timedelta(hours=i) for i in range(len(self.weather_data))]
        self.weather_data['datetime'] = timestamps
        logger.info(f"Created {len(timestamps)} hourly timestamps starting from {start_date}")
    
    def get_parallel_2024_time(self, current_time):
        """Convert current 2025 time to parallel 2024 time for data lookup"""
        return current_time.replace(year=2024)
    
    def _standardize_column_names(self):
        """Standardize weather column names"""
        column_mappings = {
            'WS50M': 'wind_speed', 'WD50M': 'wind_direction',
            'WS10M': 'wind_speed', 'WD10M': 'wind_direction',
            'wind_speed': 'wind_speed', 'windspeed': 'wind_speed',
            'wind_direction': 'wind_direction', 'winddirection': 'wind_direction'
        }
        
        for old_name, new_name in column_mappings.items():
            if old_name in self.weather_data.columns:
                self.weather_data = self.weather_data.rename(columns={old_name: new_name})
                logger.info(f"Mapped column: {old_name} -> {new_name}")
        
        # Add defaults for missing columns
        if 'temperature' not in self.weather_data.columns:
            self.weather_data['temperature'] = 25.0
        if 'pressure' not in self.weather_data.columns:
            self.weather_data['pressure'] = 1013.0
    
    def _generate_fallback_weather_2024(self, hours):
        """Generate fallback weather data when CSV loading fails"""
        current_time = datetime.now()
        parallel_2024_time = self.get_parallel_2024_time(current_time)
        
        forecast_data = []
        for i in range(hours):
            forecast_time = parallel_2024_time + timedelta(hours=i)
            forecast_data.append({
                'datetime': forecast_time,
                'wind_speed': max(0, 8.5 + np.random.normal(0, 1.5)),  # Realistic wind speeds
                'wind_direction': (245 + np.random.normal(0, 20)) % 360,  # Realistic directions
                'temperature': 26.0,
                'pressure': 1013.0
            })
        
        logger.warning(f"Using fallback weather data for {hours} hours")
        return pd.DataFrame(forecast_data)
    
    def get_weather_forecast(self, hours: int = 48) -> pd.DataFrame:
        """Get weather forecast using current real time mapped to 2024 data"""
        if self.weather_data is None:
            return self._generate_fallback_weather_2024(hours)
        
        # Get current real time and map to 2024 equivalent
        current_real_time = datetime.now()
        parallel_2024_time = self.get_parallel_2024_time(current_real_time)
        parallel_2024_time_rounded = parallel_2024_time.replace(minute=0, second=0, microsecond=0)
        
        # Find the closest timestamp in 2024 data
        time_diffs = abs(self.weather_data['datetime'] - parallel_2024_time_rounded)
        closest_index = time_diffs.idxmin()
        
        logger.info(f"Current real time: {current_real_time}")
        logger.info(f"Looking for 2024 data at: {parallel_2024_time_rounded}")
        logger.info(f"Found closest 2024 data at: {self.weather_data.loc[closest_index, 'datetime']}")
        
        # Extract next 'hours' of data starting from closest index
        forecast_data = []
        
        for i in range(hours):
            data_index = closest_index + i
            
            # If we run out of data, use cyclic repetition
            if data_index >= len(self.weather_data):
                data_index = data_index % len(self.weather_data)
            
            # Get 2024 weather data - FIXED: Convert to dict to avoid Series issues
            weather_row = self.weather_data.iloc[data_index].to_dict()
            
            # Keep the datetime progression in 2024 (not 2025)
            forecast_time = parallel_2024_time_rounded + timedelta(hours=i)
            weather_row['datetime'] = forecast_time
            
            # Add slight variation to make it realistic - NOW WORKS WITH DICT
            if 'wind_speed' in weather_row:
                current_wind_speed = float(weather_row['wind_speed'])
                weather_row['wind_speed'] = max(0, current_wind_speed + np.random.normal(0, 0.1))
            if 'wind_direction' in weather_row:
                current_wind_dir = float(weather_row['wind_direction'])
                weather_row['wind_direction'] = (current_wind_dir + np.random.normal(0, 1)) % 360
            
            forecast_data.append(weather_row)
        
        result_df = pd.DataFrame(forecast_data).reset_index(drop=True)
        logger.info(f"Generated 2024 forecast from {result_df['datetime'].min()} to {result_df['datetime'].max()}")
        
        return result_df
    
    def get_training_features(self) -> List[str]:
        """Return exact ML model feature list from training"""
        return [
            # Wind features (11 features)
            'Wind_Dir_Volatility_6h', 'Wind_Dir_Volatility_12h', 'Wind_Dir_Volatility_24h',
            'Wind_Dir_Change_1h', 'Wind_Dir_Change_6h', 'Wind_Speed_Mean',
            'Wind_Speed_Avg_6h', 'Wind_Speed_Volatility_6h', 'Wind_Speed_Avg_12h',
            'Wind_Direction_Std', 'Wind_Speed_Std',
            # Operational features (5 features)
            'Recent_Power_Loss_6h', 'Recent_Events_6h', 'Consecutive_Normal_Hours',
            'Hours_Since_Last_Event', 'Hourly_Repositioning_Events',
            # Time features (10 features)
            'Hour_of_Day', 'Day_of_Week', 'Month', 'Is_Afternoon_Peak',
            'Is_High_Repo_Month', 'Is_Weekend', 'Hour_Sin', 'Hour_Cos',
            'Month_Sin', 'Month_Cos',
            # Turbine feature (1 feature)
            'Turbine_ID_Encoded'
        ]
    
    def apply_wind_correction(self, turbine_id: str, wind_direction: float) -> float:
        """Apply turbine-specific wind direction correction"""
        if turbine_id in self.wind_corrections:
            correction = self.wind_corrections[turbine_id]['offset_degrees']
            return (wind_direction + correction) % 360
        return wind_direction
    
    def calculate_circular_stats(self, wind_dir_series: pd.Series, window: int) -> float:
        """Calculate circular standard deviation for wind direction - ROBUST VERSION"""
        try:
            if len(wind_dir_series) < 1:
                return 0.0
            
            # Convert to numpy array to avoid pandas Series issues
            values = wind_dir_series.tail(min(window, len(wind_dir_series))).values
            
            if len(values) == 0:
                return 0.0
            
            # Remove any NaN values
            values = values[~np.isnan(values)]
            
            if len(values) == 0:
                return 0.0
            
            # Convert to radians and calculate circular stats
            rad_values = np.radians(values)
            mean_cos = np.mean(np.cos(rad_values))
            mean_sin = np.mean(np.sin(rad_values))
            R = np.sqrt(mean_cos**2 + mean_sin**2)
            
            if R <= 0:
                return 180.0
            
            circular_std = np.degrees(np.sqrt(-2 * np.log(max(R, 1e-10))))
            return min(circular_std, 180.0)
            
        except Exception as e:
            logger.error(f"Error in calculate_circular_stats: {e}")
            return 0.0
        
    def calculate_features(self, weather_window: pd.DataFrame, turbine_id: str, timestamp: datetime) -> np.ndarray:
        """Calculate all 27 features for prediction - FIXED pandas Series issue"""
        # Apply wind correction
        weather_window = weather_window.copy()
        weather_window['corrected_wind_direction'] = weather_window['wind_direction'].apply(
            lambda x: self.apply_wind_correction(turbine_id, x)
        )
        
        features = {}
        corrected_wind_series = weather_window['corrected_wind_direction']
        
        # Wind features
        features['Wind_Speed_Mean'] = float(weather_window['wind_speed'].iloc[-1])
        features['Wind_Speed_Std'] = float(weather_window['wind_speed'].rolling(window=6, min_periods=1).std().iloc[-1])
        features['Wind_Direction_Std'] = float(self.calculate_circular_stats(corrected_wind_series, 6))
        features['Wind_Dir_Volatility_6h'] = float(self.calculate_circular_stats(corrected_wind_series, 6))
        features['Wind_Dir_Volatility_12h'] = float(self.calculate_circular_stats(corrected_wind_series, 12))
        features['Wind_Dir_Volatility_24h'] = float(self.calculate_circular_stats(corrected_wind_series, 24))
        features['Wind_Speed_Avg_6h'] = float(weather_window['wind_speed'].rolling(window=6, min_periods=1).mean().iloc[-1])
        features['Wind_Speed_Volatility_6h'] = float(weather_window['wind_speed'].rolling(window=6, min_periods=1).std().iloc[-1])
        features['Wind_Speed_Avg_12h'] = float(weather_window['wind_speed'].rolling(window=12, min_periods=1).mean().iloc[-1])
        
        # Wind direction changes - FIXED Series comparison issue
        corrected_diff = corrected_wind_series.diff()
        corrected_diff = corrected_diff.apply(lambda x: x if pd.isna(x) else (x - 360 if x > 180 else (x + 360 if x < -180 else x)))
        
        # Fix the pandas Series boolean issue
        if len(corrected_diff) > 1:
            last_diff = corrected_diff.iloc[-1]
            features['Wind_Dir_Change_1h'] = float(abs(last_diff)) if not pd.isna(last_diff) else 0.0
        else:
            features['Wind_Dir_Change_1h'] = 0.0
        
        if len(corrected_diff) >= 6:
            rolling_max = corrected_diff.rolling(window=6, min_periods=1).apply(lambda x: np.max(np.abs(x.dropna())))
            features['Wind_Dir_Change_6h'] = float(rolling_max.iloc[-1])
        else:
            features['Wind_Dir_Change_6h'] = features['Wind_Dir_Change_1h']
        
        # Operational features (conservative assumptions for forecasting)
        features.update({
            'Recent_Power_Loss_6h': 0, 'Recent_Events_6h': 0,
            'Consecutive_Normal_Hours': 6, 'Hours_Since_Last_Event': 12,
            'Hourly_Repositioning_Events': 0
        })
        
        # Time features - exactly matching training approach
        features.update({
            'Hour_of_Day': timestamp.hour, 
            'Day_of_Week': timestamp.weekday(), 
            'Month': timestamp.month,
            'Is_Weekend': 1 if timestamp.weekday() >= 5 else 0,
            'Is_Afternoon_Peak': 1 if 12 <= timestamp.hour <= 16 else 0,
            'Is_High_Repo_Month': 1 if timestamp.month in [3, 4, 5, 8] else 0,
            'Hour_Sin': np.sin(2 * np.pi * timestamp.hour / 24),
            'Hour_Cos': np.cos(2 * np.pi * timestamp.hour / 24),
            'Month_Sin': np.sin(2 * np.pi * timestamp.month / 12),
            'Month_Cos': np.cos(2 * np.pi * timestamp.month / 12)
        })
        
        # Turbine feature - encode exactly like training (Turbine_ID_Encoded)
        features['Turbine_ID_Encoded'] = self.turbine_list.index(turbine_id) if turbine_id in self.turbine_list else 0
        
        # Fill any NaN values
        for key, value in features.items():
            if pd.isna(value):
                features[key] = 0.0
        
        # Create feature array in exact order used in training
        feature_names = self.get_training_features()
        return np.array([[features[name] for name in feature_names]])
    
    def predict_all_turbines(self, weather_forecast: pd.DataFrame) -> pd.DataFrame:
        """Generate predictions for all 10 turbines"""
        if not self.is_loaded:
            raise Exception("Models not loaded")
        
        all_predictions = []
        
        for turbine_id in self.turbine_list:
            for i, row in weather_forecast.iterrows():
                # Create weather window for feature calculation
                window_start = max(0, i - 23)  # 24-hour window
                weather_window = weather_forecast.iloc[window_start:i+1].copy()
                
                # Calculate features and predict
                feature_array = self.calculate_features(weather_window, turbine_id, row['datetime'])
                feature_scaled = self.scaler.transform(feature_array)
                power_loss = self.model.predict(feature_scaled)[0]
                
                # Ensure non-negative predictions (matching training approach)
                power_loss = max(0, power_loss)
                
                # Get corrected wind direction for output
                corrected_wind_dir = self.apply_wind_correction(turbine_id, row['wind_direction'])
                
                all_predictions.append({
                    'turbine_id': turbine_id,
                    'hour': i,
                    'datetime': row['datetime'],
                    'original_wind_direction': row['wind_direction'],
                    'corrected_wind_direction': corrected_wind_dir,
                    'wind_speed': row['wind_speed'],
                    'predicted_power_loss': power_loss
                })
        
        predictions_df = pd.DataFrame(all_predictions)
        
        logger.info(f"Generated predictions for {len(self.turbine_list)} turbines, {len(weather_forecast)} hours each")
        logger.info(f"Total predictions: {len(predictions_df)}")
        logger.info(f"Power loss range: {predictions_df['predicted_power_loss'].min():.1f} - {predictions_df['predicted_power_loss'].max():.1f} kW")
        
        return predictions_df
    
    def update_predictions(self):
        """Update cached predictions with detailed error tracking"""
        try:
            current_time = datetime.now()
            logger.info(f"Starting prediction update at {current_time}")
            
            # Generate predictions for different time horizons
            logger.info("Generating 6h forecast...")
            weather_6h = self.get_weather_forecast(6)
            pred_6h = self.predict_all_turbines(weather_6h)
            
            logger.info("Generating 12h forecast...")
            weather_12h = self.get_weather_forecast(12)
            pred_12h = self.predict_all_turbines(weather_12h)
            
            logger.info("Generating 24h forecast...")
            weather_24h = self.get_weather_forecast(24)
            pred_24h = self.predict_all_turbines(weather_24h)
            
            logger.info("Generating 48h forecast...")
            weather_48h = self.get_weather_forecast(48)
            pred_48h = self.predict_all_turbines(weather_48h)
            
            self.cached_predictions = {
                '6h': pred_6h,
                '12h': pred_12h,
                '24h': pred_24h,
                '48h': pred_48h
            }
            
            self.last_prediction_time = current_time
            logger.info(f"Predictions updated successfully at {current_time.strftime('%H:%M')}")
            
        except Exception as e:
            logger.error(f"Error updating predictions: {e}")
            import traceback
            traceback.print_exc()

    def get_current_weather(self) -> dict:
        """Get current weather conditions using 2024 parallel time"""
        if self.weather_data is not None:
            current_real_time = datetime.now()
            parallel_2024_time = self.get_parallel_2024_time(current_real_time)
            
            # Find closest timestamp in 2024 data
            time_diffs = abs(self.weather_data['datetime'] - parallel_2024_time)
            closest_index = time_diffs.idxmin()
            current_weather = self.weather_data.iloc[closest_index]
            
            return {
                'windSpeed': float(current_weather.get('wind_speed', 8.5)),
                'temperature': float(current_weather.get('temperature', 26.8)),
                'humidity': 65.0,
                'pressure': float(current_weather.get('pressure', 1013.0)),
                'windDirection': float(current_weather.get('wind_direction', 245.0)),
                'visibility': 15.0
            }
        else:
            return {
                'windSpeed': 8.5, 'temperature': 26.8, 'humidity': 65.0,
                'pressure': 1013.0, 'windDirection': 245.0, 'visibility': 15.0
            }

# Initialize global pipeline on import
pipeline = WindFarmPipeline()

# Try to initialize on import
try:
    logger.info("Initializing wind direction pipeline...")
    
    # Load ML models
    success = pipeline.load_models(
    model_path="weather_impact_backend/WindDirection/ml_training_data/hourly_power_loss_model_20250814_234606.pkl",
    scaler_path="weather_impact_backend/WindDirection/ml_training_data/hourly_feature_scaler_20250814_234606.pkl",
    corrections_path="weather_impact_backend/WindDirection/turbine_wind_corrections.json"
    )
    
    if success:
        # Load weather data from CSV files
        csv_files = [f for f in os.listdir('weather_impact_backend/WindDirection') if f.endswith('.csv')]
        if csv_files:
            weather_file = None
            for file in csv_files:
                if any(keyword in file.lower() for keyword in ['weather', 'forecast', '2024']):
                    weather_file = f"weather_impact_backend/WindDirection/{file}"
                    break
            if not weather_file:
                weather_file = f"weather_impact_backend/WindDirection/{csv_files[0]}"
            
            pipeline.load_weather_data(weather_file)
            
        # Generate initial predictions
        pipeline.update_predictions()
        
        logger.info("Wind direction pipeline initialization complete")
    
except Exception as e:
    logger.error(f"Error during wind direction pipeline initialization: {e}")

# FastAPI endpoints (converted from original FastAPI app)
@router.get("/health")
async def health_check():
    return {
        "status": "healthy" if pipeline.is_loaded else "unhealthy",
        "turbines": pipeline.turbine_list,
        "model_loaded": pipeline.is_loaded,
        "weather_loaded": pipeline.weather_data is not None,
        "last_prediction": pipeline.last_prediction_time.isoformat() if pipeline.last_prediction_time else None,
        "weather_date_range": {
            "start": pipeline.data_start_date.isoformat() if pipeline.data_start_date else None,
            "end": pipeline.data_end_date.isoformat() if pipeline.data_end_date else None
        },
        "model_features": len(pipeline.get_training_features())
    }

@router.get("/current")
async def get_current_predictions():
    """Get 6-hour hourly power loss predictions"""
    if not pipeline.is_loaded:
        raise HTTPException(status_code=503, detail="ML models not loaded")
    
    try:
        # Use cached predictions or generate fresh ones
        if '6h' in pipeline.cached_predictions and pipeline.last_prediction_time:
            all_predictions = pipeline.cached_predictions['6h']
        else:
            weather_forecast = pipeline.get_weather_forecast(6)
            all_predictions = pipeline.predict_all_turbines(weather_forecast)
        
        # Aggregate by hour for UI
        hourly_agg = all_predictions.groupby(['hour', 'datetime']).agg({
            'predicted_power_loss': 'sum',
            'corrected_wind_direction': 'mean',
            'original_wind_direction': 'mean'
        }).reset_index()
        
        predictions_list = []
        for _, row in hourly_agg.iterrows():
            predictions_list.append({
                "time": row['datetime'].strftime("%H:%M"),
                "date": row['datetime'].strftime("%Y-%m-%d"),
                "windDir": int(row['corrected_wind_direction']),
                "prevDir": int(row['original_wind_direction']),
                "powerLoss": round(row['predicted_power_loss'], 1),  # kWh
                "duration": f"{max(4, int(row['predicted_power_loss'] / 10))} min"
            })
        
        return {
            "success": True,
            "data": {"predictions": predictions_list},
            "meta": {
                "turbines": len(pipeline.turbine_list),
                "last_update": pipeline.last_prediction_time.isoformat() if pipeline.last_prediction_time else None,
                "prediction_type": "Hourly power loss (kWh)",
                "demo_mode": "2024 data"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.get("/summary")
async def get_predictions_summary():
    """Get summary statistics for different time horizons"""
    if not pipeline.is_loaded:
        raise HTTPException(status_code=503, detail="ML models not loaded")
    
    try:
        # Use cached 48h predictions
        if '48h' in pipeline.cached_predictions:
            all_predictions = pipeline.cached_predictions['48h']
        else:
            weather_forecast = pipeline.get_weather_forecast(48)
            all_predictions = pipeline.predict_all_turbines(weather_forecast)
        
        # Calculate summaries for different time horizons
        summary_6h = all_predictions[all_predictions['hour'] < 6]['predicted_power_loss'].sum()
        summary_12h = all_predictions[all_predictions['hour'] < 12]['predicted_power_loss'].sum()
        summary_24h = all_predictions[all_predictions['hour'] < 24]['predicted_power_loss'].sum()
        summary_48h = all_predictions['predicted_power_loss'].sum()
        
        # Risk assessment based on kWh levels
        hourly_totals = all_predictions.groupby('hour')['predicted_power_loss'].sum()
        high_risk_hours = len(hourly_totals[hourly_totals > 50])  # Hours with >50 kWh loss
        
        return {
            "success": True,
            "data": {
                "next_6_hours": round(summary_6h, 1),
                "next_12_hours": round(summary_12h, 1),
                "next_24_hours": round(summary_24h, 1),
                "next_48_hours": round(summary_48h, 1),
                "avg_repositioning_time": 8.5,
                "direction_changes": high_risk_hours,
                "revenue_impact": round(summary_6h * 0.06, 2)  # $0.06/kWh
            },
            "meta": {
                "turbines": len(pipeline.turbine_list),
                "last_update": pipeline.last_prediction_time.isoformat() if pipeline.last_prediction_time else None,
                "unit": "kWh (hourly power loss)",
                "demo_mode": "2024 data"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary error: {str(e)}")

@router.get("/download-predictions-csv")
async def download_predictions_csv():
    """Download 48-hour hourly power loss predictions as CSV with 2024 timestamps"""
    if not pipeline.is_loaded:
        raise HTTPException(status_code=503, detail="ML models not loaded")
    
    try:
        # Get 48h predictions
        if '48h' in pipeline.cached_predictions:
            all_predictions = pipeline.cached_predictions['48h']
        else:
            weather_forecast = pipeline.get_weather_forecast(48)
            all_predictions = pipeline.predict_all_turbines(weather_forecast)
        
        # Create CSV data using 2024 timeline (parallel to current real time)
        df_data = []
        current_real_time = datetime.now()
        parallel_2024_time = pipeline.get_parallel_2024_time(current_real_time)
        demo_base_time = parallel_2024_time.replace(minute=0, second=0, microsecond=0)
        
        for hour_idx in range(48):
            current_time_hour = demo_base_time + timedelta(hours=hour_idx)
            hour_predictions = all_predictions[all_predictions['hour'] == hour_idx]
            
            row = {
                'timestamp': current_time_hour,
                'Date': current_time_hour.strftime('%Y-%m-%d'),
                'Hour': current_time_hour.hour,
                'Day': current_time_hour.strftime('%A'),
                'Period_6h': hour_idx // 6 + 1,
                'Period_Label': f"Period {hour_idx // 6 + 1}"
            }
            
            # Add turbine columns - hourly power loss in kWh
            total_loss = 0
            for turbine in pipeline.turbine_list:
                turbine_data = hour_predictions[hour_predictions['turbine_id'] == turbine]
                loss_value = float(turbine_data['predicted_power_loss'].iloc[0]) if not turbine_data.empty else 0.0
                row[turbine] = round(loss_value, 6)
                total_loss += loss_value
            
            row['Total_WindFarm_Loss_kWh'] = round(total_loss, 6)
            df_data.append(row)
        
        # Create DataFrame and CSV
        df = pd.DataFrame(df_data)
        column_order = ['timestamp'] + pipeline.turbine_list + ['Total_WindFarm_Loss_kWh', 'Date', 'Hour', 'Day', 'Period_6h', 'Period_Label']
        df = df[column_order]
        
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False, date_format='%Y-%m-%d %H:%M:%S')
        csv_content = csv_buffer.getvalue()
        csv_buffer.close()
        
        filename = f"hourly_power_loss_predictions_10_turbines_{demo_base_time.strftime('%Y%m%d_%H%M%S')}.csv"
        
        return StreamingResponse(
            io.BytesIO(csv_content.encode('utf-8')),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CSV generation error: {str(e)}")

@router.get("/weather/current")
async def get_current_weather():
    """Get current weather conditions"""
    return {"success": True, "data": pipeline.get_current_weather()}

@router.get("/update/manual")
async def manual_update():
    """Manually trigger prediction update"""
    try:
        pipeline.update_predictions()
        return {
            "success": True,
            "message": "Hourly power loss predictions updated manually",
            "timestamp": datetime.now().isoformat(),
            "turbines": len(pipeline.turbine_list),
            "prediction_type": "Hourly power loss (kWh)",
            "demo_mode": "2024 data"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Update error: {str(e)}")

@router.get("/debug/weather-forecast")
async def debug_weather_forecast():
    """Debug endpoint to see raw weather forecast data"""
    try:
        if not pipeline.is_loaded:
            raise HTTPException(status_code=500, detail='Pipeline not initialized')
        
        # Get weather forecast for current time
        weather_forecast = pipeline.get_weather_forecast(48)
        
        if weather_forecast is None or len(weather_forecast) == 0:
            raise HTTPException(status_code=500, detail='No weather forecast data')
        
        # Analyze weather conditions
        wind_speeds = weather_forecast['wind_speed'].values
        wind_directions = weather_forecast['wind_direction'].values
        
        # Sample of forecast data (first 10 records)
        sample_data = weather_forecast.head(10).to_dict('records')
        
        return {
            'success': True,
            'debug_info': {
                'total_forecast_hours': len(weather_forecast),
                'weather_stats': {
                    'wind_speed_min': float(wind_speeds.min()),
                    'wind_speed_max': float(wind_speeds.max()),
                    'wind_speed_avg': round(float(wind_speeds.mean()), 2),
                    'wind_direction_avg': round(float(wind_directions.mean()), 1)
                },
                'sample_forecast': sample_data,
                'date_range': {
                    'start': weather_forecast['datetime'].min().isoformat(),
                    'end': weather_forecast['datetime'].max().isoformat()
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Debug weather forecast error: {e}")
        raise HTTPException(status_code=500, detail=f'Debug failed: {str(e)}')

@router.get("/debug/predictions")
async def debug_predictions():
    """Debug endpoint to see ML model predictions"""
    try:
        if not pipeline.is_loaded:
            raise HTTPException(status_code=500, detail='Pipeline not initialized')
        
        # Get weather forecast
        weather_forecast = pipeline.get_weather_forecast(6)
        if weather_forecast is None or len(weather_forecast) == 0:
            raise HTTPException(status_code=500, detail='No weather forecast data')
        
        # Make predictions
        predictions_df = pipeline.predict_all_turbines(weather_forecast)
        
        # Analyze predictions
        total_predictions = len(predictions_df)
        power_losses = predictions_df['predicted_power_loss'].values
        
        # Sample predictions
        sample_predictions = predictions_df.head(10)[['turbine_id', 'hour', 'datetime', 
                                                     'wind_speed', 'predicted_power_loss']].to_dict('records')
        
        return {
            'success': True,
            'debug_info': {
                'total_predictions': total_predictions,
                'power_loss_stats': {
                    'min_loss': float(power_losses.min()),
                    'max_loss': float(power_losses.max()),
                    'avg_loss': round(float(power_losses.mean()), 2),
                    'total_loss': round(float(power_losses.sum()), 2)
                },
                'sample_predictions': sample_predictions,
                'turbines_analyzed': len(pipeline.turbine_list)
            }
        }
        
    except Exception as e:
        logger.error(f"Debug predictions error: {e}")
        raise HTTPException(status_code=500, detail=f'Debug failed: {str(e)}')

@router.get("/model/info")
async def get_model_info():
    """Get model information"""
    try:
        if not pipeline.is_loaded:
            raise HTTPException(status_code=500, detail='Model not loaded')
        
        return {
            'success': True,
            'model_info': {
                'model_type': 'XGBoost',
                'features_count': len(pipeline.get_training_features()),
                'turbines': pipeline.turbine_list,
                'turbine_count': len(pipeline.turbine_list),
                'prediction_type': 'Hourly power loss (kWh)',
                'weather_source': '2024 parallel data mapping',
                'wind_corrections_loaded': len(pipeline.wind_corrections),
                'last_update': pipeline.last_prediction_time.isoformat() if pipeline.last_prediction_time else None,
                'status': 'operational' if pipeline.is_loaded else 'not_loaded'
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Error getting model info: {str(e)}')