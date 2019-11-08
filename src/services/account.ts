import { bignumber } from "mathjs";

import { SavingService } from "./saving";
import { ICoreService } from "./core";

export class AccountService {
  constructor(
    private core: ICoreService,
    public cid: string,
    public cif: string,
    public name: string,
    public savings: string[]
  ) { }

  public async getSaving(id: string): Promise<SavingService> {
    const res = await this.core.send({ command: 'saving', id }, 30000);
    if (res.cif !== this.cif) {
      throw {
        name: 'InvalidRecord',
        message: 'Invalid cif',
        cif: this.cif,
        res
      };
    }
    return new SavingService(this.core, res.cif, id, bignumber(res.balance));
  }
}