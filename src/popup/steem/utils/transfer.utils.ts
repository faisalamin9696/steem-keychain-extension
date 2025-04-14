import { Key, TransactionOptions } from '@interfaces/keys.interface';
import { exchanges } from '@popup/steem/pages/app-container/home/buy-coins/buy-coins-list-item.list';
import { SavingOperationType } from '@popup/steem/pages/app-container/home/savings/savings-operation-type.enum';
import { SteemTxUtils } from '@popup/steem/utils/steem-tx.utils';
import { Transaction, TransferOperation } from '@steempro/dsteem';
import { getPrivateKeysMemoValidationWarning } from '@steempro/steem-keychain-commons';

const getTransferWarning = (
  account: string,
  currency: string,
  memo: any,
  phisingAccounts: any,
  isRecurrent?: boolean,
) => {
  const exchangeWarning = getExchangeValidationWarning(
    account,
    currency,
    memo.length > 0,
    isRecurrent,
  );
  if (exchangeWarning) return exchangeWarning;

  const privateKeyInMemoWarning = getPrivateKeysMemoValidationWarning(memo);
  if (privateKeyInMemoWarning)
    return chrome.i18n.getMessage('popup_warning_private_key_in_memo');

  if (phisingAccounts.includes(account)) {
    return chrome.i18n.getMessage('popup_warning_phishing', [account]);
  }

  return;
};

const getTransferFromToSavingsValidationWarning = (
  account: string,
  operation: SavingOperationType,
) => {
  if (exchanges.map((exchange) => exchange.username).includes(account)) {
    if (operation === SavingOperationType.DEPOSIT) {
      return chrome.i18n.getMessage(
        'popup_html_transfer_to_saving_to_exchange_error',
      );
    } else {
      return chrome.i18n.getMessage(
        'popup_html_transfer_from_saving_to_exchange_error',
      );
    }
  }
};

const getExchangeValidationWarning = (
  account: string,
  currency: string,
  hasMemo: boolean,
  isRecurrent?: boolean,
) => {
  const exchange = exchanges.find((exchange) => exchange.username === account);
  if (!exchange) return;
  if (!exchange.acceptedCoins.includes(currency)) {
    return chrome.i18n.getMessage('popup_warning_exchange_deposit', [currency]);
  }
  if (!hasMemo) return chrome.i18n.getMessage('popup_warning_exchange_memo');
  if (isRecurrent)
    return chrome.i18n.getMessage(
      'popup_html_transfer_recurrent_exchange_warning',
    );
  // if (exchange.account === 'bittrex') {
  //   const info = await CurrencyPricesUtils.getBittrexCurrency(currency);
  //   if (info && !info.IsActive) {
  //     return chrome.i18n.getMessage('popup_warning_exchange_wallet');
  //   }
  // }
  return;
};

const sendTransfer = (
  sender: string,
  receiver: string,
  amount: string,
  memo: string,
  activeKey: Key,
  options?: TransactionOptions,
) => {
  return SteemTxUtils.sendOperation(
    [getTransferOperation(sender, receiver, amount, memo)],
    activeKey,
    true,
    options,
  );
};

const getTransferOperation = (
  sender: string,
  receiver: string,
  amount: string,
  memo: string,
) => {
  return [
    'transfer',
    {
      from: sender,
      to: receiver,
      amount: amount,
      memo: memo,
    },
  ] as TransferOperation;
};

const getTransferTransaction = (
  sender: string,
  receiver: string,
  amount: string,
  memo: string,
): Promise<Transaction> => {
  return SteemTxUtils.createTransaction([
    getTransferOperation(sender, receiver, amount, memo),
  ]);
};

const TransferUtils = {
  getExchangeValidationWarning,
  getTransferFromToSavingsValidationWarning,
  sendTransfer,
  getTransferOperation,
  getTransferTransaction,
  getTransferWarning,
};

export default TransferUtils;
