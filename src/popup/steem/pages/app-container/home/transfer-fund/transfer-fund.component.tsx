import { joiResolver } from '@hookform/resolvers/joi';
import { AutoCompleteValues } from '@interfaces/autocomplete.interface';
import {
  KeychainKeyTypes,
  KeychainKeyTypesLC,
} from '@interfaces/keychain.interface';
import { TransactionOptions } from '@interfaces/keys.interface';
import {
  addToLoadingList,
  removeFromLoadingList,
} from '@popup/multichain/actions/loading.actions';
import {
  setErrorMessage,
  setSuccessMessage,
} from '@popup/multichain/actions/message.actions';
import {
  navigateTo,
  navigateToWithParams,
} from '@popup/multichain/actions/navigation.actions';
import { setTitleContainerProperties } from '@popup/multichain/actions/title-container.actions';
import { RootState } from '@popup/multichain/store';
import { fetchPhishingAccounts } from '@popup/steem/actions/phishing.actions';
import AccountUtils from '@popup/steem/utils/account.utils';
import CurrencyUtils, {
  CurrencyLabels,
} from '@popup/steem/utils/currency.utils';
import { FavoriteUserUtils } from '@popup/steem/utils/favorite-user.utils';
import { KeysUtils } from '@popup/steem/utils/keys.utils';
import SteemUtils from '@popup/steem/utils/steem.utils';
import TransferUtils from '@popup/steem/utils/transfer.utils';
import Joi from 'joi';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ConnectedProps, connect } from 'react-redux';
import { BalanceSectionComponent } from 'src/common-ui/balance-section/balance-section.component';
import { OperationButtonComponent } from 'src/common-ui/button/operation-button.component';
import { ConfirmationPageParams } from 'src/common-ui/confirmation-page/confirmation-page.component';
import {
  ComplexeCustomSelect,
  OptionItem,
} from 'src/common-ui/custom-select/custom-select.component';
import { FormContainer } from 'src/common-ui/form-container/form-container.component';
import { SVGIcons } from 'src/common-ui/icons.enum';
import { FormInputComponent } from 'src/common-ui/input/form-input.component';
import { InputType } from 'src/common-ui/input/input-type.enum';
import { Screen } from 'src/reference-data/screen.enum';
import { FormUtils } from 'src/utils/form.utils';
import FormatUtils from 'src/utils/format.utils';
import Logger from 'src/utils/logger.utils';

interface TransferForm {
  receiverUsername: string;
  selectedCurrency: keyof CurrencyLabels;
  amount: number;
  memo: string;
  encrypted: boolean;
}

const transferFormRules = FormUtils.createRules<TransferForm>({
  receiverUsername: Joi.string().required(),
});

const TransferFunds = ({
  activeAccount,
  navParams,
  currencyLabels,
  phishing,
  formParams,
  localAccounts,
  setErrorMessage,
  setSuccessMessage,
  navigateToWithParams,
  navigateTo,
  fetchPhishingAccounts,
  addToLoadingList,
  removeFromLoadingList,
  setTitleContainerProperties,
}: PropsFromRedux) => {
  const { control, handleSubmit, setValue, watch } = useForm<TransferForm>({
    defaultValues: {
      receiverUsername: formParams.receiverUsername
        ? formParams.receiverUsername
        : '',
      selectedCurrency: formParams.selectedCurrency
        ? formParams.selectedCurrency
        : navParams.selectedCurrency,
      amount: formParams.amount ? formParams.amount : '',
      memo: formParams.memo ? formParams.memo : '',
      encrypted: formParams.encrypted ? formParams.encrypted : false,
    },
    resolver: (values, context, options) => {
      const resolver = joiResolver<Joi.ObjectSchema<TransferForm>>(
        transferFormRules,
        { context: { balance: balance }, errors: { render: true } },
      );
      return resolver(values, { balance: balance }, options);
    },
  });

  const [balance, setBalance] = useState<string | number>('...');

  const [autocompleteFavoriteUsers, setAutocompleteFavoriteUsers] =
    useState<AutoCompleteValues>({
      categories: [],
    });

  let balances = {
    steem: FormatUtils.toNumber(activeAccount.account.balance),
    sbd: FormatUtils.toNumber(activeAccount.account.sbd_balance),
    sp: 0,
  };

  Logger.log(`activeAccount ${activeAccount}`);
  useEffect(() => {
    fetchPhishingAccounts();
    loadAutocompleteTransferUsernames();
    setTitleContainerProperties({
      title: 'popup_html_transfer_funds',
      isBackButtonEnabled: true,
    });
  }, []);

  useEffect(() => {
    setBalance(balances[watch('selectedCurrency')]);
  }, [watch('selectedCurrency')]);

  const options = [
    { label: currencyLabels.steem, value: 'steem' as keyof CurrencyLabels },
    { label: currencyLabels.sbd, value: 'sbd' as keyof CurrencyLabels },
  ];

  const loadAutocompleteTransferUsernames = async () => {
    const autoCompleteListByCategories: AutoCompleteValues =
      await FavoriteUserUtils.getAutocompleteListByCategories(
        activeAccount.name!,
        localAccounts,
        { addExchanges: true, token: watch('selectedCurrency').toUpperCase() },
      );
    setAutocompleteFavoriteUsers(autoCompleteListByCategories);
  };

  const setAmountToMaxValue = () => {
    setValue('amount', parseFloat(balance.toString()));
  };

  const getFormParams = () => {
    return watch();
  };

  const handleClickOnSend = async (form: TransferForm) => {
    if (form.amount <= 0) {
      setErrorMessage('popup_html_need_positive_amount');
      return;
    }

    if (parseFloat(form.amount.toString()) > parseFloat(balance.toString())) {
      setErrorMessage('popup_html_power_up_down_error');
      return;
    }

    const formattedAmount = `${parseFloat(form.amount.toString()).toFixed(3)} ${
      currencyLabels[form.selectedCurrency]
    }`;

    const stringifiedAmount = `${FormatUtils.formatCurrencyValue(
      parseFloat(form.amount.toString()),
    )} ${currencyLabels[form.selectedCurrency]}`;

    let memoField = form.memo;
    if (form.memo.length) {
      if (form.memo.startsWith('#') || form.encrypted) {
        memoField = `${form.memo} (${chrome.i18n.getMessage(
          'popup_encrypted',
        )})`;
        if (!activeAccount.keys.memo) {
          setErrorMessage('popup_html_memo_key_missing');
          return;
        }
      }
    } else {
      memoField = chrome.i18n.getMessage('popup_empty');
    }

    let fields = [
      { label: 'popup_html_transfer_from', value: `@${activeAccount.name}` },
      { label: 'popup_html_transfer_to', value: `@${form.receiverUsername}` },
      { label: 'popup_html_transfer_amount', value: stringifiedAmount },
      { label: 'popup_html_transfer_memo', value: memoField },
    ];

    let warningMessage = await TransferUtils.getTransferWarning(
      form.receiverUsername,
      currencyLabels[form.selectedCurrency],
      form.memo,
      phishing,
    );
    navigateToWithParams(Screen.CONFIRMATION_PAGE, {
      method: KeychainKeyTypes.active,
      message: chrome.i18n.getMessage('popup_html_transfer_confirm_text'),
      fields: fields,
      warningMessage: warningMessage,
      skipWarningTranslation: true,
      title: 'popup_html_transfer_funds',
      formParams: getFormParams(),
      afterConfirmAction: async (options?: TransactionOptions) => {
        addToLoadingList(
          'html_popup_transfer_fund_operation',
          KeysUtils.getKeyType(
            activeAccount.keys.active!,
            activeAccount.keys.activePubkey!,
          ),
        );
        try {
          let success;
          let memoParam = form.memo;
          if (form.memo.length) {
            if (form.memo.startsWith('#') || form.encrypted) {
              if (!activeAccount.keys.memo) {
                setErrorMessage('popup_html_memo_key_missing');
                return;
              } else {
                memoParam = SteemUtils.encodeMemo(
                  `${!form.memo.startsWith('#') ? '#' : ''}${form.memo}`,
                  activeAccount.keys.memo.toString(),
                  await AccountUtils.getPublicMemo(form.receiverUsername),
                );
              }
            }
          }

          success = await TransferUtils.sendTransfer(
            activeAccount.name!,
            form.receiverUsername,
            formattedAmount,
            memoParam,
            activeAccount.keys.active!,
            options,
          );

          removeFromLoadingList('html_popup_transfer_fund_operation');

          if (success) {
            navigateTo(Screen.HOME_PAGE, true);
            await FavoriteUserUtils.saveFavoriteUser(
              form.receiverUsername,
              activeAccount,
            );

            if (success.isUsingMultisig) {
              setSuccessMessage('multisig_transaction_sent_to_signers');
            } else {
              setSuccessMessage('popup_html_transfer_successful', [
                `@${form.receiverUsername}`,
                stringifiedAmount,
              ]);
            }
          } else {
            setErrorMessage('popup_html_transfer_failed');
          }
        } catch (err: any) {
          Logger.error(err);
          setErrorMessage(err.message, err.messageParams);
        } finally {
          removeFromLoadingList('html_popup_transfer_fund_operation');
        }
      },
    } as ConfirmationPageParams);
  };

  return (
    <>
      <div
        className="transfer-funds-page"
        data-testid={`${Screen.TRANSFER_FUND_PAGE}-page`}>
        <BalanceSectionComponent
          value={balance}
          unit={currencyLabels[watch('selectedCurrency')]}
          label="popup_html_balance"
        />

        <FormContainer onSubmit={handleSubmit(handleClickOnSend)}>
          <div className="form-fields">
            <FormInputComponent
              name="receiverUsername"
              control={control}
              dataTestId="input-username"
              type={InputType.TEXT}
              logo={SVGIcons.INPUT_AT}
              placeholder="popup_html_username"
              label="popup_html_username"
              autocompleteValues={autocompleteFavoriteUsers}
            />
            <div className="value-panel">
              <ComplexeCustomSelect
                label="popup_html_currency"
                options={options}
                selectedItem={
                  {
                    value: watch('selectedCurrency'),
                    label:
                      currencyLabels[
                        watch('selectedCurrency') as keyof CurrencyLabels
                      ],
                  } as OptionItem
                }
                setSelectedItem={(item) =>
                  setValue(
                    'selectedCurrency',
                    item.value as keyof CurrencyLabels,
                  )
                }
              />

              <div className="value-input-panel">
                <FormInputComponent
                  name="amount"
                  control={control}
                  dataTestId="amount-input"
                  type={InputType.NUMBER}
                  label="popup_html_transfer_amount"
                  placeholder="0.000"
                  skipPlaceholderTranslation
                  min={0}
                  rightActionClicked={setAmountToMaxValue}
                  rightActionIcon={SVGIcons.INPUT_MAX}
                />
              </div>
            </div>

            <FormInputComponent
              name="memo"
              control={control}
              dataTestId="input-memo-optional"
              type={InputType.TEXT}
              label="popup_html_memo_optional"
              placeholder="popup_html_memo_optional"
              rightActionClicked={() =>
                setValue('encrypted', !watch('encrypted'))
              }
              rightActionIcon={
                watch('encrypted')
                  ? SVGIcons.INPUT_ENCRYPT
                  : SVGIcons.INPUT_DECRYPT
              }
            />
            <div className="memo-status">
              {watch('encrypted') ? 'Note: Memo encryption enabled' : ''}
            </div>
          </div>
          <OperationButtonComponent
            dataTestId="send-transfer"
            requiredKey={KeychainKeyTypesLC.active}
            onClick={handleSubmit(handleClickOnSend)}
            label={'popup_html_send_transfer'}
          />
        </FormContainer>
      </div>
    </>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    activeAccount: state.steem.activeAccount,
    currencyLabels: CurrencyUtils.getCurrencyLabels(
      state.steem.activeRpc?.testnet!,
    ),
    navParams: state.navigation.stack[0].params,
    formParams: state.navigation.stack[0].previousParams?.formParams
      ? state.navigation.stack[0].previousParams?.formParams
      : {},
    phishing: state.steem.phishing,
    localAccounts: state.steem.accounts,
  };
};

const connector = connect(mapStateToProps, {
  setErrorMessage,
  setSuccessMessage,
  navigateToWithParams,
  navigateTo,
  fetchPhishingAccounts,
  addToLoadingList,
  removeFromLoadingList,
  setTitleContainerProperties,
});
type PropsFromRedux = ConnectedProps<typeof connector>;

export const TransferFundsComponent = connector(TransferFunds);
