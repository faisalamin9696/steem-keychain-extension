import { ActiveAccountReducer } from '@popup/steem/reducers/active-account.reducer';
import { ActiveRpcReducer } from '@popup/steem/reducers/active-rpc.reducer';
import { AppStatusReducer } from '@popup/steem/reducers/app-status.reducer';
import ConversionsReducer from '@popup/steem/reducers/conversion.reducer';
import CurrencyPricesReducer from '@popup/steem/reducers/currency-prices.reducer';
import DelegationsReducer from '@popup/steem/reducers/delegation.reducer';
import GlobalPropertiesReducer from '@popup/steem/reducers/global-properties.reducer';
import SteemEngineConfigReducer from '@popup/steem/reducers/steem-engine-config.reducer';
import { PhishingReducer } from '@popup/steem/reducers/phishing.reducer';
import { RpcSwitcherReducer } from '@popup/steem/reducers/rpc-switcher.reducer';
import TokenHistoryReducer from '@popup/steem/reducers/token-history.reducer';
import TokenMarketReducer from '@popup/steem/reducers/token-market.reducer';
import TokensPendingUnstakingReducer from '@popup/steem/reducers/tokens-pending-unstaking.reducer';
import TokensReducer from '@popup/steem/reducers/tokens.reducer';
import transactionsReducer from '@popup/steem/reducers/transactions.reducer';
import UserTokensReducer from '@popup/steem/reducers/user-token.reducer';
import { combineReducers } from 'redux';
import { AccountReducer } from './account.reducer';

const steemReducers = combineReducers({
  accounts: AccountReducer,
  activeAccount: ActiveAccountReducer,
  activeRpc: ActiveRpcReducer,
  currencyPrices: CurrencyPricesReducer,
  globalProperties: GlobalPropertiesReducer,
  delegations: DelegationsReducer,
  conversions: ConversionsReducer,
  phishing: PhishingReducer,
  transactions: transactionsReducer,
  userTokens: UserTokensReducer,
  tokens: TokensReducer,
  tokenHistory: TokenHistoryReducer,
  tokenMarket: TokenMarketReducer,
  steemEngineConfig: SteemEngineConfigReducer,
  appStatus: AppStatusReducer,
  rpcSwitcher: RpcSwitcherReducer,
  tokensPendingUnstaking: TokensPendingUnstakingReducer,
});

export default steemReducers;
