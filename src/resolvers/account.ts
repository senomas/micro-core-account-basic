import { Query, Resolver, Root, FieldResolver, Args } from 'type-graphql';

import { Account, Saving, AccountArgs, SavingArgs } from '../schemas/account';
import { AccountService } from '../services/account';
import { SavingService } from '../services/saving';

@Resolver(of => Account)
export class AccountResolver {
  @FieldResolver(returns => [Saving])
  public async savings(@Root() account: AccountService): Promise<SavingService[]> {
    return Promise.all(account.savings.map(async v => {
      return account.getSaving(v);
    }));
  }

  @FieldResolver(returns => Saving, { nullable: true })
  public async saving(
    @Root() account: AccountService,
    @Args() { id }: SavingArgs
  ): Promise<SavingService> {
    return account.getSaving(id);
  }
}