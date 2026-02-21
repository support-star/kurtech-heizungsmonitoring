export interface HeatingData {
  timestamp: Date;
  aussentemperatur: number;
  vorlauftemperatur: number;
  ruecklauftemperatur: number;
  puffer_oben: number;
  puffer_mitte: number;
  puffer_unten: number;
  drehzahl_pumpe: number;
  stromverbrauch: number;
  cop: number;
  betriebsstunden: number;
  fehlercode: string | null;
  status: 'heizen' | 'standby' | 'stoerung' | 'abtauen';
}

export interface Alarm {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface User {
  username: string;
  role: 'customer' | 'installer' | 'technician' | 'admin' | 'viewer';
  anlageId?: string;
  customerId?: string;
}

export interface Anlage {
  id: string;
  name: string;
  address: string;
  installDate: Date;
  lastMaintenance: Date;
  nextMaintenance: Date;
}

export type TimeRange = '24h' | '7d' | '30d';

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  yAxisID?: string;
}
