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
