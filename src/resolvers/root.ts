import { Query, Resolver, UseMiddleware } from 'type-graphql';

import { config } from '../config';
import { Core } from '../schemas/account';
import { CoreService } from '../services/core';
import { CoreAsyncService } from '../services/core-async';
import { ResolveTimeMiddleware } from '../services/resolve-time';

@Resolver()
export class RootResolver {

  @Query(returns => Core, { nullable: true })
  @UseMiddleware(ResolveTimeMiddleware)
  public async core(): Promise<Core> {
    return new CoreService(config.core.host, config.core.port);
  }


  @Query(returns => Core, { nullable: true })
  @UseMiddleware(ResolveTimeMiddleware)
  public async asyncCore(): Promise<Core> {
    return new CoreAsyncService(config.core.host, config.core.port);
  }
}
