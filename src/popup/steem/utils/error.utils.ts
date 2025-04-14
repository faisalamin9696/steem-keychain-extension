import { KeychainError } from 'src/keychain-error';
import FormatUtils from 'src/utils/format.utils';
import Logger from 'src/utils/logger.utils';

enum BlockchainErrorType {
  ADJUST_BLANCE = 'adjust_balance',
  GET_ACCOUNT = 'get_account',
  DO_APPLY = 'do_apply',
  WITNESS_NOT_FOUND = 'get_witness',
  VALIDATION = 'validate',
  VALIDATE_TRANSACTION = 'validate_transaction',
  MISSING_AUTHORITY = 'verify_authority',
}

enum SteemEngineErrorType {
  OVERDRAW_BALANCE = 'overdrawn balance',
  TOKEN_NOT_EXISTING = 'symbol does not exist',
  USER_NOT_EXISTING = 'invalid to',
}

const parse = (error: any) => {
  Logger.log(error);

  const formatValue = (value: any) => {
    switch (typeof value) {
      case 'object':
        return JSON.stringify(value);
      default:
        return String(value);
    }
  };

  const stack = error?.data?.stack[0];
  if (stack?.context?.method) {
    switch (stack.context.method) {
      case BlockchainErrorType.ADJUST_BLANCE:
        return new KeychainError(
          'bgd_ops_transfer_adjust_balance',
          [FormatUtils.getSymbol(stack.data.a.nai), stack.data.acc!],
          error,
        );
      case BlockchainErrorType.GET_ACCOUNT:
        return new KeychainError(
          'bgd_ops_transfer_get_account',
          [stack.data.name],
          error,
        );
      case BlockchainErrorType.DO_APPLY: {
        if (stack.format.includes('has_proxy')) {
          return new KeychainError(
            'html_popup_witness_vote_error_proxy',
            [],
            error,
          );
        }
        if (stack.format.includes('Proxy must change')) {
          return new KeychainError('set_same_proxy_error', [], error);
        }
        if (stack.format.includes('reject')) {
          return new KeychainError(
            'html_popup_witness_already_voted',
            [],
            error,
          );
        }
        if (stack.format.includes('approve')) {
          return new KeychainError('html_popup_witness_not_voted', [], error);
        }
        if (stack.format.includes('too many')) {
          return new KeychainError(
            'html_popup_vote_witness_error_30_votes',
            [],
            error,
          );
        }
        if (
          stack.format.includes(
            'Account does not have sufficient Steem Power for withdraw',
          )
        ) {
          return new KeychainError(
            'power_down_hp_not_sufficient_error',
            [],
            error,
          );
        }
        break;
      }
      case BlockchainErrorType.WITNESS_NOT_FOUND:
        return new KeychainError('html_popup_witness_not_existing', [], error);
      case BlockchainErrorType.VALIDATION: {
        if (stack.format.includes('${days}')) {
          return new KeychainError(
            'recurrent_transfer_recurrence_max_duration_error',
            [stack.data.days],
            error,
          );
        }
        if (stack.format.includes('${recurrence}')) {
          return new KeychainError(
            'recurrent_transfer_recurrence_error',
            [stack.data.recurrence],
            error,
          );
        }
        if (stack.format.includes('execution')) {
          return new KeychainError(
            'recurrent_transfer_iterations_error',
            [],
            error,
          );
        }
      }
      case BlockchainErrorType.VALIDATE_TRANSACTION: {
        if (error.message.includes('transaction expiration exception')) {
          return new KeychainError('broadcast_error_transaction_expired');
        }
      }
      case BlockchainErrorType.MISSING_AUTHORITY: {
        return new KeychainError(error.data.name);
      }
    }
  }

  if (error.data && error.data.name === 'not_enough_rc_exception') {
    return new KeychainError('not_enough_rc', [], error);
  }
  if (stack && stack.format && !stack.format.includes('${what}')) {
    let message = '';
    if (stack.data) {
      message = stack.format.replace(
        /\$\{([a-z_]+)\}/gi,
        (match: string, key: string) => {
          let rv = match;
          if (stack.data[key]) {
            rv = formatValue(stack.data[key]);
            delete stack.data[key];
          }
          return rv;
        },
      );
    }

    return new KeychainError(
      'error_while_broadcasting',
      [message || stack.format],
      error,
    );
  }
  return new KeychainError('html_popup_error_while_broadcasting', [], error);
};

const parseSteemEngine = (error: string, payload: any) => {
  if (error.includes(SteemEngineErrorType.OVERDRAW_BALANCE)) {
    return new KeychainError('hive_engine_overdraw_balance_error', [
      payload.symbol,
    ]);
  }
  if (error.includes(SteemEngineErrorType.TOKEN_NOT_EXISTING)) {
    return new KeychainError('hive_engine_not_existing_token_error', [
      payload.symbol,
    ]);
  }
  if (error.includes(SteemEngineErrorType.USER_NOT_EXISTING)) {
    return new KeychainError('hive_engine_not_existing_user_error', [
      payload.to,
    ]);
  }
  return new KeychainError('bgd_ops_hive_engine_confirmation_error', [error]);
};

export const ErrorUtils = { parse, parseSteemEngine };
