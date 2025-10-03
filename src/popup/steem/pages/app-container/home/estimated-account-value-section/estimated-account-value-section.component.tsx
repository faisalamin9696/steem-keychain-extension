import { SteemInternalMarketLockedInOrders } from '@interfaces/steem-market.interface';
import { RootState } from '@popup/multichain/store';
import AccountUtils from '@popup/steem/utils/account.utils';
import { SteemInternalMarketUtils } from '@popup/steem/utils/steem-internal-market.utils';
import { AccountValueType } from '@reference-data/account-value-type.enum';
import { LocalStorageKeyEnum } from '@reference-data/local-storage-key.enum';
import React, { useEffect, useState } from 'react';
import { ConnectedProps, connect } from 'react-redux';
import { CustomTooltip } from 'src/common-ui/custom-tooltip/custom-tooltip.component';
import { SVGIcons } from 'src/common-ui/icons.enum';
import { SVGIcon } from 'src/common-ui/svg-icon/svg-icon.component';
import LocalStorageUtils from 'src/utils/localStorage.utils';

const EstimatedAccountValueSection = ({
  activeAccount,
  currencyPrices,
  globalProperties,
  tokensBalance,
  tokensMarket,
  tokens,
}: PropsFromRedux) => {
  const [accountValue, setAccountValue] = useState<string | number>('...');
  const [accountValueType, setAccountValueType] = useState<AccountValueType>(
    AccountValueType.DOLLARS,
  );
  // const [hiddenTokensList, setHiddenTokensList] = useState<string[]>();
  const [
    steemMarketLockedOpenOrdersValues,
    setSteemMarketLockedOpenOrdersValues,
  ] = useState<SteemInternalMarketLockedInOrders>({ steem: 0, sbd: 0 });

  useEffect(() => {
    init();
    // loadHiddenTokensList();
  }, []);

  // const loadHiddenTokensList = async () => {
  //   const hiddenTokensList = await LocalStorageUtils.getValueFromLocalStorage(
  //     LocalStorageKeyEnum.HIDDEN_TOKENS,
  //   );
  //   setHiddenTokensList(hiddenTokensList ?? []);
  // };

  const init = async () => {
    setAccountValueType(
      (await LocalStorageUtils.getValueFromLocalStorage(
        LocalStorageKeyEnum.ACCOUNT_VALUE_TYPE,
      )) || AccountValueType.DOLLARS,
    );
  };

  const loadSteemInternalMarketOrders = async (username: string) => {
    setSteemMarketLockedOpenOrdersValues(
      await SteemInternalMarketUtils.getSteemInternalMarketOrders(username),
    );
  };

  useEffect(() => {
    if (activeAccount.name) {
      loadSteemInternalMarketOrders(activeAccount.name);
    }
  }, [activeAccount]);

  useEffect(() => {
    if (
      activeAccount &&
      currencyPrices &&
      globalProperties?.globals &&
      steemMarketLockedOpenOrdersValues
    ) {
      setAccountValue(
        AccountUtils.getAccountValue(
          activeAccount.account,
          currencyPrices,
          globalProperties.globals!,
          accountValueType,
          steemMarketLockedOpenOrdersValues,
        ),
      );
    }
  }, [
    activeAccount,
    currencyPrices,
    globalProperties,
    // tokensBalance,
    // tokensMarket,
    accountValueType,
    steemMarketLockedOpenOrdersValues,
    // hiddenTokensList,
  ]);

  const openPortfolio = async () => {
    chrome.tabs.create({
      url: `portfolio.html`,
    });
  };

  const onClickEstimatedValue = () => {
    const newAccountValueType =
      accountValueType === AccountValueType.DOLLARS
        ? AccountValueType.STEEM
        : accountValueType === AccountValueType.STEEM
        ? AccountValueType.HIDDEN
        : AccountValueType.DOLLARS;
    setAccountValueType(newAccountValueType);
    LocalStorageUtils.saveValueInLocalStorage(
      LocalStorageKeyEnum.ACCOUNT_VALUE_TYPE,
      newAccountValueType,
    );
  };
  const getPrefix = () => {
    return accountValueType === AccountValueType.DOLLARS ? '$' : '';
  };
  const getSuffix = () => {
    return accountValueType === AccountValueType.STEEM ? 'STEEM' : '';
  };

  return (
    <>
      <div className="estimated-account-value-section">
        <div className="label-panel">
          <CustomTooltip
            dataTestId="custom-tool-tip-estimated-value-section"
            message="popup_html_estimation_info_text"
            delayShow={500}
            position="bottom">
            <div className="label">
              {chrome.i18n.getMessage('popup_html_estimation')}
            </div>
          </CustomTooltip>
        </div>
        <div className="estimated-value-button-container">
          {' '}
          <div
            data-testid="estimated-account-div-value"
            className={`value ${
              accountValueType === AccountValueType.HIDDEN ? 'with-margin' : ''
            }`}
            onClick={onClickEstimatedValue}>
            {accountValue
              ? `${getPrefix()} ${accountValue} ${getSuffix()}`
              : '...'}
          </div>
          <SVGIcon
            className={`portfolio-icon `}
            icon={SVGIcons.PORTOLIO}
            onClick={openPortfolio}
          />
        </div>
      </div>
    </>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    activeAccount: state.steem.activeAccount,
    currencyPrices: state.steem.currencyPrices,
    globalProperties: state.steem.globalProperties,
    tokensBalance: state.steem.userTokens.list,
    tokensMarket: state.steem.tokenMarket,
    tokens: state.steem.tokens,
  };
};

const connector = connect(mapStateToProps, {});
type PropsFromRedux = ConnectedProps<typeof connector>;

export const EstimatedAccountValueSectionComponent = connector(
  EstimatedAccountValueSection,
);
