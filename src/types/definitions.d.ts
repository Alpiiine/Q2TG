import { MessageRet } from '@alpiiine/oicq';

export type WorkMode = 'group' | 'personal';
export type QQMessageSent = MessageRet & { senderId: number, brief: string };
