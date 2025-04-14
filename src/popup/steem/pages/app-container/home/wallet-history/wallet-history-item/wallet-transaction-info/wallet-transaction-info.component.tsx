import {
  ClaimAccount,
  ClaimReward,
  Convert,
  CreateAccount,
  CreateClaimedAccount,
  Delegation,
  DepositSavings,
  FillConvert,
  PowerDown,
  PowerUp,
  ProducerReward,
  ReceivedInterests,
  StartWithdrawSavings,
  Transaction,
  Transfer,
  WithdrawSavings,
} from '@interfaces/transaction.interface';
import { RootState } from '@popup/multichain/store';
import { ClaimAccountTransactionComponent } from '@popup/steem/pages/app-container/home/wallet-history/wallet-history-item/wallet-transaction-info/wallet-transaction-types/claim-account-transaction/claim-account-transaction.component';
import { ClaimRewardsTransactionComponent } from '@popup/steem/pages/app-container/home/wallet-history/wallet-history-item/wallet-transaction-info/wallet-transaction-types/claim-rewards-transaction/claim-rewards-transaction.component';
import { ConvertTransactionComponent } from '@popup/steem/pages/app-container/home/wallet-history/wallet-history-item/wallet-transaction-info/wallet-transaction-types/convert-transaction/convert-transaction.component';
import { CreateAccountTransactionComponent } from '@popup/steem/pages/app-container/home/wallet-history/wallet-history-item/wallet-transaction-info/wallet-transaction-types/create-account-transaction/create-account-transaction.component';
import { CreateClaimedAccountTransactionComponent } from '@popup/steem/pages/app-container/home/wallet-history/wallet-history-item/wallet-transaction-info/wallet-transaction-types/create-claimed-account-transaction/create-claimed-account-transaction.component';
import { DelegationTransactionComponent } from '@popup/steem/pages/app-container/home/wallet-history/wallet-history-item/wallet-transaction-info/wallet-transaction-types/delegation-transaction/delegation-transaction.component';
import { DepositSavingsTransactionComponent } from '@popup/steem/pages/app-container/home/wallet-history/wallet-history-item/wallet-transaction-info/wallet-transaction-types/deposit-savings-transaction/deposit-savings-transaction.component';
import { FillConvertTransactionComponent } from '@popup/steem/pages/app-container/home/wallet-history/wallet-history-item/wallet-transaction-info/wallet-transaction-types/fill-convert-transaction/fill-convert-transaction.component';
import { FillWithdrawSavingsTransactionComponent } from '@popup/steem/pages/app-container/home/wallet-history/wallet-history-item/wallet-transaction-info/wallet-transaction-types/fill-withdraw-savings-transaction/fill-withdraw-savings-transaction.component';
import { PowerDownTransactionComponent } from '@popup/steem/pages/app-container/home/wallet-history/wallet-history-item/wallet-transaction-info/wallet-transaction-types/power-down-transaction/power-down-transaction.component';
import { PowerUpTransactionComponent } from '@popup/steem/pages/app-container/home/wallet-history/wallet-history-item/wallet-transaction-info/wallet-transaction-types/power-up-transaction/power-up-transaction.component';
import { ProducerRewardTransactionTransactionComponent } from '@popup/steem/pages/app-container/home/wallet-history/wallet-history-item/wallet-transaction-info/wallet-transaction-types/producer-reward-transaction/producer-reward-transaction.component';
import { ReceivedInterestsTransactionComponent } from '@popup/steem/pages/app-container/home/wallet-history/wallet-history-item/wallet-transaction-info/wallet-transaction-types/received-interests-transaction/received-interests-transaction.component';
import { TransferTransactionComponent } from '@popup/steem/pages/app-container/home/wallet-history/wallet-history-item/wallet-transaction-info/wallet-transaction-types/transfer-transaction/transfer-transaction.component';
import { WithdrawSavingsTransactionComponent } from '@popup/steem/pages/app-container/home/wallet-history/wallet-history-item/wallet-transaction-info/wallet-transaction-types/withdraw-savings-transaction/withdraw-savings-transaction.component';
import React from 'react';
import { ConnectedProps, connect } from 'react-redux';
import 'react-tabs/style/react-tabs.scss';

interface WalletTransactionInfoProps {
  transaction: Transaction;
}

const WalletTransactionInfo = ({
  transaction,
}: PropsFromRedux & WalletTransactionInfoProps) => {
  const getTransactionContent = () => {
    switch (transaction.type) {
      case 'transfer':
        return (
          <TransferTransactionComponent transaction={transaction as Transfer} />
        );

      case 'claim_reward_balance':
        return (
          <ClaimRewardsTransactionComponent
            transaction={transaction as ClaimReward}
          />
        );
      case 'delegate_vesting_shares':
        return (
          <DelegationTransactionComponent
            transaction={transaction as Delegation}
          />
        );
      case 'claim_account':
        return (
          <ClaimAccountTransactionComponent
            transaction={transaction as ClaimAccount}
          />
        );
      case 'savings': {
        switch (transaction.subType) {
          case 'interest':
            return (
              <ReceivedInterestsTransactionComponent
                transaction={transaction as ReceivedInterests}
              />
            );
          case 'transfer_to_savings':
            return (
              <DepositSavingsTransactionComponent
                transaction={transaction as DepositSavings}
              />
            );
          case 'transfer_from_savings':
            return (
              <WithdrawSavingsTransactionComponent
                transaction={transaction as WithdrawSavings}
              />
            );
          case 'fill_transfer_from_savings':
            return (
              <FillWithdrawSavingsTransactionComponent
                transaction={transaction as StartWithdrawSavings}
              />
            );
        }
      }
      case 'power_up_down': {
        switch (transaction.subType) {
          case 'withdraw_vesting':
            return (
              <PowerDownTransactionComponent
                transaction={transaction as PowerDown}
              />
            );
          case 'transfer_to_vesting':
            return (
              <PowerUpTransactionComponent
                transaction={transaction as PowerUp}
              />
            );
        }
      }
      case 'convert': {
        switch (transaction.subType) {
          case 'convert':
            return (
              <ConvertTransactionComponent
                transaction={transaction as Convert}
              />
            );

          case 'fill_convert_request':
            return (
              <FillConvertTransactionComponent
                transaction={transaction as FillConvert}
              />
            );
        }
      }

      case 'account_create':
        return (
          <CreateAccountTransactionComponent
            transaction={transaction as CreateAccount}
          />
        );

      case 'producer_reward':
        return (
          // <ProducerRewardTransactionTransactionComponent
          //   transaction={transaction as ProducerReward}
          // />
          <></>
        );
      case 'create_claimed_account':
        return (
          <CreateClaimedAccountTransactionComponent
            transaction={transaction as CreateClaimedAccount}
          />
        );
    }
  };
  return (
    <div className="wallet-transaction-info">{getTransactionContent()}</div>
  );
};

const mapStateToProps = (state: RootState) => {
  return {};
};

const connector = connect(mapStateToProps, {});
type PropsFromRedux = ConnectedProps<typeof connector>;

export const WalletTransactionInfoComponent = connector(WalletTransactionInfo);
