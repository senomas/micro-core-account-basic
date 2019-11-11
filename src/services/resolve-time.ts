import { MiddlewareFn } from "type-graphql";

import { logger } from "./service";

export const ResolveTimeMiddleware: MiddlewareFn = async ({ info }, next) => {
  const start = Date.now();
  await next();
  const responseTime = Date.now() - start;
  const ps = [];
  for (let p = info.path; p; p = p.prev) {
    ps.unshift(p.key);
  }
  logger.info({
    graphql: {
      path: ps.join("."),
      type: info.parentType.name
    },
    responseTime
  }, 'graphql-resolver');
};
