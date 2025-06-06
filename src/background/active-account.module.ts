import { ExtendedAccount } from '@steempro/dsteem';
import { ActiveAccount } from '@interfaces/active-account.interface';
import { LocalAccount } from '@interfaces/local-account.interface';
import AccountUtils from '@popup/steem/utils/account.utils';

const createActiveAccount = async (
  userAccount: ExtendedAccount,
  localAccounts: LocalAccount[],
) => {
  const localAccount = localAccounts.find(
    (localAccount) => localAccount.name === userAccount.name,
  );
  if (!localAccount) {
    return;
  }
  const activeAccount: ActiveAccount = {
    account: userAccount,
    keys: localAccount.keys,
    name: localAccount.name,
    rc: await AccountUtils.getRCMana(localAccount.name),
  };

  return activeAccount;
};

export const ActiveAccountModule = {
  createActiveAccount,
};
