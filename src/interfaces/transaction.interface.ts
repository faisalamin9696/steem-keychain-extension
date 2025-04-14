import { OperationName, VirtualOperationName } from '@steempro/dsteem';

export type CustomTransactionType = 'savings' | 'power_up_down';
export interface Transactions {
  loading: boolean;
  list: Transaction[];
  lastUsedStart: number;
}

export type SdsOperationName =
  | 'account_create'
  | 'account_create_with_delegation'
  | 'account_update'
  | 'account_update2'
  | 'account_witness_proxy'
  | 'account_witness_vote'
  | 'author_reward'
  | 'cancel_transfer_from_savings'
  | 'change_recovery_account'
  | 'claim_account'
  | 'claim_reward_balance'
  | 'comment'
  | 'comment_benefactor_reward'
  | 'comment_options'
  | 'convert'
  | 'create_claimed_account'
  | 'create_proposal'
  | 'curation_reward'
  | 'custom'
  | 'custom_json'
  | 'decline_voting_rights'
  | 'delegate_vesting_shares'
  | 'delete_comment'
  | 'escrow_approve'
  | 'escrow_dispute'
  | 'escrow_release'
  | 'escrow_transfer'
  | 'feed_publish'
  | 'fill_convert_request'
  | 'fill_order'
  | 'fill_transfer_from_savings'
  | 'fill_vesting_withdraw'
  | 'hardfork'
  | 'hardfork23'
  | 'interest'
  | 'limit_order_cancel'
  | 'limit_order_create'
  | 'limit_order_create2'
  | 'liquidity_reward'
  | 'pow'
  | 'pow2'
  | 'producer_reward'
  | 'proposal_pay'
  | 'recover_account'
  | 'remove_proposal'
  | 'request_account_recovery'
  | 'return_vesting_delegation'
  | 'set_withdraw_vesting_route'
  | 'shutdown_witness'
  | 'sps_fund'
  | 'transfer'
  | 'transfer_from_savings'
  | 'transfer_to_savings'
  | 'transfer_to_vesting'
  | 'update_proposal_votes'
  | 'vote'
  | 'withdraw_vesting'
  | 'witness_set_properties'
  | 'witness_update'
  | CustomTransactionType;

export interface SdsOperation {
  0: SdsOperationName;
  1: {
    [key: string]: any;
  };
}
export interface SdsTransaction {
  id: number;
  time: number;
  block_num: number;
  trans_index: number;
  op_index: number;
  virtual: number;
  op: SdsOperation;
}
export interface Transaction {
  blockNumber: number;
  txId: string;
  index: number;
  key: string;
  type: SdsOperationName;
  subType?: OperationName | VirtualOperationName;
  timestamp: string;
  lastFetched?: boolean;
  last?: boolean;
  url: string;
}
export interface Transfer extends Transaction {
  amount: string;
  from: string;
  memo: string;
  to: string;
}

export interface FillRecurrentTransfer extends Transfer {
  remainingExecutions: number;
}

export interface Delegation extends Transaction {
  amount: string;
  delegator: string;
  delegatee: string;
}

export interface ClaimReward extends Transaction {
  sp: string;
  sbd: string;
  steem: string;
}

export interface PowerUp extends Transaction {
  amount: string;
  to: string;
  from: string;
}

export interface PowerDown extends Transaction {
  amount: string;
}

export interface ReceivedInterests extends Transaction {
  interest: string;
}

export interface DepositSavings extends Transaction {
  amount: string;
  to: string;
  from: string;
}

export interface StartWithdrawSavings extends Transaction {
  amount: any;
}
export interface WithdrawSavings extends Transaction {
  amount: any;
}

export interface ClaimAccount extends Transaction {}

export interface Convert extends Transaction {
  amount: string;
}
export interface CollateralizedConvert extends Transaction {
  amount: string;
}
export interface FillConvert extends Transaction {
  amount_in: string;
  amount_out: string;
}
export interface FillCollateralizedConvert extends Transaction {
  amount_in: string;
  amount_out: string;
}

export interface CreateClaimedAccount extends Transaction {
  creator: string;
  new_account_name: string;
}

export interface CreateAccount extends Transaction {
  creator: string;
  new_account_name: string;
  fee: string;
}

export interface ProducerReward extends Transaction {
  producer: string;
  vesting_shares: string;
}
