import { NO_BALANCE } from "./reducers/balance";
import { notificationList} from "./constants/notificationList";
import {NO_PRICE} from "./reducers/priceHistory";

export const convertTimestampToDateString = timestamp =>
  new Date(timestamp).toLocaleDateString();

//coingeckeo delivers to much prices, so we reduce it
export const lowerPricePoints = priceData => {
  const prices = priceData.prices;
  const reducedPrices = [];
  const maxVal = 30;
  const delta = Math.round(prices.length / maxVal);
  let i;
  for (i = 0; i < prices.length; i += delta) {
    reducedPrices.push(prices[i]);
  }

  return { prices: reducedPrices };
};

export const convertBalanceForReading = balance => {
  if (balance === NO_BALANCE) return balance;

  const readableBalance = (balance / Math.pow(10, 12)).toFixed(4);

  if (readableBalance % 1 === 0) return parseInt(readableBalance);
  return readableBalance;
};

export const uuidv4 = () => {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
};

export const getMessageOfError = (error) => {

  const errorNotification = notificationList.find( notification => notification.code === error.code );
  return errorNotification? errorNotification.message : error.message;

};


export const calcValue = (amount, price) => {

  if (amount === NO_BALANCE || price === NO_PRICE ) {
    return '--';
  }
  else {
    return (amount * price).toLocaleString("en-US", {
      style: "currency",
      currency: "USD"
    });
  }


};
