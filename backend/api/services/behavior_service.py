import xgboost as xgb
import pandas as pd
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "models" / "behavior_model.json"

class BehaviorService:
    def __init__(self):
        self.model = xgb.XGBClassifier()
        self.is_loaded = False
        self._load_model()

    def _load_model(self):
        try:
            if MODEL_PATH.exists():
                self.model.load_model(MODEL_PATH)
                self.is_loaded = True
                logger.info(f"[BehaviorService] XGBoost behavioral model loaded successfully from {MODEL_PATH}")
            else:
                logger.warning("[BehaviorService] Behavioral model file not found! Autonomous features will be disabled.")
        except Exception as e:
            logger.error(f"[BehaviorService] Failed to load behavioral model: {e}")

    def predict_action(self, day_of_week: int, hour: int, minute: int, lux: float, motion: bool) -> dict:
        """Based on the system's current state, it predicts whether the device should be ON or OFF."""

        if not self.is_loaded:
            return {"action": None, "confidence": 0.0, "reason": "Model offline"}

        df = pd.DataFrame([{
            "day_of_week": day_of_week,
            "hour_of_day": hour,
            "minute_of_hour": minute,
            "lux_level": lux,
            "motion_detected": int(motion)
        }])

        try:
            probabilities = self.model.predict_proba(df)[0]
            prob_off = float(probabilities[0])
            prob_on = float(probabilities[1])
            
            decision = True if prob_on >= 0.85 else False
            
            return {
                "action": decision,
                "confidence": prob_on if decision else prob_off,
                "prob_on": prob_on,
                "prob_off": prob_off
            }
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {"action": None, "confidence": 0.0, "error": str(e)}

behavior_service = BehaviorService()