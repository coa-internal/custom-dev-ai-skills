// Runtime configuration from environment variables. Secrets never go here as literals:
// read them from AWS Secrets Manager or SSM Parameter Store at startup instead.
export interface Config {
  port: number;
  logLevel: string;
  nodeEnv: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    // 8080 is the Lambda Web Adapter's default port.
    port: Number(env.PORT ?? 8080),
    logLevel: env.LOG_LEVEL ?? "info",
    nodeEnv: env.NODE_ENV ?? "development",
  };
}
