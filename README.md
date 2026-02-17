# AI-Powered Proactive Smart Home Ecosystem

![LangGraph](https://img.shields.io/badge/LangGraph-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![NumPy](https://img.shields.io/badge/NumPy-013243?style=for-the-badge&logo=numpy&logoColor=white)

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Pydantic](https://img.shields.io/badge/Pydantic-E92063?style=for-the-badge&logo=pydantic&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)


![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

![Raspberry Pi](https://img.shields.io/badge/Raspberry%20Pi-A22846?style=for-the-badge&logo=raspberry-pi&logoColor=white)
![MicroPython](https://img.shields.io/badge/MicroPython-2B3A42?style=for-the-badge&logo=micropython&logoColor=white)
![MQTT](https://img.shields.io/badge/MQTT-3C5280?style=for-the-badge&logo=mqtt&logoColor=white)
![Espressif](https://img.shields.io/badge/Espressif-E7352C?style=for-the-badge&logo=espressif&logoColor=white)


 - "Beyond reactive automation: A home that thinks, adapts, and responds."

## Introduction

This project is a local-first, privacy-centric smart home ecosystem designed to bridge the gap between traditional reactive IoT systems and true agentic intelligence. While standard hubs wait for explicit commands, Homify leverages a **Hybrid AI Architecture** running on a **Raspberry Pi 5** to proactively manage the environment based on context and habits.

By orchestrating **Distributed ESP32 Sensor Nodes**, **Computer Vision**, **Predictive User Behavior Models**, **and Generative AI (LangGraph)**, the system creates a "conscious" living space. It doesn't just switch lights on; it understands context, identifies users via voice biometrics, detects anomalies, and executes complex natural language goals while keeping critical data within the home network.

---

## System Architecture

The project follows a **modular 5-Layer Architecture** designed for high scalability, fault tolerance, and separation of concerns. This layered approach ensures that the physical perception (sensors) is decoupled from the cognitive reasoning (AI Agent)

| Layer | Component | Description |
| :--- | :--- | :--- |
| **L5** | **Presentation** | Next.js Dashboard & Voice Command Center handling multi-modal user inputs (Audio/Touch). |
| **L4** | **Intelligence** | Hosts the LangGraph Agent, Voice Biometrics (Resemblyzer), and Predictive Models. It filters intents through a 3-stage logic (Edge -> Local RAG -> Cloud LLM). |
| **L3** | **Backend Services** | FastAPI Microservices that manage logic routing, data persistence (PostgreSQL), and background polling tasks.|
| **L2** | **Communication** | An MQTT Broker (Mosquitto) acting as the central nervous system, bridging asynchronous hardware events with synchronous backend logic. |
| **L1** | **Physical** |The distributed hardware layer consisting of the Raspberry Pi 5 Hub, ESP32 Sensor Nodes (Environmental Data), and Tapo Actuators. |




---

## The Agentic Workflow

At the core of this project lies a **LangGraph-based State Machine**, transforming the system from a passive listener into an active decision-maker. Unlike linear chatbots, this utilizes a **cyclic graph architecture**, allowing the agent to reason, execute tools, observe outputs, and re-evaluate its next step in a continuous loop until the user's goal is met.

#### 1. Hierarchical Reasoning

To optimize for Privacy-First Latency, the system processes user intents through a cascading 3-stage logic. This ensures that sensitive data leaves the local network only when absolutely necessary .

**Filter 1: Edge NLU (Deterministic)**

- **Role:** Handles high-frequency, low-latency commands (e.g., "Lights on", "Stop").

- **Tech:** Rhino NLU

- **Latency:** <100ms.

- **Privacy:** 100% Local.

**Filter 2: Local RAG (Contextual)**

- **Role:** Answers questions about personal data and device history (e.g., "What was the temperature last night?").

- **Tech:** Queries the local PostgreSQL database and Vector Store.

- **Privacy:** Data is retrieved locally; no sensitive logs are sent to the cloud.

**Filter 3: Cloud Intelligence (Generative)**

- **Role:** Escalates complex, multi-step reasoning tasks to Gemini 3.0 Flash.

- **Tech:** Context-aware prompt engineering via Google Vertex AI.

- **Safety:** Only anonymized state snapshots are transmitted.

#### 2. Cognitive Tools & Sensor Fusion

The Agent interacts with the physical world through a set of "Robust Tools" that handle the unpredictability of IoT networks.

`get_home_status (Sensor Fusion)`:

- Aggregates telemetry from **MQTT** (BH1750, BME280, PIR) and device states (Tapo API) into a single context window.

- Why it matters: Allows the LLM to answer holistic questions like "Is the living room environment suitable for reading?" by analyzing light levels and temperature simultaneously.

`control_smart_device` (Self-Healing Actuator):

- Wraps the **Tapo P110** driver with a Self-Healing Mechanism.

- **Logic:** If a device is unreachable, the system automatically attempts to re-authenticate and reconnect (up to 3 retries) before reporting a failure, significantly reducing "false offline" errors.

`control_bulb` (Advanced Lighting):

- Manages **L530 bulbs** with full HSL (Hue, Saturation, Lightness) color space support.

- **Adaptive:** Can translate vague natural language commands (e.g., "Make it cozy") into specific color temperatures (e.g., 2700K Warm White).

#### Voice Biometrics & Zero-Trust Security

This project implements a Zero-Trust Architecture where no command is executed without continuous authentication.

**Real-Time Speaker Diarization:**

- **Model:** Uses Resemblyzer (Deep Learning based Voice Encoder) to generate a 256-dimensional vector embedding of the speaker's voice every 2 seconds.

- **Verification:** Calculates the **Cosine Similarity** between the live audio embedding and stored user profiles.

- **Thresholding:** A strict similarity score (>0.75) is required to authenticate a user.

**Dynamic RBAC (Role-Based Access Control):**

- The System Prompt dynamically adjusts based on the identified user.

- **Admin (Berkay):** Full access to all tools (Delete, Configure, Control).

- **Guest:** Read-Only access. Commands like "Turn off the modem" are strictly blocked at the prompt level, ensuring physical security.

---

### Tech Stack

### AI & Machine Learning

| Category | Tool/Library | Purpose |
| :--- | :--- | :--- |
| **Orchestration** | **LangGraph** |Manages the cyclic state of the agent, allowing for reasoning loops, error recovery, and multi-turn conversation memory.|
| **Framework** | **LangChain** | Used for creating structured Tools (@tool decorators) and managing prompt templates.|
| **LLM** | **Google Gemini 3.0** | The primary reasoning engine (gemini-3-flash-preview) accessed via Vertex AI for high-speed intent processing. |
| **Biometrics** | **Resemblyzer** | Generates 256-dimensional voice embeddings for real-time speaker identification. |
| **Math** | **Numpy** | Performs Cosine Similarity calculations to match live audio vectors against stored user profiles. |
| **Audio** | **OpenAI Whisper** | State-of-the-art Speech-to-Text (STT) for accurate command transcription. |
| | **OpenAI TTS** | Generates natural-sounding speech responses (streaming audio). |

### Backend & Infrastructure

| Category | Tool/Library | Purpose |
| :--- | :--- | :--- |
| **Language** | **Python** | Primary backend language chosen for its rich AI ecosystem and async capabilities.|
| | **MicroPython** | Running on ESP32 nodes for efficient, low-level sensor control and MQTT publishing.|
| **Framework** | **FastAPI** | High-performance async REST API with WebSocket support.|
| **Validation** | **Pydantic** | Enforces strict data schemas (Data Transfer Objects) for API requests/responses, ensuring data integrity. |
| **Database** | **PostgreSQL** | Robust relational database storing time-series sensor data, device logs, and user vectors. |
| **ORM**| **SQLModel** | Modern ORM bridging SQL tables with Pydantic models, reducing code duplication. |
| **Server** | **Uvicorn** | Lightning-fast ASGI server implementation to run the FastAPI application. |
| **IoT Broker** | **Eclipse Mosquitto** | Lightweight MQTT broker handling pub/sub messaging between ESP32 nodes and the Pi.|


### Frontend

| Category | Tool/Library | Purpose |
| :--- | :--- | :--- |
| **Framework** | **Next.js** | App Router based React framework for the dashboard.|
| **Language** | **TypeScript** | Ensures type safety for the Frontend, preventing runtime errors in complex UI states. |
| **Styling** | **Tailwind CSS** | Utility-first styling with a glassmorphism design language. |
| **Realtime** | **Websockets** | Bi-directional communication for audio streaming and sensor updates.. |
| **Visualization**| **Recharts** |Rendering historical sensor data charts.|
| **Icons** | **Lucide React** | Consistent and modern UI iconography.|


### Hardware & IoT Drivers

| Category | Tool/Library | Purpose |
| :--- | :--- | :--- |
| **Hub** | **Raspberry Pi 5** | The edge computing unit hosting for Backend, DB, and Broker.|
| **Edge Nodes** | **ESP32 (WROOM)** | Low-power microcontrollers reading sensors (BME280, BH1750, PIR) via I2C/GPIO. |
| **Driver** | **tapo** | Reverse-engineered Python client for controlling TP-Link P110 Plugs and L530 Bulbs over LAN. |
| **Library** | **Paho-MQTT** | Asynchronous Python client for handling MQTT message loops without blocking the main thread.|




---

## Key Features

#### Robust & Hybrid Architecture

- **Hybrid Communication Protocols:** Implements a strategic split between protocols for maximum efficiency:

  - **HTTP/REST:** Used for reliable, stateful device management and sensor history.

  - **WebSockets:** Reserved for low-latency, bi-directional AI audio streaming and agent interaction.

- **Self-Healing Connectivity:** The backend implements an intelligent retry wrapper. If a Tapo device drops from the network, the system attempts to re-authenticate and reconnect before failing a command, ensuring high availability.

- **Background State Polling:** An `asyncio` task continuously syncs the digital twin with physical reality, logging energy consumption (kWh) and device states to PostgreSQL.

#### Multi-Modal AI Command Center

- **Dual-Mode Interaction:** Users can interact with the Agent via Voice (for hands-free control) or Text Chat (for silent commands), sharing the same context window.

- **Streamed Intelligence:** Utilizes WebSockets to stream audio chunks in real-time. The frontend implements a Smart Audio Queue to buffer and play synthesized speech responses smoothly without overlap.

- **Deep Context Awareness:** The LangGraph agent remembers conversation history (e.g., User: "Turn on the lights" -> Agent: "Done" -> User: "Make them blue").

#### Interactive Dashboard & Visualization

- **Dynamic Floor Plan:** A visual, SVG-based interactive map allows users to select rooms directly from the home layout.

- **Granular Room Control:** Each room features a dedicated control panel:

- **Environmental Status:** Real-time metrics for Temperature, Humidity, Pressure (BME280), Light Level (BH1750), and Motion (PIR).

- **Live Feed:** Integrated RTSP/HTTP video streams for real-time surveillance.

- **Smart Lighting**: Advanced control for L530 bulbs including Brightness, Color Temperature, and HSL Color Space.

- **Appliance Control:** Toggle switches and power monitoring for devices connected via smart plugs.

#### Biometric Security & Access Control

- **Voice-Based Identity Management:** A dedicated "User Management" interface allows administrators to record and register new users.

- **Database Verification:** When a command is issued, the AI compares the live audio embedding against stored user vectors in PostgreSQL.

- **Dynamic RBAC:** The system grants permissions dynamically; recognized admins get full control, while guests or unrecognized voices are restricted to read-only access.
---

## Future Roadmap


- [ ] **True Local Autonomy:** Replacing cloud dependencies with quantized **Local LLMs (Llama-3)**, **Whisper.cpp** (STT), and **Piper TTS** for 100% offline privacy and zero-latency response.

- [ ] **Multi-Modal Vision Context:** Strengthening the Agent's context awareness via **YOLO & MediaPipe** to enable Hand Gesture Control, Face Recognition-based personalization, and Pose Estimation for Fall Detection.

- [ ] **Acoustic Event Detection (SED):** Integrating Audio Intelligence models (e.g., YAMNet) to recognize critical environmental sounds such as *baby crying* or *glass breaking* and trigger emergency protocols.

- [ ] **Predictive Behavior Modeling:** Training **LSTM/Transformer** networks on historical home data to learn user habits and automate routines proactively (e.g., "User usually drinks coffee at 8 AM, pre-heat the machine").

- [ ] **Native Mobile Ecosystem:** Developing a **React Native** application to extend control beyond the local network and enable rich push notifications.