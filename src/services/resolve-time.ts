import { MiddlewareFn } from "type-graphql";

import { logger } from "./service";

export const ResolveTimeMiddleware: MiddlewareFn = async ({ info, args }, next) => {
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
      [`args_${info.parentType.name}_${info.fieldName}`]: args,
      type: info.parentType.name
    },
    responseTime
  }, 'graphql-resolver');
};
