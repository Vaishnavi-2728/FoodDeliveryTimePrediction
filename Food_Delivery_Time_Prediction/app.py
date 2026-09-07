import streamlit as st
import pandas as pd
import joblib
import os

# --------------------------------------------------
# Load the trained ML model
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "best_food_delivery_model.pkl")

model = joblib.load(MODEL_PATH)


# --------------------------------------------------
# Page Configuration
# --------------------------------------------------

st.set_page_config(
    page_title="Food Delivery Time Prediction",
    page_icon="🍔",
    layout="centered"
)


# --------------------------------------------------
# Title
# --------------------------------------------------

st.title("🍔 Food Delivery Time Prediction")

st.write(
    "Enter the order details below to predict the estimated "
    "food delivery time."
)

st.divider()


# --------------------------------------------------
# User Input
# --------------------------------------------------

st.subheader("📋 Enter Order Details")


# Distance
distance = st.number_input(
    "📍 Delivery Distance (km)",
    min_value=0.1,
    max_value=50.0,
    value=5.0,
    step=0.1
)


# Weather
weather = st.selectbox(
    "🌦️ Weather",
    ["Windy", "Clear", "Foggy", "Rainy", "Snowy"]
)


# Traffic
traffic = st.selectbox(
    "🚦 Traffic Level",
    ["Low", "Medium", "High"]
)


# Time of Day
time_of_day = st.selectbox(
    "🕐 Time of Day",
    ["Afternoon", "Evening", "Night", "Morning"]
)


# Vehicle Type
vehicle = st.selectbox(
    "🛵 Vehicle Type",
    ["Scooter", "Bike", "Car"]
)


# Restaurant Preparation Time
preparation_time = st.number_input(
    "🍳 Restaurant Preparation Time (minutes)",
    min_value=1,
    max_value=120,
    value=20,
    step=1
)


# Courier Experience
experience = st.number_input(
    "👨‍✈️ Courier Experience (years)",
    min_value=0.0,
    max_value=20.0,
    value=3.0,
    step=0.5
)


st.divider()


# --------------------------------------------------
# Prediction Button
# --------------------------------------------------

if st.button("🚀 Predict Delivery Time", use_container_width=True):

    # Create DataFrame with the same column names
    # used during ML model training

    input_data = pd.DataFrame({
        "Distance_km": [distance],
        "Weather": [weather],
        "Traffic_Level": [traffic],
        "Time_of_Day": [time_of_day],
        "Vehicle_Type": [vehicle],
        "Preparation_Time_min": [preparation_time],
        "Courier_Experience_yrs": [experience]
    })


    # --------------------------------------------------
    # Make Prediction
    # --------------------------------------------------

    prediction = model.predict(input_data)

    predicted_time = prediction[0]


    # --------------------------------------------------
    # Display Result
    # --------------------------------------------------

    st.success(
        f"🎯 Estimated Delivery Time: {predicted_time:.2f} minutes"
    )


    # Additional message
    if predicted_time <= 30:

        st.info("⚡ Your order is expected to arrive quickly.")

    elif predicted_time <= 60:

        st.info("🚴 Your order is expected to arrive within about an hour.")

    else:

        st.warning(
            "⏳ The estimated delivery time is relatively high."
        )
