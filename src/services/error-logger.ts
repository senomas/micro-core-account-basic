import { MiddlewareInterface, NextFn, ResolverData, ArgumentValidationError } from "type-graphql";

import { logger } from "./service";

export class ErrorLoggerMiddleware implements MiddlewareInterface<any> {

  async use({ context, info }: ResolverData<any>, next: NextFn) {
    try {
      return await next();
    } catch (err) {
      logger.info({
        message: err.message,
        operation: info.operation.operation,
        fieldName: info.fieldName,
        userName: context.currentUser.name,
      }, 'graphql-error');
      throw err;
    }
  }
}