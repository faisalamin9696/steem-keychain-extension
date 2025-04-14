import { ActiveAccount } from '@interfaces/active-account.interface';
import { Key, TransactionOptions } from '@interfaces/keys.interface';
import { SteemTxUtils } from '@popup/steem/utils/steem-tx.utils';
import {
  Asset,
  CancelTransferFromSavingsOperation,
  TransferFromSavingsOperation,
  TransferToSavingsOperation,
} from '@steempro/dsteem';
import Logger from 'src/utils/logger.utils';
import { Asset as CommonAsset } from '@steempro/steem-keychain-commons';


/* istanbul ignore next */
const deposit = async (
  amount: string,
  receiver: string,
  username: string,
  activeKey: Key,
  options?: TransactionOptions,
) => {
  return SteemTxUtils.sendOperation(
    [await getDepositOperation(username, receiver, amount)],
    activeKey,
    false,
    options,
  );
};
/* istanbul ignore next */
const withdraw = async (
  amount: string,
  to: string,
  username: string,
  activeKey: Key,
  options?: TransactionOptions,
) => {
  return SteemTxUtils.sendOperation(
    [await getWithdrawOperation(username, to, amount)],
    activeKey,
    false,
    options,
  );
};
/* istanbul ignore next */
const getWithdrawOperation = async (
  from: string,
  to: string,
  amount: string,
) => {
  return [
    'transfer_from_savings',
    {
      amount: amount,
      from: from,
      memo: '',
      request_id: await SavingsUtils.getRequestId(from),
      to,
    },
  ] as TransferFromSavingsOperation;
};
/* istanbul ignore next */
const getDepositOperation = async (
  from: string,
  to: string,
  amount: string,
) => {
  return [
    'transfer_to_savings',
    {
      amount: amount,
      from: from,
      memo: '',
      request_id: await SavingsUtils.getRequestId(from),
      to,
    },
  ] as TransferToSavingsOperation;
};

const getRequestId = async (username: string) => {
  const savings = await SteemTxUtils.getData(
    'condenser_api.get_savings_withdraw_from',
    [username],
  );
  return Math.max(...savings.map((e: any) => e.request_id), 0) + 1;
};
/* istanbul ignore next */
const getSavingsWithdrawals = async (username: string) => {
  return await SteemTxUtils.getData('condenser_api.get_savings_withdraw_from', [
    username,
  ]);
};
/* istanbul ignore next */
const getCancelTransferFromSavingsOperation = (
  username: string,
  request_id: number,
) => {
  return [
    'cancel_transfer_from_savings',
    {
      from: username,
      request_id,
    },
  ] as CancelTransferFromSavingsOperation;
};
/* istanbul ignore next */
const cancelCurrentWithdrawSaving = async (
  username: string,
  request_id: number,
  activeKey: Key,
  options?: TransactionOptions,
) => {
  return await SteemTxUtils.sendOperation(
    [SavingsUtils.getCancelTransferFromSavingsOperation(username, request_id)],
    activeKey,
    false,
    options,
  );
};

/* istanbul ignore next */
const hasBalance = (balance: string | Asset, greaterOrEqualTo: number) => {
  return typeof balance === 'string'
    ? CommonAsset.fromString(balance as string).amount >= greaterOrEqualTo
    : balance.amount >= greaterOrEqualTo;
};

const claimSavings = async (
  activeAccount: ActiveAccount,
  options?: TransactionOptions,
) => {
  const { sbd_balance, savings_sbd_balance } = activeAccount.account;
  const hasSbd = hasBalance(sbd_balance, 0.001);
  const hasSavings = hasBalance(savings_sbd_balance, 0.001);
  if (hasSbd) {
    return SavingsUtils.deposit(
      '0.001 SBD',
      activeAccount.name!,
      activeAccount.name!,
      activeAccount.keys.active!,
      options,
    );
  } else if (hasSavings) {
    return SavingsUtils.withdraw(
      '0.001 SBD',
      activeAccount.name!,
      activeAccount.name!,
      activeAccount.keys.active!,
      options,
    );
  } else {
    Logger.error(
      `@${activeAccount.name} has no SBD to deposit or savings to withdraw`,
    );
    return false;
  }
};

export const SavingsUtils = {
  getWithdrawOperation,
  getDepositOperation,
  withdraw,
  deposit,
  getRequestId,
  hasBalance,
  claimSavings,
  getSavingsWithdrawals,
  getCancelTransferFromSavingsOperation,
  cancelCurrentWithdrawSaving,
};
