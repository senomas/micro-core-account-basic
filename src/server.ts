import smap = require("source-map-support");
import 'reflect-metadata';
import { ApolloServer } from 'apollo-server-express';
import shrinkRay from 'shrink-ray-current';
import express from 'express';
import { buildSchema, MiddlewareFn } from 'type-graphql';
import math, { BigNumber } from "mathjs";
import { GraphQLScalarType, Kind } from "graphql";
import { isString } from "util";
import Decimal from "decimal.js";

import { getUser } from './authentication';
import { customAuthChecker } from './authorization';
import { logger } from './services/service';
import { SavingResolver } from "./resolvers/saving";
import { RootResolver } from "./resolvers/root";
import { AccountResolver } from "./resolvers/account";
import { CoreResolver } from "./resolvers/core";
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

export const ResolveTime: MiddlewareFn = async ({ info }, next) => {
  const start = Date.now();
  await next();
  const responseTime = Date.now() - start;
  logger.info({ path: `${info.parentType.name}.${info.fieldName}`, responseTime }, 'resolve time');
};

class BasicLogging {
  public requestDidStart(o) {
    logger.info({ query: o.queryString, variables: o.variables }, 'graphql request');
  }

  public willSendResponse({ graphqlResponse }) {
    logger.info({ gqlRes: graphqlResponse }, 'graphql response');
  }
}

export async function bootstrap() {
  const schema = await buildSchema({
    resolvers: [RootResolver, CoreResolver, AccountResolver, SavingResolver],
    scalarsMap: [{ type: Decimal, scalar: BigNumberScalar }],
    authChecker: customAuthChecker,
    authMode: "null",
    emitSchemaFile: true,
    dateScalarMode: "isoDate"
  });

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
    extensions: [() => {
      return new BasicLogging();
    }]
  });

  const app = express();
  app.use(shrinkRay());
  server.applyMiddleware({ app });

  const port = parseInt(process.env.PORT, 10 || 4000);
  const bindAddress = process.env.BIND_ADDRESS || "0.0.0.0";
  const serverInfo = await app.listen(port, bindAddress);
  logger.info({ port, bindAddress, ...serverInfo }, "Server is running");
}

bootstrap().catch(err => {
  console.error("server error", err);
  process.exit(-1);
});
