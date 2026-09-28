/**
 * FoodPredict — Frontend Client Logic
 * Handles interactive validation, async ML predictions, presets,
 * recent predictions history (localStorage), light/dark mode, and responsive UX.
 */

document.addEventListener("DOMContentLoaded", () => {
  // --------------------------------------------------------------------------
  // DOM Element Selectors
  // --------------------------------------------------------------------------
  const htmlElement = document.documentElement;
  const themeToggleBtn = document.getElementById("themeToggleBtn");

  const predictionForm = document.getElementById("predictionForm");
  const predictBtn = document.getElementById("predictBtn");
  const predictBtnText = document.getElementById("predictBtnText");
  const predictSpinner = document.getElementById("predictSpinner");
  const resetFormBtn = document.getElementById("resetFormBtn");
  const formAlert = document.getElementById("formAlert");

  const resultCard = document.getElementById("resultCard");
  const resultPlaceholder = document.getElementById("resultPlaceholder");
  const resultDisplay = document.getElementById("resultDisplay");
  const resultValue = document.getElementById("resultValue");
  const resultBadgeTag = document.getElementById("resultBadgeTag");
  const resultInsightBox = document.getElementById("resultInsightBox");
  const insightText = document.getElementById("insightText");
  const makeAnotherBtn = document.getElementById("makeAnotherBtn");

  // Summary Snapshot Chips
  const chipDist = document.getElementById("chipDist");
  const chipTraffic = document.getElementById("chipTraffic");
  const chipWeather = document.getElementById("chipWeather");
  const chipVehicle = document.getElementById("chipVehicle");
  const chipPrep = document.getElementById("chipPrep");
  const chipExp = document.getElementById("chipExp");

  // Recent Predictions Table Elements
  const recentTableWrapper = document.getElementById("recentTableWrapper");
  const recentTableBody = document.getElementById("recentTableBody");
  const recentEmptyState = document.getElementById("recentEmptyState");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");

  // Mobile menu
  const mobileToggle = document.getElementById("mobileToggle");
  const navMenu = document.getElementById("navMenu");
  const navLinks = document.querySelectorAll(".nav-link");

  // Presets
  const presetPills = document.querySelectorAll(".preset-pill");

  // --------------------------------------------------------------------------
  // Theme Toggle (Dark / Light Mode)
  // --------------------------------------------------------------------------
  const THEME_STORAGE_KEY = "foodpredict_theme";

  const initTheme = () => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      htmlElement.setAttribute("data-theme", "dark");
    } else {
      htmlElement.setAttribute("data-theme", "light");
    }
  };

  const toggleTheme = () => {
    const currentTheme = htmlElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    htmlElement.setAttribute("data-theme", newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme);
  }

  initTheme();

  // --------------------------------------------------------------------------
  // API URL Resolution (Supports Flask direct host & decoupled dev servers)
  // --------------------------------------------------------------------------
  const getApiEndpoint = () => {
    if (window.location.protocol.startsWith("http")) {
      return "/predict";
    }
    return "http://127.0.0.1:5000/predict";
  };

  // --------------------------------------------------------------------------
  // Preset Configurations
  // --------------------------------------------------------------------------
  const PRESETS = {
    standard: {
      distance: 5.0,
      weather: "Clear",
      traffic: "Medium",
      time: "Evening",
      vehicle: "Scooter",
      prep: 20,
      exp: 3.0,
    },
    rainy_rush: {
      distance: 8.0,
      weather: "Rainy",
      traffic: "High",
      time: "Evening",
      vehicle: "Bike",
      prep: 30,
      exp: 1.5,
    },
    late_night: {
      distance: 3.2,
      weather: "Clear",
      traffic: "Low",
      time: "Night",
      vehicle: "Scooter",
      prep: 15,
      exp: 4.0,
    },
    long_distance: {
      distance: 14.5,
      weather: "Windy",
      traffic: "Medium",
      time: "Afternoon",
      vehicle: "Car",
      prep: 25,
      exp: 5.0,
    },
  };

  presetPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      presetPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");

      const presetKey = pill.getAttribute("data-preset");
      const config = PRESETS[presetKey];
      if (!config) return;

      document.getElementById("distance_km").value = config.distance;
      document.getElementById("weather").value = config.weather;
      document.getElementById("traffic_level").value = config.traffic;
      document.getElementById("time_of_day").value = config.time;
      document.getElementById("vehicle_type").value = config.vehicle;
      document.getElementById("prep_time").value = config.prep;
      document.getElementById("courier_exp").value = config.exp;

      hideAlert();
    });
  });

  // --------------------------------------------------------------------------
  // Reset Button Handler
  // --------------------------------------------------------------------------
  if (resetFormBtn) {
    resetFormBtn.addEventListener("click", () => {
      document.getElementById("distance_km").value = "5.0";
      document.getElementById("weather").value = "Clear";
      document.getElementById("traffic_level").value = "Medium";
      document.getElementById("time_of_day").value = "Evening";
      document.getElementById("vehicle_type").value = "Scooter";
      document.getElementById("prep_time").value = "20";
      document.getElementById("courier_exp").value = "3.0";

      presetPills.forEach((p) => p.classList.remove("active"));
      const standardPill = document.querySelector('[data-preset="standard"]');
      if (standardPill) standardPill.classList.add("active");

      hideAlert();
    });
  }

  // --------------------------------------------------------------------------
  // Make Another Prediction Handler
  // --------------------------------------------------------------------------
  if (makeAnotherBtn) {
    makeAnotherBtn.addEventListener("click", () => {
      const distanceInput = document.getElementById("distance_km");
      if (distanceInput) {
        distanceInput.focus();
        predictionForm.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  // --------------------------------------------------------------------------
  // Mobile Navigation Toggle
  // --------------------------------------------------------------------------
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener("click", () => {
      navMenu.classList.toggle("open");
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("open");
      });
    });
  }

  // --------------------------------------------------------------------------
  // Scrollspy for Navigation Highlighting
  // --------------------------------------------------------------------------
  const sections = document.querySelectorAll("section[id]");
  const updateActiveNavLink = () => {
    const scrollY = window.pageYOffset;

    sections.forEach((current) => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute("id");

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navLinks.forEach((link) => {
          link.classList.remove("active");
          if (link.getAttribute("data-section") === sectionId) {
            link.classList.add("active");
          }
        });
      }
    });
  };

  window.addEventListener("scroll", updateActiveNavLink);

  // --------------------------------------------------------------------------
  // Friendly Alert Helpers
  // --------------------------------------------------------------------------
  const showAlert = (message) => {
    formAlert.textContent = message;
    formAlert.className = "form-alert error";
    formAlert.classList.remove("hidden");
  };

  const hideAlert = () => {
    formAlert.textContent = "";
    formAlert.classList.add("hidden");
  };

  // --------------------------------------------------------------------------
  // Animated Number Counter
  // --------------------------------------------------------------------------
  const animateValue = (element, start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = progress * (end - start) + start;
      element.textContent = current.toFixed(2);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        element.textContent = end.toFixed(2);
      }
    };
    window.requestAnimationFrame(step);
  };

  // --------------------------------------------------------------------------
  // Recent Predictions Management (localStorage)
  // --------------------------------------------------------------------------
  const RECENT_STORAGE_KEY = "foodpredict_recent_history";

  const getRecentPredictions = () => {
    try {
      const saved = localStorage.getItem(RECENT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const saveRecentPrediction = (item) => {
    const history = getRecentPredictions();
    history.unshift(item);
    if (history.length > 6) {
      history.pop();
    }
    try {
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Storage error fallback
    }
    renderRecentPredictions();
  };

  const renderRecentPredictions = () => {
    const history = getRecentPredictions();
    if (!recentTableBody || !recentTableWrapper || !recentEmptyState) return;

    if (history.length === 0) {
      recentTableWrapper.classList.add("hidden");
      recentEmptyState.classList.remove("hidden");
      recentTableBody.innerHTML = "";
      return;
    }

    recentEmptyState.classList.add("hidden");
    recentTableWrapper.classList.remove("hidden");
    recentTableBody.innerHTML = "";

    history.forEach((record) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="font-mono" style="font-size:0.8rem; color:var(--color-text-muted);">${record.timestamp}</td>
        <td><strong>${record.distance} km</strong></td>
        <td>${record.traffic}</td>
        <td>${record.weather}</td>
        <td>${record.vehicle}</td>
        <td>${record.prep} min</td>
        <td><span class="recent-eta-badge">${record.prediction.toFixed(2)} min</span></td>
      `;
      recentTableBody.appendChild(row);
    });
  };

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", () => {
      localStorage.removeItem(RECENT_STORAGE_KEY);
      renderRecentPredictions();
    });
  }

  // Render on page load
  renderRecentPredictions();

  // --------------------------------------------------------------------------
  // Form Submission & ML Prediction
  // --------------------------------------------------------------------------
  if (predictionForm) {
    predictionForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideAlert();

      // Retrieve form values
      const distance = parseFloat(document.getElementById("distance_km").value);
      const weather = document.getElementById("weather").value;
      const traffic = document.getElementById("traffic_level").value;
      const timeOfDay = document.getElementById("time_of_day").value;
      const vehicle = document.getElementById("vehicle_type").value;
      const prepTime = parseFloat(document.getElementById("prep_time").value);
      const experience = parseFloat(document.getElementById("courier_exp").value);

      // Client-side Validation with friendly messages
      if (isNaN(distance) || distance <= 0 || distance > 50) {
        showAlert("Please enter a valid delivery distance between 0.1 and 50 km.");
        return;
      }
      if (isNaN(prepTime) || prepTime < 1 || prepTime > 120) {
        showAlert("Please enter a realistic kitchen preparation time between 1 and 120 minutes.");
        return;
      }
      if (isNaN(experience) || experience < 0 || experience > 25) {
        showAlert("Please enter courier experience between 0 and 25 years.");
        return;
      }

      // Payload matching exact ML features schema
      const payload = {
        Distance_km: distance,
        Weather: weather,
        Traffic_Level: traffic,
        Time_of_Day: timeOfDay,
        Vehicle_Type: vehicle,
        Preparation_Time_min: prepTime,
        Courier_Experience_yrs: experience,
      };

      // Loading UI State
      predictBtn.disabled = true;
      predictSpinner.classList.remove("hidden");
      predictBtnText.textContent = "Calculating ETA...";

      try {
        const response = await fetch(getApiEndpoint(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "The prediction request could not be processed by the server.");
        }

        const predictedMinutes = parseFloat(data.prediction);

        // Display results
        resultPlaceholder.classList.add("hidden");
        resultDisplay.classList.remove("hidden");

        // Animate counter smoothly
        animateValue(resultValue, 0, predictedMinutes, 700);

        // Transit Status Categorization
        const category = data.category || {
          tag: predictedMinutes <= 30 ? "Fast Arrival" : predictedMinutes <= 60 ? "Standard Transit" : "High Delay Notice",
          icon: predictedMinutes <= 30 ? "⚡" : predictedMinutes <= 60 ? "🚴" : "⏳",
          class: predictedMinutes <= 30 ? "fast" : predictedMinutes <= 60 ? "normal" : "delayed",
        };

        resultBadgeTag.className = `result-badge-tag ${category.class}`;
        resultBadgeTag.textContent = `${category.icon} ${category.tag}`;

        // Delivery Insight (strictly grounded in input features)
        insightText.textContent = `Your prediction of ${predictedMinutes.toFixed(2)} minutes is based on distance (${distance} km), traffic (${traffic}), weather (${weather}), time of day (${timeOfDay}), vehicle type (${vehicle}), preparation time (${prepTime} min), and courier experience (${experience} yrs).`;

        // Update Snapshot Chips
        chipDist.textContent = `${distance} km`;
        chipTraffic.textContent = traffic;
        chipWeather.textContent = weather;
        chipVehicle.textContent = vehicle;
        chipPrep.textContent = `${prepTime} min`;
        chipExp.textContent = `${experience} yrs`;

        // Save into recent history
        const now = new Date();
        const timeFormatted = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        saveRecentPrediction({
          timestamp: timeFormatted,
          distance: distance,
          traffic: traffic,
          weather: weather,
          vehicle: vehicle,
          prep: prepTime,
          prediction: predictedMinutes,
        });

        // On mobile/tablet, scroll result card into view
        if (window.innerWidth < 1024) {
          resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
        }

      } catch (err) {
        console.error("Prediction Error:", err);
        showAlert(
          err.message.includes("Failed to fetch")
            ? "Cannot reach prediction server. Please ensure the Flask backend (python backend/app.py) is running on port 5000."
            : `Prediction Error: ${err.message}`
        );
      } finally {
        predictBtn.disabled = false;
        predictSpinner.classList.add("hidden");
        predictBtnText.textContent = "🔮 Predict Delivery Time";
      }
    });
  }

  // --------------------------------------------------------------------------
  // Background Health Check on Load
  // --------------------------------------------------------------------------
  const checkBackendHealth = async () => {
    try {
      const endpoint = window.location.protocol.startsWith("http")
        ? "/api/health"
        : "http://127.0.0.1:5000/api/health";

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.model_loaded) {
          console.log("FoodPredict backend connected and ML model ready:", data.model_path);
        } else {
          console.warn("Backend reachable but model failed to load:", data);
        }
      }
    } catch {
      // Backend may not yet be running if static file was opened directly
    }
  };

  checkBackendHealth();
});
