import os
import sys
import math
import logging
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Base directories
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")

# Initialize Flask App
app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")

# --------------------------------------------------
# CORS Configuration
# --------------------------------------------------
# When Flask serves the frontend directly, same-origin requests do not need CORS.
# For decoupled frontend servers (e.g., Live Server or dev servers on other ports),
# allowed origins can be configured via FRONTEND_ORIGINS or CORS_ORIGINS env vars (comma-separated).
DEFAULT_CORS_ORIGINS = [
    "http://127.0.0.1:5000",
    "http://localhost:5000",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
]

cors_env = os.environ.get("FRONTEND_ORIGINS") or os.environ.get("CORS_ORIGINS")
if cors_env:
    if cors_env.strip() == "*":
        allowed_origins = "*"
    else:
        allowed_origins = [origin.strip() for origin in cors_env.split(",") if origin.strip()]
else:
    allowed_origins = DEFAULT_CORS_ORIGINS

CORS(app, resources={r"/predict": {"origins": allowed_origins}, r"/api/*": {"origins": allowed_origins}})


# --------------------------------------------------
# Safe Model Loading
# --------------------------------------------------
MODEL_CANDIDATE_PATHS = [
    os.path.join(PROJECT_ROOT, "model", "best_food_delivery_model.pkl"),
    os.path.join(PROJECT_ROOT, "best_food_delivery_model.pkl"),
    os.path.join(BACKEND_DIR, "best_food_delivery_model.pkl"),
    os.path.join(BACKEND_DIR, "model", "best_food_delivery_model.pkl"),
]

model = None
model_path_used = None
model_load_error = None

for path in MODEL_CANDIDATE_PATHS:
    if os.path.exists(path):
        try:
            model = joblib.load(path)
            model_path_used = path
            logger.info(f"Successfully loaded machine learning model from: {path}")
            break
        except Exception as e:
            model_load_error = str(e)
            logger.error(f"Failed to load model from candidate path {path}: {e}")

if model is None:
    logger.error(
        f"WARNING: Could not find or load 'best_food_delivery_model.pkl'. "
        f"Error: {model_load_error}"
    )

# --------------------------------------------------
# ML Specification & Feature Constants
# --------------------------------------------------
VALID_CATEGORIES = {
    "Weather": ["Windy", "Clear", "Foggy", "Rainy", "Snowy"],
    "Traffic_Level": ["Low", "Medium", "High"],
    "Time_of_Day": ["Afternoon", "Evening", "Night", "Morning"],
    "Vehicle_Type": ["Scooter", "Bike", "Car"],
}

NUMERICAL_BOUNDS = {
    "Distance_km": {"min": 0.1, "max": 50.0, "label": "Delivery Distance"},
    "Preparation_Time_min": {"min": 1.0, "max": 120.0, "label": "Preparation Time"},
    "Courier_Experience_yrs": {"min": 0.0, "max": 25.0, "label": "Courier Experience"},
}

MODEL_METRICS = {
    "task": "Regression",
    "final_model": "Linear Regression",
    "target": "Delivery_Time_min",
    "evaluation_metrics": [
        {"code": "MAE", "name": "Mean Absolute Error", "description": "Average magnitude of the errors without considering direction (minutes)"},
        {"code": "MSE", "name": "Mean Squared Error", "description": "Average of the squares of errors, penalizing larger deviations"},
        {"code": "RMSE", "name": "Root Mean Squared Error", "description": "Square root of MSE, measured in the same unit as delivery time (minutes)"},
        {"code": "R²", "name": "R² Score", "description": "Coefficient of determination (proportion of variance explained)"},
    ],
    "model_comparison": [
        {"model": "Linear Regression", "mae": 5.8992, "mse": 77.9066, "rmse": 8.8265, "r2": 0.8262, "is_best": True},
        {"model": "Gradient Boosting", "mae": 6.4312, "mse": 85.8629, "rmse": 9.2662, "r2": 0.8084, "is_best": False},
        {"model": "Random Forest", "mae": 6.8683, "mse": 93.8313, "rmse": 9.6867, "r2": 0.7907, "is_best": False},
        {"model": "Extra Trees", "mae": 7.0205, "mse": 101.2091, "rmse": 10.0603, "r2": 0.7742, "is_best": False},
        {"model": "Decision Tree", "mae": 11.0750, "mse": 251.8950, "rmse": 15.8712, "r2": 0.4380, "is_best": False},
    ],
    "cross_validation": {
        "title": "5-Fold Cross-Validation Mean R²",
        "description": "Evaluated using 5-fold cross validation on 800 training samples (80% split).",
        "results": [
            {"model": "Linear Regression", "mean_r2": 0.7525, "std": 0.0484, "is_best": True},
            {"model": "Gradient Boosting", "mean_r2": 0.7121, "std": 0.0590, "is_best": False},
            {"model": "Random Forest", "mean_r2": 0.6937, "std": 0.0517, "is_best": False},
            {"model": "Extra Trees", "mean_r2": 0.6652, "std": 0.0350, "is_best": False},
            {"model": "Decision Tree", "mean_r2": 0.3989, "std": 0.0646, "is_best": False},
        ],
    },
    "preprocessing": [
        {"step": "StandardScaler", "type": "numerical", "features": ["Distance_km", "Preparation_Time_min", "Courier_Experience_yrs"]},
        {"step": "OneHotEncoder", "type": "categorical", "features": ["Weather", "Traffic_Level", "Time_of_Day", "Vehicle_Type"], "handle_unknown": "ignore"},
        {"step": "ColumnTransformer", "type": "pipeline", "features": "All combined preprocessed features"},
        {"step": "LinearRegression", "type": "estimator", "features": "Final prediction model"},
    ]
}


# --------------------------------------------------
# Frontend Static Routes
# --------------------------------------------------
@app.route("/")
def index():
    """Serve the single-page application frontend."""
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:path>")
def static_proxy(path):
    """Serve static assets (CSS, JS, images)."""
    file_path = os.path.join(FRONTEND_DIR, path)
    if os.path.exists(file_path):
        return send_from_directory(FRONTEND_DIR, path)
    return send_from_directory(FRONTEND_DIR, "index.html")


# --------------------------------------------------
# API Endpoints
# --------------------------------------------------
@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint to verify backend status and model readiness."""
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "model_path": model_path_used if model_path_used else "None",
    })


@app.route("/api/model-info", methods=["GET"])
def get_model_info():
    """Return model specification, metrics, and cross-validation data."""
    return jsonify({
        "success": True,
        "data": MODEL_METRICS,
        "categories": VALID_CATEGORIES,
    })


@app.route("/predict", methods=["POST"])
@app.route("/api/predict", methods=["POST"])
def predict():
    """
    Accepts food delivery parameters, validates inputs, and predicts
    delivery time using the trained Linear Regression pipeline.
    """
    if model is None:
    return jsonify({
        "error": f"Model loading failed: {model_load_error}"
    }), 503

    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({
            "success": False,
            "error": "Invalid request body. Expected a valid JSON object."
        }), 400

    # 1. Validate presence of all 7 required features
    required_keys = [
        "Distance_km",
        "Weather",
        "Traffic_Level",
        "Time_of_Day",
        "Vehicle_Type",
        "Preparation_Time_min",
        "Courier_Experience_yrs",
    ]

    missing_fields = [k for k in required_keys if k not in payload or payload[k] is None or payload[k] == ""]
    if missing_fields:
        return jsonify({
            "success": False,
            "error": f"Missing required fields: {', '.join(missing_fields)}"
        }), 400

    # 2. Validate and cast numerical features
    parsed_inputs = {}
    for num_col, bounds in NUMERICAL_BOUNDS.items():
        val = payload.get(num_col)
        try:
            val_float = float(val)
        except (ValueError, TypeError):
            return jsonify({
                "success": False,
                "error": f"Invalid numerical value for {bounds['label']} ('{num_col}'). Please enter a valid number."
            }), 400

        # Reject NaN and +/- Infinity
        if math.isnan(val_float) or math.isinf(val_float):
            return jsonify({
                "success": False,
                "error": f"Invalid numerical value for {bounds['label']} ('{num_col}'). NaN and Infinity are not accepted."
            }), 400

        if val_float < bounds["min"] or val_float > bounds["max"]:
            return jsonify({
                "success": False,
                "error": f"{bounds['label']} must be between {bounds['min']} and {bounds['max']}."
            }), 400

        parsed_inputs[num_col] = val_float

    # 3. Validate categorical features
    for cat_col, allowed_values in VALID_CATEGORIES.items():
        val_str = str(payload.get(cat_col)).strip()
        # Case-insensitive match normalization
        matched = next((item for item in allowed_values if item.lower() == val_str.lower()), None)
        if not matched:
            return jsonify({
                "success": False,
                "error": f"Invalid value '{val_str}' for '{cat_col}'. Allowed options: {', '.join(allowed_values)}"
            }), 400
        parsed_inputs[cat_col] = matched

    # 4. Create the pandas DataFrame with exact feature order and column names
    try:
        input_df = pd.DataFrame([{
            "Distance_km": parsed_inputs["Distance_km"],
            "Weather": parsed_inputs["Weather"],
            "Traffic_Level": parsed_inputs["Traffic_Level"],
            "Time_of_Day": parsed_inputs["Time_of_Day"],
            "Vehicle_Type": parsed_inputs["Vehicle_Type"],
            "Preparation_Time_min": parsed_inputs["Preparation_Time_min"],
            "Courier_Experience_yrs": parsed_inputs["Courier_Experience_yrs"],
        }])

        # 5. Make prediction using the trained scikit-learn pipeline
        raw_prediction = model.predict(input_df)[0]
        prediction_val = float(round(raw_prediction, 2))

        # Enforce realistic lower bound (e.g. at least 5 mins)
        if prediction_val < 1.0:
            prediction_val = 1.0

        # Transit classification
        if prediction_val <= 30.0:
            category_tag = "Fast Arrival"
            category_icon = "⚡"
            category_class = "fast"
            category_note = "Expected to arrive quickly with minimal transit friction."
        elif prediction_val <= 60.0:
            category_tag = "Standard Transit"
            category_icon = "🚴"
            category_class = "normal"
            category_note = "Expected to arrive within typical delivery timeframes."
        else:
            category_tag = "High Delay Notice"
            category_icon = "⏳"
            category_class = "delayed"
            category_note = "Higher delivery time expected due to distance, weather, or traffic conditions."

        return jsonify({
            "success": True,
            "prediction": prediction_val,
            "units": "minutes",
            "category": {
                "tag": category_tag,
                "icon": category_icon,
                "class": category_class,
                "note": category_note
            },
            "inputs": parsed_inputs
        })

    except Exception as e:
        logger.error(f"Prediction execution error: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": "An unexpected error occurred while calculating the delivery time. Please verify your inputs."
        }), 500


# --------------------------------------------------
# Main Runner
# --------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "127.0.0.1")
    debug_mode = os.environ.get("FLASK_DEBUG", "0").strip().lower() in ("1", "true", "yes")
    logger.info(f"Starting Food Delivery Time Prediction Flask Server on http://{host}:{port} (debug={debug_mode})")
    app.run(host=host, port=port, debug=debug_mode)
