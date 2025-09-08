
# Wind Turbine Failure Prediction Report

## Model Performance Summary

### Random Forest Model
- **AUC Score**: 0.8166
- **Accuracy**: 0.8562

### LSTM Model  
- **AUC Score**: 0.4939
- **Accuracy**: 0.8094

## Dataset Information
- **Total Samples**: 52,705
- **Training Samples**: 42,164
- **Test Samples**: 10,541
- **Failure Rate**: 19.1%

## Features Used
['WTG01_Ambient WindSpeed Avg. (1)_x', 'WTG02_Ambient WindSpeed Avg. (2)_x', 'WTG03_Ambient WindSpeed Avg. (3)_x', 'WTG04_Ambient WindSpeed Avg. (4)_x', 'WTG05_Ambient WindSpeed Avg. (5)_x', 'WTG06_Ambient WindSpeed Avg. (6)_x', 'WTG07_Ambient WindSpeed Avg. (7)_x', 'WTG08_Ambient WindSpeed Avg. (8)_x', 'WTG09_Ambient WindSpeed Avg. (9)_x', 'WTG10_Ambient WindSpeed Avg. (10)_x']

## Model Files Saved
- `models/random_forest_model.pkl` - Random Forest model
- `models/lstm_model.h5` - LSTM model  
- `models/scaler.pkl` - Feature scaler
- `models/confusion_matrices.png` - Confusion matrices
- `models/roc_curves.png` - ROC curves
- `models/feature_importance.png` - Feature importance

## Next Steps
1. Deploy the Random Forest model for production use
2. Monitor model performance over time
3. Retrain models with new data periodically
4. Consider ensemble methods for improved performance
