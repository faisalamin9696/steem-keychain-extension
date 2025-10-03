import { createMessage } from '@background/requests/operations/operations.utils';
import { RequestsHandler } from '@background/requests/request-handler';
import { RequestConvert, RequestId } from '@interfaces/keychain.interface';
import { TransactionOptions } from '@interfaces/keys.interface';
import { ConversionType } from '@popup/steem/pages/app-container/home/conversion/conversion-type.enum';
import { ConversionUtils } from '@popup/steem/utils/conversion.utils';
import CurrencyUtils, {
  BaseCurrencies,
} from '@popup/steem/utils/currency.utils';
import { KeysUtils } from '@popup/steem/utils/keys.utils';
import { KeychainError } from 'src/keychain-error';
import Logger from 'src/utils/logger.utils';

export const convert = async (
  requestHandler: RequestsHandler,
  data: RequestConvert & RequestId,
  options?: TransactionOptions,
) => {
  let result, err, err_message;
  const { username, amount, collaterized } = data;
  const key = requestHandler.data.key;
  const rpc = requestHandler.data.rpc;
  const requestId = await getNextRequestID(username);
  const conversionType = ConversionType.CONVERT_SBD_TO_STEEM;
  const currency = collaterized ? BaseCurrencies.STEEM : BaseCurrencies.SBD;
  const amountS = `${amount} ${CurrencyUtils.getCurrencyLabel(
    currency,
    rpc!.testnet,
  )}`;
  const successMessage = collaterized
    ? 'bgd_ops_convert_collaterized'
    : 'bgd_ops_convert';

  try {
    switch (KeysUtils.getKeyType(key!)) {
      default: {
        result = await ConversionUtils.sendConvert(
          username,
          requestId,
          amountS,
          conversionType,
          key!,
          options,
        );
        break;
      }
    }
  } catch (e: any) {
    Logger.error(e);
    err = (e as KeychainError).trace || e;
    err_message = await chrome.i18n.getMessage(
      (e as KeychainError).message,
      (e as KeychainError).messageParams,
    );
  } finally {
    const message = await createMessage(
      err,
      result,
      data,
      await chrome.i18n.getMessage(successMessage, [amount, username]),
      err_message,
    );
    return message;
  }
};

// export const convert = async (
//   requestHandler: RequestsHandler,
//   data: RequestConvert & RequestId,
// ) => {
//   const { username, amount, collaterized } = data;
//   const key = requestHandler.data.key;
//   const rpc = requestHandler.data.rpc;
//   const requestId = await getNextRequestID(username);
//   let result, err, err_message;
//   if (collaterized) {
//     try {
//       const amountS = `${amount} ${CurrencyUtils.getCurrencyLabel(
//         'SBD',
//         rpc!.testnet,
//       )}`;
//       result = await ConversionUtils.sendConvert(
//         username,
//         requestId,
//         amountS,
//         ConversionType.CONVERT_STEEM_TO_SBD,
//         key!,
//       );
//     } catch (e) {
//       Logger.error(e);
//       err = (e as KeychainError).trace || e;
//       err_message = await chrome.i18n.getMessage(
//         (e as KeychainError).message,
//         (e as KeychainError).messageParams,
//       );
//     } finally {
//       const message = createMessage(
//         err,
//         result,
//         data,
//         await chrome.i18n.getMessage('bgd_ops_convert_collaterized', [
//           amount,
//           username,
//         ]),
//         err_message,
//       );
//       return message;
//     }
//   } else {
//     try {
//       const amountS = `${amount} ${CurrencyUtils.getCurrencyLabel(
//         'SBD',
//         rpc!.testnet,
//       )}`;
//       result = await ConversionUtils.sendConvert(
//         username,
//         requestId,
//         amountS,
//         ConversionType.CONVERT_SBD_TO_STEEM,
//         key!,
//       );
//     } catch (e) {
//       Logger.error(e);
//       err = (e as KeychainError).trace || e;
//       err_message = await chrome.i18n.getMessage(
//         (e as KeychainError).message,
//         (e as KeychainError).messageParams,
//       );
//     } finally {
//       const message = createMessage(
//         err,
//         result,
//         data,
//         await chrome.i18n.getMessage('bgd_ops_convert', [amount, username]),
//         err_message,
//       );
//       return message;
//     }
//   }
// };

const getNextRequestID = async (username: string) => {
  let conversions = await ConversionUtils.getConversionRequests(username);

  return Math.max(...conversions.map((conv) => conv.requestid), 0) + 1;
};
