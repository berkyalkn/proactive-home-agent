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
![MediaPipe](https://img.shields.io/badge/MediaPipe-00B2A9?style=for-the-badge&logo=google&logoColor=white)
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
![Twilio](https://img.shields.io/badge/Twilio-F22F46?style=for-the-badge&logo=twilio&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)

![Meta Llama](https://img.shields.io/badge/Meta%20Llama-0466C8?style=for-the-badge&logo=meta&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-EEEEEE?style=for-the-badge&logo=ollama&logoColor=black)
![C++](https://img.shields.io/badge/C++-00599C?style=for-the-badge&logo=c%2B%2B&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)

> "Beyond reactive automation: A home that thinks, observes, remembers, adapts, and protects."

## Introduction

This project is a local-first, privacy-centric smart home ecosystem designed to bridge the gap between traditional reactive IoT systems and true agentic intelligence. While standard hubs wait for explicit commands, this project leverages a Hybrid AI Architecture running on a Raspberry Pi 5 to proactively manage the environment based on context, visual observation, spatial-episodic memory, and physical gestures.

By orchestrating **Distributed ESP32 Sensor Nodes, Edge Computer Vision, Multi-Modal Presence Management, Omnichannel Security Alerts, and Generative AI (LangGraph)**, the system creates a "conscious" living space. It doesn't just switch lights on; it understands context, visually identifies users upon entry via multi-angle biometrics, comprehends hand gestures, interactively verifies fall emergencies, triggers autonomous lockdown protocols, retains a chronological memory of spatial events, and executes complex natural language goals—while keeping critical data within the home network.

---

## System Architecture

The project follows a **modular 5-Layer Architecture** designed for high scalability, fault tolerance, and separation of concerns.

| Layer | Component | Description |
| :--- | :--- | :--- |
| **L5** | **Presentation** | Next.js Dashboard, **5-Step Autonomous Onboarding Engine**, an independent Omnichannel **Security Hub**, and Voice Command Center handling multi-modal user inputs (Audio/Touch/Camera Feeds) with event-driven auto-microphone triggering. |
| **L4** | **Intelligence** | Hosts the LangGraph Agent, Dual-Stage Computer Vision (YOLOv8-Face Alignment + GhostFaceNet Biometrics + Asynchronous MediaPipe Gestures), and Predictive Models. It filters intents through a 3-stage logic (Edge -> Local RAG -> Cloud LLM) and utilizes Zero-Latency Omniscient Context Injection and Graceful Degradation. |
| **L3** | **Backend Services** | FastAPI Microservices managing logic routing, hardware provisioning, **dynamic relational data persistence (PostgreSQL/SQLModel)** replacing static registries, omnichannel notifications (Twilio/Telegram), presence ledgers, and real-time System Integrity Diagnostics. |
| **L2** | **Communication** | A **Hybrid Event Bus:** MQTT (Hardware-to-Backend), WebSockets (Backend-to-Frontend), and Connection-Pooled HTTP/REST(Edge Node Image Transmission/External APIs) ensuring <50ms local latency. |
| **L1** | **Physical** | Distributed hardware layer consisting of the Pi 5 Hub, ESP32 Sensor Nodes, Tapo Actuators, and Edge Camera Nodes running a 4-Layer Quality Gate. |

---

## The Agentic Workflow

At the core of this project lies a **LangGraph-based State Machine**, transforming the system from a passive listener into an active decision-maker. Unlike linear chatbots, this utilizes a **cyclic graph architecture**, allowing the agent to reason, execute tools, observe outputs, and re-evaluate its next step in a continuous loop until the user's goal is met.

### 1. Hierarchical Reasoning & 100% Local Autonomy
To optimize for Privacy-First Latency, the system processes user intents through a cascading 3-stage logic. It has successfully evolved from a cloud-dependent architecture (OpenAI/Gemini) to a completely independent, zero-latency smart home that survives without the internet.

- **Filter 1: Edge NLU (Deterministic):** Handles high-frequency commands (e.g., "Lights on") via Rhino NLU for <100ms ultra-low latency execution.
- **Filter 2: Local AI Brain (Contextual & Autonomous):** Integrates **Ollama** to run **Meta Llama 3.1**, querying the local PostgreSQL database (RAG) to manage device history and execute standard workflows entirely on local hardware.
- **Filter 3: Masked Cloud LLM (Generative Escalation):** Escalates highly complex, multi-step generative tasks to Google Gemini 3.0 Flash via Vertex AI. *Safety enforcement guarantees only strictly anonymized, structure-only state snapshots are transmitted.*

*(Complementing this local-first approach, the system replaces cloud audio APIs with **Faster-Whisper (STT)** for sub-second edge transcription, and employs a standalone **Piper TTS C++ Binary** to synthesize high-fidelity WAV responses instantaneously—eliminating Python GIL bottlenecks and ARM64 crashes.)*

### 2. Cognitive Tools & Fault Tolerance
The Agent interacts with the physical world through a set of "Robust Tools" designed to handle the unpredictability of IoT networks.

- **Omniscient Context Injection:** Upon entry, current telemetry (temperature, light, exact local time) is injected directly from RAM into the LLM's system prompt. This eliminates the 3-5 second delay of traditional API tool-calling.
- **Self-Healing Actuators:** Wraps device drivers (e.g., Tapo API) with a self-healing mechanism. If an ESP32 or smart plug loses power (`No route to host`), the system silently marks it "Offline" and attempts background re-authentication instead of crashing or hallucinating.
- **Multi-Room Topology Mapping:** The LangGraph agent relies on a fully relational PostgreSQL database rather than static registries, allowing for dynamic spatial awareness and instant adaptation to newly added hardware.

### 3. Dual-Biometric Zero-Trust Security & FaceID Login
The system redefines traditional login flows, treating authentication as a fluid, biometric-first experience across the home and the Next.js dashboard.

- **Visual Edge-to-Hub Pipeline:** Utilizes an Apple FaceID-style 5-angle enrollment. For real-time inference, **MediaPipe BlazeFace** extracts ROIs at the Edge via a strict **4-Layer Quality Gate** (Size/Ratio -> Brightness -> Laplacian Blur -> Pose Frontality).
- **Smart Load Balancing (YOLOv8 Bypass):** By pre-cropping flawless ROIs at the Edge, the Hub dynamically bypasses heavy YOLOv8-Face alignment. The 15KB image is fed directly into the 17MB **GhostFaceNet** for Cosine Similarity matching, slashing Raspberry Pi 5 CPU load by >50%.
- **Vocal Authentication:** Uses **Resemblyzer** for real-time speaker diarization and embedding matching to ensure voice commands come from authorized residents.
- **Dynamic RBAC & Jailbreak Protection:** The System Prompt dynamically adjusts based on identity. Admins have full rights, while "Guests" trigger guardrails. Furthermore, an **Anti-False Positive Grace Period** buffers unrecognized frames before declaring an intrusion, drastically reducing visual misidentifications.

### 4. Event-Driven Vision & Spatial Awareness
The system visually monitors the environment and acts autonomously without melting the central CPU or choking the local network.

- **Bandwidth-Free Edge Tracking:** Once a face is detected, edge nodes switch to an asynchronous **KCF Tracker** following the user at 30 FPS. Instead of streaming heavy video, it sends lightweight JSON telemetries (`{"user": "Berkay", "status": "PRESENT"}`). **IoU matching** is used to eliminate bounding-box drift.
- **Social Intelligence (Silent Guest Protocol):** The presence service maintains a timezone-aware history ledger. If an unrecognized face is detected while an authorized user is already present, the AI intelligently suppresses security alerts and repetitive TTS greetings.
- **Asynchronous Presence Watchdog:** A non-blocking background task polls room states every 15 seconds. If a user walks out and their dynamic TTL window expires, the Watchdog autonomously triggers the "Exit Protocol" to save energy.

### 5. Risk-Based Hybrid Action Engine (Gestures & Security)
The system transforms passive observation into life-saving interventions via a sophisticated, database-driven rule engine.

- **Temporal Gating & Gaze-Locked UX:** Fuses hand tracking (MediaPipe Tasks API) with BlazeFace projection matrices. Gestures (e.g., Victory, Open Palm) are only processed if held continuously *while* the user is making direct eye contact with the sensor.
- **Interactive AI Fall Detection Loop:** Instead of blind panic, the system verifies emergencies:
  1. Cameras detect a fall.
  2. The AI autonomously asks the user if they are okay and forces the dashboard microphone open for a 10-second verification window.
  3. If there is no response, it assumes loss of consciousness and executes the lockdown.
- **Multimodal Emergency Abort:** Users can instantly abort alarms via **Voice Intercept** ("I am fine") or **Gesture Override** (`Open_Palm` to the camera).
- **The Red Zone (Emergency Lockdown Protocol):** A Fail-Fast macro that simultaneously forces smart bulbs into a deterministic alert state (e.g., Police Strobe), dispatches omnichannel alerts (Twilio Call/SMS, Telegram), and broadcasts a dynamic AI TTS announcement to the room.

---

## Onboarding-Driven Development (ODD)

The ecosystem features a bespoke, immersive 5-Step Onboarding Engine that acts as the "Constitution" for the Smart Home, dynamically generating the backend schema before the user ever reaches the dashboard.

- **1- AI Context Initialization:** Collects structural data to seed the LangGraph System Prompt, allowing the AI to naturally adapt its tone.
- **2- Autonomous Hardware Radar:** Replaces tedious manual IP entries with background `mDNS Snooping` and `TCP Subnet Sweeping`. To combat cheap IoT hardware fatigue, it implements a resilient **Deep Object Inspection** layer with Exponential Backoff. It even features a **"Blink to Identify"** UI, physically flashing smart bulbs for seamless configuration.
- **3- Biometric Security Calibration:** Captures a 5-point face mesh and acoustic footprint via an interactive, gaze-guided UI designed with human-centric copywriting.
- **4- Security Hub & Emergency Protocol:** Integrates granular SOS configuration for trigger/cancel gestures, fall detection logic, hardware override states, and custom AI Voice Announcements.
- **5- Gesture Mapping & System Finalization:** Empowers users to dynamically link hand gestures to physical actuators. It employs psychological UX design ("The Labor Illusion") during finalization to build perceived value as the system compiles schemas and encrypts signatures.
---


## Tech Stack

### AI & Machine Learning
| Category | Tool/Library | Purpose |
| :--- | :--- | :--- |
| **Orchestration** | **LangGraph** |Manages the cyclic state of the agent, allowing for reasoning loops, error recovery, and multi-turn conversation memory.|
| **Framework** | **LangChain** | Used for creating structured Tools (@tool decorators) and managing prompt templates.|
| **Active Core (LLM)**| **Ollama (Llama 3.1)** | The current air-gapped, privacy-first generative engine for offline automation. |
| **Active Core (STT)**| **Faster-Whisper (Int8)** | Quantized edge-transcription microservice running locally with zero latency. |
| **Active Core (TTS)**| **Piper TTS (C++)** | Industrial-grade, fully local neural text-to-speech engine running as an OS subprocess. |
| **Legacy (Research)**| **Google Gemini 3.0** | *Previous reasoning engine (Vertex AI), kept in architecture for comparative reference.* |
| **Legacy (Research)**| **OpenAI TTS & Whisper** | *Previous cloud audio endpoints, successfully deprecated in favor of the local Air-Gapped architecture.* |
| **Computer Vision**| **OpenCV & KCF** | Lightweight motion detection and high-speed bounding box tracking on edge nodes. |
| **Edge Vision**| **MediaPipe BlazeFace** | Ultra-lightweight mobile-optimized face detection for extracting ROIs at high FPS on edge devices. |
| **Gesture AI** | **MediaPipe Tasks API** | Asynchronous real-time hand gesture recognition (Victory, Open Palm, Closed Fist) running on non-blocking C++ worker threads. |
| **Pose Estimation**| **MediaPipe Pose** | Extracts real-time 33-point body landmarks to calculate spatial velocity and asynchronously detect falls. |
| **Alignment**| **YOLOv8-Face** | Executes 5-point facial landmark detection on the Hub for surgical face alignment before recognition. |
| **Face Recognition**| **DeepFace (GhostFaceNet)**| Extracts high-dimensional facial embeddings for real-time biometric verification. |
| **Biometrics** | **Resemblyzer** | Generates 256-dimensional voice embeddings for real-time speaker identification. |
| **Math** | **Numpy** | Performs Cosine Similarity calculations to match live audio vectors against stored user profiles. |


### Backend & Infrastructure
| Category | Tool/Library | Purpose |
| :--- | :--- | :--- |
| **Language** | **Python** | Primary backend language chosen for its rich AI ecosystem and async capabilities.|
| | **MicroPython** | Running on ESP32 nodes for efficient, low-level sensor control and MQTT publishing.|
| **Framework** | **FastAPI** | High-performance async REST API with WebSocket support.|
| **Validation** | **Pydantic** | Enforces strict data schemas (Data Transfer Objects) for API requests/responses, ensuring data integrity. |
| **Database** | **PostgreSQL** | Robust relational database storing time-series sensor data, device logs, security preferences, and user vectors. |
| **ORM**| **SQLModel** | Modern ORM bridging SQL tables with Pydantic models, enabling the dynamic, registry-free hardware architecture. |
| **Server** | **Uvicorn** | Lightning-fast ASGI server implementation to run the FastAPI application. |
| **IoT Broker** | **Eclipse Mosquitto** | Lightweight MQTT broker handling pub/sub messaging between ESP32 nodes and the Pi.|
| **External API**| **Twilio SDK** | Facilitates automated SMS and Voice Call dispatching during emergency protocols.|
| **External API**| **Telegram API** | Handled via asynchronous HTTP requests (`httpx`) for markdown-rich security push notifications. |

### Frontend
| Category | Tool/Library | Purpose |
| :--- | :--- | :--- |
| **Framework** | **Next.js** | App Router based React framework for the dashboard.|
| **Language** | **TypeScript** | Ensures type safety for the Frontend, preventing runtime errors in complex UI states. |
| **Styling** | **Tailwind CSS** | Utility-first styling with a glassmorphism design language. |
| **Realtime** | **Websockets** | Bi-directional communication for audio streaming and sensor updates. |
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

### Proactive Context-Aware AI (LangGraph)
Instead of passively waiting for explicit commands, the LangGraph agent actively observes the environment and engages the user with intelligent, situation-specific actions.

- **Zero-Latency Context Injection:** Upon a user entering a room, current telemetry (temperature, light levels, smart device states) and the exact local time are injected directly from RAM caching into the LLM's system prompt. This bypasses the 3-5 second delay of traditional API tool-calling, enabling instantaneous reasoning.

- **Omniscient Context & Smart Logic:** Instead of blind prompt execution, the agent receives a structured `--- CURRENT HOME CONTEXT ---` dashboard upon any entry or exit. If a room is dark but the lights are already ON, the agent intelligently suppresses hardcoded "Would you like me to turn on the lights?" prompts.

- **Soft Failure (Fault Tolerance):** If an ESP32 or a smart plug loses power (e.g., `No route to host`), the system silently marks it as "Offline/Unreachable" and continues its agentic duties gracefully without crashing or hallucinating.

- **Temporal & Environmental Awareness:** The AI synthesizes the injected data to make logical deductions without hardcoded rules. For example, if a user enters the room at 6:30 PM, the AI can independently deduce that it is around sunset and proactively offer to turn on the study lamp or adjust the room's ambiance.

### 100% Local Autonomy
The ecosystem has successfully evolved from a cloud-dependent architecture (OpenAI/Gemini) to a completely independent, zero-latency smart home. It operates flawlessly without an internet connection, guaranteeing absolute privacy and data sovereignty.

- **Local AI Brain (LLM):** Integrates **Ollama** to run **Meta Llama 3.1**, empowering the agent to reason, make decisions, and control devices entirely on local hardware.
- **Instant Voice Recognition (STT):** Replaces cloud APIs with **Faster-Whisper**, transcribing spoken commands in under a second directly on the edge, bypassing internet delays completely.
- **Natural Voice Responses (TTS):** Employs **Piper TTS** for high-fidelity speech synthesis. Engineered for ultimate stability, it delivers crash-proof, instant voice responses without ever sending your voice data to the cloud.

### Extreme CPU Optimization via Edge Computing
- By shifting the burden of frame processing, **Quality Gating, and MJPEG encoding** to the edge nodes (cameras) and utilizing **KCF Object Tracking**, the central Raspberry Pi 5 Hub is relieved from analyzing continuous video feeds. The Pi only runs the heavy GhostFaceNet model once during initial entry. Subsequent presence updates are handled via lightweight JSON payloads, keeping the Hub's CPU usage minimal and preventing Thermal Throttling.

### Spatial & Temporal Context Awareness
- The system doesn't just know who is home; it knows where they are and when they moved. Edge nodes inject room-specific spatial data, and the Presence Service maintains a timezone-aware history ledger. Combined with an event-driven last_seen database update mechanism, the AI agent possesses a persistent, true sense of time and location across reboots.

- **Social Intelligence (Silent Guest Protocol):** The system distinguishes between an empty home intrusion and a social gathering. If an unrecognized face is detected while an authorized user is already present in the room, the AI intelligently suppresses security alerts and redundant greetings to avoid interrupting conversations.

- **Multi-Room Topology & Dynamic Database Mapping:** The system has abandoned static registries. It utilizes a fully relational PostgreSQL database mapping specific Tapo devices and ESP32 sensors to distinct rooms. The UI and the LangGraph agent inherently understand this dynamic spatial topology, allowing for localized context resolution and instant adaptation to newly added hardware.

- **Asynchronous Presence Watchdog:** The backend runs a continuous, non-blocking background task (`continuous_presence_check`) that polls room states every 15 seconds. If a user walks out of the camera frame and does not return within a dynamic TTL window, the Watchdog autonomously triggers the "Exit Protocol," turning off active devices to guarantee energy efficiency without requiring an explicit "Goodbye".

### Robust & Hybrid Architecture

- **Hybrid Communication Protocols:** HTTP/REST is used for reliable, stateful device management, while WebSockets are reserved for low-latency, bi-directional AI audio streaming.

- **Zero-Latency State Synchronization:** Utilizing a Push-Based WebSocket system, physical sensor changes or motion events instantly broadcast to the dashboard without requiring a page refresh.

### Multi-Modal AI Command Center

- **Parallel Async Processing:** The backend processes Voice Identification (CPU-bound) and Speech-to-Text (I/O-bound) in parallel using `asyncio.gather`, reducing response time by 50%.

- **Streamed Intelligence:** Utilizes a Smart Audio Queue on the frontend to seamlessly buffer and play synthesized speech responses via WebSockets in real-time.

### Seamless Authentication & FaceID Access
The system completely redefines the traditional login/register flow by treating authentication as a fluid, biometric-first experience.

- **Live FaceID Login:** Users can bypass traditional passwords entirely. The login interface captures a real-time webcam feed, passing the frame through the Edge Quality Gate directly to the GhostFaceNet backend for instantaneous, passwordless dashboard access.

- **Smart Registration & State-Machine Routing:** Features a real-time visual password strength algorithm and strict email uniqueness validation mapped directly to PostgreSQL. Post-login, a strict State-Machine evaluates the `is_onboarding_complete` flag to seamlessly route users either to the Initialization Engine or the Control Dashboard, preventing unauthorized bypasses.

- **Apple-Tier Modal UX:** Password recovery and biometric scanning flows are built using GPU-accelerated Framer Motion modals. The UI dynamically responds to backend API states (e.g., green checkmarks for verified emails, radar pulses for FaceID scanning) without ever leaving or refreshing the page.

### Interactive Dashboard & Biometric Management

- **Dynamic Floor Plan & Granular Control:** SVG-based interactive maps for room selection, real-time environmental metrics (Temp, Humidity, Light), and HSL-supported smart lighting control, completely driven by backend database inventories.

- **Modular UI widgets (Separation of Concerns):** A decoupled frontend architecture featuring specialized control hubs (UserManager, GestureManager, EmergencyManager) to handle independent operations without cluttering the primary DOM layout.

- **5-Point Identity Enrollment:** A sophisticated UI guides users to register their face from 5 different angles (Front, Left, Right, Up, Down) while simultaneously capturing voice signatures, ensuring bulletproof identity verification across all lighting and positional conditions.

- **Real-Time Edge Video Streaming:** Integrates MJPEG streams with aggressive frontend cache-busting mechanisms and dynamic skeleton loaders, eliminating browser ghost-connections and ensuring zero-refresh, instant live camera feeds.

---

## Future Roadmap


- [ ] **Acoustic Event Detection (SED):** Integrating Audio Intelligence models (e.g., YAMNet) to recognize critical environmental sounds such as *baby crying* or *glass breaking* and trigger emergency protocols.

- [ ] **Predictive Behavior Modeling:** Training **LSTM/Transformer** networks on historical home data to learn user habits and automate routines proactively (e.g., "User usually drinks coffee at 8 AM, pre-heat the machine").

- [ ] **Native Mobile Ecosystem:** Developing a **React Native** application to extend control beyond the local network and enable rich push notifications.