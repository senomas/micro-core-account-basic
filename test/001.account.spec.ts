import { expect } from "chai";
import { suite, test } from "mocha-typescript";

import { BaseTest } from "./base";

@suite
export class SyncSocketTest extends BaseTest {

  @test
  public async testSavingId() {
    const res = await this.post({
      query: `query account($cif: String!, $savingId: String!, $from: DateTime!, $to: DateTime!) {
        core {
          account(cif: $cif) {
            cif
            name
            saving(id: $savingId) {
              id
              balance
              transactions(from: $from, to: $to) {
                time
              }
            }
          }
        }
      }`,
      variables: {
        cif: "10001",
        savingId: "1000000001",
        from: new Date(),
        to: new Date()
      }
    });
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
  }

  @test
  public async testAccountSaving() {
    const res = await this.post({
      query: `query account($cif: String!, $savingId: String!, $from: DateTime!, $to: DateTime!) {
        core {
          account(cif: $cif) {
            cif
            name
            savings {
              id
              balance
            }
            saving(id: $savingId) {
              id
              balance
              transactions(from: $from, to: $to) {
                time
              }
            }
          }
        }
      }`,
      variables: {
        cif: "10001",
        savingId: "1000000001",
        from: new Date(),
        to: new Date()
      }
    });
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
  }

  @test
  public async testSavingAccount() {
    const res = await this.post({
      query: `query account($savingId: String!, $from: DateTime!, $to: DateTime!) {
        core {
          saving(id: $savingId) {
            id
            balance
            account {
              name
            }
            transactions(from: $from, to: $to) {
              time
            }
          }
        }
      }`,
      variables: {
        savingId: "1000000001",
        from: new Date(),
        to: new Date()
      }
    });
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
  }

  @test
  public async testBasic() {
    const res = await this.post({
      query: `query account($cif: String!) {
        core {
          account(cif: $cif) {
            cif
            name
            savings {
              id
              balance
            }
          }
        }
      }`,
      variables: {
        cif: "1001"
      }
    });
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
  }

  @test
  public async testAsyncAccountCid() {
    const test = [];
    for (let i = 1001; i <= 2000; i++) {
      test.push({
        id: i
      });
    }
    await Promise.all(test.map(async t => {
      t.t0 = Date.now();
      const res = await this.post({
        query: `query account($cif: String!) {
          core {
            account(cif: $cif) {
              cif
              name
              savings {
                id
                balance
              }
            }
          }
        }`,
        variables: {
          cif: `${t.id}`,
        }
      });
      t.t1 = Date.now();
      t.res = res.body.data;
      if (res.body.data.core.account.name !== `USER ${t.id}`) {
        throw {
          name: "Invalid ID",
          t,
          res: res.data.body
        };
      }
    }));
    const { max, min, sum } = test.reduce(({ max, min, sum }, t) => {
      const tz = t.t1 - t.t0;
      if (sum === 0) {
        return {
          max: tz, min: tz, sum: tz
        };
      }
      return {
        max: Math.max(max, tz),
        min: Math.min(min, tz),
        sum: sum + tz
      };
    }, { max: 0, min: 0, sum: 0 });
    console.log(`RESULT COUNT: ${test.length} AVG: ${sum / test.length} MIN: ${min} MAX: ${max}`);
  }
}
