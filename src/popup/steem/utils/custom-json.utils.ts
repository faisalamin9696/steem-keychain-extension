import { Key, KeyType, TransactionOptions } from '@interfaces/keys.interface';
import { SteemTxUtils } from '@popup/steem/utils/steem-tx.utils';
import { CustomJsonOperation } from '@steempro/dsteem';
import Config from 'src/config';

const send = async (
  json: any,
  username: string,
  key: Key,
  keyType: KeyType,
  mainnet?: string,
  options?: TransactionOptions,
) => {
  return SteemTxUtils.sendOperation(
    [CustomJsonUtils.getCustomJsonOperation(json, username, keyType, mainnet)],
    key,
    false,
    options,
  );
};

const getCustomJsonOperation = (
  json: any,
  username: string,
  keyType: KeyType,
  mainnet?: string,
) => {
  return [
    'custom_json',
    {
      id: mainnet ? mainnet : Config.steemEngine.mainnet,
      json: typeof json === 'string' ? json : JSON.stringify(json),
      required_auths: keyType === KeyType.ACTIVE ? [username] : [],
      required_posting_auths: keyType === KeyType.POSTING ? [username] : [],
    },
  ] as CustomJsonOperation;
};

const getCustomJsonTransaction = (
  json: any,
  username: string,
  keyType: KeyType,
  mainnet: string,
) => {
  return SteemTxUtils.createTransaction([
    CustomJsonUtils.getCustomJsonOperation(json, username, keyType, mainnet),
  ]);
};

export const CustomJsonUtils = {
  send,
  getCustomJsonOperation,
  getCustomJsonTransaction,
};
