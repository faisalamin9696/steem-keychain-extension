import { createMessage } from '@background/requests/operations/operations.utils';
import { RequestsHandler } from '@background/requests/request-handler';
import {
  KeychainKeyTypesLC,
  RequestId,
  RequestProxy,
} from '@interfaces/keychain.interface';
import { TransactionOptions } from '@interfaces/keys.interface';
import { KeysUtils } from '@popup/steem/utils/keys.utils';
import ProxyUtils from '@popup/steem/utils/proxy.utils';
import { KeychainError } from 'src/keychain-error';
import Logger from 'src/utils/logger.utils';

export const broadcastProxy = async (
  requestHandler: RequestsHandler,
  data: RequestProxy & RequestId,
  options?: TransactionOptions,
) => {
  let result, err, err_message;

  try {
    let key = requestHandler.data.key;
    if (!key) {
      [key] = (await requestHandler.getUserKeyPair(
        data.username!,
        KeychainKeyTypesLC.active,
      )) as [string, string];
    }

    switch (KeysUtils.getKeyType(key!)) {
      default: {
        result = await ProxyUtils.setAsProxy(
          data.proxy,
          data.username!,
          key,
          options,
        );
        break;
      }
    }
  } catch (e) {
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
      data.proxy.length
        ? await chrome.i18n.getMessage('popup_success_proxy', [data.proxy])
        : await chrome.i18n.getMessage('bgd_ops_unproxy'),
      err_message,
    );
    return message;
  }
};
