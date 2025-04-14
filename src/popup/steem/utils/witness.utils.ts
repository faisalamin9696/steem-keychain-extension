import { CurrencyPrices } from '@interfaces/bittrex.interface';
import { GlobalProperties } from '@interfaces/global-properties.interface';
import { Key, TransactionOptions } from '@interfaces/keys.interface';
import {
  LastSigningKeys,
  Witness,
  WitnessInfo,
  WitnessParamsForm,
} from '@interfaces/witness.interface';
import { GovernanceUtils } from '@popup/steem/utils/governance.utils';
import { SteemTxUtils } from '@popup/steem/utils/steem-tx.utils';
import { LocalStorageKeyEnum } from '@reference-data/local-storage-key.enum';
import {
  AccountWitnessVoteOperation,
  WitnessUpdateOperation,
} from '@steempro/dsteem';
import moment from 'moment';
import Config from 'src/config';
import FormatUtils from 'src/utils/format.utils';
import LocalStorageUtils from 'src/utils/localStorage.utils';

export const WITNESS_DISABLED_KEY =
  'STM1111111111111111111111111111111114T1Anm';

/* istanbul ignore next */
const voteWitness = async (
  witness: Witness,
  voter: string,
  activeKey: Key,
  options?: TransactionOptions,
) => {
  const witnessOperation = WitnessUtils.getWitnessVoteOperation(
    true,
    voter,
    witness.owner,
  );

  return WitnessUtils.sendWitnessOperation(
    witnessOperation,
    voter,
    activeKey,
    options,
  );
};
/* istanbul ignore next */
const unvoteWitness = async (
  witness: Witness,
  voter: string,
  activeKey: Key,
  options?: TransactionOptions,
) => {
  const witnessOperation = WitnessUtils.getWitnessVoteOperation(
    false,
    voter,
    witness.owner,
  );

  return WitnessUtils.sendWitnessOperation(
    witnessOperation,
    voter,
    activeKey,
    options,
  );
};
/* istanbul ignore next */
const updateWitnessVote = async (
  voter: string,
  witness: Witness,
  approve: boolean,
  activeKey: Key,
  options?: TransactionOptions,
) => {
  const witnessOperation = WitnessUtils.getWitnessVoteOperation(
    approve,
    voter,
    witness.owner,
  );

  return WitnessUtils.sendWitnessOperation(
    witnessOperation,
    voter,
    activeKey,
    options,
  );
};
/* istanbul ignore next */
const sendWitnessOperation = async (
  witnessOperation: AccountWitnessVoteOperation,
  username: string,
  activeKey: Key,
  options?: TransactionOptions,
) => {
  GovernanceUtils.removeFromIgnoreRenewal(username);

  return await SteemTxUtils.sendOperation(
    [witnessOperation],
    activeKey,
    false,
    options,
  );
};
/* istanbul ignore next */
const getWitnessVoteOperation = (
  approve: boolean,
  voter: string,
  witnessName: string,
) => {
  return [
    'account_witness_vote',
    {
      account: voter,
      approve: approve,
      witness: witnessName,
    },
  ] as AccountWitnessVoteOperation;
};
/* istanbul ignore next */
const getUpdateWitnessTransaction = (
  voter: string,
  witness: Witness,
  approve: boolean,
) => {
  return SteemTxUtils.createTransaction([
    WitnessUtils.getWitnessVoteOperation(approve, voter, witness.owner),
  ]);
};

const getWitnessAccountUpdateOperation = (
  witnessAccountName: string,
  witnessParamsForm: WitnessParamsForm,
) => {
  return [
    'witness_update',
    {
      owner: witnessAccountName,
      url: witnessParamsForm.url,
      block_signing_key: witnessParamsForm.signingKey,
      props: {
        account_creation_fee: `${Number(
          witnessParamsForm.accountCreationFee,
        ).toFixed(3)} STEEM`,
        maximum_block_size: Number(witnessParamsForm.maximumBlockSize),
        sbd_interest_rate: Number(witnessParamsForm.sbdInterestRate) * 100,
      },
      fee: '0.000 STEEM',
    },
  ] as WitnessUpdateOperation;
};

const updateWitnessParameters = async (
  witnessAccountName: string,
  witnessParamsForm: WitnessParamsForm,
  activeKey: Key,
  options?: TransactionOptions,
) => {
  const witnessAccountUpdateOperation = getWitnessAccountUpdateOperation(
    witnessAccountName,
    witnessParamsForm,
  );
  return await SteemTxUtils.sendOperation(
    [witnessAccountUpdateOperation],
    activeKey,
    true,
    options,
  );
};

const getWitnessInfo = async (
  username: string,
  globalProperties: GlobalProperties,
  currencyPrices: CurrencyPrices,
): Promise<WitnessInfo> => {
  let resultFromBlockchain: Witness;
  [resultFromBlockchain] = await SteemTxUtils.getData(
    'database_api.find_witnesses',
    {
      owners: [username],
    },
    'witnesses',
  );

  const lastFeedUpdate = `${resultFromBlockchain.last_sbd_exchange_update}Z`;

  const witnessInfo: WitnessInfo = {
    rewards: {
      lastMonthValue: 0,
      lastMonthInSP: '',
      lastMonthInUSD: '',
      lastWeekValue: 0,
      lastWeekInSP: '',
      lastWeekInUSD: '',
      lastYearValue: 0,
      lastYearInSP: '',
      lastYearInUSD: '',
    },
    username: resultFromBlockchain.owner,
    votesCount: resultFromBlockchain.votes,
    voteValueInSP: FormatUtils.nFormatter(
      FormatUtils.toSP(
        (Number(resultFromBlockchain.votes) / 1000000).toString(),
        globalProperties.globals,
      ),
      3,
    ),
    blockMissed: resultFromBlockchain.total_missed,
    lastBlock: resultFromBlockchain.last_confirmed_block_num?.toString(),
    lastBlockUrl: `https://steemdb.io/block/${resultFromBlockchain.last_confirmed_block_num}`,
    priceFeed: FormatUtils.fromNaiAndSymbol(
      resultFromBlockchain.sbd_exchange_rate.base,
    ),
    priceFeedUpdatedAt: moment(lastFeedUpdate),
    priceFeedUpdatedAtWarning: wasUpdatedAfterThreshold(moment(lastFeedUpdate)),
    signingKey: resultFromBlockchain.signing_key,
    url: resultFromBlockchain.url,
    version: resultFromBlockchain.running_version,
    isDisabled: resultFromBlockchain.signing_key === WITNESS_DISABLED_KEY,
    params: {
      accountCreationFee: FormatUtils.getAmountFromNai(
        resultFromBlockchain.props.account_creation_fee,
      ),
      accountCreationFeeFormatted: FormatUtils.fromNaiAndSymbol(
        resultFromBlockchain.props.account_creation_fee,
      ),
      maximumBlockSize: resultFromBlockchain.props.maximum_block_size,
      sbdInterestRate: resultFromBlockchain.props.sbd_interest_rate / 100,
    },
    // rewards: {
    //   lastMonthValue: resultFromAPI.lastMonthValue,
    //   lastMonthInHP: FormatUtils.toFormattedHP(
    //     resultFromAPI.lastMonthValue,
    //     globalProperties.globals!,
    //   ),
    //   lastMonthInUSD: FormatUtils.getUSDFromVests(
    //     resultFromAPI.lastMonthValue,
    //     globalProperties,
    //     currencyPrices,
    //   ),
    //   lastWeekValue: resultFromAPI.lastWeekValue,
    //   lastWeekInHP: FormatUtils.toFormattedHP(
    //     resultFromAPI.lastWeekValue,
    //     globalProperties.globals!,
    //   ),
    //   lastWeekInUSD: FormatUtils.getUSDFromVests(
    //     resultFromAPI.lastWeekValue,
    //     globalProperties,
    //     currencyPrices,
    //   ),
    //   lastYearValue: resultFromAPI.lastYearValue,
    //   lastYearInHP: FormatUtils.toFormattedHP(
    //     resultFromAPI.lastYearValue,
    //     globalProperties.globals!,
    //   ),
    //   lastYearInUSD: FormatUtils.getUSDFromVests(
    //     resultFromAPI.lastYearValue,
    //     globalProperties,
    //     currencyPrices,
    //   ),
    // },
  };
  return witnessInfo;
};
const wasUpdatedAfterThreshold = (updatedAt: moment.Moment) => {
  const now = moment.utc();
  var duration = moment.duration(now.diff(updatedAt.utc()));
  var hours = duration.asHours();

  return hours > Config.witnesses.feedWarningLimitInHours;
};

const getLastSigningKeyForWitness = async (username: string) => {
  const result: LastSigningKeys =
    await LocalStorageUtils.getValueFromLocalStorage(
      LocalStorageKeyEnum.WITNESS_LAST_SIGNING_KEY,
    );
  return result ? result[username] : null;
};

const saveLastSigningKeyForWitness = async (username: string, key: string) => {
  let result: LastSigningKeys =
    await LocalStorageUtils.getValueFromLocalStorage(
      LocalStorageKeyEnum.WITNESS_LAST_SIGNING_KEY,
    );
  if (!result) {
    result = {};
  }
  result[username] = key;
  LocalStorageUtils.saveValueInLocalStorage(
    LocalStorageKeyEnum.WITNESS_LAST_SIGNING_KEY,
    result,
  );
};

const WitnessUtils = {
  unvoteWitness,
  voteWitness,
  getWitnessVoteOperation,
  sendWitnessOperation,
  updateWitnessVote,
  getUpdateWitnessTransaction,
  updateWitnessParameters,
  getWitnessInfo,
  wasUpdatedAfterThreshold,
  getLastSigningKeyForWitness,
  saveLastSigningKeyForWitness,
};

export default WitnessUtils;
