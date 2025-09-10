# ==========================================
# Wind Turbine Energy Forecasting Models
# Step-by-Step Implementation - FIXED VERSION
# ==========================================

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, mean_absolute_percentage_error
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam
import warnings
warnings.filterwarnings('ignore')
import os
import pickle
import joblib
from datetime import datetime
import json

class EnergyForecastingModels:
    """
    Simple and focused energy forecasting models for wind turbines
    """
    
    def __init__(self, save_models=True, output_dir="trained_models"):
        self.models = {}
        self.results = {}
        self.scalers = {}
        self.save_models = save_models
        self.output_dir = output_dir
        
        # Create output directory for saved models
        if self.save_models:
            os.makedirs(self.output_dir, exist_ok=True)
            print(f"📁 Models will be saved to: {self.output_dir}")
        
    def load_and_prepare_data(self, data_path):
        """
        Load dataset and prepare for forecasting
        """
        print("=" * 80)
        print("LOADING AND PREPARING DATA FOR ENERGY FORECASTING")
        print("=" * 80)
        
        try:
            # Load data
            print(f"Loading data from: {data_path}")
            df = pd.read_csv(data_path, index_col=0, parse_dates=True)
            print(f"✅ Data loaded successfully: {df.shape}")
            print(f"Date range: {df.index.min()} to {df.index.max()}")
            
        except Exception as e:
            print(f"❌ Error loading data: {e}")
            return None
        
        # Data preparation
        print("\n📋 Data Preparation:")
        print("-" * 40)
        
        # 1. Calculate total fleet power (our main target)
        power_cols = [col for col in df.columns if '_active_power' in col]
        print(f"Found {len(power_cols)} turbine power columns")
        
        if len(power_cols) == 0:
            print("❌ No power columns found!")
            return None
        
        # Create fleet total power
        df['total_fleet_power'] = df[power_cols].sum(axis=1)
        print(f"✅ Created total_fleet_power (Range: {df['total_fleet_power'].min():.0f} - {df['total_fleet_power'].max():.0f} kW)")
        
        # 2. Calculate average wind speed across fleet
        wind_cols = [col for col in df.columns if '_wind_speed' in col]
        if len(wind_cols) > 0:
            df['avg_fleet_wind'] = df[wind_cols].mean(axis=1)
            print(f"✅ Created avg_fleet_wind (Range: {df['avg_fleet_wind'].min():.1f} - {df['avg_fleet_wind'].max():.1f} m/s)")
        
        # 3. Clean data
        print(f"\n🧹 Data Cleaning:")
        print(f"Before cleaning: {len(df)} rows")
        
        # Remove rows where total power is 0 (all turbines off)
        df = df[df['total_fleet_power'] > 100].copy()
        print(f"After removing zero power: {len(df)} rows")
        
        # Handle missing values
        df = df.fillna(method='ffill').fillna(method='bfill')
        print(f"✅ Missing values handled")
        
        # 4. Create time-based features for forecasting
        print(f"\n⏰ Creating Time Features:")
        df['hour'] = df.index.hour
        df['day_of_year'] = df.index.dayofyear
        df['month'] = df.index.month
        df['day_of_week'] = df.index.dayofweek
        df['is_weekend'] = (df.index.dayofweek >= 5).astype(int)
        
        # Cyclical encoding
        df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
        df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
        
        print(f"✅ Created time-based features")
        
        # 5. Create lag features
        print(f"\n📈 Creating Lag Features:")
        target_col = 'total_fleet_power'
        
        # Short-term lags (1-12 hours back)
        for lag in [1, 2, 3, 6, 12]:
            df[f'power_lag_{lag}h'] = df[target_col].shift(lag)
        
        # Rolling averages
        for window in [6, 12, 24]:
            df[f'power_rolling_mean_{window}h'] = df[target_col].rolling(window=window).mean()
            df[f'power_rolling_std_{window}h'] = df[target_col].rolling(window=window).std()
        
        # Wind lag features if available
        if 'avg_fleet_wind' in df.columns:
            for lag in [1, 2, 3, 6]:
                df[f'wind_lag_{lag}h'] = df['avg_fleet_wind'].shift(lag)
            
            # Wind rolling features
            df['wind_rolling_mean_6h'] = df['avg_fleet_wind'].rolling(window=6).mean()
        
        print(f"✅ Created lag and rolling features")
        
        # 6. Remove rows with NaN (due to lag features)
        initial_len = len(df)
        df = df.dropna()
        print(f"After removing NaN (lag effects): {len(df)} rows ({initial_len - len(df)} removed)")
        
        if len(df) < 1000:
            print("⚠️ Warning: Less than 1000 data points after cleaning")
        
        # 7. Select final features
        time_features = ['hour', 'day_of_year', 'month', 'day_of_week', 'is_weekend', 
                        'hour_sin', 'hour_cos', 'month_sin', 'month_cos']
        lag_features = [col for col in df.columns if 'lag_' in col or 'rolling_' in col]
        
        # Additional useful features from original dataset
        additional_features = []
        for col in df.columns:
            if any(keyword in col.lower() for keyword in ['fleet_', 'capacity_factor']) and col != 'total_fleet_power':
                additional_features.append(col)
        
        self.feature_columns = time_features + lag_features + additional_features
        self.target_column = 'total_fleet_power'
        
        # Keep only necessary columns
        keep_columns = self.feature_columns + [self.target_column]
        available_columns = [col for col in keep_columns if col in df.columns]
        df_final = df[available_columns].copy()
        
        print(f"\n📊 Final Dataset Summary:")
        print(f"Shape: {df_final.shape}")
        print(f"Target: {self.target_column}")
        print(f"Features: {len(available_columns)-1}")
        print(f"Sample features: {available_columns[:10]}")
        
        return df_final
    
    def train_short_term_models(self, df, forecast_hours=6):
        """
        Train short-term forecasting models (1-6 hours ahead)
        Tests: XGBoost, Random Forest, LSTM
        """
        print("\n" + "=" * 80)
        print(f"SHORT-TERM FORECASTING MODELS ({forecast_hours} hours ahead)")
        print("=" * 80)
        
        target_col = self.target_column
        feature_cols = [col for col in self.feature_columns if col in df.columns]
        
        print(f"Using {len(feature_cols)} features to predict {target_col}")
        
        # Prepare data for multi-step forecasting
        X = df[feature_cols].values
        y = df[target_col].values
        
        # Create sequences for multi-step ahead prediction
        def create_forecast_sequences(X, y, forecast_steps):
            X_seq, y_seq = [], []
            for i in range(len(X) - forecast_steps):
                X_seq.append(X[i])
                y_seq.append(y[i + forecast_steps])  # forecast_steps ahead
            return np.array(X_seq), np.array(y_seq)
        
        X_forecast, y_forecast = create_forecast_sequences(X, y, forecast_hours)
        
        print(f"Created forecast sequences: {X_forecast.shape} -> {y_forecast.shape}")
        
        # Split data (time series split)
        split_idx = int(len(X_forecast) * 0.8)
        X_train, X_test = X_forecast[:split_idx], X_forecast[split_idx:]
        y_train, y_test = y_forecast[:split_idx], y_forecast[split_idx:]
        
        print(f"Train set: {len(X_train)}, Test set: {len(X_test)}")
        
        # Models to test
        models_to_test = {
            'XGBoost': xgb.XGBRegressor(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                random_state=42
            ),
            'Random Forest': RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
        }
        
        results = {}
        
        # Test traditional ML models
        for model_name, model in models_to_test.items():
            print(f"\n🤖 Training {model_name}...")
            
            # Train model
            model.fit(X_train, y_train)
            
            # Predictions
            y_pred_train = model.predict(X_train)
            y_pred_test = model.predict(X_test)
            
            # Metrics
            train_mae = mean_absolute_error(y_train, y_pred_train)
            test_mae = mean_absolute_error(y_test, y_pred_test)
            train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
            test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
            train_r2 = r2_score(y_train, y_pred_train)
            test_r2 = r2_score(y_test, y_pred_test)
            test_mape = mean_absolute_percentage_error(y_test, y_pred_test)
            
            results[model_name] = {
                'model': model,
                'train_mae': train_mae,
                'test_mae': test_mae,
                'train_rmse': train_rmse,
                'test_rmse': test_rmse,
                'train_r2': train_r2,
                'test_r2': test_r2,
                'test_mape': test_mape,
                'predictions': {'y_test': y_test, 'y_pred': y_pred_test}
            }
            
            print(f"✅ {model_name} Results:")
            print(f"   Test MAE: {test_mae:.2f} kW")
            print(f"   Test RMSE: {test_rmse:.2f} kW")
            print(f"   Test R²: {test_r2:.3f}")
            print(f"   Test MAPE: {test_mape:.1%}")
        
        # Test LSTM model
        print(f"\n🧠 Training LSTM...")
        try:
            lstm_result = self.train_lstm_model(X_train, y_train, X_test, y_test, forecast_hours)
            if lstm_result:
                results['LSTM'] = lstm_result
                print(f"✅ LSTM Results:")
                print(f"   Test MAE: {lstm_result['test_mae']:.2f} kW")
                print(f"   Test RMSE: {lstm_result['test_rmse']:.2f} kW")
                print(f"   Test MAPE: {lstm_result['test_mape']:.1%}")
        except Exception as e:
            print(f"❌ LSTM training failed: {e}")
        
        # Find best model
        if results:
            best_model_name = min(results.keys(), key=lambda x: results[x]['test_mae'])
            best_result = results[best_model_name]
            
            print(f"\n🏆 BEST SHORT-TERM MODEL: {best_model_name}")
            print(f"   MAE: {best_result['test_mae']:.2f} kW")
            print(f"   RMSE: {best_result['test_rmse']:.2f} kW")
            print(f"   R²: {best_result['test_r2']:.3f}")
            print(f"   MAPE: {best_result['test_mape']:.1%}")
            
            # Store results
            self.results[f'short_term_{forecast_hours}h'] = results
            self.models[f'best_short_term_{forecast_hours}h'] = best_result['model']
            
            # Save the best model
            if self.save_models:
                self.save_model(best_result['model'], f'best_short_term_{forecast_hours}h', best_model_name, best_result)
            
            # Plot results
            self.plot_forecasting_results(best_result, f"Short-term Forecasting ({forecast_hours}h) - {best_model_name}")
        
        return results
    
    def train_lstm_model(self, X_train, y_train, X_test, y_test, forecast_hours):
        """Train LSTM model for time series forecasting"""
        try:
            # Reshape for LSTM (samples, timesteps, features)
            # For now, treat each sample as a single timestep
            X_train_lstm = X_train.reshape((X_train.shape[0], 1, X_train.shape[1]))
            X_test_lstm = X_test.reshape((X_test.shape[0], 1, X_test.shape[1]))
            
            # Build LSTM model
            model = Sequential([
                LSTM(50, return_sequences=False, input_shape=(1, X_train.shape[1])),
                Dropout(0.2),
                Dense(25, activation='relu'),
                Dense(1)
            ])
            
            model.compile(optimizer=Adam(learning_rate=0.001), loss='mse')
            
            # Train
            history = model.fit(
                X_train_lstm, y_train,
                epochs=50,
                batch_size=32,
                validation_split=0.2,
                verbose=0
            )
            
            # Predictions
            y_pred_train = model.predict(X_train_lstm).flatten()
            y_pred_test = model.predict(X_test_lstm).flatten()
            
            # Metrics
            train_mae = mean_absolute_error(y_train, y_pred_train)
            test_mae = mean_absolute_error(y_test, y_pred_test)
            train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
            test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
            train_r2 = r2_score(y_train, y_pred_train)
            test_r2 = r2_score(y_test, y_pred_test)
            test_mape = mean_absolute_percentage_error(y_test, y_pred_test)
            
            return {
                'model': model,
                'train_mae': train_mae,
                'test_mae': test_mae,
                'train_rmse': train_rmse,
                'test_rmse': test_rmse,
                'train_r2': train_r2,
                'test_r2': test_r2,
                'test_mape': test_mape,
                'history': history.history,
                'predictions': {'y_test': y_test, 'y_pred': y_pred_test}
            }
            
        except Exception as e:
            print(f"LSTM training error: {e}")
            return None
    
    def train_medium_term_models(self, df, forecast_days=1):
        """
        Train medium-term forecasting models (daily aggregation)
        Tests: XGBoost, Random Forest, Gradient Boosting
        """
        print("\n" + "=" * 80)
        print(f"MEDIUM-TERM FORECASTING MODELS ({forecast_days} day ahead)")
        print("=" * 80)
        
        # Aggregate to daily data
        df_daily = df.resample('D').agg({
            self.target_column: 'mean',  # Daily average power
            'avg_fleet_wind': 'mean' if 'avg_fleet_wind' in df.columns else 'first',
            'month': 'first',
            'day_of_year': 'first',
            'day_of_week': 'first'
        }).dropna()
        
        print(f"Daily aggregated data: {df_daily.shape}")
        
        # Create daily features
        df_daily['total_energy_daily'] = df_daily[self.target_column] * 24 / 1000  # MWh per day
        
        # Lag features for daily data
        for lag in [1, 2, 3, 7, 14]:  # 1, 2, 3 days, 1 week, 2 weeks back
            df_daily[f'energy_lag_{lag}d'] = df_daily['total_energy_daily'].shift(lag)
        
        # Rolling features
        for window in [7, 14, 30]:  # Weekly, bi-weekly, monthly averages
            df_daily[f'energy_rolling_mean_{window}d'] = df_daily['total_energy_daily'].rolling(window=window).mean()
        
        # Remove NaN
        df_daily = df_daily.dropna()
        print(f"After adding lags and removing NaN: {df_daily.shape}")
        
        if len(df_daily) < 100:
            print("❌ Not enough data for medium-term forecasting")
            return None
        
        # Prepare features
        feature_cols = [col for col in df_daily.columns if col not in ['total_energy_daily', self.target_column]]
        X = df_daily[feature_cols].values
        y = df_daily['total_energy_daily'].values
        
        # Create forecast sequences
        def create_daily_sequences(X, y, forecast_days):
            X_seq, y_seq = [], []
            for i in range(len(X) - forecast_days):
                X_seq.append(X[i])
                y_seq.append(y[i + forecast_days])
            return np.array(X_seq), np.array(y_seq)
        
        X_forecast, y_forecast = create_daily_sequences(X, y, forecast_days)
        
        # Split data
        split_idx = int(len(X_forecast) * 0.8)
        X_train, X_test = X_forecast[:split_idx], X_forecast[split_idx:]
        y_train, y_test = y_forecast[:split_idx], y_forecast[split_idx:]
        
        print(f"Daily forecast training: {len(X_train)} samples")
        
        # Models to test
        from sklearn.ensemble import GradientBoostingRegressor
        
        models_to_test = {
            'XGBoost': xgb.XGBRegressor(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42),
            'Random Forest': RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42),
            'Gradient Boosting': GradientBoostingRegressor(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42)
        }
        
        results = {}
        
        for model_name, model in models_to_test.items():
            print(f"\n🤖 Training {model_name}...")
            
            # Train
            model.fit(X_train, y_train)
            
            # Predictions
            y_pred_test = model.predict(X_test)
            
            # Metrics
            mae = mean_absolute_error(y_test, y_pred_test)
            rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
            r2 = r2_score(y_test, y_pred_test)
            mape = mean_absolute_percentage_error(y_test, y_pred_test)
            
            results[model_name] = {
                'model': model,
                'test_mae': mae,
                'test_rmse': rmse,
                'test_r2': r2,
                'test_mape': mape,
                'predictions': {'y_test': y_test, 'y_pred': y_pred_test}
            }
            
            print(f"✅ {model_name} Results:")
            print(f"   MAE: {mae:.2f} MWh/day")
            print(f"   RMSE: {rmse:.2f} MWh/day")
            print(f"   R²: {r2:.3f}")
            print(f"   MAPE: {mape:.1%}")
        
        # Find best model
        if results:
            best_model_name = min(results.keys(), key=lambda x: results[x]['test_mae'])
            best_result = results[best_model_name]
            
            print(f"\n🏆 BEST MEDIUM-TERM MODEL: {best_model_name}")
            print(f"   MAE: {best_result['test_mae']:.2f} MWh/day")
            print(f"   RMSE: {best_result['test_rmse']:.2f} MWh/day")
            print(f"   R²: {best_result['test_r2']:.3f}")
            print(f"   MAPE: {best_result['test_mape']:.1%}")
            
            # Store results
            self.results[f'medium_term_{forecast_days}d'] = results
            self.models[f'best_medium_term_{forecast_days}d'] = best_result['model']
            
            # Plot results for the best model
            self.plot_forecasting_results(best_result, f"Medium-term Forecasting ({forecast_days}d) - {best_model_name}")
        
        return results
    
    def plot_forecasting_results(self, result, title):
        """Plot forecasting results"""
        y_test = result['predictions']['y_test']
        y_pred = result['predictions']['y_pred']
        
        plt.figure(figsize=(12, 8))
        
        # Plot 1: Actual vs Predicted
        plt.subplot(2, 2, 1)
        plt.scatter(y_test, y_pred, alpha=0.6)
        plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
        plt.xlabel('Actual')
        plt.ylabel('Predicted')
        plt.title('Actual vs Predicted')
        plt.grid(True, alpha=0.3)
        
        # Plot 2: Time series (last 200 points)
        plt.subplot(2, 2, 2)
        n_points = min(200, len(y_test))
        plt.plot(y_test[-n_points:], label='Actual', linewidth=2)
        plt.plot(y_pred[-n_points:], label='Predicted', linewidth=2)
        plt.xlabel('Time')
        plt.ylabel('Power')
        plt.title(f'Time Series (Last {n_points} points)')
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        # Plot 3: Residuals
        plt.subplot(2, 2, 3)
        residuals = y_test - y_pred
        plt.hist(residuals, bins=50, alpha=0.7)
        plt.xlabel('Residuals')
        plt.ylabel('Frequency')
        plt.title('Residuals Distribution')
        plt.grid(True, alpha=0.3)
        
        # Plot 4: Error metrics
        plt.subplot(2, 2, 4)
        mae = result['test_mae']
        rmse = result['test_rmse']
        r2 = result['test_r2']
        mape = result['test_mape']
        
        metrics = ['MAE', 'RMSE', 'R²', 'MAPE']
        values = [mae, rmse, r2*100, mape*100]  # Scale for visibility
        
        plt.bar(metrics, values)
        plt.title('Performance Metrics')
        plt.ylabel('Value')
        
        plt.suptitle(title, fontsize=14)
        plt.tight_layout()
        plt.savefig(f'forecasting_results_{title.replace(" ", "_").replace("(", "").replace(")", "")}.png', 
                   dpi=300, bbox_inches='tight')
        plt.show()
    
    def save_model(self, model, model_key, model_name, results):
        """Save trained model and metadata to disk"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            model_filename = f"{model_key}_{model_name.replace(' ', '_')}_{timestamp}"
            
            # Save model based on type
            if 'LSTM' in model_name or hasattr(model, 'save'):
                # TensorFlow/Keras model
                model_path = os.path.join(self.output_dir, f"{model_filename}.h5")
                model.save(model_path)
                print(f"💾 Saved LSTM model: {model_path}")
            else:
                # Scikit-learn or XGBoost model
                model_path = os.path.join(self.output_dir, f"{model_filename}.pkl")
                joblib.dump(model, model_path)
                print(f"💾 Saved {model_name} model: {model_path}")
            
            # Save model metadata and performance
            metadata = {
                'model_name': model_name,
                'model_type': model_key,
                'timestamp': timestamp,
                'performance_metrics': {
                    'test_mae': results.get('test_mae'),
                    'test_rmse': results.get('test_rmse'),
                    'test_r2': results.get('test_r2'),
                    'test_mape': results.get('test_mape')
                },
                'model_path': model_path,
                'feature_columns': getattr(self, 'feature_columns', []),
                'target_column': getattr(self, 'target_column', '')
            }
            
            metadata_path = os.path.join(self.output_dir, f"{model_filename}_metadata.json")
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=4, default=str)
            
            print(f"📋 Saved metadata: {metadata_path}")
            
            return model_path, metadata_path
            
        except Exception as e:
            print(f"❌ Error saving model: {e}")
            return None, None
    
    def load_saved_model(self, model_path, model_type='sklearn'):
        """Load a previously saved model"""
        try:
            if model_path.endswith('.h5'):
                # Load Keras/TensorFlow model
                from tensorflow.keras.models import load_model
                model = load_model(model_path)
                print(f"✅ Loaded LSTM model from: {model_path}")
            elif model_path.endswith('.pkl'):
                # Load scikit-learn/XGBoost model
                model = joblib.load(model_path)
                print(f"✅ Loaded {model_type} model from: {model_path}")
            else:
                print(f"❌ Unsupported model file format: {model_path}")
                return None
            
            return model
            
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            return None
    
    def list_saved_models(self):
        """List all saved models in the output directory"""
        if not os.path.exists(self.output_dir):
            print(f"❌ No saved models directory found: {self.output_dir}")
            return []
        
        model_files = []
        metadata_files = []
        
        for file in os.listdir(self.output_dir):
            if file.endswith('.pkl') or file.endswith('.h5'):
                model_files.append(file)
            elif file.endswith('_metadata.json'):
                metadata_files.append(file)
        
        print(f"\n📁 SAVED MODELS IN {self.output_dir}:")
        print("-" * 60)
        
        if model_files:
            for model_file in sorted(model_files):
                print(f"🤖 {model_file}")
                
                # Try to load corresponding metadata
                base_name = model_file.replace('.pkl', '').replace('.h5', '')
                metadata_file = f"{base_name}_metadata.json"
                
                if metadata_file in metadata_files:
                    try:
                        metadata_path = os.path.join(self.output_dir, metadata_file)
                        with open(metadata_path, 'r') as f:
                            metadata = json.load(f)
                        
                        metrics = metadata.get('performance_metrics', {})
                        print(f"   📊 MAE: {metrics.get('test_mae', 'N/A')}")
                        print(f"   📊 R²: {metrics.get('test_r2', 'N/A')}")
                        print(f"   📅 Created: {metadata.get('timestamp', 'N/A')}")
                        
                    except Exception as e:
                        print(f"   ⚠️ Could not read metadata: {e}")
                
                print()
        else:
            print("No saved models found")
        
        return model_files
    
    def generate_summary_report(self):
        """Generate comprehensive summary report"""
        print("\n" + "=" * 80)
        print("ENERGY FORECASTING SUMMARY REPORT")
        print("=" * 80)
        
        if not self.results:
            print("No results to report")
            return
        
        for forecast_type, results in self.results.items():
            print(f"\n📊 {forecast_type.upper().replace('_', ' ')} RESULTS:")
            print("-" * 50)
            
            # Sort models by performance
            sorted_models = sorted(results.items(), key=lambda x: x[1]['test_mae'])
            
            for rank, (model_name, result) in enumerate(sorted_models, 1):
                mae = result['test_mae']
                rmse = result['test_rmse'] 
                r2 = result['test_r2']
                mape = result['test_mape']
                
                print(f"{rank}. {model_name}:")
                print(f"   MAE: {mae:.2f} ({'kW' if 'short' in forecast_type else 'MWh/day'})")
                print(f"   RMSE: {rmse:.2f}")
                print(f"   R²: {r2:.3f}")
                print(f"   MAPE: {mape:.1%}")
                
                if rank == 1:
                    print("   🏆 BEST PERFORMER")
        
        print(f"\n" + "=" * 80)
        print("ANALYSIS COMPLETE!")
        print("Check generated PNG files for detailed visualizations")
        
        if self.save_models:
            print(f"🤖 TRAINED MODELS SAVED TO: {self.output_dir}/")
            print("📋 Use list_saved_models() to see all saved models")
            self.list_saved_models()
        
        print("=" * 80)


# ==========================================
# MAIN EXECUTION FUNCTION
# ==========================================

def main():
    """
    Main function to run energy forecasting models
    """
    print("WIND TURBINE ENERGY FORECASTING - STEP BY STEP")
    print("=" * 80)
    
    # ==========================================
    # 🔧 EDIT THESE PATHS FOR YOUR SETUP
    # ==========================================
    DATA_PATH = "data/processed/wind_turbine_data_enhanced_for_modeling.csv"
    OUTPUT_DIR = "trained_models/energy_forecasting"  # Directory to save models
    
    # ==========================================
    # Step 1: Initialize and Load Data
    # ==========================================
    forecasting = EnergyForecastingModels(save_models=True, output_dir=OUTPUT_DIR)
    
    df = forecasting.load_and_prepare_data(DATA_PATH)
    if df is None:
        print("❌ Failed to load data. Please check the file path.")
        return
    
    # ==========================================
    # Step 2: Short-term Forecasting (6 hours ahead)
    # ==========================================
    print("\n" + "🚀 STARTING SHORT-TERM FORECASTING...")
    short_term_results = forecasting.train_short_term_models(df, forecast_hours=6)
    
    # ==========================================
    # Step 3: Medium-term Forecasting (1 day ahead) 
    # ==========================================
    print("\n" + "🚀 STARTING MEDIUM-TERM FORECASTING...")
    medium_term_results = forecasting.train_medium_term_models(df, forecast_days=1)
    
    # ==========================================
    # Step 4: Generate Summary Report
    # ==========================================
    forecasting.generate_summary_report()
    
    return forecasting


def load_and_predict_example(model_path, data_path):
    """
    Example function showing how to load a saved model and make predictions
    """
    print(f"\n🔮 EXAMPLE: Loading saved model and making predictions")
    print("-" * 60)
    
    # Initialize forecasting class
    forecasting = EnergyForecastingModels(save_models=False)
    
    # Load the saved model
    model = forecasting.load_saved_model(model_path)
    if model is None:
        return
    
    # Load and prepare new data
    df = forecasting.load_and_prepare_data(data_path)
    if df is None:
        return
    
    # Make predictions on new data
    try:
        feature_cols = [col for col in forecasting.feature_columns if col in df.columns]
        X_new = df[feature_cols].tail(100)  # Last 100 data points
        
        predictions = model.predict(X_new)
        
        print(f"✅ Made {len(predictions)} predictions using saved model")
        print(f"Prediction range: {predictions.min():.2f} - {predictions.max():.2f}")
        
        return predictions
        
    except Exception as e:
        print(f"❌ Error making predictions: {e}")
        return None

if __name__ == "__main__":
    # Run the forecasting models
    print("📋 INSTRUCTIONS:")
    print("1. Update DATA_PATH to point to your enhanced dataset CSV file")
    print("2. Make sure you have the required libraries installed:")
    print("   pip install pandas numpy matplotlib seaborn scikit-learn xgboost tensorflow")
    print("3. Run this script: python energy_forecasting.py")
    print("4. Check the generated PNG files for results visualization")
    print("\n" + "=" * 80)
    
    # Run the analysis
    forecasting_model = main()