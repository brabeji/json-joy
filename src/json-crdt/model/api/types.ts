import type * as types from '../../nodes';
import type * as nodes from './nodes';

// prettier-ignore
export type JsonNodeApi<N> = N extends types.ConNode<any>
  ? nodes.ConApi<N>
  : N extends types.RootLww<any>
    ? nodes.ValApi<N>
    : N extends types.ValNode<any>
      ? nodes.ValApi<N>
      : N extends types.StrNode
        ? nodes.StrApi
        : N extends types.BinNode
          ? nodes.BinaryApi
          : N extends types.ArrayRga<any>
            ? nodes.ArrayApi<N>
            : N extends types.ObjNode<any>
              ? nodes.ObjApi<N>
              : N extends types.VecNode<any>
                ? nodes.VecApi<N>
                : never;
