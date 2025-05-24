import { createMessage } from '@background/requests/operations/operations.utils';
import { RequestsHandler } from '@background/requests/request-handler';
import {
  KeychainKeyTypesLC,
  RequestId,
  RequestWitnessVote,
} from '@interfaces/keychain.interface';
import { TransactionOptions } from '@interfaces/keys.interface';
import { Witness } from '@interfaces/witness.interface';
import { KeysUtils } from '@popup/steem/utils/keys.utils';
import WitnessUtils from '@popup/steem/utils/witness.utils';
import { KeychainError } from 'src/keychain-error';

export const broadcastWitnessVote = async (
  requestHandler: RequestsHandler,
  data: RequestWitnessVote & RequestId,
  options?: TransactionOptions,
) => {
  let result,
    err,
    err_message = null;

  try {
    let key = requestHandler.data.key;
    if (!key) {
      [key] = await requestHandler.getUserKeyPair(
        data.username!,
        KeychainKeyTypesLC.active,
      ) as [string, string];
    }

    switch (KeysUtils.getKeyType(key!)) {
      default: {
        result = await WitnessUtils.updateWitnessVote(
          data.username!,
          { owner: data.witness } as Witness,
          data.vote,
          key,
          options,
        );
        break;
      }
    }
  } catch (e: any) {
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
      data.vote
        ? await chrome.i18n.getMessage('bgd_ops_witness_voted', [data.witness])
        : await chrome.i18n.getMessage('bgd_ops_witness_unvoted', [
            data.witness,
          ]),
      err_message,
    );
    return message;
  }
};
