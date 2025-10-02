import { RequestId } from '@interfaces/keychain.interface';
import { Rpc } from '@interfaces/rpc.interface';
import { BackgroundCommand } from '@reference-data/background-message-key.enum';
import React, { useState } from 'react';
import ButtonComponent, {
    ButtonType,
} from 'src/common-ui/button/button.component';
import { CheckboxPanelComponent } from 'src/common-ui/checkbox/checkbox-panel/checkbox-panel.component';
import { LoadingComponent } from 'src/common-ui/loading/loading.component';
import { Separator } from 'src/common-ui/separator/separator.component';
import CollaspsibleItem from 'src/dialog/components/collapsible-item/collapsible-item';
import DialogHeader from 'src/dialog/components/dialog-header/dialog-header.component';
import RequestItem from 'src/dialog/components/request-item/request-item';

interface RequestChangeNetworkRpc {
  rpc: Rpc;
}

type Props = {
  data: RequestChangeNetworkRpc & RequestId;
  domain: string;
  tab: number;
  rpc: Rpc;
};

const ChangeNetworkRpc = (props: Props) => {
  const { data, domain, tab } = props;
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = () => {
    setLoading(true);

    // Accept the transaction to send success response back to the requesting site
    // The backend will handle saving RPC if setAsDefault is true
    chrome.runtime.sendMessage({
      command: BackgroundCommand.ACCEPT_TRANSACTION,
      value: {
        data: data,
        tab: tab,
        domain: domain,
        keep: false,
        options: { setAsDefault },
      },
    });
  };

  const handleCancel = () => {
    window.close();
  };

  return (
    <div className="operation">
      <div
        className="scrollable"
        style={{
          height: '70%',
          overflow: 'scroll',
          display: 'flex',
          flexDirection: 'column',
          rowGap: '16px',
        }}>
        <div>
          <DialogHeader title={chrome.i18n.getMessage('dialog_change_network_rpc_title')} />
          <div className="operation-header">
            {chrome.i18n.getMessage('dialog_change_network_rpc_description')}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            flex: 1,
            flexDirection: 'column',
          }}>
          <div className="operation-body">
            <div className="fields">
              <RequestItem
                title="dialog_rpc_url"
                content={data.rpc.uri}
              />
              <Separator type={'horizontal'} fullSize />
              <RequestItem
                title="dialog_address_prefix"
                content={data.rpc.addressPrefix || 'STM'}
              />
              <Separator type={'horizontal'} fullSize />
              <RequestItem
                title="dialog_chain_id"
                content={data.rpc.chainId || 'Default'}
              />
              <Separator type={'horizontal'} fullSize />
              <RequestItem
                title="dialog_testnet"
                content={data.rpc.testnet ? 'Yes' : 'No'}
              />
              <Separator type={'horizontal'} fullSize />
              <CollaspsibleItem
                title="dialog_full_rpc_details"
                content={JSON.stringify(data.rpc, undefined, 2)}
                pre
              />
            </div>
          </div>
        </div>
      </div>

      <CheckboxPanelComponent
        onChange={setSetAsDefault}
        checked={setAsDefault}
        skipTranslation
        title={chrome.i18n.getMessage('dialog_set_as_default_rpc')}
      />

      {!loading && (
        <div className="operation-buttons">
          <ButtonComponent
            label="dialog_cancel"
            type={ButtonType.ALTERNATIVE}
            onClick={handleCancel}
            height="small"
          />
          <ButtonComponent
            type={ButtonType.IMPORTANT}
            label="dialog_confirm"
            onClick={handleConfirm}
            height="small"
          />
        </div>
      )}

      <LoadingComponent hide={!loading} />
    </div>
  );
};

export default ChangeNetworkRpc;
