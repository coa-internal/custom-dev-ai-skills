// Entry point. Runs the same way locally (`npm run dev` / `npm start`) and on AWS Lambda, where the
// Lambda Web Adapter starts this server via run.sh and forwards API Gateway requests to it.
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createLogger } from "./logger.js";

const config = loadConfig();
const logger = createLogger(config.logLevel);
const app = createApp({ logger });

app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.nodeEnv }, "server listening");
});
