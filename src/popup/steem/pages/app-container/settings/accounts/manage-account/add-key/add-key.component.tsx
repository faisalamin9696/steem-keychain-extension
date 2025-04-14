import {
  setErrorMessage,
  setSuccessMessage,
} from '@popup/multichain/actions/message.actions';
import { goBack } from '@popup/multichain/actions/navigation.actions';
import { setTitleContainerProperties } from '@popup/multichain/actions/title-container.actions';
import { RootState } from '@popup/multichain/store';
import { addKey } from '@popup/steem/actions/account.actions';
import { refreshActiveAccount } from '@popup/steem/actions/active-account.actions';
import AccountUtils from '@popup/steem/utils/account.utils';
import { Screen } from '@reference-data/screen.enum';
import { ExtendedAccount } from '@steempro/dsteem';
import React, { useEffect, useState } from 'react';
import { ConnectedProps, connect } from 'react-redux';
import ButtonComponent from 'src/common-ui/button/button.component';
import { InputType } from 'src/common-ui/input/input-type.enum';
import InputComponent from 'src/common-ui/input/input.component';
import { KeyType } from 'src/interfaces/keys.interface';
import ArrayUtils from 'src/utils/array.utils';

const AddKey = ({
  keyType,
  activeAccountName,
  activeAccount,
  localAccounts,
  mk,
  addKey,
  setTitleContainerProperties,
  setErrorMessage,
  refreshActiveAccount,
  setSuccessMessage,
  goBack,
}: PropsType) => {
  const [privateKey, setPrivateKey] = useState('');
  const [availableAuths, setAvailableAuths] = useState<any[]>([]);

  useEffect(() => {
    setTitleContainerProperties({
      title: 'popup_html_add_key',
      isBackButtonEnabled: true,
    });
    loadAuthorizedAccounts();
  }, []);

  const importKey = async () => {
    if (privateKey.trim().length === 0) {
      setErrorMessage('popup_accounts_fill');
      return;
    }
    addKey(privateKey.trim(), keyType, setErrorMessage);
    goBack();
  };

  const loadAuthorizedAccounts = async () => {
    activeAccount.account.posting;
    const auths: any = (
      activeAccount.account[
        keyType.toLowerCase() as keyof ExtendedAccount
      ] as any
    ).account_auths.map((auth: any) => auth[0]);

    setAvailableAuths(
      ArrayUtils.findCommons(
        auths,
        localAccounts.map((la) => la.name),
      ),
    );
  };

  const addAuth = async (username: string) => {
    await AccountUtils.addAuthorizedKey(
      activeAccount,
      username,
      localAccounts,
      mk,
      keyType,
    );
    refreshActiveAccount();
    setSuccessMessage('html_popup_successfully_add_key');
    goBack();
  };

  return (
    <div
      className="add-key-page"
      data-testid={`${Screen.SETTINGS_ADD_KEY}-page`}>
      <div
        data-testid="add-key-page-paragraph-introduction"
        className="caption"
        dangerouslySetInnerHTML={{
          __html: chrome.i18n.getMessage('popup_html_add_key_text', [
            keyType.substring(0, 1) + keyType.substring(1).toLowerCase(),
          ]),
        }}></div>

      <InputComponent
        dataTestId="input-private-key"
        type={InputType.PASSWORD}
        placeholder="popup_html_private_key"
        value={privateKey}
        onChange={setPrivateKey}
        onEnterPress={importKey}
      />

      {availableAuths.length > 0 && (
        <div className="available-auths">
          <div className="caption">
            {chrome.i18n.getMessage('html_add_available_authorities_caption')}
          </div>
          <div className="auths">
            {availableAuths.map((auth, index) => (
              <div className="auth" key={`account-auth-item-${auth}-${index}`}>
                <div className="item-account" onClick={() => addAuth(auth)}>
                  <img
                    className="account-img"
                    src={`https://steemitimages.com/u/${auth}/avatar`}
                    onError={(e: any) => {
                      e.target.onError = null;
                      e.target.src = '/assets/images/menu/accounts.svg';
                    }}
                  />
                  <div className="account-name">{auth}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="fill-space"></div>

      <ButtonComponent
        dataTestId="import-keys-button"
        label="popup_html_import_key"
        onClick={importKey}
      />
    </div>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    keyType: state.navigation.stack[0].params as KeyType,
    activeAccountName: state.steem.activeAccount.name,
    activeAccount: state.steem.activeAccount,
    localAccounts: state.steem.accounts,
    mk: state.mk,
  };
};

const connector = connect(mapStateToProps, {
  goBack,
  addKey,
  setTitleContainerProperties,
  setErrorMessage,
  setSuccessMessage,
  refreshActiveAccount,
});
type PropsType = ConnectedProps<typeof connector>;

export const AddKeyComponent = connector(AddKey);
