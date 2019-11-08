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
  logger.info({ connId }, "ASYNC-CONNECTED");
});
socket.once('ready', () => {
  logger.info({ connId }, "ASYNC-READY");
});
socket.on('data', async (data: Buffer) => {
  buf = Buffer.concat([buf, data], buf.length + data.length);
  let ix = buf.indexOf('\n');
  while (ix >= 0) {
    const msg = JSON.parse(buf.slice(0, ix).toString('utf8'));
    const resp = buffers[msg.cid];
    logger.info({ connId, message: msg }, "ASYNC-MESSAGE");
    if (resp) {
      resp.push(msg);
      event.emit(msg.cid);
    } else {
      logger.info({ msg }, "OUT-OF TRX");
    }
    buf = buf.slice(ix + 1);
    ix = buf.indexOf('\n');
  }
});
socket.on('error', err => {
  logger.info({ connId, err }, "ASYNC-ERROR");
  connId = null;
});

export class CoreAsyncService {

  constructor(private host: string, private port: number) {
    logger.info("CORE-ASYNC-SERVICE");
  }

  public async send(request: any, timeout: number): Promise<any> {
    return new Promise(resolve => {
      if (!connId) {
        connId = 'connecting';
        socket.connect(this.port, this.host);
      }
      const cid = `${counter++}`;
      buffers[cid] = [];
      let timerh;
      const onMsg = () => {
        clearTimeout(timerh);
        const msgs = buffers[cid];
        const msg = msgs ? msgs[0] : null;
        delete buffers[cid];
        logger.info({ cid, message: msg }, "ON-MESSAGE");
        resolve(msg);
      };
      event.once(cid, onMsg);
      timerh = setTimeout(() => {
        const msgs = buffers[cid];
        const msg = msgs ? msgs[0] : null;
        delete buffers[cid];
        logger.info({ cid, message: msg }, "ON-TIMEOUT");
        event.removeListener(cid, onMsg);
        resolve(msg);
      }, timeout * 1000);
      logger.info({ cid, request }, "ASYNC-REQUEST");
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
