import { Keys } from '@interfaces/keys.interface';
import { ActionPayload } from '@popup/multichain/actions/interfaces';
import { SteemActionType } from '@popup/steem/actions/action-type.enum';
import { ExtendedAccount } from '@steempro/dsteem';
import { ActiveAccount, RC } from 'src/interfaces/active-account.interface';

export const ActiveAccountReducer = (
  state: ActiveAccount = {
    account: {} as ExtendedAccount,
    keys: {} as Keys,
    rc: {} as RC,
  },
  { type, payload }: ActionPayload<any>,
): ActiveAccount => {
  switch (type) {
    case SteemActionType.SET_ACTIVE_ACCOUNT:
      return { ...state, ...payload };
    case SteemActionType.SET_ACTIVE_ACCOUNT_RC:
      return { ...state, rc: payload };
    case SteemActionType.FORGET_ACCOUNT:
    case SteemActionType.FORGET_ACCOUNTS:
    case SteemActionType.RESET_ACTIVE_ACCOUNT:
      return {
        account: {} as ExtendedAccount,
        keys: {},
        rc: {} as RC,
      };
    default:
      return state;
  }
};
