import { KeychainKeyTypesLC } from '@interfaces/keychain.interface';
import { TransactionOptions } from '@interfaces/keys.interface';
import {
  addToLoadingList,
  removeFromLoadingList,
} from '@popup/multichain/actions/loading.actions';
import {
  setErrorMessage,
  setSuccessMessage,
  setWarningMessage,
} from '@popup/multichain/actions/message.actions';
import {
  goBackToThenNavigate,
  navigateTo,
  navigateToWithParams,
} from '@popup/multichain/actions/navigation.actions';
import { setTitleContainerProperties } from '@popup/multichain/actions/title-container.actions';
import { RootState } from '@popup/multichain/store';
import { loadTokensMarket } from '@popup/steem/actions/token.actions';
import { BaseCurrencies } from '@popup/steem/utils/currency.utils';
import { KeysUtils } from '@popup/steem/utils/keys.utils';
import TokensUtils from '@popup/steem/utils/tokens.utils';
import { Screen } from '@reference-data/screen.enum';
import { IStep, KeychainKeyTypes } from '@steempro/steem-keychain-commons';
import { ThrottleSettings, throttle } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { ConnectedProps, connect } from 'react-redux';
import 'react-tabs/style/react-tabs.scss';
import { OperationButtonComponent } from 'src/common-ui/button/operation-button.component';
import { ConfirmationPageParams } from 'src/common-ui/confirmation-page/confirmation-page.component';
import {
  ComplexeCustomSelect,
  OptionItem,
} from 'src/common-ui/custom-select/custom-select.component';
import { CustomTooltip } from 'src/common-ui/custom-tooltip/custom-tooltip.component';
import { FormContainer } from 'src/common-ui/form-container/form-container.component';
import { SVGIcons } from 'src/common-ui/icons.enum';
import { InputType } from 'src/common-ui/input/input-type.enum';
import InputComponent from 'src/common-ui/input/input.component';
import RotatingLogoComponent from 'src/common-ui/rotating-logo/rotating-logo.component';
import ServiceUnavailablePage from 'src/common-ui/service-unavailable-page/service-unavailable-page.component';
import { SVGIcon } from 'src/common-ui/svg-icon/svg-icon.component';
import Config from 'src/config';
import FormatUtils from 'src/utils/format.utils';
import Logger from 'src/utils/logger.utils';
import { SwapTokenUtils } from 'src/utils/swap-token.utils';

const TokenSwaps = ({
  activeAccount,
  setErrorMessage,
  setSuccessMessage,
  navigateToWithParams,
  navigateTo,
  goBackToThenNavigate,
  addToLoadingList,
  removeFromLoadingList,
  setTitleContainerProperties,
  setWarningMessage,
  price,
  formParams,
}: PropsFromRedux) => {
  const [underMaintenance, setUnderMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [slippage, setSlippage] = useState(5);
  const [amount, setAmount] = useState<string>('');

  const [startToken, setStartToken] = useState<OptionItem>();
  const [endToken, setEndToken] = useState<OptionItem>();
  const [startTokenListOptions, setStartTokenListOptions] = useState<
    OptionItem[]
  >([]);
  const [endTokenListOptions, setEndTokenListOptions] = useState<OptionItem[]>(
    [],
  );
  const [estimate, setEstimate] = useState<IStep[]>();
  const [estimateValue, setEstimateValue] = useState<string | undefined>();

  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState<
    number | null
  >(null);

  const [isAdvancedParametersOpen, setIsAdvancedParametersOpen] =
    useState(false);

  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  const throttledRefresh = useMemo(() => {
    return throttle(
      (newAmount, newEndToken, newStartToken) => {
        if (parseFloat(newAmount) > 0 && newEndToken && newStartToken) {
          calculateEstimate(newAmount, newStartToken, newEndToken);
          setAutoRefreshCountdown(Config.swaps.autoRefreshPeriodSec);
        }
      },
      1000,
      { leading: false } as ThrottleSettings,
    );
  }, []);

  useEffect(() => {
    throttledRefresh(amount, endToken, startToken);
  }, [amount, endToken, startToken]);

  useEffect(() => {
    init();
    setTitleContainerProperties({
      title: 'popup_html_token_swaps',
      isBackButtonEnabled: true,
    });
    return () => {
      throttledRefresh.cancel();
    };
  }, []);

  const init = async () => {
    let tokenInitialization;
    try {
      setLoading(true);
      tokenInitialization = initTokenSelectOptions();
      const [serverStatus] = await Promise.all([
        SwapTokenUtils.getServerStatus(),
      ]);

      setUnderMaintenance(serverStatus.isMaintenanceOn);
      if (
        serverStatus.layerTwoDelayed &&
        (!['STEEM', 'SBD'].includes(endToken?.value.symbol) ||
          !['STEEM', 'SBD'].includes(startToken?.value.symbol))
      ) {
        setWarningMessage('swap_layer_two_delayed');
      }
    } catch (err: any) {
      Logger.error(err);
      setServiceUnavailable(true);
      // setErrorMessage(err.reason?.template, err.reason?.params);
    } finally {
      await tokenInitialization;

      if (formParams.startToken) {
        setStartToken(formParams.startToken);
      }
      if (formParams.endToken) {
        setEndToken(formParams.endToken);
      }
      if (formParams.amount) {
        setAmount(formParams.amount);
      }
      if (formParams.slipperage) {
        setSlippage(formParams.slipperage);
      }

      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoRefreshCountdown === null) {
      return;
    }

    if (autoRefreshCountdown === 0 && startToken && endToken) {
      calculateEstimate(amount, startToken, endToken);
      setAutoRefreshCountdown(Config.swaps.autoRefreshPeriodSec);
      return;
    }

    const a = setTimeout(() => {
      setAutoRefreshCountdown(autoRefreshCountdown! - 1);
    }, 1000);

    return () => {
      clearTimeout(a);
    };
  }, [autoRefreshCountdown]);

  const initTokenSelectOptions = async () => {
    const startList = await SwapTokenUtils.getSwapTokenStartList(
      activeAccount.account,
    );

    let list = startList.map((token) => {
      let img = '';
      let imgBackup = '';
      img =
        token.symbol === BaseCurrencies.STEEM.toUpperCase()
          ? `/assets/images/wallet/steem-logo.svg`
          : `/assets/images/wallet/sbd-logo.svg`;

      return {
        value: token,
        label: token.symbol,
        img: img,
        imgBackup,
      };
    });
    let endList: OptionItem[] = [
      {
        value: { symbol: BaseCurrencies.STEEM.toUpperCase(), precision: 3 },
        label: BaseCurrencies.STEEM.toUpperCase(),
        img: `/assets/images/wallet/steem-logo.svg`,
      },
      {
        value: { symbol: BaseCurrencies.SBD.toUpperCase(), precision: 3 },
        label: BaseCurrencies.SBD.toUpperCase(),
        img: `/assets/images/wallet/sbd-logo.svg`,
      },
    ];

    const lastUsed = await SwapTokenUtils.getLastUsed();
    setStartToken(
      lastUsed.from
        ? list.find((t) => t.value.symbol === lastUsed.from.symbol) || list[0]
        : list[0],
    );
    setStartTokenListOptions(list);
    const endTokenToSet = lastUsed.to
      ? endList.find((t) => t.value.symbol === lastUsed.to.symbol)
      : endList[1];
    setEndToken(endTokenToSet);
    setEndTokenListOptions(endList);
  };

  const calculateEstimate = async (
    amount: string,
    startToken: OptionItem,
    endToken: OptionItem,
  ) => {
    if (startToken === endToken) {
      setErrorMessage('swap_start_end_token_should_be_different');
      return;
    }

    try {
      setLoadingEstimate(true);
      setEstimate(undefined);
      setEstimateValue(undefined);
      const result = await SwapTokenUtils.getEstimate(
        startToken?.value.symbol,
        endToken?.value.symbol,
        amount,
        () => {
          setAutoRefreshCountdown(null);
        },
      );

      if (result?.steem_volume && result?.sbd_volume) {
        const value = Number(
          startToken.label === 'STEEM' ? result.highest_bid : result.lowest_ask,
        );
        const fee = 0;
        const finalValue = Number(Number(amount) * value - fee).toFixed(3);
        setEstimate([
          {
            provider: 'STEEM_INTERNAL_MARKET' as any,
            startToken: startToken.label,
            endToken: endToken.label,
            id: 0,
            amountStartToken: Number(amount),
            type: 'SELL_ON_MARKET' as any,
            estimate: Number(finalValue),
            stepNumber: 0,
          },
        ]);
        setEstimateValue(finalValue);
      } else {
        setEstimateValue(undefined);
      }
    } catch (err: any) {
      setEstimate(undefined);
      setErrorMessage(err.reason.template, err.reason.params);
    } finally {
      setLoadingEstimate(false);
    }
  };

  const processSwap = async () => {
    if (!estimate) {
      setErrorMessage('swap_no_estimate_error');
      return;
    }
    // if (slippage < swapConfig.slippage.min) {
    //   setErrorMessage('swap_min_slippage_error', [
    //     swapConfig.slippage.min.toString(),
    //   ]);
    //   return;
    // }
    if (startToken?.value.symbol === endToken?.value.symbol) {
      setErrorMessage('swap_start_end_token_should_be_different');
      return;
    }
    if (!amount || amount.length === 0) {
      setErrorMessage('popup_html_need_positive_amount');
      return;
    }

    if (parseFloat(amount) > parseFloat(startToken?.value.balance)) {
      setErrorMessage('steem_engine_overdraw_balance_error', [
        startToken?.label!,
      ]);
      return;
    }
    let estimateId: string;
    try {
      estimateId = await SwapTokenUtils.saveEstimate(
        estimate!,
        slippage,
        startToken?.value.symbol,
        endToken?.value.symbol,
        parseFloat(amount),
        activeAccount.name!,
      );
    } catch (err: any) {
      setErrorMessage(err.reason.template, err.reason.params);
      return;
    }

    const startTokenPrecision = await TokensUtils.getTokenPrecision(
      startToken?.value.symbol,
    );
    const endTokenPrecision = await TokensUtils.getTokenPrecision(
      endToken?.value.symbol,
    );

    const fields = [
      { label: 'html_popup_swap_swap_id', value: estimateId },
      {
        label: 'html_popup_swap_swap_amount',
        value: `${FormatUtils.withCommas(
          Number(amount).toFixed(startTokenPrecision),
        )} ${startToken?.value.symbol} => ${FormatUtils.withCommas(
          estimateValue!.toString(),
        )} ${endToken?.value.symbol}`,
      },
      {
        label: 'html_popup_swap_swap_slipperage',
        value: `${slippage}% (for each step)`,
      },
    ];

    navigateToWithParams(Screen.CONFIRMATION_PAGE, {
      method: KeychainKeyTypes.active,
      message: chrome.i18n.getMessage('html_popup_swap_token_confirm_message'),
      fields: fields,
      title: 'html_popup_swap_token_confirm_title',
      formParams: getFormParams(),
      afterConfirmAction: async (options?: TransactionOptions) => {
        addToLoadingList(
          'html_popup_swap_sending_token_to_swap_account',
          KeysUtils.getKeyType(
            activeAccount.keys.active!,
            activeAccount.keys.activePubkey!,
            activeAccount.account,
            activeAccount.account,
          ),
          [startToken?.value.symbol],
        );
        try {
          let success;

          // success = await SwapTokenUtils.processSwap(
          //   estimateId,
          //   startToken?.value.symbol,
          //   parseFloat(amount),
          //   activeAccount,
          //   options,
          // );

          removeFromLoadingList(
            'html_popup_swap_sending_token_to_swap_account',
          );

          if (success) {
            await SwapTokenUtils.saveLastUsed(
              startToken?.value,
              endToken?.value,
            );
            setSuccessMessage('swap_multisig_transaction_sent_to_signers');
            goBackToThenNavigate(Screen.TOKENS_SWAP_HISTORY);
          } else if (success && success?.['tx_id']) {
            await SwapTokenUtils.saveLastUsed(
              startToken?.value,
              endToken?.value,
            );
            await SwapTokenUtils.setAsInitiated(estimateId);
            setSuccessMessage('html_popup_swap_sending_token_successful');
            goBackToThenNavigate(Screen.TOKENS_SWAP_HISTORY);
          }
        } catch (err: any) {
          setErrorMessage(err.message);
        } finally {
          removeFromLoadingList('html_popup_delegate_rc_operation');
        }
      },
      afterCancelAction: async () => {
        await SwapTokenUtils.cancelSwap(estimateId);
      },
    } as ConfirmationPageParams);
  };

  const getFormParams = () => {
    return {
      startToken: startToken,
      endToken: endToken,
      amount: amount,
      slipperage: slippage,
    };
  };

  const swapStartAndEnd = () => {
    const option = startTokenListOptions.find(
      (option) => option.value.symbol === endToken?.value.symbol,
    );
    if (option) {
      const tmp = startToken;
      setStartToken(option);
      setEndToken(tmp);
    } else {
      setErrorMessage('swap_cannot_switch_tokens', endToken?.value.symbol);
    }
  };

  const getTokenUSDPrice = (
    estimateValue: string | undefined,
    symbol: string,
  ) => {
    if (!estimateValue) return '';
    else {
      let tokenPrice;
      if (symbol === BaseCurrencies.STEEM.toUpperCase()) {
        tokenPrice = price.steem.usd!;
      } else if (symbol === BaseCurrencies.SBD.toUpperCase()) {
        tokenPrice = price.steem_dollars.usd!;
      }
      return `≈ $${FormatUtils.withCommas(
        Number.parseFloat(estimateValue) + '',
        2,
      )}`;
    }
  };

  if (loading)
    return (
      <div className="rotating-logo-wrapper">
        <RotatingLogoComponent />
      </div>
    );
  else if (!startTokenListOptions.length) {
    return (
      <div className="token-swaps" aria-label="token-swaps">
        <div>
          <div className="caption">
            {' '}
            {chrome.i18n.getMessage('swap_no_token')}
          </div>
        </div>
      </div>
    );
  } else
    return (
      <div className="token-swaps" aria-label="token-swaps">
        {!loading && !underMaintenance && !serviceUnavailable && (
          <>
            <div className="caption">
              {chrome.i18n.getMessage('swap_caption')}
            </div>

            <div className="top-row">
              <div className="fee">{chrome.i18n.getMessage('swap_fee')}: 0</div>
              <SVGIcon
                className="swap-history-button"
                icon={SVGIcons.SWAPS_HISTORY}
                onClick={() => navigateTo(Screen.TOKENS_SWAP_HISTORY)}
              />
            </div>
            <FormContainer>
              <div className="form-fields">
                <div className="start-token">
                  <div className="inputs">
                    {startTokenListOptions.length > 0 && startToken && (
                      <ComplexeCustomSelect
                        selectedItem={startToken}
                        options={startTokenListOptions}
                        setSelectedItem={setStartToken}
                        label="token"
                        filterable
                      />
                    )}
                    <InputComponent
                      type={InputType.NUMBER}
                      value={amount}
                      onChange={setAmount}
                      label="popup_html_transfer_amount"
                      placeholder="popup_html_transfer_amount"
                      min={0}
                      rightActionClicked={() =>
                        setAmount(startToken?.value.balance)
                      }
                      rightActionIcon={SVGIcons.INPUT_MAX}
                    />
                  </div>
                  <span className="available">
                    {chrome.i18n.getMessage('popup_html_available')} :{' '}
                    {startToken?.value.balance
                      ? FormatUtils.withCommas(startToken?.value.balance)
                      : ''}
                  </span>
                </div>
                <SVGIcon
                  icon={SVGIcons.SWAPS_SWITCH}
                  onClick={swapStartAndEnd}
                  className="swap-icon"
                />
                <div className="end-token">
                  <div className="inputs">
                    {endTokenListOptions.length > 0 && endToken && (
                      <ComplexeCustomSelect
                        selectedItem={endToken}
                        options={endTokenListOptions}
                        setSelectedItem={setEndToken}
                        label="token"
                        filterable
                      />
                    )}
                    <CustomTooltip
                      color="grey"
                      message={getTokenUSDPrice(
                        estimateValue,
                        endToken?.value.symbol,
                      )}
                      position={'top'}
                      skipTranslation>
                      <InputComponent
                        type={InputType.TEXT}
                        value={
                          estimateValue
                            ? FormatUtils.withCommas(estimateValue!)
                            : ''
                        }
                        disabled
                        onChange={() => {}}
                        placeholder="popup_html_transfer_amount"
                        rightActionIconClassname={
                          loadingEstimate ? 'rotate' : ''
                        }
                        rightActionIcon={SVGIcons.SWAPS_ESTIMATE_REFRESH}
                        rightActionClicked={() => {
                          if (!estimate) return;
                          calculateEstimate(amount, startToken!, endToken!);
                          setAutoRefreshCountdown(
                            Config.swaps.autoRefreshPeriodSec,
                          );
                        }}
                      />
                    </CustomTooltip>
                  </div>
                  <div className="countdown">
                    {!!autoRefreshCountdown && (
                      <>
                        {
                          <span>
                            {chrome.i18n.getMessage(
                              'swap_autorefresh',
                              autoRefreshCountdown + '',
                            )}
                          </span>
                        }
                      </>
                    )}
                  </div>
                </div>
                <div className="advanced-parameters">
                  <div
                    className="title-panel"
                    onClick={() =>
                      setIsAdvancedParametersOpen(!isAdvancedParametersOpen)
                    }>
                    <div className="title">
                      {chrome.i18n.getMessage('swap_advanced_parameters')}
                    </div>
                    <SVGIcon
                      icon={SVGIcons.GLOBAL_ARROW}
                      onClick={() =>
                        setIsAdvancedParametersOpen(!isAdvancedParametersOpen)
                      }
                      className={`advanced-parameters-toggle ${
                        isAdvancedParametersOpen ? 'open' : 'closed'
                      }`}
                    />
                  </div>
                  {isAdvancedParametersOpen && (
                    <div className="advanced-parameters-container">
                      <InputComponent
                        type={InputType.NUMBER}
                        min={5}
                        step={1}
                        value={slippage}
                        onChange={setSlippage}
                        label="html_popup_swaps_slipperage"
                        placeholder="html_popup_swaps_slipperage"
                        // tooltip="html_popup_swaps_slippage_definition"
                      />
                    </div>
                  )}
                </div>
              </div>
              <OperationButtonComponent
                requiredKey={KeychainKeyTypesLC.active}
                onClick={processSwap}
                disabled={true}
                // label={'html_popup_swaps_process_swap'}
                label={'swap_under_maintenance'}
              />
            </FormContainer>
          </>
        )}

        {underMaintenance && (
          <div className="maintenance-mode">
            <SVGIcon icon={SVGIcons.MESSAGE_ERROR} />
            <div className="text">
              {chrome.i18n.getMessage('swap_under_maintenance')}
            </div>
          </div>
        )}
        {serviceUnavailable && <ServiceUnavailablePage />}
      </div>
    );
};

const mapStateToProps = (state: RootState) => {
  return {
    activeAccount: state.steem.activeAccount,
    price: state.steem.currencyPrices,
    tokenMarket: state.steem.tokenMarket,
    formParams: state.navigation.stack[0].previousParams?.formParams
      ? state.navigation.stack[0].previousParams?.formParams
      : {},
  };
};

const connector = connect(mapStateToProps, {
  setErrorMessage,
  setSuccessMessage,
  navigateToWithParams,
  navigateTo,
  addToLoadingList,
  removeFromLoadingList,
  goBackToThenNavigate,
  setTitleContainerProperties,
  loadTokensMarket,
  setWarningMessage,
});
type PropsFromRedux = ConnectedProps<typeof connector>;

export const TokenSwapsComponent = connector(TokenSwaps);
