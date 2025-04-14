import { Key, TransactionOptions } from '@interfaces/keys.interface';
import { TokenTransaction } from '@interfaces/tokens.interface';
import { SteemEngineTransactionStatus } from '@interfaces/transaction-status.interface';
import { ErrorUtils } from '@popup/steem/utils/error.utils';
import { SteemTxUtils } from '@popup/steem/utils/steem-tx.utils';
import { SteemEngineConfigUtils } from '@popup/steem/utils/steemengine-config.utils';
import { TokenRequestParams } from '@popup/steem/utils/token-request-params.interface';
import { CustomJsonOperation } from '@steempro/dsteem';
import { KeychainError } from 'src/keychain-error';

const sendOperation = async (
  operations: CustomJsonOperation[],
  key: Key,
  options?: TransactionOptions,
): Promise<SteemEngineTransactionStatus> => {
  const transactionResult =
    await SteemTxUtils.createSignAndBroadcastTransaction(
      operations,
      key,
      options,
    );

  if (transactionResult) {
    if (transactionResult.isUsingMultisig) {
      return {
        tx_id: transactionResult.tx_id,
        broadcasted: false,
        confirmed: false,
        isUsingMultisig: true,
      };
    } else {
      return await SteemEngineUtils.tryConfirmTransaction(
        transactionResult.tx_id,
      );
    }
  } else {
    return {
      broadcasted: false,
      confirmed: false,
      tx_id: '',
    };
  }
};

const tryConfirmTransaction = (
  trxId: string,
): Promise<SteemEngineTransactionStatus> => {
  let result: any;
  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < 20; i++) {
      let res: any = await SteemEngineUtils.getDelayedTransactionInfo(trxId);
      result = res.result;
      if (result !== null) break;
    }

    var error = null;
    if (result && result.logs) {
      var logs = JSON.parse(result.logs);

      if (logs.errors && logs.errors.length > 0) {
        error = logs.errors[0];
        reject(ErrorUtils.parseSteemEngine(error, JSON.parse(result.payload)));
      }
    }
    if (result != null) {
      resolve({ broadcasted: true, confirmed: true, tx_id: trxId });
    } else {
      resolve({ broadcasted: true, confirmed: false, tx_id: trxId });
    }
  });
};

/* istanbul ignore next */
const getDelayedTransactionInfo = (trxID: string) => {
  return new Promise(function (fulfill, reject) {
    setTimeout(async function () {
      const url = `${SteemEngineConfigUtils.getApi()}/blockchain`;
      let resolved = false;
      fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'getTransactionInfo',
          params: {
            txid: trxID,
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      })
        .then((res) => {
          if (res && res.status === 200) {
            resolved = true;
            return res.json();
          }
        })
        .then((res: any) => fulfill(res));

      setTimeout(() => {
        if (!resolved) {
          reject(new KeychainError('html_popup_tokens_timeout'));
        }
      }, 20 * 1000);
    }, 1000);
  });
};

/* istanbul ignore next */
const get = async <T>(
  params: TokenRequestParams,
  timeout: number = 10,
): Promise<T> => {
  // const url = `${HiveEngineConfigUtils.getApi()}/contracts`;
  // return new Promise((resolve, reject) => {
  //   let resolved = false;
  //   fetch(url, {
  //     method: 'POST',
  //     body: JSON.stringify({
  //       jsonrpc: '2.0',
  //       method: 'find',
  //       params,
  //       id: 1,
  //     }),
  //     headers: { 'Content-Type': 'application/json' },
  //   })
  //     .then((res) => {
  //       if (res && res.status === 200) {
  //         resolved = true;
  //         return res.json();
  //       }
  //     })
  //     .then((res: any) => {
  //       resolve(res.result as unknown as T);
  //     });

  //   setTimeout(() => {
  //     if (!resolved) {
  //       reject(new KeychainError('html_popup_tokens_timeout'));
  //     }
  //   }, timeout * 1000);
  // });
  return new Promise((resolve, reject) => {
    resolve([] as unknown as T);
  });
};

/* istanbul ignore next */
const getHistory = async (
  account: string,
  symbol: string,
  offset: number = 0,
  type: string = 'user',
  timeout: number = 10,
): Promise<TokenTransaction[]> => {
  const queryParams = `account=${account}&symbol=${symbol}&offset=${offset}&type=${type}`;

  const url = `${SteemEngineConfigUtils.getAccountHistoryApi()}/accountHistory?${queryParams}`;
  return new Promise((resolve, reject) => {
    let resolved = false;
    fetch(url)
      .then((res) => {
        if (res && res.status === 200) {
          resolved = true;
          return res.json();
        }
      })
      .then((res: any) => {
        resolve(res as unknown as TokenTransaction[]);
      });

    setTimeout(() => {
      if (!resolved) {
        reject(new KeychainError('html_popup_tokens_timeout'));
      }
    }, timeout * 1000);
  });
};

export const SteemEngineUtils = {
  get,
  getDelayedTransactionInfo,
  getHistory,
  sendOperation,
  tryConfirmTransaction,
};
