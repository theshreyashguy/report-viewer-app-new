
export interface HealthParameter {
  id: string;
  name: string;
  value: string;
  unit: string;
  normalRange: string;
  isOutOfRange?: boolean;
  category?: string;
}

export interface HealthReport {
  id: string;
  patientName: string;
  reportDate: string;
  parameters: HealthParameter[];
  fileName: string;
  uploadedAt: string;
}

export interface TrendData {
  date: string;
  [key: string]: string | number;
}

export interface User {
  id: string;
  email: string;
  name: string;
}
