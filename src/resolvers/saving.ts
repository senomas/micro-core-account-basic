import { Resolver, Root, FieldResolver, Arg, Args } from 'type-graphql';

import { Saving, Transaction, TransactionArgs, Account } from '../schemas/account';
import { SavingService } from '../services/saving';

@Resolver(returns => Saving)
export class SavingResolver {

  @FieldResolver(returns => Account)
  public async account(
    @Root() saving: SavingService
  ): Promise<Account> {
    return saving.getAccount();
  }

  @FieldResolver(returns => [Transaction])
  public async transactions(
    @Root() saving: SavingService,
    @Args() { from, to }: TransactionArgs
  ): Promise<Transaction[]> {
    return saving.getTransactions();
  }
}
