import {deepClone} from './util';
import {Operation} from './types';
import {Op, operationToOp} from './op';

export interface OpResult {
  doc: unknown;
  old?: unknown;
}

export interface PatchResult {
  doc: unknown;
  res: readonly OpResult[];
}

export function applyOp(doc: unknown, op: Op, mutate: boolean): OpResult {
  if (!mutate) doc = deepClone(doc);
  return op.apply(doc);
}

export function applyOps(doc: unknown, ops: readonly Op[], mutate: boolean): PatchResult {
  if (!Array.isArray(ops)) throw new Error('SEQUENCE_NOT_AN_ARRAY');
  if (!mutate) doc = deepClone(doc);
  const res: OpResult[] = [];
  for (const op of ops) {
    const opResult = op.apply(doc);
    doc = opResult.doc;
    res.push(opResult);
  }
  return {doc, res};
}

export function applyPatch(doc: unknown, patch: readonly Operation[], mutate: boolean): PatchResult {
  const result = applyOps(doc, patch.map(operationToOp), mutate);
  return result;
}
