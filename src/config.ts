import { SteemEngineConfig } from '@interfaces/steem-engine-rpc.interface';
const Config = {
  steemEngine: {
    mainnet: 'ssc-mainnet-steem',
    accountHistoryApi: 'https://history.steem-engine.com/',
    rpc: 'https://api.steem-engine.com/rpc',
  } as SteemEngineConfig,
  sds_base_url: 'https://sds0.steemworld.org',
  claims: {
    FREQUENCY: +(process.env.DEV_CLAIM_FREQUENCY || 10),
    freeAccount: {
      MIN_RC_PCT: +(process.env.DEV_CLAIM_ACCOUNT_RC_PCT || 85),
      MIN_RC: +(process.env.DEV_CLAIM_ACCOUNT_MIN_RC || 9484331370472),
    },
    savings: {
      delay: +(process.env.DEV_CLAIM_SAVINGS_DELAY || 30),
    },
  },
  autoStakeTokens: {
    FREQUENCY: +(process.env.DEV_CLAIM_FREQUENCY || 10),
  },
  analytics: {
    frequency: +(process.env.DEV_ANALYTICS_FREQUENCY || 10),
  },
  KEYCHAIN_PROPOSAL: 306,
  PROPOSAL_MIN_VOTE_DIFFERENCE_HIDE_POPUP: 8 * 10 ** 6,
  MIN_LOADING_TIME: 1000,
  rpc: {
    DEFAULT: { uri: 'https://api.steemit.com', testnet: false },
  },
  governanceReminderDelayInSeconds: 30 * 24 * 3600, //days
  transak: {
    apiKey:
      process.env.TRANSAK_DEV_API_KEY || '716078e4-939c-445a-8c6d-534614cd31b1',
  },
  loader: {
    minDuration: process.env.NODE_ENV === 'test' ? 0 : 1000,
  },
  transactions: {
    expirationTimeInMinutes: 10,
    multisigExpirationTimeInMinutes: 60,
  },
  swaps: {
    autoRefreshPeriodSec: +(process.env.DEV_SWAP_AUTO_REFRESH ?? 30),
    autoRefreshHistoryPeriodSec: +(process.env.DEV_SWAP_AUTO_REFRESH ?? 10),
    baseURL:
      process.env.KEYCHAIN_SWAP_API_DEV === 'true'
        ? 'http://localhost:5050'
        : 'https://swap.steem-keychain.com',
  },
  witnesses: {
    feedWarningLimitInHours: 5,
  },
  multisig: {
    baseURL:
      process.env.MULTISIG_BACKEND_SERVER ||
      'https://steem-keychain-backend-d591a645ff68.herokuapp.com',
  },
  tutorial: {
    baseUrl: process.env.DEV_TUTORIAL || 'https://keychain.steempro.com/',
  },
};

export default Config;
