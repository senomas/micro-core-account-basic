import { Query, Resolver, Root, FieldResolver, Args } from 'type-graphql';
import os from "os";

import { Account, AccountArgs, Core, ServerInfo, Saving, SavingArgs } from '../schemas/account';
import { AccountService } from '../services/account';
import { SavingService } from '../services/saving';
import { ICoreService } from '../services/core';

@Resolver(of => Core)
export class CoreResolver {

  @FieldResolver(returns => ServerInfo)
  public serverInfo(@Root() core: ICoreService): ServerInfo {
    return {
      host: os.hostname(),
      time: new Date()
    };
  }

  @FieldResolver(returns => Account, { nullable: true })
  public async account(
    @Root() core: ICoreService,
    @Args() { cif }: AccountArgs
  ): Promise<AccountService> {
    return core.getAccount(cif);
  }


  @FieldResolver(returns => Saving, { nullable: true })
  public async saving(
    @Root() core: ICoreService,
    @Args() { id }: SavingArgs
  ): Promise<SavingService> {
    return core.getSaving(id);
  }

}
