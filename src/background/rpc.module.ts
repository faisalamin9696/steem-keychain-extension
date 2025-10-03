import { DefaultRpcs } from '@reference-data/default-rpc.list';
import { LocalStorageKeyEnum } from '@reference-data/local-storage-key.enum';
import { config as SteemTxConfig } from '@steempro/steem-tx-js';
import { Rpc } from 'src/interfaces/rpc.interface';
import LocalStorageUtils from 'src/utils/localStorage.utils';

const init = async () => {
  const rpc = await RPCModule.getActiveRpc();
  if (!rpc || rpc.uri === 'DEFAULT') {
    SteemTxConfig.node = DefaultRpcs[0].uri;
    SteemTxConfig.chain_id =
      '0000000000000000000000000000000000000000000000000000000000000000';
  } else {
    SteemTxConfig.node = rpc.uri;
    if (rpc.chainId) {
      SteemTxConfig.chain_id =
        '0000000000000000000000000000000000000000000000000000000000000000';
    }
  }
};

const setActiveRpc = async (rpc: Rpc) => {
  if (!rpc || rpc.uri === 'DEFAULT') {
    SteemTxConfig.node = DefaultRpcs[0].uri;
  } else {
    SteemTxConfig.node = rpc.uri;
    if (rpc.chainId) {
      SteemTxConfig.chain_id = rpc.chainId;
    }
  }
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

const RPCModule = {
  setActiveRpc,
  getActiveRpc,
  init,
};

export default RPCModule;
