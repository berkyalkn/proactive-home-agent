import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BACKEND_DIR))

import os
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sqlmodel import Session, select
from pathlib import Path

from database.settings import engine
from database.models import BehavioralTelemetry

MODEL_DIR = BACKEND_DIR / "data" / "models"
MODEL_PATH = MODEL_DIR / "behavior_model.json"

def fetch_data_from_db():
    """It retrieves synthetic telemetry data from PostgreSQL and converts it to a Pandas DataFrame."""

    print("Fetching behavioral data from PostgreSQL...")
    with Session(engine) as session:
        statement = select(BehavioralTelemetry)
        results = session.exec(statement).all()
        
    if not results:
        raise ValueError("No data found in the BehavioralTelemetry table!")
        
    data = [
        {
            "day_of_week": r.day_of_week,
            "hour_of_day": r.hour_of_day,
            "minute_of_hour": r.minute_of_hour,
            "lux_level": r.lux_level,
            "motion_detected": int(r.motion_detected), 
            "device_state": int(r.device_state)        
        }
        for r in results
    ]
    
    df = pd.DataFrame(data)
    print(f"Loaded {len(df)} records.")
    return df

def train_xgboost_model():
    df = fetch_data_from_db()

    X = df[["day_of_week", "hour_of_day", "minute_of_hour", "lux_level", "motion_detected"]]
    y = df["device_state"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training XGBoost Model...")
    
    model = xgb.XGBClassifier(
        n_estimators=100,      
        max_depth=4,           
        learning_rate=0.1,
        objective="binary:logistic",
        eval_metric="logloss"
    )
    
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print("\n" + "="*40)
    print(f"Model Training Complete!")
    print(f"Accuracy on unseen test data: {accuracy * 100:.2f}%")
    print("="*40)
    
    os.makedirs(MODEL_DIR, exist_ok=True)
    model.save_model(MODEL_PATH)
    print(f"Model successfully saved to: {MODEL_PATH}")

if __name__ == "__main__":
    train_xgboost_model()