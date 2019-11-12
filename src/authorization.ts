import { AuthChecker, ForbiddenError, UnauthorizedError } from "type-graphql";

import { logger } from "./services/service";

export const customAuthChecker: AuthChecker<any> = (
  { root, args, context, info },
  roles,
) => {
  const user = context.user;
  const error = roles.indexOf("@null") < 0;
  if (!user) {
    logger.info({ pass: false, user, roles, message: "customAuthChecker not login" }, "authorization");
    if (error) {
      throw new UnauthorizedError();
    }
    return false;
  }
  if (roles.filter(v => !v.startsWith("@")).length === 0) {
    logger.info({ pass: true, user, roles }, "authorization");
    return true;
  }
  let pass = false;
  for (let role of roles) {
    if (role.startsWith("!")) {
      role = role.substring(0, -1);
      if (user.p.indexOf(role) < 0) {
        if (error) {
          return false;
        }
        return false;
      }
      pass = true;
    } else if (user.p.indexOf(role) >= 0) {
      pass = true;
    }
  }
  logger.info({ pass, user, roles }, "authorization");
  if (error && !pass) {
    throw new ForbiddenError();
  }
  return pass;
};
