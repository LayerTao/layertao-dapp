export interface PingResult {
  ok: boolean | null;
  configured?: boolean;
  checkedAt?: string;
  detail?: string;
  latencyMs?: number;
  statusCode?: number;
  statusText?: string;
  checkType?: string;
  demo?: boolean;
  subnetId?: number;
  name?: string;
}

export interface Subnet {
  id: number;
  name: string;
  network?: string;
  region?: string;
  description?: string;
  logoGlyph?: string;
  logoUrl?: string;
  website?: string;
  monitoringTarget?: string;
  check?: { type: string; url?: string; host?: string; port?: number };
  lastPing?: PingResult;
}
