import { CurrencyPrices } from '@interfaces/bittrex.interface';
import { GlobalProperties } from '@interfaces/global-properties.interface';
import {  Asset, DynamicGlobalProperties } from '@steempro/dsteem';
import { Asset as CommonAsset } from '@steempro/steem-keychain-commons';

const withCommas = (nb: string, decimals = 3, removeTrailingZeros = false) => {
  const currency = nb.split(' ')[1];

  const value = parseFloat(nb).toFixed(decimals);
  var parts = value.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  let finalNumber = parts.join('.');

  if (removeTrailingZeros) {
    finalNumber = finalNumber.replace(
      /^([\d,]+)$|^([\d,]+)\.0*$|^([\d,]+\.[0-9]*?)0*$/,
      '$1$2$3',
    );
  }

  if (currency) {
    finalNumber = finalNumber + ' ' + currency;
  }

  return finalNumber;
};

const toSP = (vests: string, props?: DynamicGlobalProperties) =>
  props
    ? (parseFloat(vests) * parseFloat(props.total_vesting_fund_steem + '')) /
      parseFloat(props.total_vesting_shares + '')
    : 0;

const toFormattedSP = (vests: number, props?: DynamicGlobalProperties) => {
  return `${toSP(vests.toString(), props).toFixed(3)} SP`;
};

const fromSP = (sp: string, props: DynamicGlobalProperties) =>
  (parseFloat(sp) / parseFloat(props.total_vesting_fund_steem + '')) *
  parseFloat(props.total_vesting_shares + '');

const formatCurrencyValue = (
  value: string | Asset | number,
  digits = 3,
  removeTrailingZeros = false,
) => {
  if (value === undefined || value === null) {
    return '...';
  }
  return withCommas(
    value.toString().replace('SBD', '').replace('STEEM', '').trim(),
    digits,
    removeTrailingZeros,
  );
};

const nFormatter = (num: number, digits: number) => {
  var si = [
    {
      value: 1,
      symbol: '',
    },
    {
      value: 1e3,
      symbol: 'k',
    },
    {
      value: 1e6,
      symbol: 'M',
    },
    {
      value: 1e9,
      symbol: 'G',
    },
    {
      value: 1e12,
      symbol: 'T',
    },
    {
      value: 1e15,
      symbol: 'P',
    },
    {
      value: 1e18,
      symbol: 'E',
    },
  ];
  var rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var i;
  for (i = si.length - 1; i > 0; i--) {
    if (num >= si[i].value) {
      break;
    }
  }
  return (num / si[i].value).toFixed(digits).replace(rx, '$1') + si[i].symbol;
};

const hasMoreThanXDecimal = (number: number, decimal: number) => {
  const splitedNumber = number.toString().split('.');
  return splitedNumber.length > 1 ? splitedNumber[1].length > decimal : false;
};

const toNumber = (value: string | Asset) => {
  return parseFloat(value.toString().split(' ')[0].trim());
};

const getSymbol = (nai: string) => {
  if (nai === '@@000000013') return 'SBD';
  if (nai === '@@000000021') return 'STEEM';
  if (nai === '@@000000037') return 'SP';
};

const fromNaiAndSymbol = (obj: any) => {
  return `${(obj.amount / 1000).toFixed(obj.precision)} ${FormatUtils.getSymbol(
    obj.nai,
  )}`;
};

const getAmountFromNai = (obj: any) => {
  const res = fromNaiAndSymbol(obj);
  return CommonAsset.fromString(res).amount;
};

const removeHtmlTags = (str: string) => {
  return str.replace(/<(?:.|\n)*?>/gm, '');
};

const getValFromString = (string: string): number => {
  return parseFloat(string.split(' ')[0]);
};

const trimUselessZero = (number: number, precision: number) => {
  const numberWithPrecision = number.toFixed(precision);
  const n = parseFloat(numberWithPrecision).toString();
  if (n.split('.').length > 0 && n.split('.')[1]?.length > 3)
    return FormatUtils.withCommas(n);
  else return FormatUtils.withCommas(parseFloat(n).toFixed(3));
};

const getUSDFromVests = (
  vestAmount: Number,
  globalProperties: GlobalProperties,
  currencyPrices: CurrencyPrices,
) => {
  return (
    FormatUtils.toSP(vestAmount.toString(), globalProperties.globals!) *
    currencyPrices.steem.usd!
  ).toFixed(2);
};

const getOrdinalLabelTranslation = (active_rank: string) => {
  const result = parseFloat(active_rank) % 10;
  switch (result) {
    case 1:
      return 'html_popup_witness_ranking_ordinal_st_label';
    case 2:
      return 'html_popup_witness_ranking_ordinal_nd_label';
    case 3:
      return 'html_popup_witness_ranking_ordinal_rd_label';
    default:
      return 'html_popup_witness_ranking_ordinal_th_label';
  }
};

const FormatUtils = {
  withCommas,
  toSP,
  toFormattedSP,
  fromSP,
  formatCurrencyValue,
  nFormatter,
  hasMoreThanXDecimal,
  toNumber,
  getSymbol,
  getAmountFromNai,
  fromNaiAndSymbol,
  removeHtmlTags,
  getValFromString,
  trimUselessZero,
  getUSDFromVests,
  getOrdinalLabelTranslation,
};

export default FormatUtils;
