import pandas as pd
import time
import os

def stream_real_data_from_csv(file_path):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"CSV file not found: {file_path}")

    df = pd.read_csv(file_path)

    required_cols = ['noise level', 'WindSpeed at 80m', 'Wind Direction', 'power out', 'Rotor Speed', 'pitch angle']
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"CSV missing required columns: {missing_cols}")

    df = df[required_cols].dropna()

    for _, row in df.iterrows():
        yield {
            "noise_level": round(row['noise level'], 2),
            "wind_speed": round(row['WindSpeed at 80m'], 2),
            "wind_direction": round(row['Wind Direction'], 2),
            "power_out": round(row['power out'], 2),
            "rotor_speed": round(row['Rotor Speed'], 2),
            "pitch_angle": round(row['pitch angle'], 2),
            "timestamp": time.time()
        }
        time.sleep(30)

if __name__ == "__main__":
    csv_path = r"../data/wind_data.csv"

    try:
        for data_point in stream_real_data_from_csv(csv_path):
            print(data_point)
    except FileNotFoundError as e:
        print(f"Error: {e}")
    except ValueError as e:
        print(f"Error: {e}")
