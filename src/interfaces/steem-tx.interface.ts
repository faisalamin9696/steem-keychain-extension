export interface TransactionResult {
  tx_id: string;
  id: string;
  // status: string;
  // block_num: number;
  confirmed?: boolean;
  isUsingMultisig?: boolean;
}

export interface SteemTxBroadcastResult {
  status: string;
  tx_id: string;
  isUsingMultisig?: boolean;
}

export interface SteemTxBroadcastSuccessResponse {
  id: number;
  jsonrpc: string;
  result: SteemTxBroadcastResult;
}

export interface SteemTxBroadcastErrorResponse {
  error: object;
}
