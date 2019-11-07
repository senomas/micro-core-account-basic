import { Query, Resolver, Root, FieldResolver, Args } from 'type-graphql';

import { Account, AccountArgs, Core } from '../schemas/account';

import { AccountService } from './account';
import { CoreService } from './root';

@Resolver(of => Core)
export class CoreResolver {

  @FieldResolver(returns => Account)
  public async account(
    @Root() core: CoreService,
    @Args() { cif }: AccountArgs
  ): Promise<AccountService> {
    return core.data.filter(v => v.cif === cif)[0];
  }
}
