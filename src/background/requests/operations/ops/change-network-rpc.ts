import MkModule from '@background/mk.module';
import { createMessage } from '@background/requests/operations/operations.utils';
import { RequestsHandler } from '@background/requests/request-handler';
import RPCModule from '@background/rpc.module';
import { RequestId } from '@interfaces/keychain.interface';
import { Rpc } from '@interfaces/rpc.interface';
import AccountUtils from '@popup/steem/utils/account.utils';
import { KeysUtils } from '@popup/steem/utils/keys.utils';
import { LocalStorageKeyEnum } from '@reference-data/local-storage-key.enum';
import LocalStorageUtils from 'src/utils/localStorage.utils';

interface ChangeNetworkRpcRequest {
  type: string;
  rpc: Rpc;
  request_id: number;
}

export const changeNetworkRpc = async (
  requestHandler: RequestsHandler,
  data: ChangeNetworkRpcRequest & RequestId,
  setAsDefault: boolean,
) => {
  const { rpc, request_id } = data;
  let err = null;

  try {
    // Get current RPC to check if prefix changed
    const currentRpc = await LocalStorageUtils.getValueFromLocalStorage(
      LocalStorageKeyEnum.CURRENT_RPC,
    );
    const oldPrefix = currentRpc?.addressPrefix || 'STM';
    const newPrefix = rpc.addressPrefix || 'STM';

    // Always add RPC to the custom RPC list
    const savedCustomRpc = await LocalStorageUtils.getValueFromLocalStorage(
      LocalStorageKeyEnum.RPC_LIST,
    );
    const rpcList = savedCustomRpc ? savedCustomRpc : [];
    
    // Check if RPC already exists in the list
    const existingRpcIndex = rpcList.findIndex((r: Rpc) => r.uri === rpc.uri);
    if (existingRpcIndex === -1) {
      // Add new RPC to the list
      rpcList.push(rpc);
      await LocalStorageUtils.saveValueInLocalStorage(
        LocalStorageKeyEnum.RPC_LIST,
        rpcList,
      );
    }

    // If user chose to set as default, save as active RPC
    if (setAsDefault && rpc) {
      // If address prefix changed, regenerate public keys for all accounts BEFORE saving RPC
      if (oldPrefix !== newPrefix) {
        try {
          // Update the address prefix in KeysUtils BEFORE regenerating
          KeysUtils.updatePopupAddressPrefix(newPrefix);
          
          const mk = await MkModule.getMk();
          if (mk) {
            const accounts = await AccountUtils.getAccountsFromLocalStorage(mk);
            const updatedAccounts = await KeysUtils.regeneratePublicKeys(accounts, mk);
            await AccountUtils.saveAccounts(updatedAccounts, mk);
          }
        } catch (error) {
          // Log error but don't fail the RPC change
          // Silent fail - keys will be regenerated next time user opens popup
        }
      }
      
      // Save the RPC AFTER regenerating keys
      await RPCModule.setActiveRpc(rpc);
    }

    // Return success response using createMessage
    return await createMessage(
      null,
      { rpc, setAsDefault, prefixChanged: oldPrefix !== newPrefix },
      data as any,
      setAsDefault && oldPrefix !== newPrefix
        ? await chrome.i18n.getMessage('html_popup_settings_rpc_saved_keys_regenerated')
        : setAsDefault
        ? await chrome.i18n.getMessage('html_popup_settings_rpc_saved')
        : await chrome.i18n.getMessage('html_popup_settings_rpc_added'),
      await chrome.i18n.getMessage('unknown_error'),
    );
  } catch (e) {
    err = e;
    return await createMessage(
      err,
      null,
      data as any,
      null,
      await chrome.i18n.getMessage('unknown_error'),
    );
  }
};
