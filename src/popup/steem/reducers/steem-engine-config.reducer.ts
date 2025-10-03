import { SteemEngineConfig } from '@interfaces/steem-engine-rpc.interface';
import { ActionPayload } from '@popup/multichain/actions/interfaces';
import { SteemActionType } from '@popup/steem/actions/action-type.enum';
import Config from 'src/config';

const SteemEngineConfigReducer = (
  state: SteemEngineConfig = {
    rpc: Config.steemEngine.rpc,
    mainnet: Config.steemEngine.mainnet,
    accountHistoryApi: Config.steemEngine.accountHistoryApi,
  },
  { type, payload }: ActionPayload<Partial<SteemEngineConfig>>,
): SteemEngineConfig => {
  switch (type) {
    case SteemActionType.HE_SET_ACTIVE_ACCOUNT_HISTORY_API:
      return { ...state, accountHistoryApi: payload?.accountHistoryApi! };
    case SteemActionType.HE_SET_ACTIVE_RPC:
      return { ...state, rpc: payload?.rpc! };
    case SteemActionType.HE_LOAD_CONFIG:
      return {
        ...state,
        rpc: payload?.rpc!,
        accountHistoryApi: payload?.accountHistoryApi!,
      };
    default:
      return state;
  }
};

export default SteemEngineConfigReducer;
