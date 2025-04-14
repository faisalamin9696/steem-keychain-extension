import { Key, TransactionOptions } from '@interfaces/keys.interface';
import { SteemTxUtils } from '@popup/steem/utils/steem-tx.utils';
import {
  TransferToVestingOperation,
  WithdrawVestingOperation,
} from '@steempro/dsteem';

const powerUp = async (
  from: string,
  to: string,
  amount: string,
  activeKey: Key,
  options?: TransactionOptions,
) => {
  return SteemTxUtils.sendOperation(
    [getPowerUpOperation(from, to, amount)],
    activeKey,
    false,
    options,
  );
};

const powerDown = async (
  username: string,
  amount: string,
  activeKey: Key,
  options?: TransactionOptions,
) => {
  return SteemTxUtils.sendOperation(
    [getPowerDownOperation(username, amount)],
    activeKey,
    false,
    options,
  );
};

const getPowerUpOperation = (from: string, to: string, amount: string) => {
  return [
    'transfer_to_vesting',
    {
      from: from,
      to: to,
      amount: amount,
    },
  ] as TransferToVestingOperation;
};
const getPowerDownOperation = (username: string, amount: string) => {
  return [
    'withdraw_vesting',
    {
      account: username,
      vesting_shares: amount,
    },
  ] as WithdrawVestingOperation;
};

const getPowerUpTransaction = (from: string, to: string, amount: string) => {
  return SteemTxUtils.createTransaction([
    PowerUtils.getPowerUpOperation(from, to, amount),
  ]);
};

const getPowerDownTransaction = (username: string, amount: string) => {
  return SteemTxUtils.createTransaction([
    PowerUtils.getPowerDownOperation(username, amount),
  ]);
};

export const PowerUtils = {
  powerUp,
  powerDown,
  getPowerDownOperation,
  getPowerUpOperation,
  getPowerUpTransaction,
  getPowerDownTransaction,
};
