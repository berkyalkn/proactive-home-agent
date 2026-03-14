# AI-Powered Proactive Smart Home Ecosystem

![LangGraph](https://img.shields.io/badge/LangGraph-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![NumPy](https://img.shields.io/badge/NumPy-013243?style=for-the-badge&logo=numpy&logoColor=white)

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)
![YOLO](https://img.shields.io/badge/YOLO-00FFFF?style=for-the-badge&logo=yolo&logoColor=black)
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

This project is a local-first, privacy-centric smart home ecosystem designed to bridge the gap between traditional reactive IoT systems and true agentic intelligence. While standard hubs wait for explicit commands, Homify leverages a Hybrid AI Architecture running on a Raspberry Pi 5 to proactively manage the environment based on context, visual observation, spatial memory, and habits.

By orchestrating **Distributed ESP32 Sensor Nodes, Edge Computer Vision, Presence Management, and Generative AI (LangGraph)**, the system creates a "conscious" living space. It doesn't just switch lights on; it understands context, visually identifies users upon entry via multi-angle biometrics, retains a memory of spatial movements, detects anomalies, and executes complex natural language goals autonomously—while keeping critical data within the home network.

---

## System Architecture

The project follows a **modular 5-Layer Architecture** designed for high scalability, fault tolerance, and separation of concerns. This layered approach ensures that the physical perception (sensors and cameras) is decoupled from the cognitive reasoning (AI Agent).

| Layer | Component | Description |
| :--- | :--- | :--- |
| **L5** | **Presentation** | Next.js Dashboard & Voice Command Center handling multi-modal user inputs (Audio/Touch/Camera Feeds). |
| **L4** | **Intelligence** | Hosts the LangGraph Agent, Voice/Facial Biometrics (Resemblyzer & GhostFaceNet), and Predictive Models. It filters intents through a 3-stage logic (Edge -> Local RAG -> Cloud LLM). |
| **L3** | **Backend Services** | FastAPI Microservices that manage logic routing, data persistence (PostgreSQL), and background polling tasks.|
| **L2** | **Communication** | A **Hybrid Event Bus:** MQTT (Hardware-to-Backend), WebSockets (Backend-to-Frontend), and HTTP/REST (Edge Node Image Transmission) ensuring <50ms latency. |
| **L1** | **Physical** |The distributed hardware layer consisting of the Raspberry Pi 5 Hub, ESP32 Sensor Nodes (Environmental Data), Tapo Actuator and Edge Camera Nodes. |




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

- `get_home_status (Sensor Fusion & Memory)`: Aggregates telemetry from **MQTT** (BH1750, BME280, PIR), device states (Tapo API), and the **Spatial & Temporal Ledger** into a single context window. Allows the LLM to answer holistic questions like "Is the living room environment suitable for reading?" or complex contextual questions like "Where am I currently located and when did I enter?".

- `control_smart_device (Self-Healing Actuator)`: Wraps the **Tapo P110** driver with a Self-Healing Mechanism. If a device is unreachable, the system automatically attempts to re-authenticate and reconnect (up to 3 retries) before reporting a failure, significantly reducing "false offline" errors.

- `control_bulb (Advanced Lighting)`: Manages **L530** bulbs with full HSL (Hue, Saturation, Lightness) color space support. Can translate vague natural language commands (e.g., "Make it cozy") into specific color temperatures (e.g., 2700K Warm White).

#### 3. Dual-Biometric Zero-Trust Security

No command is executed without continuous authentication, utilizing both visual and vocal verification.

-  **Visual Authentication (5-Angle FaceID):** Uses the ultra-lightweight **GhostFaceNet (17MB)**. The system utilizes an Apple FaceID-style enrollment process, capturing and storing 5 different facial embeddings (Front, Left, Right, Up, Down) per user in PostgreSQL. This ensures flawless recognition from any perspective via Cosine Similarity.

- **Vocal Authentication:** Uses **Resemblyzer** for real-time speaker diarization and embedding matching.

- **Dynamic RBAC (Role-Based Access Control):** The System Prompt dynamically adjusts based on identity. Admins have full execution rights, while "Guests" or "Unknown/Intruder" entities trigger guardrails, restricting them to read-only interactions or firing security alerts.


#### 4. Event-Driven Edge Vision & State Machine

The system does not just wait for voice commands; it visually monitors the environment and acts autonomously without melting the central CPU.

- **Edge-Native Object Tracking (Zero Latency)**: Camera nodes operate as Smart Edge Sensors. Once a user is identified, the edge node switches to a lightweight OpenCV KCF Tracker, following the user's bounding box locally. It stops sending heavy JPEG frames to the backend and instead streams lightweight 1KB JSON payloads (`{"user": "Berkay", "status": "PRESENT", "location": "living_room"}`) at high frequencies.

- **Spatial & Temporal Ledger:** Maintains a rolling history of the last 20 room events with strict timezone constraints to prevent time drift. It utilizes an Event-Driven Persistent Memory approach, updating the PostgreSQL `last_seen` column only upon Entry/Exit to prevent I/O bottlenecks while ensuring the AI retains context across system reboots.

- **Identity Flickering Prevention (Grace Period)**: A custom debounce algorithm in the `PresenceService` acts as a memory shield. If a tracked user momentarily loses visibility, the system grants a 4-second grace period with a self-correcting retry mechanism, preventing false alarms.

- **Asynchronous LLM Awakening:** Upon a valid `ENTRY` or `EXIT` event, FastAPI `BackgroundTasks` silently inject a system prompt into the LangGraph Agent. The Agent assesses the home status and streams a proactive audio greeting/action via WebSockets autonomously

---

### Tech Stack

### AI & Machine Learning

| Category | Tool/Library | Purpose |
| :--- | :--- | :--- |
| **Orchestration** | **LangGraph** |Manages the cyclic state of the agent, allowing for reasoning loops, error recovery, and multi-turn conversation memory.|
| **Framework** | **LangChain** | Used for creating structured Tools (@tool decorators) and managing prompt templates.|
| **LLM** | **Google Gemini 3.0** | The primary reasoning engine (gemini-3-flash-preview) accessed via Vertex AI for high-speed intent processing. |
| **Computer Vision**| **OpenCV & KCF** | Lightweight motion detection and high-speed bounding box tracking on edge nodes. |
| **Face Recognition**| **DeepFace (GhostFaceNet)**| Extracts high-dimensional facial embeddings for real-time biometric verification. |
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

#### Extreme CPU Optimization via Edge Computing

By shifting the burden of frame processing to the edge nodes (cameras) and utilizing **KCF Object Tracking**, the central Raspberry Pi 5 Hub is relieved from analyzing continuous video feeds. The Pi only runs the heavy GhostFaceNet model once during initial entry. Subsequent presence updates are handled via lightweight JSON payloads, keeping the Hub's CPU usage minimal and preventing Thermal Throttling.

#### Spatial & Temporal Context Awareness

The system doesn't just know who is home; it knows where they are and when they moved. Edge nodes inject room-specific spatial data, and the Presence Service maintains a timezone-aware history ledger. Combined with an event-driven last_seen database update mechanism, the AI agent possesses a persistent, true sense of time and location across reboots.

#### Robust & Hybrid Architecture

- **Hybrid Communication Protocols:** HTTP/REST is used for reliable, stateful device management, while WebSockets are reserved for low-latency, bi-directional AI audio streaming.

- **Zero-Latency State Synchronization:** Utilizing a Push-Based WebSocket system, physical sensor changes or motion events instantly broadcast to the dashboard without requiring a page refresh.

#### Multi-Modal AI Command Center

- **Parallel Async Processing:** The backend processes Voice Identification (CPU-bound) and Speech-to-Text (I/O-bound) in parallel using `asyncio.gather`, reducing response time by 50%.

Streamed Intelligence: Utilizes a Smart Audio Queue on the frontend to seamlessly buffer and play synthesized speech responses via WebSockets in real-time.

#### Interactive Dashboard & Biometric Management

- **Dynamic Floor Plan & Granular Control:** SVG-based interactive maps for room selection, real-time environmental metrics (Temp, Humidity, Light), and HSL-supported smart lighting control.

- **5-Point Identity Enrollment:** A sophisticated UI guides users to register their face from 5 different angles (Front, Left, Right, Up, Down) while simultaneously capturing voice signatures, ensuring bulletproof identity verification across all lighting and positional conditions.

---

## Future Roadmap


- [ ] **True Local Autonomy:** Replacing cloud dependencies with quantized **Local LLMs (Llama-3)**, **Whisper.cpp** (STT), and **Piper TTS** for 100% offline privacy and zero-latency response.

- [ ] **Multi-Modal Vision Context:** Strengthening the Agent's context awareness via YOLO & MediaPipe to enable Hand Gesture Control, Face Recognition-based personalization, and Pose Estimation for Fall Detection.

- [ ] **Acoustic Event Detection (SED):** Integrating Audio Intelligence models (e.g., YAMNet) to recognize critical environmental sounds such as *baby crying* or *glass breaking* and trigger emergency protocols.

- [ ] **Predictive Behavior Modeling:** Training **LSTM/Transformer** networks on historical home data to learn user habits and automate routines proactively (e.g., "User usually drinks coffee at 8 AM, pre-heat the machine").

- [ ] **Native Mobile Ecosystem:** Developing a **React Native** application to extend control beyond the local network and enable rich push notifications.