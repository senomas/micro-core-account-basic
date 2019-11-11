import { Resolver, Root, FieldResolver, Arg, Args, UseMiddleware } from 'type-graphql';

import { Saving, Transaction, TransactionArgs, Account } from '../schemas/account';
import { SavingService } from '../services/saving';
import { ResolveTimeMiddleware } from '../services/resolve-time';

@Resolver(returns => Saving)
export class SavingResolver {

  @FieldResolver(returns => Account)
  @UseMiddleware(ResolveTimeMiddleware)
  public async account(
    @Root() saving: SavingService
  ): Promise<Account> {
    return saving.getAccount();
  }

  @FieldResolver(returns => [Transaction])
  @UseMiddleware(ResolveTimeMiddleware)
  public async transactions(
    @Root() saving: SavingService,
    @Args() { from, to }: TransactionArgs
  ): Promise<Transaction[]> {
    return saving.getTransactions();
  }
}
