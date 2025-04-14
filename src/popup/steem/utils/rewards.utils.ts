import { ActiveAccount } from '@interfaces/active-account.interface';
import { TransactionOptions } from '@interfaces/keys.interface';
import { TransactionResult } from '@interfaces/steem-tx.interface';
import { SteemTxUtils } from '@popup/steem/utils/steem-tx.utils';
import { Asset, ClaimRewardBalanceOperation } from '@steempro/dsteem';
import FormatUtils from 'src/utils/format.utils';

const claimRewards = async (
  username: string,
  rewardSteem: string | Asset,
  rewardSBD: string | Asset,
  rewardVests: string | Asset,
  postingKey: string,
  options?: TransactionOptions,
): Promise<TransactionResult | null> => {
  return await SteemTxUtils.sendOperation(
    [
      [
        'claim_reward_balance',
        {
          account: username,
          reward_steem: rewardSteem,
          reward_sbd: rewardSBD,
          reward_vests: rewardVests,
        },
      ] as ClaimRewardBalanceOperation,
    ],
    postingKey,
    false,
    options,
  );
};

const hasReward = (
  reward_sbd: string,
  reward_sp: string,
  reward_steem: string,
): boolean => {
  return (
    FormatUtils.getValFromString(reward_sbd) !== 0 ||
    FormatUtils.getValFromString(reward_sp) !== 0 ||
    FormatUtils.getValFromString(reward_steem) !== 0
  );
};

const getAvailableRewards = (activeAccount: ActiveAccount) => {
  let reward_sbd = activeAccount.account.reward_sbd_balance;
  let reward_vests = activeAccount.account.reward_vesting_balance;
  const reward_sp = FormatUtils.toSP(reward_vests as string) + ' SP';
  let reward_steem = activeAccount.account.reward_steem_balance;
  let rewardText = chrome.i18n.getMessage('popup_account_redeem') + ':<br>';
  if (FormatUtils.getValFromString(reward_sp) != 0)
    rewardText += reward_sp + ' / ';
  if (FormatUtils.getValFromString(reward_sbd as string) != 0)
    rewardText += reward_sbd + ' / ';
  if (FormatUtils.getValFromString(reward_steem as string) != 0)
    rewardText += reward_steem + ' / ';
  rewardText = rewardText.slice(0, -3);
  return [reward_sbd, reward_sp, reward_steem, rewardText];
};

export const RewardsUtils = {
  claimRewards,
  hasReward,
  getAvailableRewards,
};
