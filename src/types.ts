export interface ConfigData {
  supportServerUrl: string;
  inviteUrl: string;
  turnstileSiteKey?: string;
}

export interface ShardInfo {
  id: number;
  servers: number;
  users: number;
  latency: number;
  status: string;
  uptime: number;
}

export interface LatencyPoint {
  timestamp: string;
  ms: number;
}

export interface ActivityEvent {
  id: string;
  type: 'command' | 'gateway' | 'security' | 'billing' | 'sync';
  title: string;
  detail: string;
  latencyMs: number;
  shard: number;
  timestamp: string;
}

export interface StatusData {
  status: string;
  servers: number;
  users: number;
  commands: number;
  shards: number;
  latency: number;
  avatar?: string;
  botTag?: string;
  botId?: string;
  uptime?: number;
  updatedAt?: string;
  memoryUsageMB?: number;
  cpuPercent?: number;
  commandsPerMin?: number;
  latencyHistory?: LatencyPoint[];
  activityFeed?: ActivityEvent[];
  topServers?: { name: string; icon?: string; members?: number }[];
  shardList?: ShardInfo[];
}

export interface Category {
  id: string;
  label: string;
  count: number;
}

export interface CommandArgument {
  name: string;
  required: boolean;
  description?: string;
  type?: string;
}

export interface Command {
  name: string;
  description: string;
  category: string;
  aliases?: string[];
  type?: string;
  slashEnabled?: boolean;
  prefixEnabled?: boolean;
  permissions?: string[];
  arguments?: CommandArgument[];
  cooldown?: number;
}
