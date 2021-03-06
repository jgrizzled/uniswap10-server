/*  liquidity/volume weighted strategy

    options {
      top: top n tokens in weights
      lookbackPeriod: average period
      volumeWeight: weight factor for average volume
      liquidityWeight: weight factor for average liquidity
          * volumeWeight and liquidityWeight must sum to 1
      weightDivisor: round weights to multiples of 1/weightDivisor
      rebalancePeriod: min dates between rebalances }

    context {
      liquiditiesByAsset: []
      volumesByAsset: [] } */

import { Strategy } from 'portfolio-tools';
import pa from 'portfolio-allocation';
const { roundedWeights } = pa;

const calcWeights = (dateIndex, returnsByAsset, options, context) => {
  // initialize weights
  let weightByAsset = Array(returnsByAsset.length).fill(0);

  // no weights until avg period
  if (dateIndex + 1 < options.lookbackPeriod) return weightByAsset;

  // calc avgs
  const liqAvgByAsset = context.liquiditiesByAsset.map(
    liqs =>
      liqs
        .slice(dateIndex - options.lookbackPeriod + 1, dateIndex + 1)
        .reduce((sum, liq) => sum + liq, 0) / liqs.length
  );
  const volAvgByAsset = context.volumesByAsset.map(
    vols =>
      vols
        .slice(dateIndex - options.lookbackPeriod + 1, dateIndex + 1)
        .reduce((sum, vol) => sum + vol, 0) / vols.length
  );

  // attach values to assets
  const assets = returnsByAsset.map((_, i) => ({
    value:
      liqAvgByAsset[i] * options.liquidityWeight +
      volAvgByAsset[i] * options.volumeWeight,
    assetIndex: i
  }));

  // get top assets
  assets.sort((a, b) => b.value - a.value);
  const topAssets = assets.slice(0, options.top);

  // calc weight divisor
  const totalValue = topAssets.reduce((sum, a) => sum + a.value, 0);

  // calc weights
  topAssets.forEach(a => {
    weightByAsset[a.assetIndex] = a.value / totalValue;
  });

  // round weights
  weightByAsset = roundedWeights(weightByAsset, options.weightDivisor);

  return weightByAsset;
};

const validateOptions = (options, returnsByAsset) => {
  if (typeof options.top !== 'number' || options.top < 1 || options.top > 10000)
    throw new Error('invalid top ' + options.top);

  if (
    typeof options.lookbackPeriod !== 'number' ||
    options.lookbackPeriod < 1 ||
    options.lookbackPeriod >= returnsByAsset[0].length
  )
    throw new Error('invalid period ' + options.lookbackPeriod);

  if (
    typeof options.liquidityWeight !== 'number' ||
    options.liquidityWeight < 0 ||
    typeof options.volumeWeight !== 'number' ||
    options.volumeWeight < 0 ||
    options.liquidityWeight + options.volumeWeight !== 1
  )
    throw new Error(
      `invalid volume weight ${options.volumeWeight} and/or liquidity weight ${options.liquidityWeight}`
    );

  if (
    typeof options.weightDivisor !== 'number' ||
    options.weightDivisor < 1 ||
    !Number.isInteger(options.weightDivisor)
  )
    if (
      typeof options.rebalancePeriod !== 'number' ||
      options.rebalancePeriod < 1 ||
      !Number.isInteger(options.rebalancePeriod) ||
      options.rebalancePeriod >= returnsByAsset[0].length
    )
      throw new Error('invalid rebalancePeriod ' + options.rebalancePeriod);
};

const validateContext = (context, returnsByAsset) => {
  if (
    context.liquiditiesByAsset.length !== returnsByAsset.length ||
    context.liquiditiesByAsset[0].length !== returnsByAsset[0].length
  )
    throw new Error('invalid liquiditiesByAsset');

  if (
    context.volumesByAsset.length !== returnsByAsset.length ||
    context.volumesByAsset[0].length !== returnsByAsset[0].length
  )
    throw new Error('invalid volumesByAsset');
};

export default new Strategy(calcWeights, validateOptions, validateContext);
