#!/usr/bin/env python3
"""
Wind Turbine Data Analysis Script
Analyzes the comprehensive dataset of wind turbine operational data.
"""

import pandas as pd
import numpy as np
import os
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns

def analyze_file(filename):
    """Analyze a single Excel file and return basic statistics."""
    try:
        df = pd.read_excel(filename)
        analysis = {
            'filename': filename,
            'shape': df.shape,
            'columns': len(df.columns),
            'rows': len(df),
            'memory_usage_mb': df.memory_usage(deep=True).sum() / 1024 / 1024,
            'missing_values': df.isnull().sum().sum(),
            'duplicate_rows': df.duplicated().sum(),
            'time_range': None,
            'column_types': df.dtypes.value_counts().to_dict()
        }
        
        # Check if there's a timestamp column
        if 'PCTimeStamp' in df.columns:
            df['PCTimeStamp'] = pd.to_datetime(df['PCTimeStamp'])
            analysis['time_range'] = {
                'start': df['PCTimeStamp'].min(),
                'end': df['PCTimeStamp'].max(),
                'duration_days': (df['PCTimeStamp'].max() - df['PCTimeStamp'].min()).days
            }
        
        return analysis
    except Exception as e:
        return {'filename': filename, 'error': str(e)}

def get_column_categories(df):
    """Categorize columns by their measurement type."""
    categories = {
        'timestamp': [],
        'power': [],
        'temperature': [],
        'wind_speed': [],
        'voltage': [],
        'current': [],
        'pressure': [],
        'rpm': [],
        'angle': [],
        'humidity': [],
        'other': []
    }
    
    for col in df.columns:
        col_lower = col.lower()
        if 'timestamp' in col_lower or 'time' in col_lower:
            categories['timestamp'].append(col)
        elif 'power' in col_lower:
            categories['power'].append(col)
        elif 'temp' in col_lower or 'temperature' in col_lower:
            categories['temperature'].append(col)
        elif 'windspeed' in col_lower or 'wind' in col_lower:
            categories['wind_speed'].append(col)
        elif 'voltage' in col_lower:
            categories['voltage'].append(col)
        elif 'current' in col_lower:
            categories['current'].append(col)
        elif 'pressure' in col_lower:
            categories['pressure'].append(col)
        elif 'rpm' in col_lower:
            categories['rpm'].append(col)
        elif 'angle' in col_lower or 'pitch' in col_lower or 'yaw' in col_lower:
            categories['angle'].append(col)
        elif 'humidity' in col_lower:
            categories['humidity'].append(col)
        else:
            categories['other'].append(col)
    
    return categories

def main():
    """Main analysis function."""
    print("=" * 80)
    print("WIND TURBINE DATA ANALYSIS")
    print("=" * 80)
    
    # Get all Excel files
    excel_files = [f for f in os.listdir('.') if f.endswith('.xlsx')]
    excel_files.sort()
    
    print(f"\nFound {len(excel_files)} Excel files:")
    for i, file in enumerate(excel_files, 1):
        size_mb = os.path.getsize(file) / 1024 / 1024
        print(f"{i:2d}. {file:<50} ({size_mb:.1f} MB)")
    
    print("\n" + "=" * 80)
    print("DETAILED FILE ANALYSIS")
    print("=" * 80)
    
    all_analyses = []
    for file in excel_files:
        print(f"\nAnalyzing: {file}")
        analysis = analyze_file(file)
        all_analyses.append(analysis)
        
        if 'error' in analysis:
            print(f"  ERROR: {analysis['error']}")
        else:
            print(f"  Shape: {analysis['shape']}")
            print(f"  Memory: {analysis['memory_usage_mb']:.1f} MB")
            print(f"  Missing values: {analysis['missing_values']}")
            print(f"  Duplicate rows: {analysis['duplicate_rows']}")
            
            if analysis['time_range']:
                tr = analysis['time_range']
                print(f"  Time range: {tr['start']} to {tr['end']} ({tr['duration_days']} days)")
    
    print("\n" + "=" * 80)
    print("DATASET SUMMARY")
    print("=" * 80)
    
    # Summary statistics
    total_rows = sum(a.get('rows', 0) for a in all_analyses if 'error' not in a)
    total_columns = sum(a.get('columns', 0) for a in all_analyses if 'error' not in a)
    total_memory = sum(a.get('memory_usage_mb', 0) for a in all_analyses if 'error' not in a)
    
    print(f"Total dataset size: {total_rows:,} rows × {total_columns:,} columns")
    print(f"Total memory usage: {total_memory:.1f} MB")
    print(f"Number of files: {len([a for a in all_analyses if 'error' not in a])}")
    
    # Analyze the main power curve file in detail
    print("\n" + "=" * 80)
    print("POWER CURVE ANALYSIS")
    print("=" * 80)
    
    try:
        power_df = pd.read_excel('Power-curve baseline (expected power vs. wind-speed pairs).xlsx')
        print(f"Power curve data shape: {power_df.shape}")
        
        # Get column categories
        categories = get_column_categories(power_df)
        
        print("\nColumn categories:")
        for category, cols in categories.items():
            if cols:
                print(f"  {category.title()}: {len(cols)} columns")
                if len(cols) <= 5:
                    for col in cols:
                        print(f"    - {col}")
        
        # Basic statistics for wind speed and power
        wind_cols = [col for col in power_df.columns if 'windspeed' in col.lower()]
        power_cols = [col for col in power_df.columns if 'power' in col.lower()]
        
        if wind_cols and power_cols:
            print(f"\nWind speed columns: {len(wind_cols)}")
            print(f"Power columns: {len(power_cols)}")
            
            # Sample statistics for first wind turbine
            if wind_cols and power_cols:
                wind_col = wind_cols[0]
                power_col = power_cols[0]
                
                print(f"\nSample statistics for {wind_col} and {power_col}:")
                print(f"  Wind speed - Min: {power_df[wind_col].min():.2f}, Max: {power_df[wind_col].max():.2f}, Mean: {power_df[wind_col].mean():.2f}")
                print(f"  Power - Min: {power_df[power_col].min():.2f}, Max: {power_df[power_col].max():.2f}, Mean: {power_df[power_col].mean():.2f}")
    
    except Exception as e:
        print(f"Error analyzing power curve file: {e}")
    
    print("\n" + "=" * 80)
    print("RECOMMENDATIONS")
    print("=" * 80)
    
    print("1. Data Quality:")
    print("   - Check for missing values and handle them appropriately")
    print("   - Remove duplicate rows if necessary")
    print("   - Validate timestamp consistency across files")
    
    print("\n2. Data Integration:")
    print("   - Merge files based on PCTimeStamp for comprehensive analysis")
    print("   - Create a unified dataset with all measurements")
    print("   - Consider time-series analysis capabilities")
    
    print("\n3. Analysis Opportunities:")
    print("   - Power curve analysis and optimization")
    print("   - Predictive maintenance using temperature and pressure data")
    print("   - Wind speed vs power production correlation")
    print("   - Component health monitoring (gearbox, generator, etc.)")
    print("   - Performance comparison across 10 wind turbines")
    
    print("\n4. Technical Considerations:")
    print("   - Large dataset (18MB+ files) - consider data sampling for initial analysis")
    print("   - Time-series data with 10-minute intervals")
    print("   - Multiple sensor types: temperature, pressure, voltage, current, angles")
    print("   - 10 wind turbines (WTG01-WTG10) with comprehensive monitoring")

if __name__ == "__main__":
    main() 