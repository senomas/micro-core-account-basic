import { Socket } from "net";
import { bignumber } from "mathjs";
import { EventEmitter } from "events";

import { logger } from "./service";
import { AccountService } from "./account";
import { SavingService } from "./saving";

const buffers = {};
const event = new EventEmitter();
let connId = null;
let counter = Date.now();
let buf = Buffer.from([]);
const socket: Socket = new Socket();

socket.on('connect', () => {
  connId = `${socket.localPort}-${socket.remoteAddress}:${socket.remotePort}`;
  logger.info({ socket: { type: 'async', event: 'connect', connId } }, "socket");
});
socket.once('ready', () => {
  logger.info({ socket: { type: 'async', event: 'ready', connId } }, "socket");
});
socket.on('data', async (data: Buffer) => {
  logger.info({ socket: { type: 'async', event: 'data', connId, data: data.toString('utf8') } }, "socket");
  buf = Buffer.concat([buf, data], buf.length + data.length);
  let ix = buf.indexOf('\n');
  while (ix >= 0) {
    const msg = JSON.parse(buf.slice(0, ix).toString('utf8'));
    const resp = buffers[msg.cid];
    if (resp) {
      resp.push(msg);
      event.emit(msg.cid);
    } else {
      logger.info({ socket: { type: 'async', event: 'outOfTx', connId, message: msg } }, "socket");
    }
    buf = buf.slice(ix + 1);
    ix = buf.indexOf('\n');
  }
});
socket.on('error', err => {
  logger.info({ socket: { type: 'async', event: 'error', connId, err } }, "socket");
  connId = null;
});
socket.on("timeout", () => {
  logger.info({ socket: { type: 'async', event: 'timeout', connId } }, "socket");
  socket.end();
});
socket.on('close', () => {
  logger.info({ socket: { type: 'async', event: 'close', connId } }, "socket");
  connId = null;
  buf = Buffer.from([]);
});
socket.on('end', () => {
  logger.info({ socket: { type: 'async', event: 'end', connId } }, "socket");
  connId = null;
});

export class CoreAsyncService {

  constructor(private host: string, private port: number) {
  }

  public async send(request: any, timeout: number): Promise<any> {
    return new Promise(resolve => {
      if (!connId) {
        connId = 'connecting';
        socket.connect(this.port, this.host);
      }
      const cid = `${counter++}`;
      const t0 = Date.now();
      buffers[cid] = [];
      let timerh;
      const onMsg = () => {
        clearTimeout(timerh);
        const msgs = buffers[cid];
        const msg = msgs ? msgs[0] : null;
        delete buffers[cid];
        logger.info({
          socket: {
            type: 'async',
            event: 'receive',
            cid,
            messageType: request.command,
            [`message_${request.command || '_unknown'}`]: msg
          }, responseTime: Date.now() - t0
        }, "socket");
        resolve(msg);
      };
      event.once(cid, onMsg);
      timerh = setTimeout(() => {
        const msgs = buffers[cid];
        const msg = msgs ? msgs[0] : null;
        delete buffers[cid];
        logger.info({
          socket: {
            type: 'async',
            event: 'timeout',
            cid,
            messageType: request.command,
            [`message_${request.command || '_unknown'}`]: msg
          }, responseTime: Date.now() - t0
        }, "socket");
        event.removeListener(cid, onMsg);
        resolve(msg);
      }, timeout * 1000);
      logger.info({
        socket: {
          type: 'async',
          event: 'send',
          cid,
          messageType: request.command,
          [`request_${request.command || '_unknown'}`]: request
        }
      }, "socket");
      socket.write(JSON.stringify({ ...request, cid }));
      socket.write("\n");
    });
  }

  public async  getAccount(cif: string): Promise<AccountService> {
    const res = await this.send({
      command: 'cif',
      cif
    }, 5000);
    if (!res) {
      return null;
    }
    return new AccountService(this, res.cid, cif, res.name, res.savings);
  }

  public async getSaving(id: string): Promise<SavingService> {
    const res = await this.send({ command: 'saving', id }, 5000);
    if (!res) {
      return null;
    }
    return new SavingService(this, res.cif, id, bignumber(res.balance));
  }
}
