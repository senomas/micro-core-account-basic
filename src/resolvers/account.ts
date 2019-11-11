import { Query, Resolver, Root, FieldResolver, Args, UseMiddleware } from 'type-graphql';

import { Account, Saving, AccountArgs, SavingArgs } from '../schemas/account';
import { AccountService } from '../services/account';
import { SavingService } from '../services/saving';
import { ResolveTimeMiddleware } from '../services/resolve-time';

@Resolver(of => Account)
export class AccountResolver {
  @FieldResolver(returns => [Saving])
  @UseMiddleware(ResolveTimeMiddleware)
  public async savings(@Root() account: AccountService): Promise<SavingService[]> {
    return Promise.all(account.savings.map(async v => {
      return account.getSaving(v);
    }));
  }

  @FieldResolver(returns => Saving, { nullable: true })
  @UseMiddleware(ResolveTimeMiddleware)
  public async saving(
    @Root() account: AccountService,
    @Args() { id }: SavingArgs
  ): Promise<SavingService> {
    return account.getSaving(id);
  }
}