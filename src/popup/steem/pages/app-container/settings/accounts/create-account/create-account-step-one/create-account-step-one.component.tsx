import { LocalAccount } from '@interfaces/local-account.interface';
import { setErrorMessage } from '@popup/multichain/actions/message.actions';
import { navigateToWithParams } from '@popup/multichain/actions/navigation.actions';
import { setTitleContainerProperties } from '@popup/multichain/actions/title-container.actions';
import { RootState } from '@popup/multichain/store';
import {
  AccountCreationType,
  AccountCreationUtils,
} from '@popup/steem/utils/account-creation.utils';
import AccountUtils from '@popup/steem/utils/account.utils';
import CurrencyUtils from '@popup/steem/utils/currency.utils';
import SteemUtils from '@popup/steem/utils/steem.utils';
import { Screen } from '@reference-data/screen.enum';
import { Asset as CommonAsset } from '@steempro/steem-keychain-commons';
import React, { useEffect, useState } from 'react';
import { ConnectedProps, connect } from 'react-redux';
import ButtonComponent from 'src/common-ui/button/button.component';
import {
  ComplexeCustomSelect,
  OptionItem,
} from 'src/common-ui/custom-select/custom-select.component';
import { SVGIcons } from 'src/common-ui/icons.enum';
import { InputType } from 'src/common-ui/input/input-type.enum';
import InputComponent from 'src/common-ui/input/input.component';

interface AccountItemOption extends OptionItem {
  img: string;
}

const CreateAccountStepOne = ({
  activeAccount,
  accounts,
  currencyLabels,
  setTitleContainerProperties,
  navigateToWithParams,
}: PropsFromRedux) => {
  const [accountOptions, setAccountOptions] = useState<AccountItemOption[]>();
  const [selectedAccount, setSelectedAccount] = useState<AccountItemOption>();
  const [accountName, setAccountName] = useState('');
  const [price, setPrice] = useState(3);
  const [creationType, setCreationType] = useState<AccountCreationType>();

  useEffect(() => {
    setTitleContainerProperties({
      title: 'popup_html_create_account',
      isBackButtonEnabled: true,
    });
    initPrice();
  }, []);

  const initPrice = async () => {
    setPrice(await SteemUtils.getAccountPrice());
  };

  useEffect(() => {
    setSelectedAccount({
      label: `@${activeAccount.name!}`,
      value: activeAccount.name!,
      canDelete: false,
      img: `https://steemitimages.com/u/${activeAccount.name!}/avatar`,
    });
  }, [activeAccount]);

  useEffect(() => {
    initAccountOptions();
  }, [accounts]);

  const initAccountOptions = async () => {
    const options = [];
    for (const account of accounts as LocalAccount[]) {
      options.push({
        label: `@${account.name!}`,
        value: account.name!,
        img: `https://steemitimages.com/u/${account.name!}/avatar`,
        canDelete: false,
      });
    }
    setAccountOptions(options);
  };

  useEffect(() => {
    onSelectedAccountChanged(selectedAccount?.value!);
  }, [selectedAccount]);

  const onSelectedAccountChanged = async (username: string) => {
    if (!selectedAccount) {
      return;
    }
    const account = (await AccountUtils.getExtendedAccount(username)) as any;

    if (account.pending_claimed_accounts > 0) {
      setPrice(0);
      setCreationType(AccountCreationType.USING_TICKET);
    } else {
      setPrice(3);
      setCreationType(AccountCreationType.BUYING);
    }
  };

  const validateAccountName = async () => {
    if (accountName.length < 3) {
      setErrorMessage('html_popup_create_account_username_too_short');
      return false;
    }
    if (!AccountCreationUtils.validateUsername(accountName)) {
      setErrorMessage('html_popup_create_account_account_name_not_valid');
      return false;
    }
    if (await AccountCreationUtils.checkAccountNameAvailable(accountName)) {
      return true;
    } else {
      setErrorMessage('html_popup_create_account_username_already_used');
      return false;
    }
  };

  const getPriceLabel = () => {
    switch (creationType) {
      case AccountCreationType.BUYING:
        return `${price} ${currencyLabels.steem}`;
      case AccountCreationType.USING_TICKET:
        return chrome.i18n.getMessage('html_popup_ticket', ['1']);
    }
  };

  const goToNextPage = async () => {
    if (await validateAccountName()) {
      const account = await AccountUtils.getExtendedAccount(
        selectedAccount?.value!,
      );
      const balance = CommonAsset.fromString(account.balance.toString());
      if (
        creationType === AccountCreationType.USING_TICKET ||
        (creationType === AccountCreationType.BUYING && balance.amount >= 3)
      ) {
        navigateToWithParams(Screen.CREATE_ACCOUNT_PAGE_STEP_TWO, {
          usedAccount: accounts.find(
            (localAccount: LocalAccount) =>
              localAccount.name === selectedAccount?.value,
          ),
          newUsername: accountName,
          creationType: creationType,
          price: price,
        });
      } else {
        setErrorMessage('html_popup_account_creation_not_enough_found');
      }
    }
  };

  return (
    <div
      data-testid={`${Screen.CREATE_ACCOUNT_PAGE_STEP_ONE}-page`}
      className="create-account-step-one">
      {selectedAccount && accountOptions && (
        <ComplexeCustomSelect<AccountItemOption>
          selectedItem={selectedAccount}
          options={accountOptions}
          setSelectedItem={(item: AccountItemOption) =>
            setSelectedAccount(item)
          }
          background="white"
        />
      )}
      <div className="price-panel">
        <span className="label">
          {chrome.i18n.getMessage('html_popup_price')}
        </span>
        <span className="price">{getPriceLabel()}</span>
      </div>
      <InputComponent
        onChange={setAccountName}
        value={accountName}
        logo={SVGIcons.INPUT_AT}
        placeholder="popup_html_username"
        label="popup_html_username"
        type={InputType.TEXT}
      />
      <div className="fill-space"></div>
      <ButtonComponent label="html_popup_next" onClick={() => goToNextPage()} />
    </div>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    activeAccount: state.steem.activeAccount,
    accounts: state.steem.accounts,
    currencyLabels: CurrencyUtils.getCurrencyLabels(
      state.steem.activeRpc?.testnet!,
    ),
  };
};

const connector = connect(mapStateToProps, {
  setTitleContainerProperties,
  navigateToWithParams,
});
type PropsFromRedux = ConnectedProps<typeof connector>;

export const CreateAccountStepOneComponent = connector(CreateAccountStepOne);
