import { config } from "../config";

const tickersHandlers = new Map(); // {}
const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${config.API_KEY}`
);
const CURRENCY = {
  USD: "USD",
  BTC: "BTC",
};
const AGGREGATE_INDEX = "5";
const INVALID_INDEX = "500";

var BTCtoUSDCost = null;

socket.addEventListener("message", (e) => {
  const {
    TYPE: type,
    FROMSYMBOL: fromCurrency,
    TOSYMBOL: toCurrency,
    PRICE: newPrice,
    PARAMETER: parameter,
    MESSAGE: message,
  } = JSON.parse(e.data);

  switch (type) {
    case AGGREGATE_INDEX:
      if (!newPrice) return;
      var handlers = tickersHandlers.get(fromCurrency) ?? [];
      handlers.forEach((fn) =>
        fn(toCurrency === CURRENCY.BTC ? newPrice * BTCtoUSDCost : newPrice)
      );
      if (fromCurrency === CURRENCY.BTC && toCurrency === CURRENCY.USD)
        BTCtoUSDCost = newPrice;
      break;
    case INVALID_INDEX: {
      if (message !== "INVALID_SUB") return;
      var from = parameter.split("~")[2];
      var to = parameter.split("~")[3];
      if (!BTCtoUSDCost) subscribeToTickerOnWs(CURRENCY.BTC, CURRENCY.USD);
      if (to === CURRENCY.USD) {
        unsubscribeFromTickerOnWs(from, to);
        subscribeToTickerOnWs(from, CURRENCY.BTC);
      } else {
        var event = new CustomEvent("invalid-ticker", {
          detail: parameter.split("~")[2],
        });
        window.dispatchEvent(event);
      }
    }
  }
});

function sendToWebSocket(message) {
  const stringifiedMessage = JSON.stringify(message);

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(stringifiedMessage);
    return;
  }

  socket.addEventListener(
    "open",
    () => {
      socket.send(stringifiedMessage);
    },
    { once: true }
  );
}

function subscribeToTickerOnWs(fromCurrency, toCurrency) {
  sendToWebSocket({
    action: "SubAdd",
    subs: [`5~CCCAGG~${fromCurrency}~${toCurrency}`],
  });
}

function unsubscribeFromTickerOnWs(fromCurrency, toCurrency) {
  sendToWebSocket({
    action: "SubRemove",
    subs: [`5~CCCAGG~${fromCurrency}~${toCurrency}`],
  });
}

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
  subscribeToTickerOnWs(ticker, CURRENCY.USD);
};

export const unsubscribeFromTicker = (ticker) => {
  tickersHandlers.delete(ticker);
  unsubscribeFromTickerOnWs(ticker, CURRENCY.USD);
  if (!!BTCtoUSDCost && !tickersHandlers.length) {
    unsubscribeFromTickerOnWs(CURRENCY.BTC, CURRENCY.USD);
    BTCtoUSDCost = null;
  }
};
