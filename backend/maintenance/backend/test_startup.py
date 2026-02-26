#!/usr/bin/env python3
"""
Test script to verify the application can start without errors
"""

import sys
import os

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test if all required modules can be imported"""
    print("🧪 Testing imports...")
    
    try:
        # Test basic imports
        import fastapi
        print("✅ FastAPI imported successfully")
        
        import uvicorn
        print("✅ Uvicorn imported successfully")
        
        import pandas
        print("✅ Pandas imported successfully")
        
        import numpy
        print("✅ NumPy imported successfully")
        
        import joblib
        print("✅ Joblib imported successfully")
        
        import tensorflow
        print("✅ TensorFlow imported successfully")
        
        # Test our custom modules
        from maintenance import (
            TurbineData, PredictionResponse, HealthScore, 
            load_models, predict_failure, calculate_component_health
        )
        print("✅ Maintenance module imported successfully")
        
        print("\n✅ All imports successful!")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_model_loading():
    """Test if models can be loaded (or fail gracefully)"""
    print("\n🧪 Testing model loading...")
    
    try:
        from maintenance import load_models
        
        # This should not crash even if models don't exist
        result = load_models()
        print(f"✅ Model loading completed: {result}")
        return True
        
    except Exception as e:
        print(f"❌ Model loading error: {e}")
        return False

def test_basic_functions():
    """Test if basic functions work"""
    print("\n🧪 Testing basic functions...")
    
    try:
        from maintenance import (
            TurbineData, calculate_component_health, 
            generate_component_predictions
        )
        
        # Test creating a TurbineData object
        test_data = TurbineData(
            wind_speed=15.0,
            power_output=2000.0,
            rotor_rpm=20.0,
            nacelle_temp=60.0,
            gear_oil_temp=70.0,
            generator_temp=80.0,
            blade_pitch=45.0,
            yaw_angle=180.0,
            voltage_l1=380.0,
            voltage_l2=380.0,
            voltage_l3=380.0,
            current_l1=150.0,
            current_l2=150.0,
            current_l3=150.0,
            gear_oil_pressure=2.5,
            ambient_temp=25.0,
            humidity=60.0,
            wind_direction=270.0
        )
        print("✅ TurbineData object created successfully")
        
        # Test component health calculation
        health = calculate_component_health(test_data)
        print(f"✅ Component health calculated: {len(health)} components")
        
        # Test component predictions
        predictions = generate_component_predictions()
        print(f"✅ Component predictions generated: {len(predictions)} components")
        
        print("✅ All basic functions working!")
        return True
        
    except Exception as e:
        print(f"❌ Basic functions error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("🚀 Starting application startup tests...\n")
    
    tests = [
        ("Import Test", test_imports),
        ("Model Loading Test", test_model_loading),
        ("Basic Functions Test", test_basic_functions)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"📋 Running {test_name}...")
        if test_func():
            passed += 1
        print()
    
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The application should start successfully.")
        print("\n💡 To run the application:")
        print("   cd backend")
        print("   python main.py")
        return True
    else:
        print("⚠️ Some tests failed. Check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

