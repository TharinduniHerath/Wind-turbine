# ==========================================
# Wind Turbine Power Optimization Models
# Fleet-Wide Training Implementation
# ==========================================

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, mean_absolute_percentage_error
from sklearn.preprocessing import StandardScaler
from sklearn.multioutput import MultiOutputRegressor
import xgboost as xgb
import warnings
warnings.filterwarnings('ignore')
import os
import joblib
from datetime import datetime
import json

class PowerOptimizationModels:
    """
    Fleet-wide power optimization models for wind turbines
    """
    
    def __init__(self, save_models=True, output_dir="power_optimization_models"):
        self.models = {}
        self.results = {}
        self.scalers = {}
        self.save_models = save_models
        self.output_dir = output_dir
        
        # Create output directory for saved models
        if self.save_models:
            os.makedirs(self.output_dir, exist_ok=True)
            print(f"Models will be saved to: {self.output_dir}")
    
    def load_and_prepare_data(self, data_path):
        """
        Load dataset and prepare for power optimization
        """
        print("=" * 80)
        print("LOADING DATA FOR POWER OPTIMIZATION")
        print("=" * 80)
        
        try:
            df = pd.read_csv(data_path, index_col=0, parse_dates=True)
            print(f"Data loaded successfully: {df.shape}")
            print(f"Date range: {df.index.min()} to {df.index.max()}")
        except Exception as e:
            print(f"Error loading data: {e}")
            return None
        
        print("\nData Preparation:")
        print("-" * 40)
        
        # Find all turbines
        turbine_ids = []
        for col in df.columns:
            if '_active_power' in col:
                turbine_id = col.replace('_active_power', '')
                if turbine_id not in turbine_ids:
                    turbine_ids.append(turbine_id)
        
        print(f"Found {len(turbine_ids)} turbines: {turbine_ids}")
        
        if len(turbine_ids) == 0:
            print("No turbines found!")
            return None
        
        # Clean data - remove rows where all turbines are off
        power_cols = [f'{tid}_active_power' for tid in turbine_ids if f'{tid}_active_power' in df.columns]
        df['total_power'] = df[power_cols].sum(axis=1)
        df = df[df['total_power'] > 500].copy()  # Fleet producing at least 500kW
        
        print(f"After cleaning: {len(df)} rows")
        
        # Handle missing values
        df = df.fillna(method='ffill').fillna(method='bfill').fillna(0)
        
        # Store turbine info
        self.turbine_ids = turbine_ids
        self.power_cols = power_cols
        
        print(f"Ready for optimization with {len(turbine_ids)} turbines")
        
        return df
    
    def prepare_optimization_features(self, df):
        """
        Prepare features for power optimization
        """
        print("\nPreparing Optimization Features:")
        print("-" * 40)
        
        # Environmental features (same for all turbines)
        environmental_features = []
        
        # Wind features
        wind_cols = [col for col in df.columns if '_wind_speed' in col]
        if wind_cols:
            df['avg_wind_speed'] = df[wind_cols].mean(axis=1)
            df['max_wind_speed'] = df[wind_cols].max(axis=1)
            df['min_wind_speed'] = df[wind_cols].min(axis=1)
            df['wind_speed_std'] = df[wind_cols].std(axis=1)
            environmental_features.extend(['avg_wind_speed', 'max_wind_speed', 'min_wind_speed', 'wind_speed_std'])
        
        # Time-based features
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
        
        time_features = ['hour', 'day_of_year', 'month', 'day_of_week', 'is_weekend', 
                        'hour_sin', 'hour_cos', 'month_sin', 'month_cos']
        
        # Fleet features
        fleet_features = [col for col in df.columns if 'fleet' in col.lower()]
        
        # Individual turbine operational features
        operational_features = []
        for turbine_id in self.turbine_ids:
            # Current operational state
            for feature_type in ['wind_speed', 'pitch_angle', 'rotor_speed']:
                col = f'{turbine_id}_{feature_type}'
                if col in df.columns:
                    operational_features.append(col)
            
            # Optimization features if available
            for opt_feature in ['power_coefficient', 'tip_speed_ratio', 'wind_utilization']:
                col = f'{turbine_id}_{opt_feature}'
                if col in df.columns:
                    operational_features.append(col)
        
        # Combine all features
        all_features = environmental_features + time_features + fleet_features + operational_features
        available_features = [f for f in all_features if f in df.columns]
        
        print(f"Environmental features: {len(environmental_features)}")
        print(f"Time features: {len(time_features)}")
        print(f"Fleet features: {len(fleet_features)}")  
        print(f"Operational features: {len([f for f in operational_features if f in df.columns])}")
        print(f"Total features available: {len(available_features)}")
        
        self.feature_columns = available_features
        
        return df
    
    def train_power_maximization_models(self, df):
        """
        Train models to maximize power output for the entire fleet
        Target: Predict optimal power for each turbine simultaneously
        """
        print("\n" + "=" * 80)
        print("TRAINING POWER MAXIMIZATION MODELS")
        print("=" * 80)
        
        # Prepare features and targets
        X = df[self.feature_columns].fillna(0)
        
        # Multiple targets: power output for each turbine
        y = df[self.power_cols].fillna(0)
        
        print(f"Features shape: {X.shape}")
        print(f"Targets shape: {y.shape}")
        print(f"Predicting power for: {self.power_cols}")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        print(f"Training samples: {len(X_train)}, Test samples: {len(X_test)}")
        
        # Models to test
        models_to_test = {
            'XGBoost': MultiOutputRegressor(xgb.XGBRegressor(
                n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42
            )),
            'Random Forest': MultiOutputRegressor(RandomForestRegressor(
                n_estimators=100, max_depth=10, random_state=42
            )),
            'Gradient Boosting': MultiOutputRegressor(GradientBoostingRegressor(
                n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42
            ))
        }
        
        results = {}
        
        for model_name, model in models_to_test.items():
            print(f"\nTraining {model_name} for Power Maximization...")
            
            # Train model
            model.fit(X_train, y_train)
            
            # Predictions
            y_pred_train = model.predict(X_train)
            y_pred_test = model.predict(X_test)
            
            # Calculate metrics for each turbine and overall
            turbine_metrics = {}
            
            for i, turbine_power_col in enumerate(self.power_cols):
                turbine_id = turbine_power_col.replace('_active_power', '')
                
                train_mae = mean_absolute_error(y_train.iloc[:, i], y_pred_train[:, i])
                test_mae = mean_absolute_error(y_test.iloc[:, i], y_pred_test[:, i])
                test_r2 = r2_score(y_test.iloc[:, i], y_pred_test[:, i])
                test_mape = mean_absolute_percentage_error(y_test.iloc[:, i], y_pred_test[:, i])
                
                turbine_metrics[turbine_id] = {
                    'train_mae': train_mae,
                    'test_mae': test_mae,
                    'test_r2': test_r2,
                    'test_mape': test_mape
                }
            
            # Overall fleet metrics
            fleet_train_mae = np.mean([turbine_metrics[tid.replace('_active_power', '')]['train_mae'] for tid in self.power_cols])
            fleet_test_mae = np.mean([turbine_metrics[tid.replace('_active_power', '')]['test_mae'] for tid in self.power_cols])
            fleet_test_r2 = np.mean([turbine_metrics[tid.replace('_active_power', '')]['test_r2'] for tid in self.power_cols])
            fleet_test_mape = np.mean([turbine_metrics[tid.replace('_active_power', '')]['test_mape'] for tid in self.power_cols])
            
            results[model_name] = {
                'model': model,
                'turbine_metrics': turbine_metrics,
                'fleet_train_mae': fleet_train_mae,
                'fleet_test_mae': fleet_test_mae,
                'fleet_test_r2': fleet_test_r2,
                'fleet_test_mape': fleet_test_mape,
                'predictions': {'y_test': y_test, 'y_pred': y_pred_test}
            }
            
            print(f"Results for {model_name}:")
            print(f"   Fleet Average MAE: {fleet_test_mae:.2f} kW")
            print(f"   Fleet Average R²: {fleet_test_r2:.3f}")
            print(f"   Fleet Average MAPE: {fleet_test_mape:.1%}")
            
            # Save model
            if self.save_models:
                self.save_model(model, f'power_maximization_{model_name.replace(" ", "_")}', 
                              model_name, results[model_name])
        
        # Find best model
        if results:
            best_model_name = min(results.keys(), key=lambda x: results[x]['fleet_test_mae'])
            best_result = results[best_model_name]
            
            print(f"\nBEST POWER MAXIMIZATION MODEL: {best_model_name}")
            print(f"   Fleet MAE: {best_result['fleet_test_mae']:.2f} kW")
            print(f"   Fleet R²: {best_result['fleet_test_r2']:.3f}")
            print(f"   Fleet MAPE: {best_result['fleet_test_mape']:.1%}")
            
            # Store results
            self.results['power_maximization'] = results
            
            # Plot results
            self.plot_power_optimization_results(best_result, f"Power Maximization - {best_model_name}")
        
        return results
    
    def train_combined_optimization_models(self, df):
        """
        Train a unified model that optimizes both power output AND pitch angles
        This addresses your question: "can we train one model to do both"
        """
        print("\n" + "=" * 80)
        print("TRAINING COMBINED POWER + PITCH OPTIMIZATION MODELS")
        print("=" * 80)
        
        # Prepare features
        X = df[self.feature_columns].fillna(0)
        
        # Multiple targets: both power AND pitch for each turbine
        target_cols = []
        
        # Add power targets
        for power_col in self.power_cols:
            if power_col in df.columns:
                target_cols.append(power_col)
        
        # Add pitch targets  
        for turbine_id in self.turbine_ids:
            pitch_col = f'{turbine_id}_pitch_angle'
            if pitch_col in df.columns:
                target_cols.append(pitch_col)
        
        if len(target_cols) == 0:
            print("No suitable target columns found for combined optimization")
            return None
        
        y = df[target_cols].fillna(0)
        
        print(f"Combined optimization targets: {len(target_cols)} variables")
        print(f"Targets: {target_cols[:10]}...")  # Show first 10
        print(f"Features shape: {X.shape}, Targets shape: {y.shape}")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Models for multi-output regression
        models_to_test = {
            'XGBoost_Combined': MultiOutputRegressor(xgb.XGBRegressor(
                n_estimators=150, max_depth=8, learning_rate=0.1, random_state=42
            )),
            'Random_Forest_Combined': MultiOutputRegressor(RandomForestRegressor(
                n_estimators=150, max_depth=12, random_state=42
            ))
        }
        
        results = {}
        
        for model_name, model in models_to_test.items():
            print(f"\nTraining {model_name} for Combined Optimization...")
            
            # Train model
            model.fit(X_train, y_train)
            
            # Predictions
            y_pred_test = model.predict(X_test)
            
            # Calculate metrics separately for power and pitch
            power_metrics = {}
            pitch_metrics = {}
            
            for i, target_col in enumerate(target_cols):
                mae = mean_absolute_error(y_test.iloc[:, i], y_pred_test[:, i])
                r2 = r2_score(y_test.iloc[:, i], y_pred_test[:, i])
                mape = mean_absolute_percentage_error(y_test.iloc[:, i], y_pred_test[:, i])
                
                if 'active_power' in target_col:
                    turbine_id = target_col.replace('_active_power', '')
                    power_metrics[turbine_id] = {'mae': mae, 'r2': r2, 'mape': mape}
                elif 'pitch_angle' in target_col:
                    turbine_id = target_col.replace('_pitch_angle', '')
                    pitch_metrics[turbine_id] = {'mae': mae, 'r2': r2, 'mape': mape}
            
            # Overall metrics
            power_avg_mae = np.mean([m['mae'] for m in power_metrics.values()]) if power_metrics else 0
            power_avg_r2 = np.mean([m['r2'] for m in power_metrics.values()]) if power_metrics else 0
            pitch_avg_mae = np.mean([m['mae'] for m in pitch_metrics.values()]) if pitch_metrics else 0
            pitch_avg_r2 = np.mean([m['r2'] for m in pitch_metrics.values()]) if pitch_metrics else 0
            
            results[model_name] = {
                'model': model,
                'power_metrics': power_metrics,
                'pitch_metrics': pitch_metrics,
                'power_avg_mae': power_avg_mae,
                'power_avg_r2': power_avg_r2,
                'pitch_avg_mae': pitch_avg_mae,
                'pitch_avg_r2': pitch_avg_r2,
                'target_columns': target_cols,
                'predictions': {'y_test': y_test, 'y_pred': y_pred_test}
            }
            
            print(f"Results for {model_name}:")
            print(f"   Power - Average MAE: {power_avg_mae:.2f} kW, Average R²: {power_avg_r2:.3f}")
            print(f"   Pitch - Average MAE: {pitch_avg_mae:.2f} degrees, Average R²: {pitch_avg_r2:.3f}")
            
            # Save model
            if self.save_models:
                self.save_model(model, f'combined_optimization_{model_name.replace(" ", "_")}', 
                              model_name, results[model_name])
        
        # Find best model (based on power performance)
        if results:
            best_model_name = max(results.keys(), key=lambda x: results[x]['power_avg_r2'])
            best_result = results[best_model_name]
            
            print(f"\nBEST COMBINED OPTIMIZATION MODEL: {best_model_name}")
            print(f"   Power R²: {best_result['power_avg_r2']:.3f}")
            print(f"   Pitch R²: {best_result['pitch_avg_r2']:.3f}")
            
            self.results['combined_optimization'] = results
            
            # Plot results  
            self.plot_combined_optimization_results(best_result, f"Combined Optimization - {best_model_name}")
        
        return results
    
    def plot_power_optimization_results(self, result, title):
        """Plot power optimization results"""
        y_test = result['predictions']['y_test']
        y_pred = result['predictions']['y_pred']
        
        n_turbines = len(self.power_cols)
        n_cols = min(4, n_turbines)
        n_rows = (n_turbines + n_cols - 1) // n_cols
        
        plt.figure(figsize=(15, 4 * n_rows))
        
        for i, power_col in enumerate(self.power_cols[:8]):  # Limit to first 8 turbines
            plt.subplot(n_rows, n_cols, i + 1)
            
            actual = y_test.iloc[:, i]
            predicted = y_pred[:, i]
            
            plt.scatter(actual, predicted, alpha=0.6)
            plt.plot([actual.min(), actual.max()], [actual.min(), actual.max()], 'r--', lw=2)
            
            turbine_id = power_col.replace('_active_power', '')
            r2 = r2_score(actual, predicted)
            mae = mean_absolute_error(actual, predicted)
            
            plt.xlabel('Actual Power (kW)')
            plt.ylabel('Predicted Power (kW)')
            plt.title(f'{turbine_id}\nR²={r2:.3f}, MAE={mae:.1f}kW')
            plt.grid(True, alpha=0.3)
        
        plt.suptitle(title, fontsize=16)
        plt.tight_layout()
        plt.savefig(f'power_optimization_{title.replace(" ", "_")}.png', dpi=300, bbox_inches='tight')
        plt.show()
    
    def plot_combined_optimization_results(self, result, title):
        """Plot combined optimization results"""
        target_cols = result['target_columns']
        y_test = result['predictions']['y_test']
        y_pred = result['predictions']['y_pred']
        
        # Separate power and pitch results
        power_indices = [i for i, col in enumerate(target_cols) if 'active_power' in col]
        pitch_indices = [i for i, col in enumerate(target_cols) if 'pitch_angle' in col]
        
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        
        # Power results
        if power_indices:
            # Combined power scatter plot
            ax = axes[0, 0]
            all_power_actual = []
            all_power_pred = []
            
            for i in power_indices[:5]:  # First 5 turbines
                all_power_actual.extend(y_test.iloc[:, i])
                all_power_pred.extend(y_pred[:, i])
            
            ax.scatter(all_power_actual, all_power_pred, alpha=0.6)
            ax.plot([min(all_power_actual), max(all_power_actual)], 
                   [min(all_power_actual), max(all_power_actual)], 'r--', lw=2)
            ax.set_xlabel('Actual Power (kW)')
            ax.set_ylabel('Predicted Power (kW)')
            ax.set_title('Power Predictions (All Turbines)')
            ax.grid(True, alpha=0.3)
        
        # Pitch results
        if pitch_indices:
            # Combined pitch scatter plot
            ax = axes[0, 1]
            all_pitch_actual = []
            all_pitch_pred = []
            
            for i in pitch_indices[:5]:  # First 5 turbines
                all_pitch_actual.extend(y_test.iloc[:, i])
                all_pitch_pred.extend(y_pred[:, i])
            
            ax.scatter(all_pitch_actual, all_pitch_pred, alpha=0.6, color='orange')
            ax.plot([min(all_pitch_actual), max(all_pitch_actual)], 
                   [min(all_pitch_actual), max(all_pitch_actual)], 'r--', lw=2)
            ax.set_xlabel('Actual Pitch Angle (degrees)')
            ax.set_ylabel('Predicted Pitch Angle (degrees)')
            ax.set_title('Pitch Angle Predictions (All Turbines)')
            ax.grid(True, alpha=0.3)
        
        # Performance metrics
        ax = axes[1, 0]
        power_r2 = result['power_avg_r2']
        pitch_r2 = result['pitch_avg_r2']
        
        metrics = ['Power R²', 'Pitch R²']
        values = [power_r2, pitch_r2]
        colors = ['blue', 'orange']
        
        bars = ax.bar(metrics, values, color=colors, alpha=0.7)
        ax.set_ylabel('R² Score')
        ax.set_title('Model Performance')
        ax.set_ylim(0, 1)
        
        # Add value labels on bars
        for bar, value in zip(bars, values):
            ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01, 
                   f'{value:.3f}', ha='center', va='bottom')
        
        # Error distribution
        ax = axes[1, 1]
        if power_indices:
            power_errors = []
            for i in power_indices:
                errors = y_test.iloc[:, i] - y_pred[:, i]
                power_errors.extend(errors)
            
            ax.hist(power_errors, bins=50, alpha=0.7, color='blue', label='Power Errors')
            ax.set_xlabel('Prediction Error')
            ax.set_ylabel('Frequency')
            ax.set_title('Error Distribution')
            ax.legend()
            ax.grid(True, alpha=0.3)
        
        plt.suptitle(title, fontsize=16)
        plt.tight_layout()
        plt.savefig(f'combined_optimization_{title.replace(" ", "_")}.png', dpi=300, bbox_inches='tight')
        plt.show()
    
    def save_model(self, model, model_key, model_name, results):
        """Save trained model and metadata"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            model_filename = f"{model_key}_{timestamp}"
            
            # Save model
            model_path = os.path.join(self.output_dir, f"{model_filename}.pkl")
            joblib.dump(model, model_path)
            print(f"Saved {model_name} model: {model_path}")
            
            # Save metadata
            metadata = {
                'model_name': model_name,
                'model_type': model_key,
                'timestamp': timestamp,
                'model_path': model_path,
                'feature_columns': getattr(self, 'feature_columns', []),
                'turbine_ids': getattr(self, 'turbine_ids', []),
                'power_cols': getattr(self, 'power_cols', [])
            }
            
            # Add performance metrics based on model type
            if 'power_maximization' in model_key:
                metadata['performance_metrics'] = {
                    'fleet_test_mae': results.get('fleet_test_mae'),
                    'fleet_test_r2': results.get('fleet_test_r2'),
                    'fleet_test_mape': results.get('fleet_test_mape')
                }
            elif 'combined_optimization' in model_key:
                metadata['performance_metrics'] = {
                    'power_avg_mae': results.get('power_avg_mae'),
                    'power_avg_r2': results.get('power_avg_r2'),
                    'pitch_avg_mae': results.get('pitch_avg_mae'),
                    'pitch_avg_r2': results.get('pitch_avg_r2')
                }
            
            metadata_path = os.path.join(self.output_dir, f"{model_filename}_metadata.json")
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=4, default=str)
            
            print(f"Saved metadata: {metadata_path}")
            
        except Exception as e:
            print(f"Error saving model: {e}")
    
    def generate_summary_report(self):
        """Generate comprehensive summary report"""
        print("\n" + "=" * 80)
        print("POWER OPTIMIZATION SUMMARY REPORT")
        print("=" * 80)
        
        if not self.results:
            print("No results to report")
            return
        
        # Power Maximization Results
        if 'power_maximization' in self.results:
            print("\nPOWER MAXIMIZATION RESULTS:")
            print("-" * 50)
            
            results = self.results['power_maximization']
            sorted_models = sorted(results.items(), key=lambda x: x[1]['fleet_test_mae'])
            
            for rank, (model_name, result) in enumerate(sorted_models, 1):
                mae = result['fleet_test_mae']
                r2 = result['fleet_test_r2']
                mape = result['fleet_test_mape']
                
                print(f"{rank}. {model_name}:")
                print(f"   Fleet MAE: {mae:.2f} kW")
                print(f"   Fleet R²: {r2:.3f}")
                print(f"   Fleet MAPE: {mape:.1%}")
                
                if rank == 1:
                    print("   BEST PERFORMER")
        
        # Combined Optimization Results
        if 'combined_optimization' in self.results:
            print("\nCOMBINED OPTIMIZATION RESULTS:")
            print("-" * 50)
            
            results = self.results['combined_optimization']
            sorted_models = sorted(results.items(), key=lambda x: x[1]['power_avg_r2'], reverse=True)
            
            for rank, (model_name, result) in enumerate(sorted_models, 1):
                power_r2 = result['power_avg_r2']
                pitch_r2 = result['pitch_avg_r2']
                
                print(f"{rank}. {model_name}:")
                print(f"   Power R²: {power_r2:.3f}")
                print(f"   Pitch R²: {pitch_r2:.3f}")
                
                if rank == 1:
                    print("   BEST PERFORMER")
        
        print(f"\n" + "=" * 80)
        print("OPTIMIZATION ANALYSIS COMPLETE!")
        
        if self.save_models:
            print(f"Models saved to: {self.output_dir}/")
        
        print("=" * 80)


# ==========================================
# MAIN EXECUTION FUNCTION
# ==========================================

def main():
    """
    Main function to run power optimization models
    """
    print("WIND TURBINE POWER OPTIMIZATION - FLEET-WIDE TRAINING")
    print("=" * 80)
    
    # File path - EDIT THIS
    DATA_PATH = "data/processed/wind_turbine_data_enhanced_for_modeling.csv"
    
    # Initialize power optimization models
    optimizer = PowerOptimizationModels(save_models=True, output_dir="power_optimization_models")
    
    # Step 1: Load and prepare data
    df = optimizer.load_and_prepare_data(DATA_PATH)
    if df is None:
        print("Failed to load data. Please check the file path.")
        return
    
    # Step 2: Prepare optimization features
    df = optimizer.prepare_optimization_features(df)
    
    # Step 3: Train power maximization models
    print("\nStarting Power Maximization Training...")
    power_results = optimizer.train_power_maximization_models(df)
    
    # Step 4: Train combined optimization models (power + pitch)
    print("\nStarting Combined Optimization Training...")
    combined_results = optimizer.train_combined_optimization_models(df)
    
    # Step 5: Generate summary report
    optimizer.generate_summary_report()
    
    return optimizer

if __name__ == "__main__":
    print("INSTRUCTIONS:")
    print("1. Update DATA_PATH to your enhanced dataset CSV file")
    print("2. Install required libraries: pip install pandas numpy matplotlib scikit-learn xgboost joblib")
    print("3. Run this script: python power_optimization.py")
    print("\n" + "=" * 80)
    
    # Run the optimization models
    optimizer = main()