import { KeychainKeyTypesLC } from '@interfaces/keychain.interface';
import {
  WitnessFormField,
  WitnessInfo,
  WitnessParamsForm,
} from '@interfaces/witness.interface';
import {
  addToLoadingList,
  removeFromLoadingList,
} from '@popup/multichain/actions/loading.actions';
import {
  setErrorMessage,
  setSuccessMessage,
} from '@popup/multichain/actions/message.actions';
import { RootState } from '@popup/multichain/store';
import { refreshActiveAccount } from '@popup/steem/actions/active-account.actions';
import BlockchainTransactionUtils from '@popup/steem/utils/blockchain.utils';
import { BaseCurrencies } from '@popup/steem/utils/currency.utils';
import WitnessUtils from '@popup/steem/utils/witness.utils';
import { PriceType } from '@steempro/dsteem';
import React, { useState } from 'react';
import { ConnectedProps, connect } from 'react-redux';
import 'react-tabs/style/react-tabs.scss';
import ButtonComponent, {
  ButtonType,
} from 'src/common-ui/button/button.component';
import { OperationButtonComponent } from 'src/common-ui/button/operation-button.component';
import { InputType } from 'src/common-ui/input/input-type.enum';
import InputComponent from 'src/common-ui/input/input.component';

interface EditMyWitnessProps {
  witnessInfo: WitnessInfo;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const EditMyWitness = ({
  witnessInfo,
  setEditMode,
  activeAccount,
  addToLoadingList,
  removeFromLoadingList,
  setErrorMessage,
  setSuccessMessage,
  refreshActiveAccount,
}: PropsFromRedux & EditMyWitnessProps) => {
  const [formParams, setFormParams] = useState<WitnessParamsForm>({
    accountCreationFee: witnessInfo.params.accountCreationFee,
    maximumBlockSize: witnessInfo.params.maximumBlockSize,
    sbdInterestRate: witnessInfo.params.sbdInterestRate,
    signingKey: witnessInfo.signingKey,
    url: witnessInfo.url,
  });

  const handleUpdateWitnessProps = async () => {
    if (!(formParams.signingKey as string).startsWith('STM')) {
      setErrorMessage('popup_html_public_key_needed');
      return;
    }
    try {
      addToLoadingList('html_popup_update_witness_operation');
      const success = await WitnessUtils.updateWitnessParameters(
        activeAccount.name!,
        formParams,
        activeAccount.keys.active!,
      );
      addToLoadingList('html_popup_confirm_transaction_operation');
      removeFromLoadingList('html_popup_update_witness_operation');
      await BlockchainTransactionUtils.delayRefresh();
      removeFromLoadingList('html_popup_confirm_transaction_operation');
      refreshActiveAccount();
      if (success) {
        goBackPage();

        if (success.isUsingMultisig) {
          setSuccessMessage('multisig_transaction_sent_to_signers');
        } else setSuccessMessage('popup_success_witness_account_update');
      } else {
        setErrorMessage('popup_error_witness_account_update', [
          `${activeAccount.name!}`,
        ]);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      removeFromLoadingList('html_popup_update_witness_operation');
      removeFromLoadingList('html_popup_confirm_transaction_operation');
    } finally {
      removeFromLoadingList('html_popup_confirm_transaction_operation');
      removeFromLoadingList('html_popup_confirm_transaction_operation');
    }
  };

  const handleFormParams = (
    name: WitnessFormField,
    value: string | PriceType,
  ) => {
    setFormParams((prevFormParams) => {
      return { ...prevFormParams, [name]: value };
    });
  };

  const goBackPage = () => {
    setEditMode(false);
  };

  return (
    <div className="edit-my-witness-component">
      <div className="field">
        <InputComponent
          label="popup_html_currency"
          type={InputType.TEXT}
          value={BaseCurrencies.STEEM.toUpperCase()}
          onChange={() => null}
          disabled
        />
        <InputComponent
          label="popup_html_witness_information_account_creation_fee_label"
          type={InputType.TEXT}
          placeholder="popup_html_witness_information_account_creation_fee_placeholder_text"
          value={formParams.accountCreationFee}
          onChange={(value) => handleFormParams('accountCreationFee', value)}
        />
      </div>
      <InputComponent
        label="popup_html_witness_information_maximum_block_size_label"
        type={InputType.TEXT}
        placeholder="popup_html_witness_information_block_size_placeholder_text"
        value={formParams.maximumBlockSize}
        onChange={(value) => handleFormParams('maximumBlockSize', value)}
      />
      <InputComponent
        label="popup_html_witness_information_sbd_interest_rate_label"
        type={InputType.TEXT}
        placeholder="popup_html_witness_information_sbd_interest_rate_placeholder_text"
        value={formParams.sbdInterestRate}
        onChange={(value) => handleFormParams('sbdInterestRate', value)}
      />
      <InputComponent
        type={InputType.TEXT}
        label="popup_html_witness_information_signing_key_label"
        placeholder="popup_html_witness_information_signing_key_label"
        value={formParams.signingKey}
        onChange={(value) => handleFormParams('signingKey', value)}
      />
      <InputComponent
        type={InputType.TEXT}
        label="popup_html_witness_information_url_label"
        placeholder="popup_html_witness_information_url_label"
        value={formParams.url}
        onChange={(value) => handleFormParams('url', value)}
      />
      <div className="bottom-panel">
        <ButtonComponent
          label={'popup_html_button_label_cancel'}
          onClick={() => goBackPage()}
          type={ButtonType.ALTERNATIVE}
        />
        <OperationButtonComponent
          requiredKey={KeychainKeyTypesLC.active}
          onClick={() => handleUpdateWitnessProps()}
          label={'popup_html_operation_button_save'}
        />
      </div>
    </div>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    activeAccount: state.steem.activeAccount,
  };
};

const connector = connect(mapStateToProps, {
  addToLoadingList,
  removeFromLoadingList,
  setErrorMessage,
  setSuccessMessage,
  refreshActiveAccount,
});
type PropsFromRedux = ConnectedProps<typeof connector>;

export const EditMyWitnessComponent = connector(EditMyWitness);
