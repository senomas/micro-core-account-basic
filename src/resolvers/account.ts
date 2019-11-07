import { Arg, Query, Resolver, Root } from 'type-graphql';

import { Account, Saving } from '../schemas/account';

@Resolver()
export class AccountResolver {

  @Query(returns => Account)
  public async account(@Arg("cif") cif: string): Promise<Account> {
    return {
      cif,
      name: `Account ${cif}`
    };
  }

  @Query(returns => [Saving])
  public async savings(@Root() account: Account): Promise<Saving[]> {
    return [];
  }
}