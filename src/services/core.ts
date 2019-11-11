import { Socket } from "net";
import { bignumber } from "mathjs";

import { logger } from "./service";
import { AccountService } from "./account";
import { SavingService } from "./saving";

export interface ICoreService {
  send(request: any, timeout: number): Promise<any>;

  getAccount(cif: string): Promise<AccountService>;

  getSaving(id: string): Promise<SavingService>;
}

export class CoreServicexxx {

  constructor(private host: string, private port: number) {
    logger.info("CORE-SYNC-SERVICE");
  }

  public async send(request: any, timeout: number): Promise<any> {
    const socket = new Socket();
    let cid = "not-connected";
    return new Promise((resolve, reject) => {
      let buf = Buffer.from([]);
      const timerh = setTimeout(() => {
        resolve(null);
        socket.end();
      }, timeout * 1000);
      socket.setTimeout(timeout * 1000);
      socket.connect(this.port, this.host);
      socket.on('connect', () => {
        cid = `${socket.localPort}-${socket.remoteAddress}:${socket.remotePort}`;
        logger.info({ cid }, "SYNC-CONNECTED");
      });
      socket.once('ready', () => {
        logger.info({ cid }, "SYNC-READY");
        socket.write(JSON.stringify(request));
        socket.write("\n");
      });
      socket.on('data', async (data: Buffer) => {
        buf = Buffer.concat([buf, data], buf.length + data.length);
        const ix = buf.indexOf('\n');
        if (ix >= 0) {
          clearTimeout(timerh);
          resolve(JSON.parse(buf.slice(0, ix).toString('utf8')));
          socket.end();
        }
      });
      socket.on("timeout", () => {
        logger.info({ cid }, "SYNC-TIMEOUT");
        socket.end();
      });
      socket.on('error', err => {
        logger.info({ cid, err }, "SYNC-ERROR");
        reject(err);
      });
    });
  }

  public async getAccount(cif: string): Promise<AccountService> {
    const res = await this.send({
      command: 'cif',
      cif
    }, 30000);
    if (!res) {
      return null;
    }
    return new AccountService(this, res.cid, cif, res.name, res.savings);
  }

  public async getSaving(id: string): Promise<SavingService> {
    const res = await this.send({ command: 'saving', id }, 30000);
    if (!res) {
      return null;
    }
    return new SavingService(this, res.cif, id, bignumber(res.balance));
  }
}
