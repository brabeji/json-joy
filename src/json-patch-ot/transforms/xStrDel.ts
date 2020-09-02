import {Op, OpStrDel, OpStrIns} from '../../json-patch/op';

export const xStrDel = (del: OpStrDel, op: Op): null | Op | Op[] => {
  if (op.op === 'str_ins') {
    const ins = op;
    if (ins.pos > del.pos) {
      const deleteLength = del.deleteLength();
      return new OpStrIns(ins.path, op.pos - deleteLength, op.str);
    }
    return op;
  }

  if (op.op === 'str_del') {
    const opLen = op.deleteLength();
    const delLen = del.deleteLength();
    const overlapLen1 = del.pos + delLen - op.pos;
    const overlapLen2 = op.pos + opLen - del.pos;
    if (del.pos <= op.pos && overlapLen1 > 0) {
      const newLen = opLen - overlapLen1;
      if (newLen <= 0) return null;
      if (typeof op.str === 'string')
        return new OpStrDel(op.path, op.pos - (delLen - overlapLen1), op.str.substr(overlapLen1), undefined);
      else return new OpStrDel(op.path, op.pos, undefined, newLen);
    } else if (del.pos >= op.pos && overlapLen2 > 0) {
      const newLen = del.pos - op.pos + Math.max(0, overlapLen2 - delLen);
      if (newLen <= 0) return null;
      if (typeof op.str === 'string') return new OpStrDel(op.path, op.pos, op.str.substr(0, newLen), undefined);
      else return new OpStrDel(op.path, op.pos, undefined, newLen);
    } else if (del.pos < op.pos) {
      if (typeof op.str === 'string') return new OpStrDel(op.path, op.pos - delLen, op.str, undefined);
      else return new OpStrDel(op.path, op.pos - delLen, undefined, op.len);
    }
    return op;
  }

  return op;
};
