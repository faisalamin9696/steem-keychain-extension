import { SteemInternalMarketLockedInOrders } from '@interfaces/steem-market.interface';
import { SteemTxUtils } from '@popup/steem/utils/steem-tx.utils';
import Logger from 'src/utils/logger.utils';

const getSteemInternalMarketOrders = async (username: string) => {
  let totals: SteemInternalMarketLockedInOrders = {
    steem: 0,
    sbd: 0,
  };
  try {
    const openMarketOrders = await SteemTxUtils.getData(
      'condenser_api.get_open_orders',
      [username],
    );
    totals.steem = openMarketOrders
      .filter((order: any) => order.sell_price.base.includes('STEEM'))
      .reduce(
        (acc: number, openOrder: any) =>
          acc + parseFloat(openOrder.sell_price.base.split(' ')[0]),
        0,
      );
    totals.sbd = openMarketOrders
      .filter((order: any) => order.sell_price.base.includes('SBD'))
      .reduce(
        (acc: number, openOrder: any) =>
          acc + parseFloat(openOrder.sell_price.base.split(' ')[0]),
        0,
      );
  } catch (error) {
    Logger.log('Error getting STEEM Open orders for user', { error });
  } finally {
    return totals;
  }
};

export const SteemInternalMarketUtils = {
  getSteemInternalMarketOrders,
};
