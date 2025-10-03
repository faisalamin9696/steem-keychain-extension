import { SteemEngineConfig } from '@interfaces/steem-engine-rpc.interface';
import { AppThunk } from '@popup/multichain/actions/interfaces';
import { SteemActionType } from '@popup/steem/actions/action-type.enum';
import { SteemEngineConfigUtils } from '@popup/steem/utils/steemengine-config.utils';
import { LocalStorageKeyEnum } from '@reference-data/local-storage-key.enum';
import LocalStorageUtils from 'src/utils/localStorage.utils';

export const setHEActiveRpc = (rpc: string) => {
  SteemEngineConfigUtils.setActiveApi(rpc);
  return {
    type: SteemActionType.HE_SET_ACTIVE_RPC,
    payload: { rpc: rpc },
  };
};

export const setHEActiveAccountHistoryApi = (api: string) => {
  SteemEngineConfigUtils.setActiveAccountHistoryApi(api);
  return {
    type: SteemActionType.HE_SET_ACTIVE_ACCOUNT_HISTORY_API,
    payload: { accountHistoryApi: api },
  };
};

export const initSteemEngineConfigFromStorage =
  (): AppThunk => async (dispatch) => {
    const config = (await LocalStorageUtils.getValueFromLocalStorage(
      LocalStorageKeyEnum.STEEM_ENGINE_ACTIVE_CONFIG,
    )) as SteemEngineConfig;
    if (config) {
      SteemEngineConfigUtils.setActiveAccountHistoryApi(
        config.accountHistoryApi,
      );
      SteemEngineConfigUtils.setActiveApi(config.rpc);
      dispatch({
        type: SteemActionType.HE_LOAD_CONFIG,
        payload: config,
      });
    }
  };
