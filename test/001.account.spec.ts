import { expect } from "chai";
import { suite, test } from "mocha-typescript";
import { createServer } from "net";

import { BaseTest, values, logger } from "./base";

@suite
export class SyncSocketTest extends BaseTest {
  static server = null;

  static async before() {
    SyncSocketTest.server = createServer(socket => {
      const client = `${socket.remoteAddress}:${socket.remotePort}`;
      logger.info({ client }, "CONNECTION");
      socket.on('data', data => {
        logger.info({ client, data }, "RECV");
        const rnd = 500 + Math.floor(Math.random() * 1000);
        setTimeout(() => {
          socket.write(data);
        }, rnd);
      });
      socket.on('close', data => {
        logger.info({ client, data }, "CLOSE");
      });
    }).listen(9000, "0.0.0.0");
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  static after() {
    SyncSocketTest.server.close();
  }

  @test
  public async openChannelNoServer() {
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
        savingId: "100000002",
        from: new Date(),
        to: new Date()
      }
    });
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
  }
}
