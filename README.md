# 🧬 LifeTwin AI
### Your Body. Your Data. Our Intelligence.

**Live Demo:** Experience LifeTwin AI : https://life-twin.onrender.com/

**Developed By: THE CONSORTIUM**

LifeTwin AI is an AI-powered personal health intelligence platform designed to transform health data into meaningful insights. By combining wearable data, IoT telemetry, lifestyle tracking, interactive 3D digital-twin visualizations, and AI-assisted analysis, LifeTwin AI helps users better understand their bodies and make informed lifestyle decisions.

Built by **THE CONSORTIUM**, LifeTwin AI brings together Artificial Intelligence, IoT, healthcare technology, and 3D visualization to create a smarter and more interactive approach to personal health monitoring.

---

##  Key Features

- **Personal Health Dashboard** – View health information, activity summaries, and wellness insights in one place.
- **Lifestyle Tracking** – Monitor daily activities and lifestyle-related information.
- **3D Digital Twin** – Explore an interactive 3D representation of the human body.
- **Health Visualizations** – Present health measurements and data through interactive visualizations.
- **AI-Powered Insights** – Generate AI-assisted explanations, summaries, and health reports.
- **Wearable Integration** – Integration-ready workflows for wearable health devices.
- **IoT Connectivity** – Support integration workflows for ESP32 and MAX30102 sensor data.
- **User Management** – Manage accounts, personal profiles, and privacy settings.

---

##  Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React, TypeScript |
| Build Tool | Vite |
| Backend | Node.js, Express |
| 3D Visualization | Three.js |
| Database | SQLite |
| Cloud Integration | Supabase |
| AI Integration | Google Gemini API |
| IoT Integration | ESP32, MAX30102 |

---

## Project Architecture

LifeTwin AI combines multiple technologies to create an integrated personal health intelligence experience.

```text
             USER
              |
              v
       REACT FRONTEND
              |
       +------+------+
       |             |
       v             v
  HEALTH DATA     3D DIGITAL
  VISUALIZATION      TWIN
       |             |
       +------+------+
              |
              v
       EXPRESS BACKEND
              |
      +-------+-------+
      |       |       |
      v       v       v
    SQLITE  SUPABASE GEMINI AI
      |               |
      +-------+-------+
              |
              v
       HEALTH INSIGHTS
```

---

## Project Structure

```text
Life-Twin-/
│
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── lib/
│   ├── pages/
│   └── types/
│
├── server/
│   ├── analytics.ts
│   └── db.ts
│
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── server.ts
├── tsconfig.json
└── vite.config.ts
```

---

##Getting Started

Follow these steps to run LifeTwin AI locally.

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (LTS version recommended)
- npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/expertX221/LifeTwin-AI
```

Navigate into the project directory:

```bash
cd Life-Twin-
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a local environment file:

```bash
cp .env.example .env
```

Open `.env` and configure the required credentials.

Example:

```env
GEMINI_API_KEY=your_gemini_api_key
APP_URL=your_app_url
```

Add other configuration values only when the corresponding integrations are enabled.

### 4. Run the Development Server

```bash
npm run dev
```

Open the local URL displayed in your terminal to access LifeTwin AI.

---

## 🔐 Environment Variables & Security

LifeTwin AI uses environment variables to manage sensitive configuration.

- Never commit `.env` or `.env.local` files.
- Never expose API keys or private credentials in frontend code.
- Keep Gemini API keys and OAuth client secrets on the server.
- Use secure environment-variable settings when deploying.
- Protect personal health information and database credentials.
- Review access permissions before connecting external integrations.

Refer to `.env.example` for the supported configuration keys.

---

## Build & Production

To create a production build:

```bash
npm run build
```

To preview the production frontend build:

```bash
npm run preview
```

For production deployment, configure the backend, frontend, environment variables, and database according to your hosting environment.

---

## 🔌 Integrations

LifeTwin AI is designed with integration-ready workflows for:

- **Google Gemini API** – AI-assisted analysis and explanations.
- **Supabase** – Cloud integration and related services.
- **Wearable Devices** – Health and activity data workflows.
- **ESP32 & MAX30102** – IoT-based sensor data integration.

Actual integration availability depends on the required credentials, device configuration, and implementation.

---

##  Our Vision

We believe personal health data should be more than numbers, charts, and statistics.

Our vision with LifeTwin AI is to make health information more understandable, interactive, and meaningful through the power of Artificial Intelligence, IoT, wearable technology, and 3D digital-twin visualization.

By bringing these technologies together, **THE CONSORTIUM** aims to create a smarter and more connected approach to understanding personal health and wellness.

---

## Medical Disclaimer

LifeTwin AI is intended for informational and wellness purposes only. AI-generated insights and visualizations are not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical concerns.

---

##  Contributing

Contributions, ideas, and suggestions are welcome.

If you would like to contribute:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Submit a pull request.

---

##  Developed By

# THE CONSORTIUM

**The Team Behind LifeTwin AI**

LifeTwin AI is conceptualized and developed by **THE CONSORTIUM**, a team focused on exploring the possibilities of Artificial Intelligence, healthcare technology, IoT, and interactive 3D visualization.

Our goal is to transform complex personal health data into meaningful insights and build technology that empowers individuals to better understand their bodies.

**Project:** LifeTwin AI  
**Development Team:** THE CONSORTIUM  
**Project Category:** AI | Healthcare Technology | IoT | Digital Twin

### Connect With

---

<p align="center">

**🧬 LIFETWIN AI**

*Understand Your Body. Visualize Your Health. Empower Your Future.*

**Proudly Built by THE CONSORTIUM **
