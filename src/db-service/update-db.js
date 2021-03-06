// fetch remote data and process new items

import moment from 'moment';
import { fetchExchangeDataAfterDate } from '../data-sources/uniswap/uniswap-subgraph.js';
import fetchTimeseries from '../data-sources/alpha-vantage/fetch-timeseries.js';
import processExchangeData from '../data-sources/uniswap/process-exchange-data.js';
import processETH_USDdata from '../data-sources/alpha-vantage/process-ethusd-data.js';
import { readLatestTimestamp } from '../db-service/timestamps-service.js';
import logger from '../logger.js';

const updateDB = async latestTimestamp => {
  // get most recent date
  if (!latestTimestamp) latestTimestamp = await readLatestTimestamp();
  if (latestTimestamp === null || isNaN(latestTimestamp)) latestTimestamp = 0;
  let latestDate = moment.unix(latestTimestamp);
  logger.info('Latest date ' + latestDate.toString());

  // check if its been 24h since most recent date
  const now = moment();
  const sinceLastUpdate = now.diff(latestDate, 's');
  logger.info(
    `Its been ${(sinceLastUpdate / 3600).toFixed(4)} hrs since last update`
  );

  // if yes, do fetches
  if (sinceLastUpdate / 3600 > 24) {
    logger.info('Fetching exchangeDayDatas');
    const exchangeDayDatas = await fetchExchangeDataAfterDate(latestTimestamp);
    if (exchangeDayDatas.length > 0)
      await processExchangeData(exchangeDayDatas);
    logger.info('Fetching ETH/USD timeseries');
    const ETH_USDdata = await fetchTimeseries('ETH', 'USD');
    if (ETH_USDdata.length > 0) await processETH_USDdata(ETH_USDdata);
    logger.info(`Got ${ETH_USDdata.length} days`);
  }
};

export default updateDB;
