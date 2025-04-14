import { fetchSds } from '@api/sds';
import {
  Delegator,
  PendingOutgoingUndelegation,
} from '@interfaces/delegations.interface';
import { Key, TransactionOptions } from '@interfaces/keys.interface';
import { SteemTxUtils } from '@popup/steem/utils/steem-tx.utils';
import { DelegateVestingSharesOperation } from '@steempro/dsteem';
import moment from 'moment';

const getDelegators = async (name: string) => {
  const incoming_delegations: Delegator[] = [];
  const delegators = (await fetchSds(
    `/delegations_api/getIncomingDelegations/${name}`,
  )) as { from: string; to: string; vests: number; time: number }[];

  if (delegators) {
    delegators.forEach((element) => {
      incoming_delegations.push({
        delegation_date: moment(element.time).utc().toString(),
        delegator: element.from,
        vesting_shares: element.vests,
      });
    });
  }

  return delegators
    ? incoming_delegations
        .filter((e) => e.vesting_shares !== 0)
        .sort((a, b) => b.vesting_shares - a.vesting_shares)
    : null;
};

const getDelegatees = async (name: string) => {
  const LIMIT = 1000;
  let delegatees: any[] = [];
  let from = '';
  delegatees = await SteemTxUtils.getData(
    'condenser_api.get_vesting_delegations',
    [name, from, LIMIT],
  );

  return delegatees
    .filter((e) => parseFloat(e.vesting_shares + '') !== 0)
    .sort(
      (a, b) =>
        parseFloat(b.vesting_shares + '') - parseFloat(a.vesting_shares + ''),
    );
};

const getPendingOutgoingUndelegation = async (name: string) => {
  const pendingDelegations = await SteemTxUtils.getData(
    'database_api.find_vesting_delegation_expirations',
    { account: name },
    'delegations',
  );
  return pendingDelegations.map((pendingUndelegation: any) => {
    return {
      delegator: pendingUndelegation.delegator,
      expiration_date: pendingUndelegation.expiration,
      vesting_shares:
        parseInt(pendingUndelegation.vesting_shares.amount) / 1000000,
    } as PendingOutgoingUndelegation;
  });
};

/* istanbul ignore next */
const delegateVestingShares = async (
  delegator: string,
  delegatee: string,
  vestingShares: string,
  activeKey: Key,
  options?: TransactionOptions,
) => {
  return await SteemTxUtils.sendOperation(
    [getDelegationOperation(delegatee, delegator, vestingShares)],
    activeKey,
    false,
    options,
  );
};
/* istanbul ignore next */
const getDelegationOperation = (
  delegatee: string,
  delegator: string,
  amount: string,
) => {
  return [
    'delegate_vesting_shares',
    {
      delegatee,
      delegator,
      vesting_shares: amount,
    },
  ] as DelegateVestingSharesOperation;
};
/* istanbul ignore next */
const getDelegationTransaction = (
  delegatee: string,
  delegator: string,
  amount: string,
) => {
  return SteemTxUtils.createTransaction([
    DelegationUtils.getDelegationOperation(delegatee, delegator, amount),
  ]);
};

export const DelegationUtils = {
  getDelegationOperation,
  delegateVestingShares,
  getDelegators,
  getDelegatees,
  getPendingOutgoingUndelegation,
  getDelegationTransaction,
};
