import { AppThunk } from '@popup/multichain/actions/interfaces';
import { SteemActionType } from '@popup/steem/actions/action-type.enum';
import AccountUtils from '@popup/steem/utils/account.utils';
import { KeysUtils } from '@popup/steem/utils/keys.utils';
import MkUtils from '@popup/steem/utils/mk.utils';
import { SteemTxUtils } from '@popup/steem/utils/steem-tx.utils';
import { BackgroundCommand } from '@reference-data/background-message-key.enum';
import { Rpc } from 'src/interfaces/rpc.interface';

export const setActiveRpc = (rpc: Rpc): AppThunk => async (dispatch, getState) => {
  SteemTxUtils.setRpc(rpc);
  
  const oldPrefix = KeysUtils.getPopupAddressPrefix();
  KeysUtils.updatePopupAddressPrefix(rpc.addressPrefix || 'STM');
  const newPrefix = rpc.addressPrefix || 'STM';
  
  // If address prefix changed, regenerate public keys for all accounts
  if (oldPrefix !== newPrefix) {
    try {
      const mk = await MkUtils.getMkFromLocalStorage();
      if (mk) {
        const accounts = await AccountUtils.getAccountsFromLocalStorage(mk);
        const updatedAccounts = await KeysUtils.regeneratePublicKeys(accounts, mk);
        await AccountUtils.saveAccounts(updatedAccounts, mk);
      }
    } catch (error) {
      //console.warn('Failed to regenerate public keys:', error);
    }
  }
  
  chrome.runtime.sendMessage({
    command: BackgroundCommand.SAVE_RPC,
    value: rpc,
  });
  
  dispatch({
    type: SteemActionType.SET_ACTIVE_RPC,
    payload: rpc,
  });
};
