import { subscribeToTickerOnWs, unsubscribeFromTickerOnWs } from "./api";

const tickersHandlers = new Map(); // {}
const CURRENCY = {
  USD: "USD",
  BTC: "BTC",
};
var BTCRelatedTickers = [];
var BTCCost = null;

export function HandlePriceForPair(fromCurrency, toCurrency, newPrice) {
  if (fromCurrency === CURRENCY.BTC && toCurrency === CURRENCY.USD) {
    BTCRelatedTickers?.forEach(({ tickerName, priceInBTC }) =>
      UpdatePrice(tickerName, priceInBTC * newPrice)
    );
    BTCCost = newPrice;
  }

  if (toCurrency === CURRENCY.BTC) {
    let ticker = BTCRelatedTickers?.find(
      ({ tickerName }) => tickerName === fromCurrency
    );
    ticker.priceInBTC = newPrice;
    newPrice *= BTCCost;
  }

  UpdatePrice(fromCurrency, newPrice);
}

function UpdatePrice(tickerName, newPrice) {
  if (newPrice) tickersHandlers.get(tickerName)?.forEach((fn) => fn(newPrice));
}

function TryUnsubscribeBTConWS() {
  if (
    BTCRelatedTickers.length == 1 &&
    BTCRelatedTickers[0].tickerName === CURRENCY.BTC &&
    !tickersHandlers.has(CURRENCY.BTC)
  ) {
    unsubscribeFromTickerOnWs(CURRENCY.BTC, CURRENCY.USD);
    BTCCost = null;
    BTCRelatedTickers = [];
  }
}

function TrySubscribeBTConWS() {
  if (!BTCRelatedTickers.length) {
    BTCRelatedTickers.push({ tickerName: CURRENCY.BTC, priceInBTC: 1 });
    subscribeToTickerOnWs(CURRENCY.BTC, CURRENCY.USD);
  }
}

export function HandleInvalidPair(fromCurrency, toCurrency) {
  if (toCurrency === CURRENCY.USD) {
    unsubscribeFromTickerOnWs(fromCurrency, toCurrency);
    TrySubscribeBTConWS();
    subscribeToTickerOnWs(fromCurrency, CURRENCY.BTC);
    BTCRelatedTickers.push({ tickerName: fromCurrency });
  } else {
    BTCRelatedTickers = BTCRelatedTickers.filter(
      ({ tickerName }) => tickerName !== fromCurrency
    );
    TryUnsubscribeBTConWS();

    var event = new CustomEvent("invalid-ticker", {
      detail: fromCurrency,
    });
    window.dispatchEvent(event);
  }
}

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);

  if (ticker === CURRENCY.BTC) TrySubscribeBTConWS();
  else subscribeToTickerOnWs(ticker, CURRENCY.USD);
};

export const unsubscribeFromTicker = (ticker) => {
  tickersHandlers.delete(ticker);

  if (ticker !== CURRENCY.BTC) {
    unsubscribeFromTickerOnWs(ticker, CURRENCY.USD);
    BTCRelatedTickers = BTCRelatedTickers.filter(
      ({ tickerName }) => tickerName !== ticker
    );
  }

  TryUnsubscribeBTConWS();
};
