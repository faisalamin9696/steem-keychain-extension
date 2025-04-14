import {
  SdsOperationName,
  SdsTransaction,
} from '@interfaces/transaction.interface';
import TransactionUtils from '@popup/steem/utils/transaction.utils';
import { TransferOperation } from '@steempro/dsteem';
import { Asset as CommonAsset } from '@steempro/steem-keychain-commons';
import moment from 'moment';
import { KeychainError } from 'src/keychain-error';
import Logger from 'src/utils/logger.utils';

interface ExportTransactionOperation {
  datetime: string;
  transactionId: string;
  blockNumber: number;
  from?: string;
  to?: string;
  amount: number;
  currency: string;
  operationType: SdsOperationName;
}

// const fetchTransaction = async (
//   username: string,
//   startDate?: Date,
//   endDate?: Date,
//   feedBack?: (percentage: number) => void,
// ): Promise<ExportTransactionOperation[] | undefined> => {
//   const LIMIT = 20; // Steem API upper limit is 20
//   let offset = 0;
//   let forceStop = false;
//   let transactionsFetched: ExportTransactionOperation[] = [];
//   let operations: ExportTransactionOperation[] = [];

//   endDate = endDate ? new Date(endDate) : new Date(); // Default end date is now
//   const startTimestamp = startDate ? moment(startDate).unix() : 0;
//   const endTimestamp = moment(endDate).unix();

//   try {
//     do {
//       await AsyncUtils.sleep(500); // Prevents rate limits

//       if (forceStop) break;

//       const transactions: {
//         id: number;
//         time: number;
//         block_num: number;
//         tran_index: number;
//         op_index: number;
//         virtual: number;
//         op: Operation;
//       }[] = await fetchSds(
//         `/account_history_api/getHistoryByOpTypesTime/${username}/transfer,interest,transfer_to_vesting,fill_vesting_withdraw,fill_convert_request,claim_reward_balance,escrow_release,account_create,account_create_with_delegation,proposal_pay,fill_order/${startTimestamp}-${endTimestamp}/${LIMIT}/${offset}`,
//       );

//       if (!transactions.length) break; // Stop if no transactions are returned

//       for (let i = transactions.length - 1; i >= 0; i--) {
//         const tx = transactions[i];
//         const txTimestamp = tx.time;

//         // If the transaction is before the start date, stop fetching
//         if (txTimestamp < startTimestamp) {
//           forceStop = true;
//           break;
//         }

//         // Ignore transactions beyond the end date
//         if (txTimestamp > endTimestamp) continue;

//         const operationPayload = tx.op[1];
//         const operationType = tx.op;

//         const operation: ExportTransactionOperation = {
//           operationType: operationType,
//           time: tx.time,
//           transactionId: tx.id.toString(),
//           blockNumber: tx.block_num,
//           to: 'NA',
//           amount: 0,
//           currency: 'NA',
//           from: 'NA',
//         };

//         switch (operationType[0]) {
//           case 'transfer':
//             const transferOperation = operationPayload as TransferOperation[1];
//             const asset = CommonAsset.fromString(transferOperation.amount.toString());
//             operations.push({
//               ...operation,
//               from: transferOperation.from,
//               to: transferOperation.to,
//               amount: asset.amount,
//               currency: asset.symbol,
//             });
//             break;

//           case 'interest': {
//             const asset = CommonAsset.fromString(
//               operationPayload.interest.toString(),
//             );
//             operations.push({
//               ...operation,
//               from: 'NA',
//               to: operationPayload.owner,
//               amount: asset.amount,
//               currency: asset.symbol,
//             });
//             break;
//           }
//           case 'transfer_to_vesting': {
//             const asset = CommonAsset.fromString(operationPayload.amount.toString());
//             operations.push({
//               ...operation,
//               from: operationPayload.from,
//               to: operationPayload.to,
//               amount: asset.amount,
//               currency: asset.symbol,
//             });
//             break;
//           }
//           case 'fill_vesting_withdraw': {
//             const asset = CommonAsset.fromString(
//               operationPayload.deposited.toString(),
//             );
//             operations.push({
//               ...operation,
//               from: operationPayload.from_account,
//               to: operationPayload.to_account,
//               amount: asset.amount,
//               currency: asset.symbol,
//             });
//             break;
//           }
//           case 'fill_convert_request': {
//             let asset = CommonAsset.fromString(
//               operationPayload.amount_out.toString(),
//             );
//             operations.push({
//               ...operation,
//               from: operationPayload.owner,
//               to: operationPayload.owner,
//               amount: asset.amount,
//               currency: asset.symbol,
//             });
//             asset = CommonAsset.fromString(operationPayload.amount_in.toString());
//             operations.push({
//               ...operation,
//               from: operationPayload.owner,
//               to: operationPayload.owner,
//               amount: asset.amount,
//               currency: asset.symbol,
//             });
//             break;
//           }
//           // case 'producer_reward' as any: {
//           //   let asset = CommonAsset.fromString(
//           //     operationPayload.vesting_shares.toString(),
//           //   );
//           //   operations.push({
//           //     ...operation,
//           //     to: operationPayload.producer,
//           //     amount: asset.amount,
//           //     currency: asset.symbol,
//           //   });
//           //   break;
//           // }
//           case 'claim_reward_balance': {
//             let asset = CommonAsset.fromString(
//               operationPayload.reward_steem.toString(),
//             );
//             if (asset.amount > 0)
//               operations.push({
//                 ...operation,
//                 to: operationPayload.account,
//                 amount: asset.amount,
//                 currency: asset.symbol,
//               });
//             asset = CommonAsset.fromString(operationPayload.reward_sbd.toString());
//             if (asset.amount > 0)
//               operations.push({
//                 ...operation,
//                 to: operationPayload.account,
//                 amount: asset.amount,
//                 currency: asset.symbol,
//               });
//             asset = CommonAsset.fromString(operationPayload.reward_vests.toString());
//             if (asset.amount > 0)
//               operations.push({
//                 ...operation,
//                 to: operationPayload.account,
//                 amount: asset.amount,
//                 currency: asset.symbol,
//               });
//             break;
//           }
//           case 'escrow_release': {
//             let asset = CommonAsset.fromString(
//               operationPayload.sbd_amount.toString(),
//             );
//             if (asset.amount > 0)
//               operations.push({
//                 ...operation,
//                 to: operationPayload.to,
//                 from: operationPayload.from,
//                 amount: asset.amount,
//                 currency: asset.symbol,
//               });
//             asset = CommonAsset.fromString(operationPayload.steem_amount.toString());
//             if (asset.amount > 0)
//               operations.push({
//                 ...operation,
//                 to: operationPayload.to,
//                 from: operationPayload.from,
//                 amount: asset.amount,
//                 currency: asset.symbol,
//               });
//             break;
//           }
//           case 'account_create':
//           case 'account_create_with_delegation': {
//             let asset = CommonAsset.fromString(operationPayload.fee.toString());
//             if (asset.amount > 0)
//               operations.push({
//                 ...operation,
//                 from: operationPayload.creator,
//                 amount: asset.amount,
//                 currency: asset.symbol,
//               });
//             break;
//           }
//           case 'proposal_pay' as any: {
//             let asset = CommonAsset.fromString(operationPayload.payment.toString());
//             if (asset.amount > 0)
//               operations.push({
//                 ...operation,
//                 to: operationPayload.receiver,
//                 from: operationPayload.payer,
//                 amount: asset.amount,
//                 currency: asset.symbol,
//               });
//             break;
//           }
//           case 'fill_order': {
//             let asset = CommonAsset.fromString(
//               operationPayload.current_pays.toString(),
//             );
//             if (asset.amount > 0)
//               operations.push({
//                 ...operation,
//                 to: operationPayload.open_owner,
//                 from: operationPayload.current_owner,
//                 amount: asset.amount,
//                 currency: asset.symbol,
//               });
//             asset = CommonAsset.fromString(operationPayload.open_pays.toString());
//             if (asset.amount > 0)
//               operations.push({
//                 ...operation,
//                 to: operationPayload.current_owner,
//                 from: operationPayload.open_owner,
//                 amount: asset.amount,
//                 currency: asset.symbol,
//               });
//             break;
//           }

//           default:
//             Logger.log(`missing ${operationType}`);
//             break;
//         }

//         offset += LIMIT; // Increase offset for next batch

//         // Send progress feedback
//         if (feedBack && startDate) {
//           const progress =
//             ((endDate.getTime() -
//               moment
//                 .unix(transactionsFetched[transactionsFetched.length - 1]?.time)
//                 .toDate()
//                 .getTime()) /
//               (endDate.getTime() - startDate.getTime())) *
//             100;
//           feedBack(progress);
//         }
//       }

//       return transactionsFetched;
//     } while (!forceStop);
//   } catch (err) {
//     Logger.error('Error while fetching transactions', err);
//     return undefined;
//   }
// };

const fetchTransaction = async (
  username: string,
  startDate?: Date,
  endDate?: Date,
  feedBack?: (percentage: number) => void,
): Promise<ExportTransactionOperation[] | undefined> => {
  const MAX_LIMIT = 10000;
  const lastTransaction = await TransactionUtils.getLastTransaction(username);
  if (!startDate) startDate = moment().subtract(1, 'day').toDate();
  if (!endDate) endDate = moment().toDate();

  let start = lastTransaction;
  let limit = Math.min(start, MAX_LIMIT);

  let rawTransactions: SdsTransaction[] = [];
  let operations: ExportTransactionOperation[] = [];
  let forceStop = false;
  let percentageDuration;
  if (startDate) {
    percentageDuration = endDate.getTime() - new Date(startDate).getTime();
  }

  try {
    do {
      rawTransactions = await TransactionUtils.getTransactions(
        username,
        start,
        limit,
      );
      for (let i = rawTransactions.length - 1; i >= 0; i--) {
        const tx = rawTransactions[i];
        const operationPayload = tx.op[1];
        const operationType = tx.op[0];
        const transactionInfo = tx;

        const dateString = moment(transactionInfo.time * 1000);
        const localDatetime = dateString.format('yyyy-MM-DD HH:mm:ss');

        if (
          endDate &&
          dateString.isSameOrAfter(moment(endDate).add(1, 'day'), 'day')
        ) {
          continue;
        }

        if (startDate && dateString.isAfter(moment(startDate), 'day')) {
          forceStop = true;
          break;
        }

        const operation: ExportTransactionOperation = {
          operationType: operationType,
          datetime: localDatetime,
          transactionId: transactionInfo.id.toString(),
          blockNumber: transactionInfo.block_num,
          to: 'NA',
          amount: 0,
          currency: 'NA',
          from: 'NA',
        };

        switch (operationType) {
          case 'transfer': {
            const transferOperation = operationPayload as TransferOperation[1];
            const asset = CommonAsset.fromString(transferOperation.amount.toString());
            operations.push({
              ...operation,
              from: transferOperation.from,
              to: transferOperation.to,
              amount: asset.amount,
              currency: asset.symbol,
            });
            break;
          }
          case 'interest': {
            const asset = CommonAsset.fromString(
              operationPayload.interest.toString(),
            );
            operations.push({
              ...operation,
              from: 'NA',
              to: operationPayload.owner,
              amount: asset.amount,
              currency: asset.symbol,
            });
            break;
          }
          case 'transfer_to_vesting': {
            const asset = CommonAsset.fromString(operationPayload.amount.toString());
            operations.push({
              ...operation,
              from: operationPayload.from,
              to: operationPayload.to,
              amount: asset.amount,
              currency: asset.symbol,
            });
            break;
          }
          case 'fill_vesting_withdraw': {
            const asset = CommonAsset.fromString(
              operationPayload.deposited.toString(),
            );
            operations.push({
              ...operation,
              from: operationPayload.from_account,
              to: operationPayload.to_account,
              amount: asset.amount,
              currency: asset.symbol,
            });
            break;
          }

          case 'fill_convert_request': {
            let asset = CommonAsset.fromString(
              operationPayload.amount_out.toString(),
            );
            operations.push({
              ...operation,
              from: operationPayload.owner,
              to: operationPayload.owner,
              amount: asset.amount,
              currency: asset.symbol,
            });
            asset = CommonAsset.fromString(operationPayload.amount_in.toString());
            operations.push({
              ...operation,
              from: operationPayload.owner,
              to: operationPayload.owner,
              amount: asset.amount,
              currency: asset.symbol,
            });
            break;
          }

          case 'producer_reward': {
            let asset = CommonAsset.fromString(
              operationPayload.vesting_shares.toString(),
            );
            operations.push({
              ...operation,
              to: operationPayload.producer,
              amount: asset.amount,
              currency: asset.symbol,
            });
            break;
          }
          case 'claim_reward_balance': {
            let asset = CommonAsset.fromString(
              operationPayload.reward_steem.toString(),
            );
            if (asset.amount > 0)
              operations.push({
                ...operation,
                to: operationPayload.account,
                amount: asset.amount,
                currency: asset.symbol,
              });
            asset = CommonAsset.fromString(operationPayload.reward_sbd.toString());
            if (asset.amount > 0)
              operations.push({
                ...operation,
                to: operationPayload.account,
                amount: asset.amount,
                currency: asset.symbol,
              });
            asset = CommonAsset.fromString(operationPayload.reward_vests.toString());
            if (asset.amount > 0)
              operations.push({
                ...operation,
                to: operationPayload.account,
                amount: asset.amount,
                currency: asset.symbol,
              });
            break;
          }
          case 'escrow_release': {
            let asset = CommonAsset.fromString(
              operationPayload.sbd_amount.toString(),
            );
            if (asset.amount > 0)
              operations.push({
                ...operation,
                to: operationPayload.to,
                from: operationPayload.from,
                amount: asset.amount,
                currency: asset.symbol,
              });
            asset = CommonAsset.fromString(operationPayload.steem_amount.toString());
            if (asset.amount > 0)
              operations.push({
                ...operation,
                to: operationPayload.to,
                from: operationPayload.from,
                amount: asset.amount,
                currency: asset.symbol,
              });
            break;
          }
          case 'account_create':
          case 'account_create_with_delegation': {
            let asset = CommonAsset.fromString(operationPayload.fee.toString());
            if (asset.amount > 0)
              operations.push({
                ...operation,
                from: operationPayload.creator,
                amount: asset.amount,
                currency: asset.symbol,
              });
            break;
          }
          case 'proposal_pay': {
            let asset = CommonAsset.fromString(operationPayload.payment.toString());
            if (asset.amount > 0)
              operations.push({
                ...operation,
                to: operationPayload.receiver,
                from: operationPayload.payer,
                amount: asset.amount,
                currency: asset.symbol,
              });
            break;
          }
          case 'fill_order': {
            let asset = CommonAsset.fromString(
              operationPayload.current_pays.toString(),
            );
            if (asset.amount > 0)
              operations.push({
                ...operation,
                to: operationPayload.open_owner,
                from: operationPayload.current_owner,
                amount: asset.amount,
                currency: asset.symbol,
              });
            asset = CommonAsset.fromString(operationPayload.open_pays.toString());
            if (asset.amount > 0)
              operations.push({
                ...operation,
                to: operationPayload.current_owner,
                from: operationPayload.open_owner,
                amount: asset.amount,
                currency: asset.symbol,
              });
            break;
          }
          default:
            Logger.log(`missing ${operationType}`);
            break;
        }
      }
      let percentage;
      if (startDate && percentageDuration) {
        // take care of date
        const tx = rawTransactions[rawTransactions.length - 1];
        const transactionInfo = tx;
        const date = moment(moment(transactionInfo.time * 1000) + 'z').toDate();

        const passedDuration = endDate.getTime() - date.getTime();
        percentage = (passedDuration / percentageDuration) * 100;
      } else {
        // use lastTransaction
        const index =
          lastTransaction - rawTransactions[rawTransactions.length - 1].id;
        percentage = (index / lastTransaction) * 100;
      }
      // sendBack percentage
      if (feedBack) feedBack(percentage);

      start = Math.min(start - MAX_LIMIT, rawTransactions[0].id - 1);
    } while (start > MAX_LIMIT && !forceStop);
    return operations;
  } catch (err) {
    Logger.error('Error while fetching transactions', err);
  }
  return undefined;
};
const generateCSV = (operations: ExportTransactionOperation[]): string => {
  let csvContent = `Operation Type,Date,Transaction ID, Block number,From,To,Amount,Currency\r\n`;

  for (const operation of operations) {
    csvContent += `${operation.operationType},${operation.datetime},${
      operation.transactionId
    },${operation.blockNumber},${operation.from ?? 'NA'},${operation.to},${
      operation.amount
    },${operation.currency}\r\n`;
  }

  return csvContent;
};

const downloadTransactions = async (
  username: string,
  startDate?: Date,
  endDate?: Date,
  feedback?: (percentage: number) => void,
) => {
  const operations = await fetchTransaction(
    username,
    startDate,
    endDate,
    feedback,
  );

  if (!operations) {
    throw new KeychainError('export_transactions_fetching_error');
  }
  const csv = generateCSV(operations);
  var data = new Blob([csv], {
    type: 'text/plain',
  });
  var url = window.URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;

  a.download = `${username}-transactions-${startDate || 'start'}-${
    endDate || moment().format('YYYY-MM-DD')
  }.csv`;
  a.click();
};

export const ExportTransactionUtils = { downloadTransactions };
