import {
  DefaultAccountHistoryApis,
  DefaultSteemEngineRpcs,
} from '@interfaces/steem-engine-rpc.interface';
import {
  setErrorMessage,
  setSuccessMessage,
} from '@popup/multichain/actions/message.actions';
import { setTitleContainerProperties } from '@popup/multichain/actions/title-container.actions';
import { RootState } from '@popup/multichain/store';
import { setActiveRpc } from '@popup/steem/actions/active-rpc.actions';
import {
  setHEActiveAccountHistoryApi,
  setHEActiveRpc,
} from '@popup/steem/actions/steem-engine-config.actions';
import RpcUtils from '@popup/steem/utils/rpc.utils';
import { SteemEngineConfigUtils } from '@popup/steem/utils/steemengine-config.utils';
import { LocalStorageKeyEnum } from '@reference-data/local-storage-key.enum';
import { Screen } from '@reference-data/screen.enum';
import React, { BaseSyntheticEvent, useEffect, useState } from 'react';
import { ConnectedProps, connect } from 'react-redux';
import { CheckboxPanelComponent } from 'src/common-ui/checkbox/checkbox-panel/checkbox-panel.component';
import CheckboxComponent from 'src/common-ui/checkbox/checkbox/checkbox.component';
import {
  ComplexeCustomSelect,
  OptionItem,
} from 'src/common-ui/custom-select/custom-select.component';
import { SVGIcons } from 'src/common-ui/icons.enum';
import { InputType } from 'src/common-ui/input/input-type.enum';
import InputComponent from 'src/common-ui/input/input.component';
import { Separator } from 'src/common-ui/separator/separator.component';
import { SVGIcon } from 'src/common-ui/svg-icon/svg-icon.component';
import { Rpc } from 'src/interfaces/rpc.interface';
import ArrayUtils from 'src/utils/array.utils';
import LocalStorageUtils from 'src/utils/localStorage.utils';
import * as ValidUrl from 'valid-url';

interface RpcListItem {
  label: string;
  value: string;
  rpc: Rpc;
  canDelete: boolean;
}

const RpcNodes = ({
  activeRpc,
  activeAccountHistoryApi,
  activeHERpc,
  setActiveRpc,
  setHEActiveAccountHistoryApi,
  setHEActiveRpc,
  setErrorMessage,
  setSuccessMessage,
  setTitleContainerProperties,
}: PropsFromRedux) => {
  const allRpc = RpcUtils.getFullList();
  let displayedRpcs = allRpc;
  // Steem RPC
  const [customRpcs, setCustomRpcs] = useState([] as Rpc[]);
  const [isAddRpcPanelDisplayed, setIsAddRpcPanelDisplayed] = useState(false);
  const [switchAuto, setSwitchAuto] = useState(true);
  const [addRpcNodeUri, setAddRpcNodeUri] = useState('');
  const [addRpcNodeChainId, setAddRpcNodeChainId] = useState('');
  const [addRpcNodeTestnet, setAddRpcNodeTestnet] = useState(false);
  const [setNewRpcAsActive, setSetNewRpcAsActive] = useState(false);

  const [steemRpcOptions, setSteemRpcOptions] = useState(
    allRpc.map((rpc) => {
      return {
        label: rpc.uri,
        value: rpc.uri,
        rpc: rpc,
        canDelete: RpcUtils.isDefault(rpc),
      };
    }),
  );

  // Steem Engine RPC
  const [steemEngineRpcOptions, setSteemEngineRpcOptions] = useState<
    OptionItem[]
  >([]);
  const [newHERpc, setNewHERpc] = useState('');
  const [isNewHERpcPanelOpened, setIsNewHERpcPanelOpened] = useState(false);
  const [setNewHeRpcAsActive, setSetNewHeRpcAsActive] = useState(false);

  const deleteHeRpc = async (option: OptionItem, event: any) => {
    event.preventDefault();
    event.stopPropagation();
    await SteemEngineConfigUtils.deleteCustomRpc(option.value);
    initLayer2();
  };

  // Steem Engine account history
  const [accountHistoryApiOptions, setAccountHistoryApiOptions] = useState<
    OptionItem[]
  >([]);
  const [isNewAccountHistoryPanelOpened, setIsNewAccountHistoryPanelOpened] =
    useState(false);
  const [newAccountHistory, setNewAccountHistory] = useState('');
  const [setNewAccountHistoryAsActive, setSetNewAccountHistoryAsActive] =
    useState(false);

  const deleteAccountHistoryApi = async (option: OptionItem, event: any) => {
    event.preventDefault();
    event.stopPropagation();

    await SteemEngineConfigUtils.deleteCustomAccountHistoryApi(option.value);
    initLayer2();
  };

  useEffect(() => {
    initLayer2();
  }, []);

  const initLayer2 = async () => {
    const customRpcs = await SteemEngineConfigUtils.getCustomRpcs();
    const rpcFullList = ArrayUtils.mergeWithoutDuplicate(
      customRpcs,
      DefaultSteemEngineRpcs,
    );

    const rpcOpts = rpcFullList.map((rpc) => {
      return {
        panelType: 'rpc',
        label: rpc.replace('http://', '').replace('https://', '').split('/')[0],
        value: rpc,
        canDelete: !SteemEngineConfigUtils.isRpcDefault(rpc),
      };
    });
    setSteemEngineRpcOptions(rpcOpts);

    const customAccountHistoryApi =
      await SteemEngineConfigUtils.getCustomAccountHistoryApi();
    const accountHistoryApiFullList = ArrayUtils.mergeWithoutDuplicate(
      customAccountHistoryApi,
      DefaultAccountHistoryApis,
    );
    const accountHistoryApiOpts = accountHistoryApiFullList.map((api) => {
      return {
        panelType: 'account-history-api',
        label: api.replace('http://', '').replace('https://', '').split('/')[0],
        value: api,
        canDelete: !SteemEngineConfigUtils.isAccountHistoryApiDefault(api),
      };
    });

    setAccountHistoryApiOptions(accountHistoryApiOpts);
  };

  useEffect(() => {
    displayedRpcs = [...allRpc, ...customRpcs];
    setSteemRpcOptions(
      displayedRpcs.map((rpc) => {
        return {
          label: rpc.uri,
          value: rpc.uri,
          rpc: rpc,
          canDelete: !RpcUtils.isDefault(rpc),
        };
      }),
    );
  }, [customRpcs]);

  useEffect(() => {
    setTitleContainerProperties({
      title: 'popup_html_rpc_node',
      isBackButtonEnabled: true,
    });
    initCustomRpcList();
    initSwitchAuto();
  }, []);

  useEffect(() => {
    LocalStorageUtils.saveValueInLocalStorage(
      LocalStorageKeyEnum.SWITCH_RPC_AUTO,
      switchAuto,
    );
  }, [switchAuto]);

  const initSwitchAuto = async () => {
    setSwitchAuto(
      await LocalStorageUtils.getValueFromLocalStorage(
        LocalStorageKeyEnum.SWITCH_RPC_AUTO,
      ),
    );
  };

  const initCustomRpcList = async () => {
    setCustomRpcs(await RpcUtils.getCustomRpcs());
  };

  const deleteCustomSteemRPC = async (
    item: OptionItem,
    event: BaseSyntheticEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const newRpcs = RpcUtils.deleteCustomRpc(customRpcs, (item as any).rpc);
    setCustomRpcs(newRpcs);
    initCustomRpcList();
  };

  const saveNewSteemRpc = () => {
    if (
      !addRpcNodeUri.length ||
      (addRpcNodeTestnet && !addRpcNodeChainId.length)
    ) {
      setErrorMessage('popup_html_rpc_missing_fields');
      return;
    }
    if (!ValidUrl.isWebUri(addRpcNodeUri)) {
      setErrorMessage('html_popup_url_not_valid');
      return;
    }
    if (displayedRpcs.find((rpc) => rpc.uri === addRpcNodeUri)) {
      setErrorMessage('popup_html_rpc_uri_already_existing');
      return;
    }

    const newCustomRpc = {
      uri: addRpcNodeUri,
      testnet: addRpcNodeTestnet,
      chainId: addRpcNodeChainId.length ? addRpcNodeChainId : undefined,
    };
    setIsAddRpcPanelDisplayed(false);
    RpcUtils.addCustomRpc(newCustomRpc);
    setCustomRpcs([...customRpcs, newCustomRpc]);
    if (setNewRpcAsActive) {
      setSwitchAuto(false);
      setActiveRpc(newCustomRpc);
    }
  };

  const saveAccountHistory = async () => {
    if (accountHistoryApiOptions.find((e) => e.value === newAccountHistory)) {
      setErrorMessage('html_popup_rpc_already_exist');
      return;
    }
    if (ValidUrl.isWebUri(newAccountHistory)) {
      await SteemEngineConfigUtils.addCustomAccountHistoryApi(
        newAccountHistory,
      );
      setNewAccountHistory('');
      setIsNewAccountHistoryPanelOpened(false);
      setSuccessMessage('html_popup_new_account_history_save_success');
      initLayer2();
    } else {
      setErrorMessage('html_popup_url_not_valid');
    }
  };

  const saveSteemEngineRpc = async () => {
    if (steemEngineRpcOptions.find((e) => e.value === newHERpc)) {
      setErrorMessage('html_popup_rpc_already_exist');
      return;
    }
    if (ValidUrl.isWebUri(newHERpc)) {
      setSuccessMessage('html_popup_new_rpc_save_success');
      await SteemEngineConfigUtils.addCustomRpc(newHERpc);
      setNewHERpc('');
      setIsNewHERpcPanelOpened(false);
      initLayer2();
    } else {
      setErrorMessage('html_popup_url_not_valid');
    }
  };

  return (
    <div
      data-testid={`${Screen.SETTINGS_RPC_NODES}-page`}
      className="rpc-nodes-page">
      <div className="introduction">
        {chrome.i18n.getMessage('popup_html_rpc_node_text')}
      </div>

      <div className="rpc-form-container">
        <div className="rpc-section steem-rpc">
          <div className="title">Steem RPC</div>
          <CheckboxPanelComponent
            dataTestId="checkbox-rpc-nodes-automatic-mode"
            title="popup_html_rpc_automatic_mode"
            hint="popup_html_rpc_automatic_mode_hint"
            checked={switchAuto}
            onChange={setSwitchAuto}
          />
          {activeRpc && !switchAuto && steemRpcOptions && (
            <div className="select-rpc-panel">
              <ComplexeCustomSelect
                options={steemRpcOptions}
                selectedItem={
                  {
                    value: activeRpc.uri,
                    label: activeRpc.uri
                      .replace('http://', '')
                      .replace('https://', '')
                      .split('/')[0],
                    rpc: activeRpc,
                    canDelete: !RpcUtils.isDefault(activeRpc),
                  } as RpcListItem
                }
                setSelectedItem={(item: RpcListItem) => setActiveRpc(item.rpc)}
                background="white"
                onDelete={deleteCustomSteemRPC}
              />
              <div
                className={`round-button ${
                  isAddRpcPanelDisplayed ? 'close-button' : 'add-button'
                }`}
                onClick={() =>
                  setIsAddRpcPanelDisplayed(!isAddRpcPanelDisplayed)
                }>
                <SVGIcon icon={SVGIcons.MENU_RPC_ADD_BUTTON} />
              </div>
            </div>
          )}
          {!switchAuto && isAddRpcPanelDisplayed && (
            <div className="add-rpc-panel">
              <div className="add-rpc-caption">
                <span>{chrome.i18n.getMessage('popup_html_add_rpc_text')}</span>
                <SVGIcon
                  icon={SVGIcons.MENU_RPC_SAVE_BUTTON}
                  onClick={() => saveNewSteemRpc()}
                />
              </div>
              <Separator type="horizontal" />
              <InputComponent
                dataTestId="input-rpc-node-uri"
                type={InputType.TEXT}
                value={addRpcNodeUri}
                onChange={setAddRpcNodeUri}
                placeholder={'popup_html_rpc_node'}
                onEnterPress={saveNewSteemRpc}
              />
              <CheckboxComponent
                dataTestId="checkbox-add-rpc-test-node"
                title="Testnet"
                checked={addRpcNodeTestnet}
                onChange={setAddRpcNodeTestnet}
                skipTranslation={true}></CheckboxComponent>
              {addRpcNodeTestnet && (
                <InputComponent
                  dataTestId="input-node-chain-id"
                  type={InputType.TEXT}
                  value={addRpcNodeChainId}
                  onChange={setAddRpcNodeChainId}
                  placeholder="Chain Id"
                  skipPlaceholderTranslation={true}
                  onEnterPress={saveNewSteemRpc}
                />
              )}

              <CheckboxComponent
                dataTestId="checkbox-set-new-rpc-as-active"
                title="popup_html_set_new_rpc_as_active"
                checked={setNewRpcAsActive}
                onChange={setSetNewRpcAsActive}></CheckboxComponent>
            </div>
          )}
        </div>

        {/* <div className="rpc-section steem-engine-rpc">
          <div className="title">Steem-Engine RPC</div>
          <div className="select-rpc-panel">
            <ComplexeCustomSelect
              options={steemEngineRpcOptions}
              selectedItem={
                {
                  value: activeHERpc,
                  label: activeHERpc
                    .replace('http://', '')
                    .replace('https://', '')
                    .split('/')[0],
                } as OptionItem
              }
              setSelectedItem={(item: OptionItem) => {
                setHEActiveRpc(item.value);
              }}
              background="white"
              onDelete={deleteHeRpc}
            />
            <div
              className={`round-button ${
                isNewHERpcPanelOpened ? 'close-button' : 'add-button'
              }`}
              onClick={() => setIsNewHERpcPanelOpened(!isNewHERpcPanelOpened)}>
              <SVGIcon icon={SVGIcons.MENU_RPC_ADD_BUTTON} />
            </div>
          </div>
          {isNewHERpcPanelOpened && (
            <div className="add-rpc-panel">
              <div className="add-rpc-caption">
                <span>{chrome.i18n.getMessage('popup_html_add_rpc_text')}</span>
                <SVGIcon
                  icon={SVGIcons.MENU_RPC_SAVE_BUTTON}
                  onClick={() => saveSteemEngineRpc()}
                />
              </div>
              <Separator type="horizontal" />
              <InputComponent
                dataTestId="input-rpc-node-uri"
                type={InputType.TEXT}
                value={newHERpc}
                onChange={setNewHERpc}
                placeholder={'popup_html_rpc_node'}
                onEnterPress={saveNewSteemRpc}
              />

              <CheckboxComponent
                dataTestId="checkbox-set-new-he-rpc-as-active"
                title="popup_html_set_new_rpc_as_active"
                checked={setNewHeRpcAsActive}
                onChange={setSetNewHeRpcAsActive}></CheckboxComponent>
            </div>
          )}
        </div> */}
        {/* <div className="rpc-section steem-engine-account-history">
          <div className="title">Steem-Engine account history API</div>
          <div className="select-rpc-panel">
            <ComplexeCustomSelect
              options={accountHistoryApiOptions}
              selectedItem={
                {
                  value: activeAccountHistoryApi,
                  label: activeAccountHistoryApi
                    .replace('http://', '')
                    .replace('https://', '')
                    .split('/')[0],
                } as OptionItem
              }
              setSelectedItem={(item: OptionItem) => {
                setHEActiveAccountHistoryApi(item.value);
              }}
              background="white"
              onDelete={deleteAccountHistoryApi}
            />
            <div
              className={`round-button ${
                isNewAccountHistoryPanelOpened ? 'close-button' : 'add-button'
              }`}
              onClick={() =>
                setIsNewAccountHistoryPanelOpened(
                  !isNewAccountHistoryPanelOpened,
                )
              }>
              <SVGIcon icon={SVGIcons.MENU_RPC_ADD_BUTTON} />
            </div>
          </div>
          {isNewAccountHistoryPanelOpened && (
            <div className="add-rpc-panel">
              <div className="add-rpc-caption">
                <span>{chrome.i18n.getMessage('popup_html_add_rpc_text')}</span>
                <SVGIcon
                  icon={SVGIcons.MENU_RPC_SAVE_BUTTON}
                  onClick={() => saveAccountHistory()}
                />
              </div>
              <Separator type="horizontal" />
              <InputComponent
                dataTestId="input-rpc-node-uri"
                type={InputType.TEXT}
                value={newAccountHistory}
                onChange={setNewAccountHistory}
                placeholder={'html_popup_new_account_history'}
                onEnterPress={saveAccountHistory}
              />

              <CheckboxComponent
                dataTestId="checkbox-set-new-account-history-as-active"
                title="popup_html_set_new_rpc_as_active"
                checked={setNewAccountHistoryAsActive}
                onChange={setSetNewAccountHistoryAsActive}></CheckboxComponent>
            </div>
          )}
        </div> */}
      </div>
    </div>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    activeRpc: state.steem.activeRpc,
    activeHERpc: state.steem.steemEngineConfig.rpc,
    activeAccountHistoryApi: state.steem.steemEngineConfig.accountHistoryApi,
  };
};

const connector = connect(mapStateToProps, {
  setActiveRpc,
  setHEActiveAccountHistoryApi,
  setHEActiveRpc,
  setErrorMessage,
  setTitleContainerProperties,
  setSuccessMessage,
});
type PropsFromRedux = ConnectedProps<typeof connector>;

export const RpcNodesComponent = connector(RpcNodes);
