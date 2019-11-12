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

export class CoreService {

  constructor(private host: string, private port: number) {
  }

  public async send(request: any, timeout: number): Promise<any> {
    const t0 = Date.now();
    const socket = new Socket();
    let connId = null;
    return new Promise((resolve, reject) => {
      let buf = Buffer.from([]);
      const timerh = setTimeout(() => {
        logger.info({
          socket: {
            type: 'sync',
            event: 'timeout',
            connId,
            messageType: request.command,
          }, responseTime: Date.now() - t0
        }, "socket");
        resolve(null);
        socket.end();
      }, timeout * 1000);
      socket.setTimeout(timeout * 1000);
      socket.connect(this.port, this.host);
      socket.on('connect', () => {
        connId = `${socket.localPort}-${socket.remoteAddress}:${socket.remotePort}`;
        logger.info({ socket: { type: 'sync', event: 'connect', connId } }, "socket");
      });
      socket.once('ready', () => {
        logger.info({ socket: { type: 'sync', event: 'ready', connId } }, "socket");
        logger.info({
          socket: {
            type: 'sync',
            event: 'send',
            connId,
            messageType: request.command,
            [`request_${request.command || '_unknown'}`]: request
          }
        }, "socket");
        socket.write(JSON.stringify(request));
        socket.write("\n");
      });
      socket.on('data', async (data: Buffer) => {
        logger.info({ socket: { type: 'sync', event: 'data', connId, data: data.toString('utf8') } }, "socket");
        buf = Buffer.concat([buf, data], buf.length + data.length);
        const ix = buf.indexOf('\n');
        if (ix >= 0) {
          clearTimeout(timerh);
          const msg = JSON.parse(buf.slice(0, ix).toString('utf8'));
          logger.info({
            socket: {
              type: 'sync',
              event: 'receive',
              connId,
              messageType: request.command,
              [`message_${request.command || '_unknown'}`]: msg
            }, responseTime: Date.now() - t0
          }, "socket");
          resolve(msg);
          socket.end();
        }
      });
      socket.on("timeout", () => {
        logger.info({ socket: { type: 'sync', event: 'timeout', connId } }, "socket");
        socket.end();
      });
      socket.on('error', err => {
        logger.info({ socket: { type: 'sync', event: 'error', connId, err } }, "socket");
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
