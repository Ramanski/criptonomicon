import { config } from "../config";
import { HandlePriceForPair, HandleInvalidPair } from "./tickerHandlingService";

const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${config.API_KEY}`
);

const AGGREGATE_INDEX = "5";
const INVALID_INDEX = "500";

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
      if (newPrice) HandlePriceForPair(fromCurrency, toCurrency, newPrice);
      break;
    case INVALID_INDEX: {
      let args = parameter.split("~");
      if (message === "INVALID_SUB") HandleInvalidPair(args[2], args[3]);
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

export function subscribeToTickerOnWs(fromCurrency, toCurrency) {
  sendToWebSocket({
    action: "SubAdd",
    subs: [`5~CCCAGG~${fromCurrency}~${toCurrency}`],
  });
}

export function unsubscribeFromTickerOnWs(fromCurrency, toCurrency) {
  sendToWebSocket({
    action: "SubRemove",
    subs: [`5~CCCAGG~${fromCurrency}~${toCurrency}`],
  });
}
