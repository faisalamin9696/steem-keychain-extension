import {
  CommentCurationTransaction,
  CURATIONS_REWARDS_TYPES,
  DelegationTokenTransaction,
  MiningLotteryTransaction,
  OperationsSteemEngine,
  StakeTokenTransaction,
  TokenBalance,
  TokenTransaction,
  TransferTokenTransaction,
} from '@interfaces/tokens.interface';
import { setTitleContainerProperties } from '@popup/multichain/actions/title-container.actions';
import { RootState } from '@popup/multichain/store';
import {
  fetchMoreTokenHistory,
  loadTokenHistory,
} from '@popup/steem/actions/token.actions';
import { TokenHistoryItemComponent } from '@popup/steem/pages/app-container/home/tokens/tokens-history/token-history-item/token-history-item.component';
import { TokenTransactionUtils } from '@popup/steem/utils/token-transaction.utils';
import { Screen } from '@reference-data/screen.enum';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { BackToTopButton } from 'src/common-ui/back-to-top-button/back-to-top-button.component';
import { SVGIcons } from 'src/common-ui/icons.enum';
import { InputType } from 'src/common-ui/input/input-type.enum';
import InputComponent from 'src/common-ui/input/input.component';
import RotatingLogoComponent from 'src/common-ui/rotating-logo/rotating-logo.component';
import { SVGIcon } from 'src/common-ui/svg-icon/svg-icon.component';

const TokensHistory = ({
  activeAccountName,
  currentTokenBalance,
  tokenHistory,
  loadTokenHistory,
  setTitleContainerProperties,
  isTokenHistoryLoading,
  shouldLoadMore,
  fetchMoreTokenHistory,
}: PropsFromRedux) => {
  const [displayedTransactions, setDisplayedTransactions] = useState<
    TokenTransaction[]
  >([]);
  const [filterValue, setFilterValue] = useState('');
  const [displayScrollToTop, setDisplayedScrollToTop] = useState(false);

  const walletItemList = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTokenHistory(activeAccountName!, currentTokenBalance.symbol);
    setTitleContainerProperties({
      title: 'popup_html_tokens_history',
      titleParams: [currentTokenBalance.symbol],
      isBackButtonEnabled: true,
    });
  }, []);

  useEffect(() => {
    setDisplayedTransactions(
      tokenHistory.filter((item) => {
        return (
          (CURATIONS_REWARDS_TYPES.includes(item.operation) &&
            TokenTransactionUtils.filterCurationReward(
              item as CommentCurationTransaction,
              filterValue,
            )) ||
          (item.operation === OperationsSteemEngine.TOKENS_TRANSFER &&
            TokenTransactionUtils.filterTransfer(
              item as TransferTokenTransaction,
              filterValue,
            )) ||
          (item.operation === OperationsSteemEngine.TOKEN_STAKE &&
            TokenTransactionUtils.filterStake(
              item as StakeTokenTransaction,
              filterValue,
            )) ||
          (item.operation === OperationsSteemEngine.MINING_LOTTERY &&
            TokenTransactionUtils.filterMiningLottery(
              item as MiningLotteryTransaction,
              filterValue,
            )) ||
          (item.operation === OperationsSteemEngine.TOKENS_DELEGATE &&
            TokenTransactionUtils.filterDelegation(
              item as DelegationTokenTransaction,
              filterValue,
            )) ||
          item.amount.toLowerCase().includes(filterValue.toLowerCase()) ||
          item.operation.toLowerCase().includes(filterValue.toLowerCase()) ||
          (item.timestamp &&
            moment(item.timestamp)
              .format('L')
              .includes(filterValue.toLowerCase()))
        );
      }),
    );
  }, [tokenHistory, filterValue]);

  const handleScroll = (event: any) => {
    setDisplayedScrollToTop(event.target.scrollTop !== 0);
  };

  return (
    <div
      data-testid={`${Screen.TOKENS_HISTORY}-page`}
      className="tokens-history">
      <InputComponent
        dataTestId="input-filter-box"
        type={InputType.TEXT}
        placeholder="popup_html_search"
        value={filterValue}
        onChange={setFilterValue}
      />
      <div className="item-list" ref={walletItemList} onScroll={handleScroll}>
        {displayedTransactions.map((transaction: TokenTransaction) => (
          <TokenHistoryItemComponent
            dataTestId={`token-history-item-${transaction.symbol}`}
            key={transaction._id}
            transaction={transaction}></TokenHistoryItemComponent>
        ))}
        {displayedTransactions.length === 0 && !isTokenHistoryLoading && (
          <div className="empty-history-panel">
            <SVGIcon icon={SVGIcons.MESSAGE_ERROR} />
            <div className="text">
              <div>
                {chrome.i18n.getMessage('popup_html_transaction_list_is_empty')}
              </div>
              <div>
                {chrome.i18n.getMessage(
                  'popup_html_transaction_list_is_empty_try_clear_filter',
                )}
              </div>
            </div>
          </div>
        )}
        {shouldLoadMore && !isTokenHistoryLoading && (
          <div
            className="load-more-panel"
            onClick={() => {
              fetchMoreTokenHistory(
                activeAccountName!,
                currentTokenBalance.symbol,
              );
            }}>
            <span className="label">
              {chrome.i18n.getMessage('popup_html_load_more')}
            </span>
            <SVGIcon icon={SVGIcons.GLOBAL_ADD_CIRCLE}></SVGIcon>
          </div>
        )}
        {isTokenHistoryLoading && (
          <div className="rotating-logo-container">
            <RotatingLogoComponent></RotatingLogoComponent>
          </div>
        )}
      </div>
      {displayScrollToTop && <BackToTopButton element={walletItemList} />}
    </div>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    activeAccountName: state.steem.activeAccount?.name,
    userTokens: state.steem.userTokens,
    currentTokenBalance: state.navigation.params?.tokenBalance as TokenBalance,
    tokenHistory: state.steem.tokenHistory.list as TokenTransaction[],
    isTokenHistoryLoading: state.steem.tokenHistory.loading,
    shouldLoadMore: state.steem.tokenHistory.shouldLoadMore,
  };
};

const connector = connect(mapStateToProps, {
  loadTokenHistory,
  setTitleContainerProperties,
  fetchMoreTokenHistory,
});
type PropsFromRedux = ConnectedProps<typeof connector>;

export const TokensHistoryComponent = connector(TokensHistory);
