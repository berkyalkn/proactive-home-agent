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

> "Beyond reactive automation: A home that thinks, observes, remembers, adapts, and protects."

## Introduction

This project is a local-first, privacy-centric smart home ecosystem designed to bridge the gap between traditional reactive IoT systems and true agentic intelligence. While standard hubs wait for explicit commands, this project leverages a Hybrid AI Architecture running on a Raspberry Pi 5 to proactively manage the environment based on context, visual observation, spatial-episodic memory, and physical gestures.

By orchestrating **Distributed ESP32 Sensor Nodes, Edge Computer Vision, Multi-Modal Presence Management, Omnichannel Security Alerts, and Generative AI (LangGraph)**, the system creates a "conscious" living space. It doesn't just switch lights on; it understands context, visually identifies users upon entry via multi-angle biometrics, comprehends hand gestures, triggers autonomous emergency protocols, retains a chronological memory of spatial events, and executes complex natural language goals—while keeping critical data within the home network.

---

## System Architecture

The project follows a **modular 5-Layer Architecture** designed for high scalability, fault tolerance, and separation of concerns.

| Layer | Component | Description |
| :--- | :--- | :--- |
| **L5** | **Presentation** | Next.js Dashboard, **5-Step Autonomous Onboarding Engine**, an independent Omnichannel **Security Hub**, and Voice Command Center handling multi-modal user inputs (Audio/Touch/Camera Feeds) with real-time UI/UX via GPU-accelerated Framer Motion. |
| **L4** | **Intelligence** | Hosts the LangGraph Agent, Dual-Stage Computer Vision (YOLOv8-Face Alignment + GhostFaceNet Biometrics + Asynchronous MediaPipe Gestures), and Predictive Models. It filters intents through a 3-stage logic (Edge -> Local RAG -> Cloud LLM) and utilizes Zero-Latency Omniscient Context Injection and Graceful Degradation. |
| **L3** | **Backend Services** | FastAPI Microservices managing logic routing, hardware provisioning, **dynamic relational data persistence (PostgreSQL/SQLModel)** replacing static registries, omnichannel notifications (Twilio/Telegram), presence ledgers, and real-time System Integrity Diagnostics. |
| **L2** | **Communication** | A **Hybrid Event Bus:** MQTT (Hardware-to-Backend), WebSockets (Backend-to-Frontend), and Connection-Pooled HTTP/REST(Edge Node Image Transmission/External APIs) ensuring <50ms local latency. |
| **L1** | **Physical** | Distributed hardware layer consisting of the Pi 5 Hub, ESP32 Sensor Nodes, Tapo Actuators, and Edge Camera Nodes running a 4-Layer Quality Gate. |

---

## The Agentic Workflow

At the core of this project lies a **LangGraph-based State Machine**, transforming the system from a passive listener into an active decision-maker. Unlike linear chatbots, this utilizes a **cyclic graph architecture**, allowing the agent to reason, execute tools, observe outputs, and re-evaluate its next step in a continuous loop until the user's goal is met.

### 1. Hierarchical Reasoning
To optimize for Privacy-First Latency, the system processes user intents through a cascading 3-stage logic (Edge NLU -> Local RAG -> Cloud Intelligence via Google Vertex AI). This ensures that sensitive data leaves the local network only when absolutely necessary.

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

### 2. Cognitive Tools & Sensor Fusion
The Agent interacts with the physical world through a set of "Robust Tools" that handle the unpredictability of IoT networks, including Self-Healing Actuators and Omniscient Status Aggregation.

- `get_home_status (Sensor Fusion & Memory):` Aggregates telemetry from MQTT (BH1750, BME280, PIR), device states (Tapo API), and the Spatial & Temporal Ledger into a single context window by dynamically querying the SQLModel database for real-time room topologies. 

- `control_smart_device (Self-Healing Actuator):` Wraps the Tapo P110 driver with a Self-Healing Mechanism. It dynamically resolves custom user-defined names (e.g., 'Coffee Maker', 'Desk Lamp') to physical MAC/IP addresses via the database. If a device is unreachable, it attempts to re-authenticate and reconnect before reporting a failure.

- `control_bulb (Advanced Lighting):` Manages L530 bulbs with full HSL (Hue, Saturation, Lightness) color space support. Can translate vague natural language commands (e.g., "Make it cozy") into specific color temperatures targeting specific rooms.

- `trigger_emergency_alert (Autonomous SOS):` A critical tool granting the agent the authority to initiate emergency protocols autonomously. If a user verbally reports an injury, fall, or danger, the agent triggers an omnichannel alert (SMS, Voice Call, Telegram) to predefined contacts without requiring physical interaction.

### 3. Dual-Biometric Zero-Trust Security & Progressive Profiling
No command is executed without continuous authentication, utilizing both visual and vocal verification.

- **Token-Based Autonomous Enrollment:** The system abandons legacy manual inputs. Users authenticate via standard JWT, and the system autonomously links 5-point spatial face meshes and acoustic signatures to existing database records (Upsert logic), preventing duplicate entities and manual data entry errors.

- **Visual Authentication (Edge-to-Hub Pipeline):** The system utilizes an Apple FaceID-style 5-angle enrollment stored in PostgreSQL. For real-time inference, it relies on a highly optimized dual-stage architecture: Google’s **MediaPipe BlazeFace** handles high-speed detection on the Edge. Before transmission, frames pass through a new **4-Layer Edge Quality Gate** (Size/Ratio -> Brightness -> Laplacian Blur -> Pose Frontality) to ensure only perfect, 15KB pre-cropped ROIs are sent over the network.

- **YOLOv8 Bypass Optimization:** Upon receiving this quality-gated frame, the Hub dynamically bypasses its internal **YOLOv8-Face** detection network (normally used for uncropped streams and surgical facial alignment). The flawless, pre-cropped image is fed directly into the ultra-lightweight **GhostFaceNet (17MB)** for 512-dimensional vector matching via Cosine Similarity, reducing Pi 5 CPU load by >50%.

- **Vocal Authentication:** Uses **Resemblyzer** for real-time speaker diarization and embedding matching to ensure the voice command comes from an authorized resident.

- **Dynamic RBAC (Role-Based Access Control) & Jailbreak Protection:** The System Prompt dynamically adjusts based on identity. Admins have full execution rights, while "Guests" or "Unknown/Intruder" entities trigger guardrails, restricting them to read-only interactions. The system prompt utilizes "Jailbreak Override" tags (`[User: Admin]`) to force the LLM to comply during critical security events, bypassing over-aligned AI safety refusals.

- **Anti-False Positive Grace Period:** In real-world edge vision, lighting drops or motion blur can temporarily cause recognition failures. The system implements a dynamic unknown_grace_period (`e.g., 4.0 seconds`). It buffers unrecognized frames before declaring a "Stranger Intrusion," drastically reducing biometric false-positives and maintaining a seamless user experience.

### 4. Event-Driven Edge Vision & State Machine
The system visually monitors the environment and acts autonomously without melting the central CPU.

- **Zero-Latency Multi-Tracking & Anti-Drift:** Once MediaPipe detects a face, the edge node switches to an asynchronous **KCF Tracker**, following the user locally at 30 FPS. It stops sending heavy image payloads and instead streams lightweight JSON telemetries (`{"user": "Berkay", "status": "PRESENT"}`) to the backend. To eliminate bounding-box drift, this tracker uses **IoU (Intersection over Union)** matching to periodically re-initialize with fresh BlazeFace data.

- **Producer-Consumer Threading & Ghost Box TTL:** Camera reading and frame processing are strictly separated into different threads to prevent stream blocking. A 1-second Time-To-Live (TTL) mechanism forcefully deletes lingering "ghost boxes" when a user leaves the frame.

- **Zero-Latency Context Injection:** Upon entry, FastAPI `BackgroundTasks` awaken the LangGraph Agent. Before the LLM generates a single token, current MQTT telemetry (Temp, Light) and smart plug states are injected directly from RAM into the `system_prompt`, enabling instant, proactive suggestions (e.g., offering to turn on the study lamp at 2 AM).

- **Persistent Spatial Ledger & Silent Guest Protocol:** Maintains a debounced, time-zone-aware history of room events. If an unrecognized face is detected while an authorized user is already present, the system intelligently suppresses security alerts to maintain social grace.

### 5. Risk-Based Hybrid Action Engine (Gestures & Security)
The system transforms passive hand gestures into physical actuations via a sophisticated, fully database-driven rule engine designed for zero false-positives and maximum personalization.

- **Temporal Gating & Debounce Filtering:** Eliminates accidental triggers by tracking sustained actions. A gesture is only processed if it is held continuously for a specific duration (e.g., 1.0s). A server-side `ActionState` lock prevents network spamming by enforcing strict action cooldowns.

- **Gaze-Locked UX (Frontality Check):** The system inherently understands user intentionality. By fusing MediaPipe hand tracking with BlazeFace projection matrix checks, it actively ignores gestures if the user is looking away (e.g., talking to a friend in the room), executing commands only when the user makes direct eye contact with the camera.

- **Hierarchical DB-Driven Actuation:**
  - **Level 1 (Dynamic Mapping):** Users can map available gestures (e.g., `Victory`, `Pointing_Up`) to any discovered IoT device via PostgreSQL relationships. Actions execute with zero latency, bypassing the LLM entirely.

  - **Level 2 (The Red Zone - Emergency Lockdown):** Users assign an exclusive SOS gesture (e.g., `Closed_Fist`) that triggers a catastrophic `execute_emergency_lockdown` macro. This macro runs on a **Fail-Fast architecture**, ignoring unresponsive devices (1s timeouts) to prevent system freezing. It executes parallel tasks:
    1.  **Hardware Override:** Instantly forces all discovered smart bulbs into a deterministic alert state based on user preferences (e.g., Police Strobe Red/Blue for 20 seconds).
    2.  **Omnichannel Alerts:** Simultaneously dispatches SMS, Automated Voice Calls (Twilio), and Telegram alerts.
    3.  **Dynamic AI Voice Announcement:** Bypasses standard LLM processing delays. The system injects dynamic context (e.g., "SMS sent to Tuna") into the user's custom pre-defined SOS prompt and streams it instantly to the Text-to-Speech engine, generating an authoritative, context-aware room broadcast within milliseconds.

- **Silent Episodic Memory:** Every gesture—whether it triggers an action or is simply an observation—is silently logged into the agent's `history_ledger`, granting the LLM a highly accurate episodic memory to answer queries like "What did I just do?".

---

## Onboarding-Driven Development (ODD)

The ecosystem features a bespoke, immersive 5-Step Onboarding Engine that acts as the "Constitution" for the Smart Home, dynamically generating the backend schema before the user ever reaches the dashboard. All hardcoded variables have been eliminated in favor of this fully data-driven pipeline.

- **1- AI Context Initialization:** Collects structural data (Household Type, Age Group) to seed the LangGraph System Prompt, allowing the AI to naturally adapt its tone and autonomous actions.

- **2- Hardware Discovery & Active Probing:** Replaces manual IP forms with an autonomous `mDNS Snooping` and `TCP Subnet Sweeping` radar. It implements a resilient **Deep Object Inspection** layer with **Exponential Backoff** to combat IoT hardware fatigue and strict-typing serialization errors. Features a **"Blink to Identify"** UI mechanic that physically toggles smart bulbs/plugs so users can seamlessly identify and map hardware.

- **3- Biometric Security Calibration:** Captures a 5-point face mesh and acoustic footprint via an interactive, gaze-guided UI. Designed with human-centric copywriting to avoid intimidating technical jargon.

- **4- Gesture Mapping & Advanced SOS Protocol:** Empowers users to dynamically link hand gestures to physical actuators. Integrates a highly granular Emergency SOS configuration where users define their trigger gesture, specific hardware overrides (**Alert Color** such as Police Strobe, and **Duration**), an emergency contact, and a **Custom AI Voice Announcement** that the generative agent will broadcast during a lockdown.

- **5- System Finalization (The Labor Illusion):** Employs psychological UX design (deliberate UI delays and dynamic log tracking) to build anticipation and perceived value as the system compiles PostgreSQL schemas, syncs gesture rules, encrypts signatures, and assembles the dashboard.

---

## Tech Stack

### AI & Machine Learning
| Category | Tool/Library | Purpose |
| :--- | :--- | :--- |
| **Orchestration** | **LangGraph** |Manages the cyclic state of the agent, allowing for reasoning loops, error recovery, and multi-turn conversation memory.|
| **Framework** | **LangChain** | Used for creating structured Tools (@tool decorators) and managing prompt templates.|
| **LLM** | **Google Gemini 3.0** | The primary reasoning engine (gemini-3-flash-preview) accessed via Vertex AI for high-speed intent processing. |
| **Computer Vision**| **OpenCV & KCF** | Lightweight motion detection and high-speed bounding box tracking on edge nodes. |
| **Edge Vision**| **MediaPipe BlazeFace** | Ultra-lightweight mobile-optimized face detection for extracting ROIs at high FPS on edge devices. |
| **Gesture AI** | **MediaPipe Tasks API** | Asynchronous real-time hand gesture recognition (Victory, Open Palm, Closed Fist) running on non-blocking C++ worker threads. |
| **Alignment**| **YOLOv8-Face** | Executes 5-point facial landmark detection on the Hub for surgical face alignment before recognition. |
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

- [ ] **True Local Autonomy:** Replacing cloud dependencies with quantized **Local LLMs (Llama-3)**, **Whisper.cpp** (STT), and **Piper TTS** for 100% offline privacy and zero-latency response.

- [ ] **Advanced Pose Estimation:** Expanding MediaPipe capabilities to include full-body pose estimation for emergency Fall Detection.

- [ ] **Acoustic Event Detection (SED):** Integrating Audio Intelligence models (e.g., YAMNet) to recognize critical environmental sounds such as *baby crying* or *glass breaking* and trigger emergency protocols.

- [ ] **Predictive Behavior Modeling:** Training **LSTM/Transformer** networks on historical home data to learn user habits and automate routines proactively (e.g., "User usually drinks coffee at 8 AM, pre-heat the machine").

- [ ] **Native Mobile Ecosystem:** Developing a **React Native** application to extend control beyond the local network and enable rich push notifications.