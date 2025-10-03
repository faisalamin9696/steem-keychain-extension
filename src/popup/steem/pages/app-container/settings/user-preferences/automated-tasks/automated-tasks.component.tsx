import { LocalAccountListItem } from '@interfaces/list-item.interface';
import { LocalAccount } from '@interfaces/local-account.interface';
import { setTitleContainerProperties } from '@popup/multichain/actions/title-container.actions';
import { RootState } from '@popup/multichain/store';
import { loadActiveAccount } from '@popup/steem/actions/active-account.actions';
import {
  loadTokens,
  loadTokensMarket,
  loadUserTokens,
} from '@popup/steem/actions/token.actions';
import { LocalStorageKeyEnum } from '@reference-data/local-storage-key.enum';
import { Screen } from '@reference-data/screen.enum';
import React, { useEffect, useState } from 'react';
import { ConnectedProps, connect } from 'react-redux';
import { CheckboxPanelComponent } from 'src/common-ui/checkbox/checkbox-panel/checkbox-panel.component';
import { SVGIcons } from 'src/common-ui/icons.enum';
import { SelectAccountSectionComponent } from 'src/common-ui/select-account-section/select-account-section.component';
import { SVGIcon } from 'src/common-ui/svg-icon/svg-icon.component';
import Config from 'src/config';
import AutomatedTasksUtils from 'src/utils/automatedTasks.utils';

const DEFAULT_SELECTED_TOKEN_OPTION = {
  label: chrome.i18n.getMessage(
    'popup_html_automated_steem_section_default_option_message',
  ),
  value: '',
};

const AutomatedTasks = ({
  accounts,
  activeAccount,
  setTitleContainerProperties,
}: PropsFromRedux) => {
  const defaultOptions: LocalAccountListItem[] = [];
  const [options, setOptions] = useState(defaultOptions);
  const [claimRewards, setClaimRewards] = useState(false);
  const [claimAccounts, setClaimAccounts] = useState(false);
  const [claimSavings, setClaimSavings] = useState(false);
  const [selectedLocalAccount, setSelectedLocalAccount] = useState(
    accounts[0].name,
  );
  const [isSteemSectionExpanded, setIsSteemSectionExpanded] = useState(true);
  const claimSavingsErrorMessage =
    AutomatedTasksUtils.canClaimSavingsErrorMessage(activeAccount);
  const claimAccountErrorMessage =
    AutomatedTasksUtils.canClaimAccountErrorMessage(activeAccount);
  const claimRewardsErrorMessage =
    AutomatedTasksUtils.canClaimRewardsErrorMessage(activeAccount);

  useEffect(() => {
    setTitleContainerProperties({
      title: 'popup_html_automated_tasks',
      isBackButtonEnabled: true,
    });
  }, []);

  useEffect(() => {
    init();
    setOptions(
      accounts.map((account: LocalAccount) => {
        return { label: account.name, value: account.name };
      }),
    );
    setSelectedLocalAccount(activeAccount.name!);
    loadTokensMarket();
    loadTokens();
  }, [accounts, activeAccount]);

  useEffect(() => {
    if (selectedLocalAccount) {
      loadUserTokens(selectedLocalAccount);
    }
  }, [selectedLocalAccount]);

  const saveClaims = async (
    claimRewards: boolean,
    claimAccounts: boolean,
    claimSavings: boolean,
  ) => {
    setClaimAccounts(claimAccounts);
    setClaimRewards(claimRewards);
    setClaimSavings(claimSavings);

    await AutomatedTasksUtils.saveClaims(
      claimRewards,
      claimAccounts,
      claimSavings,
      activeAccount.name!,
    );
  };

  const init = async () => {
    const values = await AutomatedTasksUtils.getClaims(activeAccount.name!);
    setClaimRewards(values[LocalStorageKeyEnum.CLAIM_REWARDS] ?? false);
    setClaimAccounts(values[LocalStorageKeyEnum.CLAIM_ACCOUNTS] ?? false);
    setClaimSavings(values[LocalStorageKeyEnum.CLAIM_SAVINGS] ?? false);
  };

  const isClaimedAccountDisabled =
    activeAccount.rc.max_rc < Config.claims.freeAccount.MIN_RC * 1.5;
  return (
    <div
      data-testid={`${Screen.SETTINGS_AUTOMATED_TASKS}-page`}
      className="automated-tasks-page">
      <div className="intro">
        {chrome.i18n.getMessage('popup_html_automated_intro')}
      </div>

      <SelectAccountSectionComponent fullSize background="white" />

      <div className="section">
        <div
          className="section-expander"
          onClick={() => setIsSteemSectionExpanded(!isSteemSectionExpanded)}>
          <div className="section-title-logo">
            <div className="section-title">
              {chrome.i18n.getMessage(
                'popup_html_automated_steem_section_title',
              )}
            </div>
          </div>
          <SVGIcon
            className="custom-select-handle"
            icon={
              isSteemSectionExpanded
                ? SVGIcons.SELECT_ARROW_UP
                : SVGIcons.SELECT_ARROW_DOWN
            }
          />
        </div>
        {isSteemSectionExpanded && (
          <div className="tasks">
            <CheckboxPanelComponent
              dataTestId="checkbox-autoclaim-rewards"
              title="popup_html_enable_autoclaim_rewards"
              checked={claimRewards}
              onChange={(value) =>
                saveClaims(value, claimAccounts, claimSavings)
              }
              hint="popup_html_enable_autoclaim_rewards_info"
              tooltipMessage={claimRewardsErrorMessage}
              disabled={!!claimRewardsErrorMessage}
            />
            <CheckboxPanelComponent
              dataTestId="checkbox-autoclaim-accounts"
              title="popup_html_enable_autoclaim_accounts"
              checked={claimAccounts && !isClaimedAccountDisabled}
              onChange={(value) =>
                saveClaims(claimRewards, value, claimSavings)
              }
              skipHintTranslation
              hint={chrome.i18n.getMessage(
                'popup_html_enable_autoclaim_accounts_info',
                [Config.claims.freeAccount.MIN_RC_PCT + ''],
              )}
              tooltipMessage={
                claimAccountErrorMessage || isClaimedAccountDisabled
                  ? 'popup_html_insufficient_hp_claim_accounts'
                  : undefined
              }
              disabled={!!claimSavingsErrorMessage || isClaimedAccountDisabled}
            />
            <CheckboxPanelComponent
              dataTestId="checkbox-autoclaim-savings"
              title="popup_html_enable_autoclaim_savings"
              checked={claimSavings}
              onChange={(value) =>
                saveClaims(claimRewards, claimAccounts, value)
              }
              hint="popup_html_enable_autoclaim_savings_info"
              tooltipMessage={claimSavingsErrorMessage}
              disabled={!!claimSavingsErrorMessage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    accounts: state.steem.accounts,
    activeAccount: state.steem.activeAccount,
    userTokens: state.steem.userTokens,
    market: state.steem.tokenMarket,
    allTokens: state.steem.tokens,
  };
};

const connector = connect(mapStateToProps, {
  loadActiveAccount,
  setTitleContainerProperties,
  loadUserTokens,
  loadTokensMarket,
  loadTokens,
});
type PropsFromRedux = ConnectedProps<typeof connector>;

export const AutomatedTasksComponent = connector(AutomatedTasks);
