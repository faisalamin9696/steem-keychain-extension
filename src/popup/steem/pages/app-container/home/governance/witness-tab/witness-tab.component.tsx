import {
  PrivateKeyType,
  TransactionOptions,
  TransactionOptionsMetadata,
} from '@interfaces/keys.interface';
import { Witness } from '@interfaces/witness.interface';
import {
  addCaptionToLoading,
  addToLoadingList,
  removeFromLoadingList,
} from '@popup/multichain/actions/loading.actions';
import {
  setErrorMessage,
  setSuccessMessage,
} from '@popup/multichain/actions/message.actions';
import { closeModal, openModal } from '@popup/multichain/actions/modal.actions';
import { RootState } from '@popup/multichain/store';
import { refreshActiveAccount } from '@popup/steem/actions/active-account.actions';
import AccountUtils from '@popup/steem/utils/account.utils';
import BlockchainTransactionUtils from '@popup/steem/utils/blockchain.utils';
import { KeysUtils } from '@popup/steem/utils/keys.utils';
import { replaceOldDomains } from '@popup/steem/utils/link';
import { MultisigUtils } from '@popup/steem/utils/multisig.utils';
import ProxyUtils from '@popup/steem/utils/proxy.utils';
import WitnessUtils from '@popup/steem/utils/witness.utils';
import {
  KeychainKeyTypes,
  KeychainKeyTypesLC,
} from '@steempro/steem-keychain-commons';
import FlatList from 'flatlist-react';
import React, { useEffect, useState } from 'react';
import { ConnectedProps, connect } from 'react-redux';
import 'react-tabs/style/react-tabs.scss';
import { CheckboxPanelComponent } from 'src/common-ui/checkbox/checkbox-panel/checkbox-panel.component';
import { SVGIcons } from 'src/common-ui/icons.enum';
import { InputType } from 'src/common-ui/input/input-type.enum';
import InputComponent from 'src/common-ui/input/input.component';
import { MetadataPopup } from 'src/common-ui/metadata-popup/metadata-popup.component';
import { SVGIcon } from 'src/common-ui/svg-icon/svg-icon.component';
import { AsyncUtils } from 'src/utils/async.utils';
import * as ValidUrl from 'valid-url';

const MAX_WITNESS_VOTE = 30;

interface WitnessTabProps {
  ranking: Witness[];
  hasError: boolean;
}

const WitnessTab = ({
  ranking,
  hasError,
  activeAccount,
  addToLoadingList,
  removeFromLoadingList,
  setErrorMessage,
  setSuccessMessage,
  refreshActiveAccount,
  addCaptionToLoading,
  openModal,
  closeModal,
}: PropsFromRedux & WitnessTabProps) => {
  const [displayVotedOnly, setDisplayVotedOnly] = useState(false);
  const [hideNonActive, setHideNonActive] = useState(true);
  const [remainingVotes, setRemainingVotes] = useState<string | number>('...');
  const [filteredRanking, setFilteredRanking] = useState<Witness[]>([]);
  const [filterValue, setFilterValue] = useState('');
  const [votedWitnesses, setVotedWitnesses] = useState<string[]>([]);

  const [usingProxy, setUsingProxy] = useState<boolean>(false);
  const [keyType, setKeyType] = useState<PrivateKeyType>();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (activeAccount) {
      setKeyType(
        KeysUtils.getKeyType(
          activeAccount.keys.active!,
          activeAccount.keys.activePubkey!,
          activeAccount.account,
          activeAccount.account,
          KeychainKeyTypesLC.active,
        ),
      );
    }
  }, [activeAccount]);

  const init = async () => {
    setRemainingVotes(
      MAX_WITNESS_VOTE - activeAccount.account.witnesses_voted_for,
    );

    let proxy = await ProxyUtils.findUserProxy(activeAccount.account);

    setUsingProxy(proxy !== null);
    if (proxy) {
      initProxyVotes(proxy);
    } else {
      setVotedWitnesses(activeAccount.account.witness_votes);
    }
  };

  useEffect(() => {
    setVotedWitnesses(activeAccount.account.witness_votes);
    setRemainingVotes(
      MAX_WITNESS_VOTE - activeAccount.account.witnesses_voted_for,
    );
  }, [activeAccount]);

  useEffect(() => {
    if (ranking)
      setFilteredRanking(
        ranking.filter(
          (witness) =>
            witness.owner.toLowerCase().includes(filterValue.toLowerCase()) &&
            (!displayVotedOnly || votedWitnesses.includes(witness.owner)) &&
            (!hideNonActive ||
              witness.signing_key !==
                'STM1111111111111111111111111111111114T1Anm'),
        ),
      );
  }, [ranking, filterValue, displayVotedOnly, votedWitnesses, hideNonActive]);

  const initProxyVotes = async (proxy: string) => {
    const hiveAccounts = await AccountUtils.getAccount(proxy);
    setVotedWitnesses(hiveAccounts[0].witness_votes);
  };

  const processClick = async (
    witness: Witness,
    options?: TransactionOptions,
  ) => {
    if (activeAccount.account.witness_votes.includes(witness.owner)) {
      try {
        addToLoadingList('html_popup_unvote_witness_operation');

        const success = await WitnessUtils.unvoteWitness(
          witness,
          activeAccount.name!,
          activeAccount.keys.active!,
          options,
        );
        addToLoadingList('html_popup_confirm_transaction_operation');
        await AsyncUtils.sleep(1000);
        removeFromLoadingList('html_popup_unvote_witness_operation');
        await BlockchainTransactionUtils.delayRefresh();
        removeFromLoadingList('html_popup_confirm_transaction_operation');
        refreshActiveAccount();
        if (success) {
          if (success.isUsingMultisig) {
            setSuccessMessage('multisig_transaction_sent_to_signers');
          } else {
            setSuccessMessage('popup_success_unvote_wit', [`${witness.owner}`]);
          }
        } else {
          setErrorMessage('popup_error_unvote_wit', [`${witness.owner}`]);
        }
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        removeFromLoadingList('html_popup_unvote_witness_operation');
        removeFromLoadingList('html_popup_confirm_transaction_operation');
      }
    } else {
      try {
        addToLoadingList('html_popup_vote_witness_operation');
        const success = await WitnessUtils.voteWitness(
          witness,
          activeAccount.name!,
          activeAccount.keys.active!,
          options,
        );
        addToLoadingList('html_popup_confirm_transaction_operation');
        await AsyncUtils.sleep(1000);
        removeFromLoadingList('html_popup_vote_witness_operation');
        await BlockchainTransactionUtils.delayRefresh();
        removeFromLoadingList('html_popup_confirm_transaction_operation');
        refreshActiveAccount();
        if (success) {
          if (success.isUsingMultisig) {
            setSuccessMessage('multisig_transaction_sent_to_signers');
          } else {
            setSuccessMessage('popup_success_wit', [`${witness.owner}`]);
          }
        } else {
          setErrorMessage('popup_error_wit', [`${witness.owner}`]);
        }
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        removeFromLoadingList('html_popup_vote_witness_operation');
        removeFromLoadingList('html_popup_confirm_transaction_operation');
      }
    }
  };

  const handleVotedButtonClick = async (witness: Witness) => {
    if (usingProxy) {
      return;
    }

    if (keyType === PrivateKeyType.MULTISIG) {
      const twoFaAccounts = await MultisigUtils.get2FAAccounts(
        activeAccount.account,
        KeychainKeyTypes.active,
      );

      let initialMetadata = {} as TransactionOptionsMetadata;
      for (const account of twoFaAccounts) {
        if (!initialMetadata.twoFACodes) initialMetadata.twoFACodes = {};
        initialMetadata.twoFACodes[account] = '';
      }

      if (twoFaAccounts.length > 0) {
        openModal({
          title: 'popup_html_transaction_metadata',
          children: (
            <MetadataPopup
              initialMetadata={initialMetadata}
              onSubmit={(metadata: TransactionOptionsMetadata) => {
                addCaptionToLoading('multisig_transmitting_to_2fa');
                processClick(witness, { metaData: metadata });
                closeModal();
              }}
              onCancel={() => closeModal()}
            />
          ),
        });
      }
    } else {
      processClick(witness);
    }
  };

  const renderWitnessItem = (witness: Witness, idx: string) => {
    return (
      <div data-testid="ranking-item" className="ranking-item" key={idx}>
        <div className="rank">
          <div className="active-rank">
            {witness.rank ? witness.rank : '-'}{' '}
          </div>
          {/* {!hideNonActive && witness.rank?.toString() !== witness.rank && (
            <div className="including-inactive">({witness.rank})</div>
          )} */}
        </div>
        <div
          className={
            'name ' +
            (witness.signing_key ===
            'STM1111111111111111111111111111111114T1Anm'
              ? 'not-active'
              : '')
          }>
          <img
            className="witness-image"
            src={`https://steemitimages.com/u/${witness.owner}/avatar`}
            onError={(e: any) => {
              e.target.onError = null;
              e.target.src = '/assets/images/accounts.png';
            }}
          />

          <div className="witness-name">@{witness.owner}</div>
          {witness.url && ValidUrl.isWebUri(witness.url) && (
            <SVGIcon
              dataTestId={`link-to-witness-page-${witness.owner}`}
              onClick={() =>
                chrome.tabs.create({ url: replaceOldDomains(witness.url) })
              }
              icon={SVGIcons.GOVERNANCE_WITNESS_LINK}
              className="link-to-witness-page"></SVGIcon>
          )}
        </div>
        <SVGIcon
          dataTestId={`witness-voting-icon-${witness.owner}`}
          className={
            'action ' +
            (votedWitnesses.includes(witness.owner) ? 'voted' : 'not-voted') +
            ' ' +
            (usingProxy || !activeAccount.keys.active
              ? 'using-proxy-button'
              : '')
          }
          icon={SVGIcons.GOVERNANCE_WITNESS_UPVOTE_DOWNVOTE}
          onClick={() => handleVotedButtonClick(witness)}
          tooltipPosition="left"
          tooltipMessage={
            !activeAccount.keys.active
              ? 'popup_witness_key'
              : usingProxy
              ? 'html_popup_witness_vote_error_proxy'
              : undefined
          }
        />
      </div>
    );
  };

  return (
    <div data-testid="witness-tab" className="witness-tab">
      {!usingProxy && (
        <div className="remaining-votes">
          {chrome.i18n.getMessage('popup_html_witness_remaining', [
            remainingVotes + '',
          ])}
        </div>
      )}
      {usingProxy && (
        <div className="using-proxy">
          {chrome.i18n.getMessage('html_popup_currently_using_proxy', [
            activeAccount.account.proxy,
          ])}
        </div>
      )}

      <div
        data-testid="link-to-arcange"
        onClick={() =>
          chrome.tabs.create({
            url: 'https://steempro.com/witnesses#faisalamin',
          })
        }
        className="link-to-arcange">
        <div>
          {chrome.i18n.getMessage('html_popup_link_to_witness_website')}
        </div>
        {/* <SVGIcon
          icon={NewIcons.GOVERNANCE_WITNESS_LINK}
          className="outside-link"
        /> */}
      </div>

      {!hasError && (
        <div className="ranking-container">
          <div className="ranking-filter">
            <InputComponent
              dataTestId="input-ranking-filter"
              type={InputType.TEXT}
              logo={SVGIcons.INPUT_SEARCH}
              logoPosition="left"
              placeholder="popup_html_search"
              value={filterValue}
              onChange={setFilterValue}
            />
            <div className="switches-panel">
              <CheckboxPanelComponent
                dataTestId="switches-panel-witness-voted_only"
                title="html_popup_witness_display_voted_only"
                checked={displayVotedOnly}
                onChange={() => {
                  setDisplayVotedOnly(!displayVotedOnly);
                }}></CheckboxPanelComponent>
              <CheckboxPanelComponent
                dataTestId="switches-panel-witness-hide_inactive"
                title="html_popup_witness_hide_inactive"
                checked={hideNonActive}
                onChange={() => {
                  setHideNonActive(!hideNonActive);
                }}></CheckboxPanelComponent>
            </div>
          </div>

          <div aria-label="ranking" className="ranking">
            <FlatList
              list={filteredRanking}
              renderItem={renderWitnessItem}
              renderOnScroll
            />
          </div>
        </div>
      )}
      {hasError && (
        <div className="error-witness">
          <SVGIcon icon={SVGIcons.MESSAGE_ERROR} />
          <div className="text">
            <div>
              {chrome.i18n.getMessage(
                'popup_html_error_retrieving_witness_ranking',
              )}
            </div>
          </div>
        </div>
      )}
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
  addCaptionToLoading,
  openModal,
  closeModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;

export const WitnessTabComponent = connector(WitnessTab);
