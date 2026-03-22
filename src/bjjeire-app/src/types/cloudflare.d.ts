export interface CfBeacon {
  token: string
  spa?: boolean
}

export interface CloudflareZaraz {
  track: (eventName: string, properties?: Record<string, string>) => void
}
