import { GlobalProperties } from '@interfaces/global-properties.interface';
import {
  ProducerReward,
} from '@interfaces/transaction.interface';
import { RootState } from '@popup/multichain/store';
import { GenericTransactionComponent } from '@popup/steem/pages/app-container/home/wallet-history/wallet-history-item/wallet-transaction-info/wallet-transaction-types/generic-transaction/generic-transaction.component';
import React from 'react';
import { ConnectedProps, connect } from 'react-redux';
import 'react-tabs/style/react-tabs.scss';
import FormatUtils from 'src/utils/format.utils';

interface WithdrawSavingsTransactionProps {
  transaction: ProducerReward;
  globalProperties: GlobalProperties;
}

const ProducerRewardTransaction = ({
  transaction,
  globalProperties,
}: PropsFromRedux & WithdrawSavingsTransactionProps) => {
  const getDetail = () => {
    return chrome.i18n.getMessage('popup_html_wallet_info_producer_reward', [
      FormatUtils.toSP(
        transaction.vesting_shares.toString(),
        globalProperties.globals,
      ).toFixed(3) +" SP",
    ]);
  };

  return (
    <GenericTransactionComponent
      transaction={transaction}
      detail={getDetail()}></GenericTransactionComponent>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    globalProperties: state.steem.globalProperties,
  };
};

const connector = connect(mapStateToProps, {});
type PropsFromRedux = ConnectedProps<typeof connector>;

export const ProducerRewardTransactionTransactionComponent = connector(
  ProducerRewardTransaction,
);
