import { Conversion } from '@interfaces/conversion.interface';
import { Key, TransactionOptions } from '@interfaces/keys.interface';
import { ConversionType } from '@popup/steem/pages/app-container/home/conversion/conversion-type.enum';
import { SteemTxUtils } from '@popup/steem/utils/steem-tx.utils';
import { ConvertOperation } from '@steempro/dsteem';

const getConversionRequests = async (name: string): Promise<Conversion[]> => {
  const [sbdConversions] = await Promise.all([
    ConversionUtils.getSbdConversions(name),
    // ConversionUtils.getSteemConversions(name),
  ]);

  return [
    // ...steemConversions.map((conv: CollateralizedConversion) => ({
    //   amount: conv.collateral_amount,
    //   conversion_date: conv.conversion_date,
    //   id: conv.id,
    //   owner: conv.owner,
    //   requestid: conv.requestid,
    //   collaterized: true,
    // })),
    ...sbdConversions.map((conv: any) => ({
      ...conv,
      collaterized: false,
    })),
  ].sort(
    (a, b) =>
      new Date(a.conversion_date).getTime() -
      new Date(b.conversion_date).getTime(),
  );
};

const getSbdConversions = (username: string) => {
  return SteemTxUtils.getData('condenser_api.get_conversion_requests', [
    username,
  ]);
};

const getSteemConversions = (username: string) => {
  return SteemTxUtils.getData(
    'condenser_api.get_collateralized_conversion_requests',
    [username],
  );
};

const convert = async (
  username: string,
  conversions: Conversion[],
  amount: string,
  conversionType: ConversionType,
  activeKey: Key,
  options?: TransactionOptions,
) => {
  const requestId = Math.max(...conversions.map((e) => e.requestid), 0) + 1;
  return ConversionUtils.sendConvert(
    username,
    requestId,
    amount,
    conversionType,
    activeKey,
    options,
  );
};

/* istanbul ignore next */
const sendConvert = async (
  username: string,
  requestId: number,
  amount: string,
  conversionType: ConversionType,
  activeKey: Key,
  options?: TransactionOptions,
) => {
  return SteemTxUtils.sendOperation(
    [
      ConversionUtils.getConvertOperation(
        username,
        requestId,
        amount,
        conversionType,
      ),
    ],
    activeKey,
    false,
    options,
  );
};

const getConvertOperation = (
  username: string,
  requestId: number,
  amount: string,
  conversionType: ConversionType,
): ConvertOperation => {
  return ['convert', { owner: username, requestid: requestId, amount: amount }];
};

const getConvertTransaction = (
  username: string,
  requestId: number,
  amount: string,
  conversionType: ConversionType,
) => {
  return SteemTxUtils.createTransaction([
    ConversionUtils.getConvertOperation(
      username,
      requestId,
      amount,
      conversionType,
    ),
  ]);
};

export const ConversionUtils = {
  getConversionRequests,
  getSbdConversions,
  // getSteemConversions,
  getConvertOperation,
  sendConvert,
  convert,
  getConvertTransaction,
};
