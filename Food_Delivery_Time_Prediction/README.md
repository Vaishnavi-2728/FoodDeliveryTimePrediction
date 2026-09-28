# 🛵 Food Delivery Time Prediction Using Machine Learning
> **B.Tech Computer Science & Engineering Final Year Project**  
> An end-to-end Machine Learning web application predicting estimated food delivery time in minutes using Scikit-Learn, Flask, and a modern responsive user interface.

---

## 📌 1. Project Overview
In on-demand food logistics (e.g., Zomato, Swiggy, Uber Eats, DoorDash), providing accurate and reliable Estimated Time of Arrival (ETA) is critical. Inaccurate estimates lead to customer frustration, dispatch delays, compromised food quality, and restaurant kitchen bottlenecks.

This project delivers a complete, production-grade Machine Learning solution that predicts delivery duration in minutes based on multi-modal operational parameters. The trained regression pipeline is served via a Flask REST API and paired with a modern, responsive web application designed for academic evaluation, project presentations, and live demonstration.

---

## 💡 2. Problem Statement
Food delivery time is inherently variable and non-linear, influenced simultaneously by:
* Travel distance between the restaurant and the delivery doorstep.
* Atmospheric and weather conditions (Rain, Wind, Fog, Snow).
* Dynamic road congestion and traffic density levels.
* Dispatch time windows (Peak dinner rush, afternoon, night).
* Courier vehicle type (Scooter, Bicycle, Car).
* Restaurant kitchen meal preparation duration.
* Courier experience and rider familiarity with the delivery zones.

Without a predictive system, customers and platforms must rely on static averages that fail during adverse weather or traffic surges.

---

## 🎯 3. Objective
1. **Develop an Accurate Regression Pipeline**: Train, evaluate, and benchmark candidate regression algorithms on historical delivery data.
2. **Automate Preprocessing**: Implement a robust Scikit-learn `Pipeline` utilizing `StandardScaler` for continuous numerical features and `OneHotEncoder` for categorical factors via `ColumnTransformer`.
3. **Deploy a Professional Web Application**: Create an interactive, responsive web app featuring instant predictions, 5-fold cross-validation comparisons, localStorage prediction history, and Light/Dark themes.
4. **Resilient Production API**: Deploy a lightweight, decoupled Flask REST API with strict input schema validation and path-safe model serialization.

---

## 📊 4. Dataset & Features
The project is trained on the curated `Food_Delivery_Times.csv` dataset containing 1,000 real-world food delivery records (800 training, 200 testing).

### Target Variable
* **`Delivery_Time_min`**: Total elapsed time from order placement to customer doorstep delivery in minutes (Continuous Numerical Target).

### Input Features (7 Total)
> *Note: Unique identification fields (`Order_ID`) were dropped prior to model fitting.*

| Feature Name | Type | Description | Values / Range |
| :--- | :--- | :--- | :--- |
| **`Distance_km`** | Numerical (float) | Distance from restaurant to customer destination | `0.1` to `50.0 km` |
| **`Weather`** | Categorical (string) | Atmospheric condition during transit | `Clear`, `Windy`, `Foggy`, `Rainy`, `Snowy` |
| **`Traffic_Level`** | Categorical (string) | Route traffic congestion level | `Low`, `Medium`, `High` |
| **`Time_of_Day`** | Categorical (string) | Time window when the order is fulfilled | `Morning`, `Afternoon`, `Evening`, `Night` |
| **`Vehicle_Type`** | Categorical (string) | Transportation mode of courier rider | `Scooter`, `Bike`, `Car` |
| **`Preparation_Time_min`** | Numerical (int) | Estimated kitchen preparation time | `1` to `120 minutes` |
| **`Courier_Experience_yrs`** | Numerical (float) | Rider experience in courier logistics | `0.0` to `25.0 years` |

---

## ⚙️ 5. Machine Learning Workflow
The machine learning pipeline architecture follows standard production best practices:

```
Raw Order Input (7 Features)
       │
       ├─── Numerical Continuous ──────> [ StandardScaler ] ──────┐
       │    • Distance_km                                         │
       │    • Preparation_Time_min                                │
       │    • Courier_Experience_yrs                              ▼
       │                                                 [ ColumnTransformer ]
       └─── Categorical Factors ───────> [ OneHotEncoder ] ───────┤
            • Weather                    (handle_unknown='ignore')│
            • Traffic_Level                                       ▼
            • Time_of_Day                               [ LinearRegression ]
            • Vehicle_Type                                        │
                                                                  ▼
                                                      Predicted Delivery Minutes
```

### Preprocessing Specifications
* **StandardScaler**: Centers numerical features to zero mean and scales to unit variance ($z = (x - \mu) / \sigma$).
* **OneHotEncoder(handle_unknown='ignore')**: Converts categorical levels into binary one-hot vectors, preventing runtime crashes from previously unseen categories.
* **ColumnTransformer**: Combines parallel transformation pipelines into a unified design matrix passed directly to the estimator.

---

## 📈 6. Models Evaluated & Cross-Validation
Candidate regression models were evaluated on the training dataset using **5-Fold Cross-Validation** to measure generalization and stability.

### 5-Fold Cross-Validation Comparison
| Model | Mean $R^2$ | Standard Deviation ($R^2$) | Evaluation Verdict |
| :--- | :---: | :---: | :--- |
| **Linear Regression** | **0.7525** | **0.0484** | ⭐ **Selected Best Model** |
| **Gradient Boosting** | 0.7121 | 0.0590 | Evaluated Candidate |
| **Random Forest** | 0.6937 | 0.0517 | Evaluated Candidate |
| **Extra Trees** | 0.6652 | 0.0350 | Evaluated Candidate |
| **Decision Tree** | 0.3989 | 0.0646 | Overfitting / High Variance |

*Note: In regression analysis, $R^2$ measures the proportion of variance explained by the model rather than classification accuracy.*

---

## 📏 7. Evaluation Metrics (Test Dataset)
Evaluation metrics calculated on the 20% held-out test dataset (200 records) from the project notebook:

| Model | MAE (min) | MSE | RMSE (min) | $R^2$ Score |
| :--- | :---: | :---: | :---: | :---: |
| **Linear Regression** | **5.8992** | **77.9066** | **8.8265** | **0.8262** |
| **Gradient Boosting** | 6.4312 | 85.8629 | 9.2662 | 0.8084 |
| **Random Forest** | 6.8683 | 93.8313 | 9.6867 | 0.7907 |
| **Extra Trees** | 7.0205 | 101.2091 | 10.0603 | 0.7742 |
| **Decision Tree** | 11.0750 | 251.8950 | 15.8712 | 0.4380 |

### Metric Definitions:
* **MAE (Mean Absolute Error)**: Average absolute magnitude of errors between predicted and actual delivery minutes ($|y - \hat{y}|$).
* **MSE (Mean Squared Error)**: Average of squared errors, penalizing larger deviations ($ (y - \hat{y})^2 $).
* **RMSE (Root Mean Squared Error)**: Standard deviation of residuals, expressed in the same physical unit (minutes) as delivery time.
* **$R^2$ Score**: Coefficient of determination, quantifying the percentage of variance captured by the model.

---

## 🏆 8. Final Model
* **Algorithm**: **Linear Regression Pipeline**
* **Serialized Artifact**: `best_food_delivery_model.pkl`
* **Test Performance**: $R^2 = 0.8262$, $\text{RMSE} = 8.83 \text{ min}$, $\text{MAE} = 5.90 \text{ min}$.
* **Why Linear Regression?**: Delivered the highest 5-fold cross-validation Mean $R^2$ ($0.7525$), lowest test set error, lowest parameter variance, and instant sub-millisecond inference time without risk of tree-based overfitting on the 1,000-record dataset.

---

## 🌟 9. Application Features
* **Modern Web Interface**: Clean design system with Plus Jakarta Sans typography, custom card components, and micro-interactions (NOT Streamlit).
* **Live Prediction Counter**: Animated roll-up counter showing calculated delivery minutes with transit classification badges (Fast Arrival, Standard Transit, High Delay).
* **Quick Presets**: 4 pre-configured real-world delivery scenarios (Standard Lunch, Rainy Rush Hour, Late Night Express, Long Distance Car).
* **Recent Predictions History**: Local browser `localStorage` table displaying recent predictions with timestamp, parameters, and ETA without requiring external databases.
* **Factual Delivery Insights**: Contextual insight summaries grounded strictly in the user's entered parameters.
* **Dedicated Model Comparison Section**: Interactive charts, 5-fold cross-validation tables, and detailed metric cards comparing all 5 evaluated algorithms.
* **Dark / Light Mode**: Seamless theme toggle with persistent state saved in `localStorage`.
* **Fully Responsive**: Mobile-first grid layouts supporting phones, tablets, laptops, and desktop screens.

---

## 📁 10. Project Structure
```
Food_Delivery_Time_Prediction/
│
├── backend/
│   └── app.py                       # Flask REST API & Web Application Server
│
├── frontend/
│   ├── index.html                   # Semantic, Accessible Single-Page UI
│   ├── style.css                    # Design System, Light/Dark Modes & Responsive Styles
│   ├── script.js                    # Client Validation, Async Fetch, Presets & History
│   └── assets/                      # Professional Graphics
│       ├── hero_delivery.jpg        # Hero Delivery Courier
│       ├── bag_clock.jpg            # Prediction Result Graphic
│       └── about_scooter.jpg        # Capstone Project Graphic
│
├── model/
│   └── best_food_delivery_model.pkl # Serialized Scikit-Learn Pipeline
│
├── best_food_delivery_model.pkl     # Root Model Fallback Copy
├── Untitled15.ipynb                 # Original Jupyter Notebook (Colab ML Source)
├── untitled15.py                    # Exported Notebook Python Script
├── requirements.txt                 # Dependencies
└── README.md                        # Project Documentation
```

---

## 💻 11. Installation Guide

### Prerequisites
* Python 3.10+ (or Python 3.11 / 3.12)
* `pip` package manager

### Step 1: Clone or Navigate to the Workspace
```bash
cd Food_Delivery_Time_Prediction
```

### Step 2: Set Up Virtual Environment (Recommended)
* **Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```
* **macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Step 3: Install Required Packages
```bash
pip install -r requirements.txt
```

---

## 🚀 12. How to Run

### Complete Web Application (Flask)
Start the unified Flask server which handles both the backend REST endpoints and serves the static frontend:
```bash
python backend/app.py
```
Open your web browser and navigate to:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🔌 13. API Information

### 1. Health Check
* **Endpoint**: `GET /api/health`
* **Response**:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_path": ".../best_food_delivery_model.pkl"
}
```

### 2. Model Information & Metrics
* **Endpoint**: `GET /api/model-info`
* **Response**: Returns model specifications, preprocessing stages, 5-fold cross-validation scores, and test evaluation metrics.

### 3. Predict Delivery Time
* **Endpoint**: `POST /predict` (also aliased at `POST /api/predict`)
* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "Distance_km": 5.0,
  "Weather": "Clear",
  "Traffic_Level": "Medium",
  "Time_of_Day": "Evening",
  "Vehicle_Type": "Scooter",
  "Preparation_Time_min": 20,
  "Courier_Experience_yrs": 3.0
}
```
* **Response Body**:
```json
{
  "success": true,
  "prediction": 44.34,
  "units": "minutes",
  "category": {
    "tag": "Standard Transit",
    "icon": "🚴",
    "class": "normal",
    "note": "Expected to arrive within typical delivery timeframes."
  },
  "inputs": {
    "Distance_km": 5.0,
    "Weather": "Clear",
    "Traffic_Level": "Medium",
    "Time_of_Day": "Evening",
    "Vehicle_Type": "Scooter",
    "Preparation_Time_min": 20.0,
    "Courier_Experience_yrs": 3.0
  }
}
```

---

## 🎓 14. Academic Attribution
* **Project**: Food Delivery Time Prediction Using Machine Learning
* **Degree**: Bachelor of Technology (B.Tech) in Computer Science & Engineering
* **Field**: Machine Learning & Applied Artificial Intelligence
