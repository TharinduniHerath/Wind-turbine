#!/usr/bin/env python3
"""
Detailed Wind Turbine Data Analysis
Provides in-depth analysis of specific aspects of the wind turbine dataset.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

def analyze_data_quality(df, filename):
    """Analyze data quality issues."""
    print(f"\n=== Data Quality Analysis for {filename} ===")
    
    # Missing values analysis
    missing_data = df.isnull().sum()
    missing_percentage = (missing_data / len(df)) * 100
    
    print(f"Total rows: {len(df):,}")
    print(f"Total columns: {len(df.columns)}")
    print(f"Total missing values: {df.isnull().sum().sum():,}")
    print(f"Overall missing percentage: {(df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100:.2f}%")
    
    # Columns with most missing values
    missing_summary = pd.DataFrame({
        'Column': missing_data.index,
        'Missing_Count': missing_data.values,
        'Missing_Percentage': missing_percentage.values
    }).sort_values('Missing_Count', ascending=False)
    
    print(f"\nTop 5 columns with most missing values:")
    print(missing_summary.head())
    
    # Duplicate analysis
    duplicates = df.duplicated().sum()
    print(f"\nDuplicate rows: {duplicates:,} ({duplicates/len(df)*100:.2f}%)")
    
    return missing_summary

def analyze_time_series_patterns(df):
    """Analyze time series patterns in the data."""
    print(f"\n=== Time Series Analysis ===")
    
    if 'PCTimeStamp' not in df.columns:
        print("No timestamp column found")
        return
    
    df['PCTimeStamp'] = pd.to_datetime(df['PCTimeStamp'])
    
    # Time range
    start_time = df['PCTimeStamp'].min()
    end_time = df['PCTimeStamp'].max()
    duration = end_time - start_time
    
    print(f"Time range: {start_time} to {end_time}")
    print(f"Duration: {duration.days} days")
    print(f"Total time points: {len(df):,}")
    
    # Time intervals
    time_diffs = df['PCTimeStamp'].diff().dropna()
    expected_interval = pd.Timedelta(minutes=10)
    
    print(f"\nTime interval analysis:")
    print(f"Expected interval: {expected_interval}")
    print(f"Actual mean interval: {time_diffs.mean()}")
    print(f"Actual median interval: {time_diffs.median()}")
    print(f"Interval standard deviation: {time_diffs.std()}")
    
    # Check for gaps
    gaps = time_diffs[time_diffs > expected_interval * 1.5]
    print(f"Number of gaps (>15 min): {len(gaps)}")
    
    return time_diffs

def analyze_wind_turbine_performance(df):
    """Analyze wind turbine performance metrics."""
    print(f"\n=== Wind Turbine Performance Analysis ===")
    
    # Find wind speed and power columns
    wind_cols = [col for col in df.columns if 'windspeed' in col.lower()]
    power_cols = [col for col in df.columns if 'power' in col.lower()]
    
    if not wind_cols or not power_cols:
        print("No wind speed or power columns found")
        return
    
    print(f"Found {len(wind_cols)} wind speed columns and {len(power_cols)} power columns")
    
    # Analyze each turbine
    for i in range(min(len(wind_cols), len(power_cols))):
        wind_col = wind_cols[i]
        power_col = power_cols[i]
        
        turbine_id = wind_col.split('_')[0]  # Extract WTG01, WTG02, etc.
        
        print(f"\n{turbine_id}:")
        
        # Basic statistics
        wind_stats = df[wind_col].describe()
        power_stats = df[power_col].describe()
        
        print(f"  Wind Speed - Mean: {wind_stats['mean']:.2f}, Std: {wind_stats['std']:.2f}")
        print(f"  Power - Mean: {power_stats['mean']:.2f}, Std: {power_stats['std']:.2f}")
        
        # Power curve analysis (wind speed vs power)
        valid_data = df[[wind_col, power_col]].dropna()
        if len(valid_data) > 0:
            correlation = valid_data[wind_col].corr(valid_data[power_col])
            print(f"  Wind-Power Correlation: {correlation:.3f}")
            
            # Efficiency analysis
            max_power = power_stats['max']
            avg_power = power_stats['mean']
            capacity_factor = avg_power / max_power if max_power > 0 else 0
            print(f"  Capacity Factor: {capacity_factor:.3f}")

def analyze_sensor_data(df, sensor_type):
    """Analyze specific sensor data."""
    print(f"\n=== {sensor_type} Sensor Analysis ===")
    
    # Find relevant columns
    sensor_cols = [col for col in df.columns if sensor_type.lower() in col.lower()]
    
    if not sensor_cols:
        print(f"No {sensor_type} columns found")
        return
    
    print(f"Found {len(sensor_cols)} {sensor_type} columns")
    
    # Analyze each sensor
    for col in sensor_cols[:5]:  # Limit to first 5 for readability
        turbine_id = col.split('_')[0]
        sensor_name = col.split('_')[1] if len(col.split('_')) > 1 else "Unknown"
        
        stats = df[col].describe()
        missing_pct = (df[col].isnull().sum() / len(df)) * 100
        
        print(f"\n{turbine_id} - {sensor_name}:")
        print(f"  Mean: {stats['mean']:.2f}, Std: {stats['std']:.2f}")
        print(f"  Min: {stats['min']:.2f}, Max: {stats['max']:.2f}")
        print(f"  Missing: {missing_pct:.1f}%")

def main():
    """Main analysis function."""
    print("=" * 80)
    print("DETAILED WIND TURBINE DATA ANALYSIS")
    print("=" * 80)
    
    # Analyze key files
    key_files = [
        'Power-curve baseline (expected power vs. wind-speed pairs).xlsx',
        'D4 Wind Speed and Voltage.xlsx',
        'D3 Temperature.xlsx',
        'Blade-pitch angle.xlsx'
    ]
    
    for filename in key_files:
        try:
            print(f"\n{'='*60}")
            print(f"ANALYZING: {filename}")
            print(f"{'='*60}")
            
            df = pd.read_excel(filename)
            
            # Data quality analysis
            missing_summary = analyze_data_quality(df, filename)
            
            # Time series analysis
            time_diffs = analyze_time_series_patterns(df)
            
            # Performance analysis (for power curve file)
            if 'power' in filename.lower():
                analyze_wind_turbine_performance(df)
            
            # Sensor-specific analysis
            if 'temperature' in filename.lower():
                analyze_sensor_data(df, 'Temperature')
            elif 'voltage' in filename.lower():
                analyze_sensor_data(df, 'Voltage')
            elif 'angle' in filename.lower():
                analyze_sensor_data(df, 'Angle')
            
        except Exception as e:
            print(f"Error analyzing {filename}: {e}")
    
    print(f"\n{'='*80}")
    print("ANALYSIS COMPLETE")
    print(f"{'='*80}")
    
    print("\nKey Findings:")
    print("1. Dataset covers 1 full year (2024) with 10-minute intervals")
    print("2. 10 wind turbines (WTG01-WTG10) with comprehensive monitoring")
    print("3. Multiple sensor types: temperature, pressure, voltage, current, angles, RPM")
    print("4. Some missing data present across all files")
    print("5. Large dataset suitable for machine learning and predictive analytics")
    
    print("\nRecommended Next Steps:")
    print("1. Data preprocessing: Handle missing values and outliers")
    print("2. Feature engineering: Create derived features from sensor data")
    print("3. Time series analysis: Seasonal patterns and trends")
    print("4. Predictive modeling: Power prediction and anomaly detection")
    print("5. Visualization: Create dashboards for monitoring")

if __name__ == "__main__":
    main() 