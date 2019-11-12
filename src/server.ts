import smap = require("source-map-support");
import 'reflect-metadata';
import { ApolloServer } from 'apollo-server-express';
import shrinkRay from 'shrink-ray-current';
import express from 'express';
import { buildSchema } from 'type-graphql';
import math, { BigNumber } from "mathjs";
import { GraphQLScalarType, Kind } from "graphql";
import { isString } from "util";
import Decimal from "decimal.js";

import { getUser } from './authentication';
import { customAuthChecker } from './authorization';
import { logger, build, NODE_ENV } from './services/service';
import { SavingResolver } from "./resolvers/saving";
import { RootResolver } from "./resolvers/root";
import { AccountResolver } from "./resolvers/account";
import { CoreResolver } from "./resolvers/core";
import { config } from "./config";
import { ErrorLoggerMiddleware } from "./services/error-logger";
smap.install();

export const BigNumberScalar = new GraphQLScalarType({
  name: 'BigNumber',
  description: 'BigNumber scalar type',
  parseValue(value: string) {
    return value && value.length > 0 ? math.bignumber(value) : null;
  },
  serialize(value: BigNumber) {
    return value.toFixed();
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      if (isString(ast.value)) {
        return math.bignumber(ast.value);
      }
      throw new TypeError(
        `Currency cannot represent an invalid currency-string ${ast.value}.`
      );
    }
    throw new TypeError(
      `Currency cannot represent an invalid currency-string ${ast}.`
    );
  }
});

class BasicLogging {
  public requestDidStart({ queryString, variables }) {
    logger.info({ query: queryString, variables: variables }, 'graphql-request');
  }
}

export async function bootstrap() {
  const schema = await buildSchema({
    resolvers: [RootResolver, CoreResolver, AccountResolver, SavingResolver],
    scalarsMap: [{ type: Decimal, scalar: BigNumberScalar }],
    globalMiddlewares: [ErrorLoggerMiddleware],
    authChecker: customAuthChecker,
    authMode: "null",
    emitSchemaFile: true,
    dateScalarMode: "isoDate"
  });

  const extensions = [];
  if (config.basicLogging) {
    extensions.push(() => {
      return new BasicLogging();
    });
  }

  const server = new ApolloServer({
    schema,
    playground: true,
    formatError: err => {
      if (err.message && err.message.startsWith("Context creation failed: ")) {
        err.message = err.message.substr(25);
      }
      return err;
    },
    context: async ({ req }) => {
      const user = await getUser(req);
      const remoteAddress = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      return { user, headers: req.headers, remoteAddress };
    },
    extensions
  });

  const app = express();
  app.use(shrinkRay());
  server.applyMiddleware({ app });

  const port = parseInt(process.env.PORT || "4000", 10);
  const bindAddress = process.env.BIND_ADDRESS || "0.0.0.0";
  await app.listen(port, bindAddress);
  logger.info({
    port,
    bindAddress,
    build,
    config: NODE_ENV === 'dev' || NODE_ENV === 'test' ? config : null,
    message: "server up"
  }, "server");
}

bootstrap().catch(err => {
  console.error("server error", err);
  process.exit(-1);
});
