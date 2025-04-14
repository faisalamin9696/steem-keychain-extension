import { Transaction, Transactions } from '@interfaces/transaction.interface';
import { ActionPayload } from '@popup/multichain/actions/interfaces';
import { SteemActionType } from '@popup/steem/actions/action-type.enum';
import ArrayUtils from 'src/utils/array.utils';

const TransactionReducer = (
  state: Transactions = { loading: false, list: [], lastUsedStart: -1 },
  { type, payload }: ActionPayload<[Transaction[], number]>,
) => {
  switch (type) {
    case SteemActionType.SET_ACTIVE_ACCOUNT: // action related to active account. Here used to reset the transaction list
      return { loading: true, list: [], lastUsedStart: -1 };
    case SteemActionType.INIT_TRANSACTIONS:
      return { loading: false, list: payload! };
    case SteemActionType.ADD_TRANSACTIONS:
      return {
        ...state,
        list: ArrayUtils.mergeWithoutDuplicate(state.list, payload![0], 'key'),
        lastUsedStart: payload![0][payload![0].length - 1].txId,
      };
    default:
      return state;
  }
};

export default TransactionReducer;
