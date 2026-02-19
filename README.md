# 🌡️ KurTech Heizungs-Monitoring v2.0

Professionelles Wärmepumpen-Monitoring-Dashboard mit Echtzeit-Datenanbindung via MQTT und integriertem Simulationsmodus.

![Dashboard](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Vite](https://img.shields.io/badge/Vite-7-purple) ![MQTT](https://img.shields.io/badge/MQTT-WebSocket-green)

## Features

- **📊 Live-Dashboard** – Temperaturen, COP, Stromverbrauch, Pufferspeicher in Echtzeit
- **📈 Verlaufs-Charts** – Historische Daten (24h / 7 Tage / 30 Tage) mit Chart.js
- **🔔 Alarm-System** – Warnungen, Fehler und Info-Meldungen mit Bestätigung
- **🔧 System-Schema** – Interaktive Anlagenübersicht mit Komponentenstatus
- **📐 P&ID-Diagramm** – Technisches Rohrleitungsschema mit Live-Daten
- **⚙️ Einstellungen** – MQTT-Konfiguration, Benutzer- & Anlagen-Info
- **🧪 Simulationsmodus** – Physikalisch plausible Demo-Daten (Tagesgang, Heizkurve, COP)
- **🔌 MQTT-Anbindung** – WebSocket-Verbindung zu beliebigem MQTT-Broker

## Schnellstart

```bash
# Repository klonen
git clone https://github.com/Support-Star/kurtech-heizungsmonitoring.git
cd kurtech-heizungsmonitoring

# Dependencies installieren
npm install

# Entwicklungsserver starten (Simulationsmodus)
npm run dev
```

App öffnet unter **http://localhost:5173** – Login: `benutzer1` / `1`

## MQTT-Modus aktivieren

In `src/config/mqtt.config.ts`:
```ts
export let useSimulation = false; // auf false setzen
```

Dann MQTT-Broker-Daten anpassen:
```ts
export const MQTT_CONFIG = {
  broker: 'ws://IHRE-IP:9001',
  username: 'iot',
  password: 'IHR-PASSWORT',
  // ...
};
```

## Projektstruktur

```
src/
├── config/          # MQTT & App-Konfiguration
│   └── mqtt.config.ts
├── lib/             # Simulation Engine
│   └── simulation.ts
├── hooks/           # React Hooks
│   ├── useAuth.ts
│   ├── useMQTTData.ts    # Unified MQTT/Simulation Hook
│   └── useHeatingData.ts
├── types/           # TypeScript Typen
│   └── heating.ts
├── sections/        # UI-Komponenten
│   ├── Login.tsx
│   ├── Header.tsx
│   ├── LiveStatus.tsx
│   ├── HistoryCharts.tsx
│   ├── Alarms.tsx
│   ├── SystemSchema.tsx
│   ├── PIDDiagram.tsx
│   └── Settings.tsx
└── components/ui/   # shadcn/ui Basis-Komponenten
```

## Technologie-Stack

- **React 19** + TypeScript
- **Vite 7** Build Tool
- **Tailwind CSS 3** + shadcn/ui
- **Chart.js** für Verlaufs-Charts
- **MQTT.js** für WebSocket-Verbindung
- **Lucide React** Icons
- **Sonner** Toast-Notifications

## Demo-Benutzer

| Benutzer | Passwort | Rolle |
|---|---|---|
| benutzer1 | 1 | Kunde |
| techniker | 1 | Techniker |
| admin | 1 | Administrator |

## Anlage

- **Wärmepumpe**: 175 kW thermisch / 38,9 kW elektrisch
- **Pufferspeicher**: 2000 L (PVT) + 1500 L (Heizung) + 1000 L (Kälte)
- **Erdwärmefeld**: Nahwärme mit 42,1 m³/h Massenstrom
- **PVT-Solarkollektoren** + Abluft-Wärmepumpe

---

© 2026 KurTech GmbH · [kurtech.de](https://kurtech.de)
