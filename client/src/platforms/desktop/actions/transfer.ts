import { offshoreTransferRPC, relayTXRPC, transfer_splitRPC } from "../ipc/rpc/rpc";

import {
  TRANSFER_CREATION_FAILED,
  TRANSFER_CREATION_FETCHING,
  TRANSFER_CREATION_SUCCEED,
  TRANSFER_FAILED,
  TRANSFER_FETCHING,
  TRANSFER_RESET,
  TRANSFER_SUCCEED,
} from "./types";

import {
  addErrorNotification,
  addNotificationByKey,
} from "shared/actions/notification";
import { TRANSFER_SUCCEED_MESSAGE } from "constants/notificationList";
import { getOffshoreBalance } from "platforms/desktop/actions/offshoreBalance";
import { Ticker } from "shared/reducers/types";
import { hideModal, showModal } from "shared/actions/modal";
import { MODAL_TYPE } from "shared/reducers/modal";
import { convertBalanceForReading } from "utility/utility";
import {getTransfers} from "platforms/desktop/actions/transferHistory";
import {getBalance} from "platforms/desktop/actions/balance";


export const transfer = (
    address: string,
    amount: number,
    paymentId: string,
    fromTicker: Ticker
) => {
  amount = amount * 1e12;
  return (dispatch: any) => {
    dispatch(transferFetch());
    const params: any = { destinations: [{ address, amount }], ring_size: 11 };

    if (paymentId !== "") {
      params["payment_id"] = paymentId;
    }

      const transferFN =
          fromTicker === Ticker.XHV ? transfer_splitRPC : offshoreTransferRPC;

      transferFN(params)
        .then(result => {
          dispatch(transferSucceed(result));
          dispatch(addNotificationByKey(TRANSFER_SUCCEED_MESSAGE));

          dispatch(getTransfers());
          dispatch(getBalance());
          dispatch(getOffshoreBalance());
        })
        .catch(error => dispatch(manageTransferFailed(error)));
  };
};

export const createTransfer = (
  address: string,
  fromAmount: number,
  paymentId: string,
  fromTicker: Ticker
) => {
  const amount = fromAmount * 1e12;
  return (dispatch: any) => {
    dispatch(
      transferCreationFetch({ address, fromAmount, paymentId, fromTicker })
    );
    const params: any = createTXInputs(address, amount, paymentId);

    const transferFN =
      fromTicker === Ticker.XHV ? transfer_splitRPC : offshoreTransferRPC;

    transferFN(params)
      .then((result) => {
        const { amount, fee, tx_metadata } = result;

        const reduxParams = {
          fee: convertBalanceForReading(fee),
          fromAmount: convertBalanceForReading(amount),
          metaData: tx_metadata,
        };

        dispatch(transferCreationSucceed(reduxParams));
        dispatch(showModal(MODAL_TYPE.ConfirmTx));
      })
      .catch((error) => dispatch(transferCreationFailed(error)));
  };
};

export const confirmTransfer = (hex: string) => {
  return (dispatch: any) => {
    dispatch(transferFetch());

    const params = { hex };

    relayTXRPC(params)
      .then((result) => {
        dispatch(transferSucceed(result));
        dispatch(addNotificationByKey(TRANSFER_SUCCEED_MESSAGE));
        dispatch(getOffshoreBalance());
        dispatch(getTransfers());
        dispatch(getBalance());
      })
      .catch((error) => dispatch(manageTransferFailed(error)))
      .finally(() => dispatch(hideModal()));
  };
};

export const createTXInputs = (
  address: string,
  amount: number,
  paymentId: string
) => {
  const params: any = {
    destinations: [{ address, amount }],
    ring_size: 11,
   //  do_not_relay: true,
   // get_tx_metadata: true
  };

  if (paymentId !== "") {
    params["payment_id"] = paymentId;
  }

  return params;
};

const transferFetch = () => ({
  type: TRANSFER_FETCHING,
  payload: { isFetching: true },
});
const transferSucceed = (result: object) => ({
  type: TRANSFER_SUCCEED,
  payload: { ...result, isFetching: false },
});

const transferFailed = (error: any) => ({
  type: TRANSFER_FAILED,
  payload: { ...error, isFetching: false },
});

const transferCreationFetch = (params: object) => ({
  type: TRANSFER_CREATION_FETCHING,
  payload: { ...params, isFetching: true },
});
const transferCreationSucceed = (result: object) => ({
  type: TRANSFER_CREATION_SUCCEED,
  payload: { ...result },
});

const transferCreationFailed = (error: any) => ({
  type: TRANSFER_CREATION_FAILED,
  payload: { ...error, isFetching: false },
});

const manageTransferFailed = (error: any) => {
  return (dispatch: any) => {
    dispatch(transferFailed(error));
    dispatch(addErrorNotification(error));
  };
};

export const resetTransferProcess = () => {
  return { type: TRANSFER_RESET };
};
