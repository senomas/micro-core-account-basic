import { bignumber, BigNumber } from 'mathjs';

import { Transaction } from '../schemas/account';

import { AccountService } from './account';
import { ICoreService } from './core';

export class SavingService {
  constructor(
    private core: ICoreService,
    public cif: string,
    public id: string,
    public balance: BigNumber
  ) { }

  public async getAccount(): Promise<AccountService> {
    const res = await this.core.send({
      command: 'cif',
      cif: this.cif
    }, 30000);
    return new AccountService(this.core, res.cid, this.cif, res.name, res.savings);
  }

  public async getTransactions(): Promise<Transaction[]> {
    const res = await this.core.send({ command: 'trx', id: this.id }, 30000);
    return res.transactions.map(v => ({
      ...v,
      time: new Date(v.time),
      amount: bignumber(v.amount)
    }));
  }

}