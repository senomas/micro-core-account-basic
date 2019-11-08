import { Query, Resolver, Args } from 'type-graphql';

import { Core } from '../schemas/account';
import { config } from '../config';
import { CoreAsyncService } from '../services/core-async';

@Resolver()
export class RootResolver {

  @Query(returns => Core, { nullable: true })
  public async core(): Promise<Core> {
    return new CoreAsyncService(config.core.host, config.core.port);
    // return new CoreService(config.core.host, config.core.port);
  }
}
