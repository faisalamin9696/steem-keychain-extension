import { fetchSds } from '@api/sds';
import {
  ClaimAccount,
  ClaimReward,
  Convert,
  CreateAccount,
  CreateClaimedAccount,
  Delegation,
  DepositSavings,
  FillConvert,
  PowerDown,
  PowerUp,
  ProducerReward,
  ReceivedInterests,
  SdsTransaction,
  StartWithdrawSavings,
  Transaction,
  Transfer,
  WithdrawSavings,
} from '@interfaces/transaction.interface';
import SteemUtils from '@popup/steem/utils/steem.utils';
import { DynamicGlobalProperties } from '@steempro/dsteem';
import moment from 'moment';
import { KeychainError } from 'src/keychain-error';
import FormatUtils from 'src/utils/format.utils';
import Logger from 'src/utils/logger.utils';

export const NB_TRANSACTION_FETCHED = 10000;
export const HAS_IN_OUT_TRANSACTIONS = ['transfer', 'delegate_vesting_shares'];
export const TRANSFER_TYPE_TRANSACTIONS = [
  'transfer',
  'fill_reccurent_transfer',
  'recurrent_transfer',
];

export const CONVERT_TYPE_TRANSACTIONS = [
  'convert',
  'fill_collateralized_convert_request',
  'fill_convert_request',
  'collateralized_convert',
];

const getAccountTransactions = async (
  accountName: string,
  start: number,
  globals: DynamicGlobalProperties,
  memoKey?: string,
): Promise<[Transaction[], number]> => {
  try {
    let limit = 1000;

    if (limit <= 0) return [[], 0];

    const transactionsFromBlockchain = await TransactionUtils.getTransactions(
      accountName,
      start,
      limit,
    );
    const transactions = transactionsFromBlockchain
      .map((e: SdsTransaction) => {
        let specificTransaction = null;
        switch (e.op[0]) {
          case 'transfer': {
            specificTransaction = e.op[1] as Transfer;
            specificTransaction = decodeMemoIfNeeded(
              specificTransaction,
              memoKey!,
            );
            break;
          }

          case 'claim_reward_balance': {
            specificTransaction = e.op[1] as ClaimReward;
            specificTransaction.sbd = e.op[1].reward_sbd;
            specificTransaction.steem = e.op[1].reward_steem;
            specificTransaction.sp = `${FormatUtils.toSP(
              e.op[1].reward_vests,
              globals,
            ).toFixed(3)} SP`;
            break;
          }
          case 'delegate_vesting_shares': {
            specificTransaction = e.op[1] as Delegation;
            specificTransaction.amount = `${FormatUtils.toSP(
              e.op[1].vesting_shares,
              globals,
            ).toFixed(3)} SP`;
            break;
          }
          case 'transfer_to_vesting': {
            specificTransaction = e.op[1] as PowerUp;
            specificTransaction.type = 'power_up_down';
            specificTransaction.subType = 'transfer_to_vesting';
            break;
          }
          case 'withdraw_vesting': {
            specificTransaction = e.op[1] as PowerDown;
            specificTransaction.type = 'power_up_down';
            specificTransaction.subType = 'withdraw_vesting';
            specificTransaction.amount = `${FormatUtils.toSP(
              e.op[1].vesting_shares,
              globals,
            ).toFixed(3)} SP`;
            break;
          }
          case 'interest': {
            specificTransaction = e.op[1] as ReceivedInterests;
            specificTransaction.type = 'savings';
            specificTransaction.subType = 'interest';
            break;
          }
          case 'producer_reward': {
            specificTransaction = e.op[1] as ProducerReward;
            specificTransaction.type = 'producer_reward';
            break;
          }
          case 'transfer_to_savings': {
            specificTransaction = e.op[1] as DepositSavings;
            specificTransaction.type = 'savings';
            specificTransaction.subType = 'transfer_to_savings';
            break;
          }
          case 'transfer_from_savings': {
            specificTransaction = e.op[1] as StartWithdrawSavings;
            specificTransaction.type = 'savings';
            specificTransaction.subType = 'transfer_from_savings';
            break;
          }
          case 'fill_transfer_from_savings': {
            specificTransaction = e.op[1] as WithdrawSavings;
            specificTransaction.type = 'savings';
            specificTransaction.subType = 'fill_transfer_from_savings';
            break;
          }
          case 'claim_account': {
            specificTransaction = e.op[1] as ClaimAccount;
            break;
          }
          case 'convert': {
            specificTransaction = e.op[1] as Convert;
            specificTransaction.type = 'convert';
            specificTransaction.subType = 'convert';
            break;
          }
          case 'fill_convert_request': {
            specificTransaction = e.op[1] as FillConvert;
            specificTransaction.type = 'convert';
            specificTransaction.subType = 'fill_convert_request';
            break;
          }
          case 'create_claimed_account': {
            specificTransaction = e.op[1] as CreateClaimedAccount;
            break;
          }
          case 'account_create': {
            specificTransaction = e.op[1] as CreateAccount;
            break;
          }
        }
        const tr: Transaction = {
          ...specificTransaction,
          type: specificTransaction?.type ?? e.op[0],
          timestamp: moment(e.time * 1000)
            .toISOString()
            .split('.')[0],
          key: `${accountName}!${e.id}`,
          index: e.id,
          txId: e.id.toString(),
          blockNumber: e.block_num,
          url: `https://steemdb.io/block/${e.block_num}`,
          last: false,
          lastFetched: false,
        };
        return tr;
      })
      .sort(
        (a: any, b: any) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
    if (start - NB_TRANSACTION_FETCHED < 0 && transactions.length > 1) {
      transactions[transactions.length - 1].last = true;
    }

    if (
      start &&
      Math.min(NB_TRANSACTION_FETCHED, start) !== NB_TRANSACTION_FETCHED &&
      transactions.length > 1
    ) {
      transactions[transactions.length - 1].lastFetched = true;
    }
    return [transactions, start];
  } catch (e) {
    Logger.error(e, e);
    return getAccountTransactions(
      accountName,
      (e as any).jse_info.stack[0].data.sequence - 1,
      globals,
      memoKey,
    );
  }
};

const getLastTransaction = async (accountName: string) => {
  const transactionsFromBlockchain = await TransactionUtils.getTransactions(
    accountName,
    -1,
    1,
  );

  return transactionsFromBlockchain.length > 0
    ? transactionsFromBlockchain[0]?.id
    : -1;
};

const getTransactions = (account: string, start: number, limit: number) => {
  return fetchSds<SdsTransaction[]>(
    `/account_history_api/getHistoryFromStartId/${account}/${start}/${limit}`,
  );
  // return SteemTxUtils.getData('condenser_api.get_account_history', [
  //   account,
  //   start,
  //   limit,
  // ]);
};

const decodeMemoIfNeeded = (transfer: Transfer, memoKey: string) => {
  const { memo } = transfer;
  if (memo[0] === '#') {
    if (memoKey) {
      try {
        const decodedMemo = SteemUtils.decodeMemo(memo, memoKey);
        transfer.memo = decodedMemo.substring(1);
      } catch (e) {
        if (e instanceof KeychainError) {
          transfer.memo = chrome.i18n.getMessage(
            'decode_with_memo_key_in_ledger',
          );
        }
        Logger.error('Error while decoding', '');
      }
    } else {
      transfer.memo = chrome.i18n.getMessage('popup_accounts_add_memo');
    }
  }
  return transfer;
};

const getExpirationTime = () => {
  return new Date(Date.now() + 60 * 1000).toISOString().slice(0, -5);
};

const TransactionUtils = {
  getAccountTransactions,
  getLastTransaction,
  decodeMemoIfNeeded,
  getExpirationTime,
  getTransactions,
};

export default TransactionUtils;
