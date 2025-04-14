import { Keys } from '@interfaces/keys.interface';
import { RcDelegationsInfo } from '@interfaces/rc-delegation.interface';
import { ExtendedAccount } from '@steempro/dsteem';
import { Manabar } from '@steempro/dsteem/lib/chain/rc';
export type RC = Manabar & RcDelegationsInfo;

export interface ActiveAccount {
  account: ExtendedAccount;
  keys: Keys;
  rc: RC;
  name?: string;
}
