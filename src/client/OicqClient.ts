import {
  Client,
  DiscussMessageEvent,
  Friend,
  Group,
  GroupMessageEvent,
  LogLevel,
  Platform,
  PrivateMessageEvent,
} from '@alpiiine/oicq';
import Buffer from 'buffer';
import { execSync } from 'child_process';
import random from '../utils/random';
import fs from 'fs';
import fsP from 'fs/promises';
import { Config } from '@alpiiine/oicq/lib/client';
import dataPath from '../helpers/dataPath';
import os from 'os';

const LOG_LEVEL: LogLevel = 'warn';

type MessageHandler = (event: PrivateMessageEvent | GroupMessageEvent) => Promise<boolean | void>

interface CreateOicqParams {
  id: number;
  uin: number;
  password: string;
  platform: Platform;
  // 当需要验证手机时调用此方法，应该返回收到的手机验证码
  onVerifyDevice: (phone: string) => Promise<string>;
  // 当滑块时调用此方法，返回 ticker，也可以返回假值改用扫码登录
  onVerifySlider: (url: string) => Promise<string>;
  // 扫码后返回
  onQrCode: (image: Buffer) => Promise<void>;
}

// OicqExtended??
export default class OicqClient extends Client {
  private readonly onMessageHandlers: Array<MessageHandler> = [];
  private static readonly uin: number;

  private constructor(uin: number, public readonly id: number, conf?: Config) {
    super(conf);
    this.uin = uin;
  }

  private static existedBots = {} as { [id: number]: OicqClient };

  public static create(params: CreateOicqParams) {
    if (this.existedBots[params.id]) {
      return Promise.resolve(this.existedBots[params.id]);
    }
    return new Promise<OicqClient>(async (resolve, reject) => {
      async function loginDeviceHandler({ phone }: { url: string, phone: string }) {
        client.sendSmsCode();
        const code = await params.onVerifyDevice(phone);
        client.submitSmsCode(code);
      }

      async function loginSliderHandler({ url }: { url: string }) {
        const res = await params.onVerifySlider(url);
        client.submitSlider(res);
      }

      async function loginQrCodeHandler({ image }: { image: Buffer }) {
        await params.onQrCode(image);
        client.qrcodeLogin();
      }

      function loginErrorHandler({ message }: { code: number; message: string }) {
        reject(message);
      }

      function successLoginHandler() {
        client.on('message', client.onMessage);
        resolve(client);
      }

      const client = new this(params.uin, params.id, {
        platform: params.platform,
        data_dir: dataPath(),
        log_level: LOG_LEVEL,
        ffmpeg_path: process.env.FFMPEG_PATH,
        ffprobe_path: process.env.FFPROBE_PATH,
      });

      client.on('system.login.device', loginDeviceHandler);
      client.on('system.login.slider', loginSliderHandler);
      client.on('system.login.error', loginErrorHandler);

      this.existedBots[params.id] = client;
      console.log('login', params.uin, params.password)
      client.login(this.uin, String(params.password));

      client.on('system.online', successLoginHandler);
    });
  }

  private onMessage = async (event: PrivateMessageEvent | GroupMessageEvent | DiscussMessageEvent) => {
    if (event.message_type === 'discuss') return;
    for (const handler of this.onMessageHandlers) {
      const res = await handler(event);
      if (res) return;
    }
  };

  public addNewMessageEventHandler(handler: MessageHandler) {
    this.onMessageHandlers.push(handler);
  }

  public removeNewMessageEventHandler(handler: MessageHandler) {
    this.onMessageHandlers.includes(handler) &&
    this.onMessageHandlers.splice(this.onMessageHandlers.indexOf(handler), 1);
  }

  public getChat(roomId: number): Group | Friend {
    if (roomId > 0) {
      return this.pickFriend(roomId);
    }
    else {
      return this.pickGroup(-roomId);
    }
  }
}
