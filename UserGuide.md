# AeroStream Legacy Operating System — User Guide
**Version:** 0.9.4  
**Date:** February 2026  
**System Requirements:** Modern Web Browser (Chrome/Edge/Firefox) with Audio and WebGL support.

Welcome to **AeroStream Command Center**, a state-of-the-art 1990s retro-futuristic airline operations dashboard. Designed with green-phosphor CRT aesthetics, mechanical hardware controls, and backed by a cutting-edge DuckDB + Machine Learning stack, this system provides real-time situational awareness and predictive delay mitigation for your flight network.

---

## 1. Global Navigation & Protocols

To maximize efficiency, AeroStream is designed to be fully navigable via keyboard, just like a true legacy mainframe.

*   **`F1` through `F8`**: Instantly switch between the primary modules (Dashboard, Map, Risk, Ops, Analytics, Search, Crew, Config).
*   **`Ctrl + K` (or `Cmd + K`)**: Open the **Global Command Protocol**. This modal allows you to type out full commands (e.g., "Take me to radar", "Show me flight analytics") using natural language.
*   **Click Audio**: Every interaction is accompanied by physical relay clicks or mechanical typewriter sounds, generated natively via the Web Audio API. 
*   **CRT Overlay**: The entire application is rendered beneath a dynamic CRT scanline and beam glow overlay.

---

## 2. Core Modules

### 1. Dashboard (`F1`)
The primary monitoring station upon boot-up.
*   **Analog KPI Dials:** View real-time Total Flights, Delay Rates, and On-Time percentages on mechanical half-circle gauges.
*   **Live Teletype Feed (TTY-1):** A continuous, scrolling feed of active block flights. Hover over any flight (crosshair cursor) and click to lock onto its Risk Profile.
*   **AI Ops Directive:** A dedicated terminal block that mechanically types out the latest overarching system analysis or warnings.

### 2. Live Radar Map (`F2`)
Your primary visual tracking interface.
*   **Radar Sweep:** A continuous 360-degree sweep emulates an active radar dish.
*   **Aircraft Identifiers:** Planes are plotted in real-time. Green indicates healthy flights.
*   **Threat Detection:** "High Risk" flights automatically flash red and pulse on the radar. Click on any aircraft to pull its telemetry into the right-side Target Panel.

### 3. Risk Intelligence (`F3`)
Deep-dive Machine Learning analysis for predicted delays.
*   **Target Select:** Use the left terminal to search or click on a specific flight.
*   **Diagnostic Barometers:** High-tech "liquid tube" graphs break down exactly *why* a flight might be delayed based on SHAP values (e.g., Weather Risk vs. Late Aircraft vs. Carrier Delay).
*   **Financial Estimator:** Automatically displays the estimated cost (in INR Cr) if the flight is severely delayed or canceled.
*   **Manual Override Protocol:** If ground crew overrides a decision (e.g., "Unexpected ATC Hold"), select a reason from the dropdown to log the deviation and retrain the underlying model.
*   **PDF Briefing Export:** Prints a physical "dot-matrix" style briefing report for the flight.

### 4. Operations Strategy Simulator (`F4`)
A "What-If" sandbox to test mitigation responses before deploying them to the fleet.
*   **Hardware Sliders:** Use the physical slide potentiometers to manipulate Headwind speeds, Aircraft substitutions, and Crew Reserve availability.
*   **Execute Simulation:** Pressing the Gemini simulation button prompts the system to analyze the new parameters.
*   **Dot-Matrix Output:** The AI mitigation strategy is printed mechanically onto a simulated reel of tractor-feed white paper, proposing exact operational pivots.

### 5. Oscilloscope Analytics (`F5`)
Macro-level network health charting.
*   **Dual CRT Oscillators:** View stepping-area charts plotting "Hourly Delay Frequency" and "Root Cause Distribution" over a glowing phosphorescent grid.
*   **Target Processing:** Displays the raw volume of ML predictions processed in the current session.
*   *(Note: Manager Financial summaries are hidden here unless your Access Level is elevated).*

### 6. Mainframe Search (`F6`)
A raw, MS-DOS style interface. 
*   You must interact with the system by typing commands at the `>` prompt.
*   **`HELP`**: Displays the list of available commands.
*   **`SEARCH [Flight No, Airline, City]`**: Looks up matching aircraft in the local cache.
*   **`LIST ALL`**: Prints the visible working directory of tracked flights.
*   **`RISK [HIGH | MEDIUM | LOW]`**: Filters the database by the AI's predicted delay confidence.
*   **`TARGET [ID]`**: Automatically routes that aircraft's data to the Risk Intelligence terminal.
*   **`CLEAR`**: Wipes the terminal buffer.

### 7. Magnetic Crew Board (`F7`)
A drag-and-drop resource allocation planner.
*   Physical, magnetic name placards ("CAPT. REYNOLDS", "FO. WASHBURNE").
*   Drag crew members seamlessly between the "Base Hub", "Crew Rest", and "Active Sectors" columns. The tags snap to a rigid grid, complete with satisfying metallic clank audio triggers.

### 8. System Configurator (`F8`)
Hardware maintenance and environment variables.
*   **Access Level Override:** Need to see executive financials? Flip the heavy physical switch from `DISPATCH` to `MANAGER`. The page will reload and expose new financial modules on the Analytics page.
*   **CRT / Scanlines Toggle:** Flip the mechanical switches to disable the retro visual effects if you require a cleaner view or if your terminal hardware is lagging.
*   **Purge DuckDB Memory:** A massive red panic button. Depress this to flush the local DuckDB WebAssembly cache and pull fresh arrays from the central API.
*   **Telemetry Grid:** Confirm API connectivity to AviationStack, OpenWeather, and Gemini instances.

---

## 3. Basic Troubleshooting
* **"App is completely black on load"**: Wait 5-10 seconds for the WebAssembly DuckDB engine and audio synthesizers to initialize.
* **"No Data is Loading"**: Ensure your Python FastAPI backend (`uvicorn main:app`) is running concurrently with your Vite React server. View the Telemetry grid on the `F8` Config page to verify API keys.

---
*End of Document. Type 'EXIT' to terminate session.*
