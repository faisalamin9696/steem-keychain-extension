import { Rpc } from '@interfaces/rpc.interface';
import { store } from '@popup/multichain/store';
import { setActiveRpc } from '@popup/steem/actions/active-rpc.actions';
import {
  setDisplayChangeRpcPopup,
  setSwitchToRpc,
} from '@popup/steem/actions/rpc-switcher';
import RpcUtils from '@popup/steem/utils/rpc.utils';
import { LocalStorageKeyEnum } from '@reference-data/local-storage-key.enum';
import LocalStorageUtils from 'src/utils/localStorage.utils';

export const useWorkingRPC = async (activeRpc?: Rpc) => {
  const switchAuto = await LocalStorageUtils.getValueFromLocalStorage(
    LocalStorageKeyEnum.SWITCH_RPC_AUTO,
  );
  const currentRpc = activeRpc || store.getState().steem.activeRpc;
  for (const rpc of RpcUtils.getFullList().filter(
    (rpc) => rpc.uri !== currentRpc?.uri && !rpc.testnet,
  )) {
    if (await RpcUtils.checkRpcStatus(rpc.uri)) {
      if (switchAuto) {
        (store.dispatch as any)(setActiveRpc(rpc));
      } else {
        store.dispatch(setSwitchToRpc(rpc));
        store.dispatch(setDisplayChangeRpcPopup(true));
      }
      return;
    }
  }
};
