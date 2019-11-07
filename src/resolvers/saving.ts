import { Resolver, Root, FieldResolver, Arg, Args } from 'type-graphql';

import { Saving, Transaction, TransactionArgs } from '../schemas/account';

@Resolver(returns => Saving)
export class SavingResolver {
  @FieldResolver(returns => [Transaction])
  public async transactions(
    @Root() saving: Saving,
    @Args() { from, to }: TransactionArgs
  ): Promise<Transaction[]> {
    return (saving as any).transactions;
  }
}
