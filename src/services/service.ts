import * as bunyan from "bunyan";
import crypto from "crypto";
import * as fs from "fs";
import * as os from "os";
import { createClient as CreateRedisClient, RedisClient } from "redis";

import { config, keyEncoder } from "../config";

export const NODE_ENV = (process.env.NODE_ENV || "production").toLowerCase();

export const appName = "core-account-basic";
if (config.logger && config.logger.path && !fs.existsSync(config.logger.path)) {
  fs.mkdirSync(config.logger.path);
}
const serializers = {
  req: req => {
    if (!req || !req.connection) {
      return req;
    }
    return {
      method: req.method,
      url: req.originalUrl || req.url,
      headers: req.headers,
      remoteAddress: req.connection.remoteAddress,
      remotePort: req.connection.remotePort
    };
  },
  res: bunyan.stdSerializers.res,
  err: bunyan.stdSerializers.err
};

export const build = JSON.parse(fs.readFileSync("dist/build.json").toString("utf8"));
const commit = build.commits[0].abbrevHash;

export const logger = bunyan.createLogger(
  (config.logger && config.logger.path) ? {
    name: appName,
    commit,
    serializers,
    streams: [{
      type: "rotating-file",
      ...config.logger,
      path: `${process.env.LOGGER_PATH || config.logger.path || "."}/${appName}-${os.hostname()}.log`,
    }]
  } : { name: appName, serializers });
const raw = Buffer.from(keyEncoder.encodePrivate(config.keys[appName].pkey, "pem", "raw"), "hex").toString("base64");

export const moduleKey = crypto.createECDH(config.auth.curves);
moduleKey.setPrivateKey(raw, "base64");

export const redis = CreateRedisClient(config.redis);
