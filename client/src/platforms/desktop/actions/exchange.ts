import { offshoreRPC, onshoreRPC, relayTXRPC } from "../ipc/rpc/rpc";
import {
  addErrorNotification,
  addExchangeSucceedMessage, addNotificationByMessage,
} from "shared/actions/notification";

import {
  EXCHANGE_CREATION_FAILED,
  EXCHANGE_CREATION_FETCHING,
  EXCHANGE_CREATION_SUCCEED,
  EXCHANGE_FAILED,
  EXCHANGE_FETCHING,
  EXCHANGE_RESET,
  EXCHANGE_SUCCEED,
  SELECT_FROM_TICKER,
  SELECT_TO_TICKER,
} from "./types";
import { updateApp } from "./refresh";
import { DesktopAppState } from "../reducers";
import { Ticker } from "shared/reducers/types";
import { showModal } from "shared/actions/modal";
import { MODAL_TYPE } from "shared/reducers/modal";
import { selectPrimaryAddress } from "shared/reducers/address";
import {NotificationType} from "constants/notificationList";

export const setToTicker = (toTicker: Ticker | null) => {
  return { type: SELECT_TO_TICKER, payload: toTicker };
};

export const setFromTicker = (fromTicker: Ticker | null) => {
  return { type: SELECT_FROM_TICKER, payload: fromTicker };
};

export function exchange(
  fromTicker: Ticker,
  toTicker: Ticker,
  fromAmount: number,
  toAmount: number,
  priority: number,
  externAddress: string,
  isOffshore: boolean
): any {
  return (dispatch: any, getState: () => DesktopAppState) => {

    const address =
      externAddress.trim() !== ""
        ? externAddress
        : selectPrimaryAddress(getState().address);

    const xhvAnmount = isOffshore? fromAmount : toAmount;

    if (!sanityCheck(xhvAnmount)) {
      dispatch(addNotificationByMessage(NotificationType.ERROR, 'Exchanges cannot exceed 4 decimals'));
      return;
    }


    const params = createExchangeInputs(xhvAnmount, priority, address);

    dispatch(onExchangeFetch());

    const exchangeRPCFN = isOffshore ? offshoreRPC : onshoreRPC;
    exchangeRPCFN(params)
      .then((result: any) => {
        dispatch(onExchangeSucceed(result));
        dispatch(
          addExchangeSucceedMessage(
            fromTicker!,
            toTicker!,
            fromAmount!,
            toAmount!
          )
        );
        dispatch(updateApp());
      })
      .catch((error: any) => {
        dispatch(addErrorNotification(error));
        dispatch(onExchangeFailed(error));
      })
      .finally(() => dispatch(resetExchangeProcess()));
  };
}

const sanityCheck = (amount:number): boolean => {

  // check that our value has not more than 4 decimals
  return (amount * 1000) % 1 === 0;

};

export function createExchange(
  fromTicker: Ticker,
  toTicker: Ticker,
  fromAmount: number,
  toAmount: number,
  priority: number,
  externAddress: string,
  isOffshore: boolean
): any {
  return (dispatch: any, getState: () => DesktopAppState) => {
    const address =
      externAddress.trim() !== ""
        ? externAddress
        : selectPrimaryAddress(getState().address);

    const xhvAnmount = isOffshore? fromAmount : toAmount;

    if (!sanityCheck(xhvAnmount)) {
      addNotificationByMessage(NotificationType.ERROR, 'Exchanges cannot exceed 4 decimals');
      return;
    }

    const params = createExchangeInputs(fromAmount, priority, address);

    dispatch(
      onExchangeCreationFetch({ fromAmount, toAmount, priority, address })
    );

    const exchangeRPCFN = isOffshore ? offshoreRPC : onshoreRPC;
    exchangeRPCFN(params)
      .then((result: any) => {
        console.log(result);
        dispatch(
          onExchangeCreationSucceed({ metaData: result.tx_metadata_list[0] })
        );
        dispatch(showModal(MODAL_TYPE.ConfirmExchange));
      })
      .catch((error: any) => {
        dispatch(onExchangeCreationFailed(error));
      });
  };
}

export const confirmExchange = (hex: string) => {
  return (dispatch: any, getState: () => DesktopAppState) => {
    const params = { hex };

    dispatch(onExchangeFetch());

    relayTXRPC(params)
      .then((result: any) => {
        dispatch(onExchangeSucceed(result));

        const {
          fromAmount,
          toAmount,
          fromTicker,
          toTicker,
        } = getState().exchangeProcess;
        dispatch(
          addExchangeSucceedMessage(
            fromTicker!,
            toTicker!,
            fromAmount!,
            toAmount!
          )
        );
        dispatch(updateApp());
      })
      .catch((error: any) => {
        dispatch(addErrorNotification(error));
        dispatch(onExchangeFailed(error));
      })
      .finally(() => dispatch(resetExchangeProcess()));
  };
};

const createExchangeInputs = (
  fromAmount: number,
  priority: number,
  address: string
) => {
  const amount = BigInt(fromAmount * 1e12);

  return {
    destinations: [{ address, amount: amount.toString() }],
    priority,
    ring_size: 11,
  //  do_not_relay: true,
   // get_tx_metadata: true,
  };
};

const onExchangeCreationSucceed = (payload: any) => {
  return { type: EXCHANGE_CREATION_SUCCEED, payload };
};

const onExchangeCreationFailed = (error: any) => {
  return { type: EXCHANGE_CREATION_FAILED, payload: error };
};

const onExchangeCreationFetch = (payload: any) => {
  return { type: EXCHANGE_CREATION_FETCHING, payload };
};

const onExchangeSucceed = (payload: any) => {
  return { type: EXCHANGE_SUCCEED, payload };
};

const onExchangeFailed = (error: any) => {
  return { type: EXCHANGE_FAILED, payload: error };
};

const onExchangeFetch = () => {
  return { type: EXCHANGE_FETCHING };
};
export const resetExchangeProcess = () => {
  return { type: EXCHANGE_RESET };
};
