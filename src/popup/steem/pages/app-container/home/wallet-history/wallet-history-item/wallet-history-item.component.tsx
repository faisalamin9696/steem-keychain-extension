import { Transaction } from '@interfaces/transaction.interface';
import { RootState } from '@popup/multichain/store';
import { WalletTransactionInfoComponent } from '@popup/steem/pages/app-container/home/wallet-history/wallet-history-item/wallet-transaction-info/wallet-transaction-info.component';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

interface WalletHistoryItemProps {
  transaction: Transaction;
  ariaLabel?: string;
}

const WalletHistoryItem = ({ transaction, ariaLabel }: PropsFromRedux) => {
  if (
    ![
      'transfer',
      'claim_reward_balance',
      'delegate_vesting_shares',
      'transfer_to_vesting',
      'withdraw_vesting',
      'interest',
      'transfer_to_savings',
      'transfer_from_savings',
      'fill_transfer_from_savings',
      'claim_account',
      'convert',
      'fill_convert_request',
      'create_claimed_account',
      'account_create',
    ].includes(transaction.type)
  )
    return null;
  return (
    <div
      data-testid={ariaLabel}
      id={`index-${transaction.index}`}
      className={`wallet-history-item`}>
      <WalletTransactionInfoComponent
        transaction={transaction}></WalletTransactionInfoComponent>
    </div>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    activeAccountName: state.steem.activeAccount.name,
  };
};

const connector = connect(mapStateToProps, {});
type PropsFromRedux = ConnectedProps<typeof connector> & WalletHistoryItemProps;

export const WalletHistoryItemComponent = connector(WalletHistoryItem);
