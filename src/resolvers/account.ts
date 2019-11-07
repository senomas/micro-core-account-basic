import { Query, Resolver, Root, FieldResolver, Args } from 'type-graphql';

import { Account, Saving, AccountArgs, SavingArgs } from '../schemas/account';

export class AccountService {
  public cif: string;
  public name: string;

  public savings: Saving[];
}

@Resolver(of => Account)
export class AccountResolver {
  @FieldResolver(returns => [Saving])
  public async savings(@Root() account: AccountService): Promise<Saving[]> {
    return account.savings;
  }

  @FieldResolver(returns => Saving, { nullable: true })
  public async saving(
    @Root() account: AccountService,
    @Args() { id }: SavingArgs
  ): Promise<Saving> {
    return account.savings.filter(s => s.id === id)[0];
  }
}