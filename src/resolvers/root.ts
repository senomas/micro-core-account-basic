import { Query, Resolver, Root, FieldResolver, Args } from 'type-graphql';
import * as math from 'mathjs';

import { Core } from '../schemas/account';

export class CoreService {
  public data = [
    {
      cif: "10001",
      name: `Adi`,
      savings: [
        {
          id: '100000001',
          balance: math.bignumber('10000000.05')
        }, {
          id: '100000002',
          balance: math.bignumber('5000000'),
          transactions: [
            {
              ref: "0001",
              time: new Date(),
              target: '2000000001',
              type: 'transfer',
              amount: math.bignumber('5000'),
              note: 'note 1'
            }, {
              ref: "0002",
              time: new Date(),
              target: '2000000001',
              type: 'transfer',
              amount: math.bignumber('5000'),
              note: 'note 2'
            }, {
              ref: "0003",
              time: new Date(),
              target: '2000000001',
              type: 'transfer',
              amount: math.bignumber('5000'),
              note: 'note 3'
            }, {
              ref: "0004",
              time: new Date(),
              target: '2000000001',
              type: 'transfer',
              amount: math.bignumber('5000'),
              note: 'note 4'
            }
          ]
        }

      ]
    }
  ];
}

@Resolver()
export class RootResolver {

  @Query(returns => Core, { nullable: true })
  public async core(): Promise<CoreService> {
    return new CoreService();
  }
}
