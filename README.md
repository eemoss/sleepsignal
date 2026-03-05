# Care Daily Sleep Signal Demo App

A high-impact, beautifully designed hybrid web application for real-time monitoring of "Sleep Signal" (AxEnd Wavve) devices within the Care Daily ecosystem.

## Features

- **Dual-Method Authentication:** Login using Email/Password or Phone Number with SMS Passcode.
- **Location Selection:** Easily switch between different "Homes" associated with your account.
- **Sleep Signal Integration:** Automatically detects "Sleep Signal" (type 2021) devices for live monitoring.
- **Live Vitals Dashboard:**
  - Real-time display of **Heartbeat (BPM)** and **Breathing (RPM)**.
  - Interactive, live-updating historical charts.
  - Occupancy tracking with "Standby" state and duration timer.
- **High-Impact Visuals:** Optimized for 1080x1920 portrait TV displays, ideal for lobbies or hospital settings.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1. Clone the repository and navigate to the project directory.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App

Start the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:3000` (or the port specified in your console).

### Live Demo (Mock Mode)

To demo the app without a physical Sleep Signal device or Care Daily account, you can use the built-in mock mode:

1. Navigate to: `http://localhost:3000/dashboard/demo-location?mock=true`
2. You can force the occupancy state by adding the `occupied` parameter:
   - Occupied: `http://localhost:3000/dashboard/demo-location?mock=true&occupied=true`
   - Standby (Empty): `http://localhost:3000/dashboard/demo-location?mock=true&occupied=false`

## Tech Stack

- **Framework:** React + TypeScript + Vite
- **Styling:** Tailwind CSS + Framer Motion (animations)
- **Charts:** Recharts
- **API Client:** Axios
- **Real-time:** WebSockets (`wsapi`)
- **Icons:** Lucide React
