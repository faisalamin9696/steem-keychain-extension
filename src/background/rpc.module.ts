import { DefaultRpcs } from '@reference-data/default-rpc.list';
import { LocalStorageKeyEnum } from '@reference-data/local-storage-key.enum';
import { config as HiveTxConfig } from '@steempro/steem-tx-js';
import { Rpc } from 'src/interfaces/rpc.interface';
import LocalStorageUtils from 'src/utils/localStorage.utils';

let _currentAddressPrefix: string = 'STM';

(async () => {
  const rpc = await LocalStorageUtils.getValueFromLocalStorage(
    LocalStorageKeyEnum.CURRENT_RPC,
  );
  if (rpc?.addressPrefix) {
    _currentAddressPrefix = rpc.addressPrefix;
  }
})();

const init = async () => {
  const rpc = await RPCModule.getActiveRpc();
  if (!rpc || rpc.uri === 'DEFAULT') {
    HiveTxConfig.node = DefaultRpcs[0].uri;
    HiveTxConfig.chain_id =
      '0000000000000000000000000000000000000000000000000000000000000000';
    _currentAddressPrefix = 'STM';
  } else {
    HiveTxConfig.node = rpc.uri;
    if (rpc.chainId) {
      HiveTxConfig.chain_id =
        rpc.chainId;
    }
    if (rpc.addressPrefix) {
      HiveTxConfig.address_prefix = rpc.addressPrefix;
    }
    _currentAddressPrefix = rpc.addressPrefix || 'STM';
  }
};

const setActiveRpc = async (rpc: Rpc) => {
  if (!rpc || rpc.uri === 'DEFAULT') {
    HiveTxConfig.node = DefaultRpcs[0].uri;
  } else {
    HiveTxConfig.node = rpc.uri;
    if (rpc.chainId) {
      HiveTxConfig.chain_id = rpc.chainId;
    }
    if (rpc.addressPrefix) {
      HiveTxConfig.address_prefix = rpc.addressPrefix;
    }
  }
  _currentAddressPrefix = rpc.addressPrefix || 'STM'; 
 await LocalStorageUtils.saveValueInLocalStorage(
    LocalStorageKeyEnum.CURRENT_RPC,
    rpc,
  );
};

const getActiveRpc = async (): Promise<Rpc> => {
  return await LocalStorageUtils.getValueFromLocalStorage(
    LocalStorageKeyEnum.CURRENT_RPC,
  );
};

const getCurrentAddressPrefix = (): string => {
  return _currentAddressPrefix;
};

const getCurrentAddressPrefixFromStorage = async (): Promise<string> => {
  const rpc = await LocalStorageUtils.getValueFromLocalStorage(
    LocalStorageKeyEnum.CURRENT_RPC,
  );
  return rpc?.addressPrefix || 'STM';
};

const RPCModule = {
  setActiveRpc,
  getActiveRpc,
  init,
  getCurrentAddressPrefix,
  getCurrentAddressPrefixFromStorage
};

export default RPCModule;
