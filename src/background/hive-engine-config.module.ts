import { SteemEngineConfig } from '@interfaces/steem-engine-rpc.interface';
import { LocalStorageKeyEnum } from '@reference-data/local-storage-key.enum';
import LocalStorageUtils from 'src/utils/localStorage.utils';

const getActiveRpc = async () => {
  return (await getActiveConfig()).rpc;
};

const getActiveAccountHistoryApi = async () => {
  return (await getActiveConfig()).accountHistoryApi;
};

const getActiveMainnet = async () => {
  return (await getActiveConfig()).mainnet;
};

const getActiveConfig = async (): Promise<SteemEngineConfig> => {
  return await LocalStorageUtils.getValueFromLocalStorage(
    LocalStorageKeyEnum.STEEM_ENGINE_ACTIVE_CONFIG,
  );
};

export const BgdSteemEngineConfigModule = {
  getActiveConfig,
  getActiveMainnet,
  getActiveRpc,
  getActiveAccountHistoryApi,
};
