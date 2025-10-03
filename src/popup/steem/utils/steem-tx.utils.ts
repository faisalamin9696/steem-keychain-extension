import { BackgroundMessage } from '@background/background-message.interface';
import { MultisigModule } from '@background/multisig.module';
import { Key, TransactionOptions } from '@interfaces/keys.interface';
import { MultisigRequestSignatures } from '@interfaces/multisig.interface';
import { Rpc } from '@interfaces/rpc.interface';
import {
  SteemTxBroadcastErrorResponse,
  SteemTxBroadcastResult,
  SteemTxBroadcastSuccessResponse,
  TransactionResult,
} from '@interfaces/steem-tx.interface';
import AccountUtils from '@popup/steem/utils/account.utils';
import { ErrorUtils } from '@popup/steem/utils/error.utils';
import { KeysUtils } from '@popup/steem/utils/keys.utils';
import MkUtils from '@popup/steem/utils/mk.utils';
import { MultisigUtils } from '@popup/steem/utils/multisig.utils';
import { BackgroundCommand } from '@reference-data/background-message-key.enum';
import { DefaultRpcs } from '@reference-data/default-rpc.list';
import {
  ExtendedAccount,
  Operation,
  Transaction,
  Client,
  PrivateKey as dPrivateKey,
} from '@steempro/dsteem';
import { sleep } from '@steempro/dsteem/lib/utils';
import {
  KeychainKeyTypes,
  KeychainKeyTypesLC,
} from '@steempro/steem-keychain-commons';
import {
  PrivateKey,
  Transaction as SteemTransaction,
  config as SteemTxConfig,
  call,
} from '@steempro/steem-tx-js';
import Config from 'src/config';
import { KeychainError } from 'src/keychain-error';
import Logger from 'src/utils/logger.utils';

const MINUTE = 60;

// default values that are already defined in config.js

const setRpc = async (rpc: Rpc) => {
  SteemTxConfig.node = rpc.uri === 'DEFAULT' ? DefaultRpcs[0].uri : rpc.uri;
  if (rpc.chainId) {
    SteemTxConfig.chain_id = rpc.chainId;
  }
};
const sendOperation = async (
  operations: Operation[],
  key: Key,
  confirmation?: boolean,
  options?: TransactionOptions,
): Promise<TransactionResult | null> => {
  operations.forEach((operation) => {
    const expiration = operation[1]?.expiration;
    if (expiration && typeof expiration === 'number') {
      operation[1].expiration = new Date(expiration * 1000)
        .toISOString()
        .split('.')[0];
    }
  });

  const transactionResult =
    await SteemTxUtils.createSignAndBroadcastTransaction(
      operations,
      key,
      options,
    );

  if (transactionResult) {
    if (transactionResult?.isUsingMultisig) {
      return {
        id: transactionResult.tx_id,
        tx_id: transactionResult.tx_id,
        isUsingMultisig: true,
      };
    } else {
      return {
        id: transactionResult.tx_id,
        tx_id: transactionResult.tx_id,
        confirmed: confirmation
          ? await confirmTransaction(transactionResult.tx_id)
          : false,
      } as TransactionResult;
    }
  } else {
    return null;
  }
};

const createTransaction = async (operations: Operation[]) => {
  let steemTransaction = new SteemTransaction();
  const tx = await steemTransaction.create(
    operations,
    Config.transactions.expirationTimeInMinutes * MINUTE,
  );
  Logger.log(`length of transaction => ${JSON.stringify(tx).length}`);
  return tx;
};

const createSignAndBroadcastTransaction = async (
  operations: Operation[],
  key: Key,
  options?: TransactionOptions,
): Promise<SteemTxBroadcastResult | undefined> => {
  let steemTransaction = new SteemTransaction();
  let transaction = await steemTransaction.create(
    operations,
    Config.transactions.expirationTimeInMinutes * MINUTE,
  );

  const username = MultisigUtils.getUsernameFromTransaction(transaction);
  const transactionAccount = await AccountUtils.getExtendedAccount(
    username!.toString(),
  );

  const localAccounts = await AccountUtils.getAccountsFromLocalStorage(
    await MkUtils.getMkFromLocalStorage(),
  );

  const localAccount = localAccounts.find(
    (account) => account.keys.posting === key || account.keys.active === key,
  );

  const initiatorAccount = await AccountUtils.getExtendedAccount(
    localAccount?.name!,
  );

  const method = await KeysUtils.isKeyActiveOrPosting(key, initiatorAccount);

  const isUsingMultisig = KeysUtils.isUsingMultisig(
    key,
    transactionAccount,
    initiatorAccount.name,
    method.toLowerCase() as KeychainKeyTypesLC,
  );

  if (isUsingMultisig) {
    transaction = await steemTransaction.create(
      operations,
      Config.transactions.multisigExpirationTimeInMinutes * MINUTE,
    );
    const signedTransaction = await signTransaction(transaction, key);
    if (!signedTransaction) {
      throw new Error('html_popup_error_while_signing_transaction');
    }
    let response: any;
    try {
      if (document) {
        response = await useMultisig(
          transaction,
          key,
          initiatorAccount,
          transactionAccount,
          method,
          signedTransaction?.signatures[0],
          options,
        );
        return {
          status: response as string,
          tx_id: '',
          isUsingMultisig: true,
        } as SteemTxBroadcastResult;
      }
    } catch (err) {
      response = await useMultisigThroughBackgroundOnly(
        transaction,
        key,
        initiatorAccount,
        transactionAccount,
        method,
        signedTransaction?.signatures[0],
        options,
      );
      if (response.error) {
        throw new KeychainError(response.error.message);
      } else {
        return {
          status: 'ok' as string,
          tx_id: response,
          isUsingMultisig: true,
        } as SteemTxBroadcastResult;
      }
    }
  } else {
    try {
      const privateKey = PrivateKey.fromString(key!.toString());

      steemTransaction.sign(privateKey);
    } catch (err) {
      Logger.error(err);
      throw new Error('html_popup_error_while_signing_transaction');
    }
  }
  let response;
  try {
    const client = new Client(SteemTxConfig.node, { ...SteemTxConfig });
    const privateKey = dPrivateKey.fromString(key!.toString());

    const signature = client.broadcast.sign(
      steemTransaction.transaction,
      privateKey,
    );

    steemTransaction.addSignature(signature.signatures.toString());

    response = await steemTransaction.broadcast();

    if ((response as SteemTxBroadcastSuccessResponse).result) {
      const result = (response as SteemTxBroadcastSuccessResponse).result;
      return {
        ...result,
      };
    }
  } catch (err) {
    Logger.error(err);
    throw new Error('html_popup_error_while_broadcasting');
  }
  response = response as SteemTxBroadcastErrorResponse;
  if (response.error) {
    Logger.error('Error during broadcast', response.error);
    throw ErrorUtils.parse(response.error);
  }
};
/* istanbul ignore next */
const confirmTransaction = async (transactionId: string) => {
  if (transactionId) {
    Logger.info('Transaction confirmed');
    return true;
  } else {
    Logger.error(`Transaction failed`);
    return false;
  }
};

const signTransaction = async (tx: Transaction, key: Key) => {
  const steemTransaction = new SteemTransaction(tx);
  try {
    const client = new Client(SteemTxConfig.node, { ...SteemTxConfig });
    const dprivateKey = dPrivateKey.fromString(key!.toString());
    const signature = client.broadcast.sign(
      steemTransaction.transaction,
      dprivateKey,
    );
    const privateKey = PrivateKey.fromString(key!.toString());
    steemTransaction.addSignature(signature.signatures.toString());
    return steemTransaction.sign(privateKey);
  } catch (err) {
    Logger.error(err);
    throw new KeychainError('html_popup_error_while_signing_transaction');
  }
};

const broadcastAndConfirmTransactionWithSignature = async (
  transaction: Transaction,
  signature: string | string[],
  confirmation?: boolean,
): Promise<TransactionResult | undefined> => {
  let steemTransaction = new SteemTransaction(transaction);
  if (typeof signature === 'string') {
    steemTransaction.addSignature(signature);
  } else {
    for (const si of signature) {
      steemTransaction.addSignature(si);
    }
  }
  let response;
  try {
    Logger.log(steemTransaction);
    response = await steemTransaction.broadcast();
    if ((response as SteemTxBroadcastSuccessResponse).result) {
      const transactionResult: SteemTxBroadcastResult = (
        response as SteemTxBroadcastSuccessResponse
      ).result;
      return {
        id: transactionResult.tx_id,
        tx_id: transactionResult.tx_id,
        confirmed: confirmation
          ? await confirmTransaction(transactionResult.tx_id)
          : false,
      } as TransactionResult;
    }
  } catch (err) {
    Logger.error(err);
    throw new Error('html_popup_error_while_broadcasting');
  }
  response = response as SteemTxBroadcastErrorResponse;
  if (response.error) {
    Logger.error('Error during broadcast', response.error);
    throw ErrorUtils.parse(response.error);
  }
};
/* istanbul ignore next */
const getData = async (
  method: string,
  params: any[] | object,
  key?: string,
) => {
  const response = await call(method, params, 3000);
  if (response?.result) {
    return key ? response.result[key] : response.result;
  } else {
    if (window && window.document) {
      import('src/utils/rpc-switcher.utils').then(({ useWorkingRPC }) => {
        useWorkingRPC();
      });
    }
    throw new Error(
      `Error while retrieving data from ${method} : ${JSON.stringify(
        response.error,
      )}`,
    );
  }
};

const useMultisigThroughBackgroundOnly = async (
  transaction: Transaction,
  key: Key,
  initiatorAccount: ExtendedAccount,
  transactionAccount: ExtendedAccount,
  method: KeychainKeyTypes,
  signature: string,
  options?: TransactionOptions,
) => {
  return MultisigModule.requestSignatures(
    {
      transaction: transaction,
      key: key,
      initiatorAccount: initiatorAccount,
      transactionAccount: transactionAccount,
      method: method,
      signature: signature,
      options: options,
    } as MultisigRequestSignatures,
    false,
  );
};

const useMultisig = async (
  transaction: Transaction,
  key: Key,
  initiatorAccount: ExtendedAccount,
  transactionAccount: ExtendedAccount,
  method: KeychainKeyTypes,
  signature: string,
  options?: TransactionOptions,
) => {
  return new Promise((resolve, reject) => {
    const handleResponseFromBackground = (
      backgroundMessage: BackgroundMessage,
      sender: chrome.runtime.MessageSender,
      sendResp: (response?: any) => void,
    ) => {
      if (
        backgroundMessage.command ===
        BackgroundCommand.MULTISIG_REQUEST_SIGNATURES_RESPONSE
      ) {
        chrome.runtime.onMessage.removeListener(handleResponseFromBackground);
        resolve(backgroundMessage.value);
      }
    };
    chrome.runtime.onMessage.addListener(handleResponseFromBackground);

    chrome.runtime.sendMessage({
      command: BackgroundCommand.MULTISIG_REQUEST_SIGNATURES,
      value: {
        transaction: transaction,
        key: key,
        initiatorAccount: initiatorAccount,
        transactionAccount: transactionAccount,
        method: method,
        signature: signature,
        options: options,
      } as MultisigRequestSignatures,
    } as BackgroundMessage);
  });
};

const getTransaction = async (txId: string) => {
  await sleep(3000);
  return SteemTxUtils.getData('condenser_api.get_transaction', [txId]);
};

export const SteemTxUtils = {
  getTransaction,
  sendOperation,
  createSignAndBroadcastTransaction,
  // confirmTransaction,
  getData,
  setRpc,
  createTransaction,
  signTransaction,
  broadcastAndConfirmTransactionWithSignature,
};
