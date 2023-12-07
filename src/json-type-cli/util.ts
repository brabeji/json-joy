import {Value} from '../json-type-value';
import {RpcError} from '../reactive-rpc/common/rpc/caller';

export const formatError = (err: unknown): unknown => {
  if (err instanceof Value) return formatError(err.data);
  if (err instanceof RpcError) return err.toJson();
  if (err instanceof Error) return {message: err.message, stack: err.stack};
  return err;
};
