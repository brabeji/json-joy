import {
  AbstractPredicateOp,
  Op,
  OpAdd,
  OpAnd,
  OpContains,
  OpCopy,
  OpDefined,
  OpEnds,
  OpExtend,
  OpFlip,
  OpIn,
  OpInc,
  OpLess,
  OpMatches,
  OpMerge,
  OpMore,
  OpMove,
  OpNot,
  OpOr,
  OpRemove,
  OpReplace,
  OpSplit,
  OpStarts,
  OpStrDel,
  OpStrIns,
  OpTest,
  OpTestString,
  OpTestStringLen,
  OpTestType,
  OpType,
  OpUndefined,
} from '../../op';
import {Decoder as MessagePackDecoder} from '../../../json-pack/Decoder';
import {OPCODE} from '../../constants';
import {Path} from '../../../json-pointer';
import {JsonPatchTypes} from '../json/types';

export class Decoder extends MessagePackDecoder {
  public decode(uint8: Uint8Array): Op[] {
    this.reset(uint8);
    return this.decodePatch();
  }

  protected decodePatch(): Op[] {
    const len = this.decodeArrayHeader();
    const ops: Op[] = [];
    for (let i = 0; i < len; i++) ops.push(this.decodeOp(undefined));
    return ops;
  }

  protected decodeOp(parent: Op | undefined): Op {
    const length = this.decodeArrayHeader();
    const opcode = this.u8();
    switch (opcode) {
      case OPCODE.add: {
        const path = this.decodeArray() as Path;
        const value = this.val();
        return new OpAdd(path, value);
      }
      case OPCODE.and: {
        const path = this.decodePath(parent);
        const length = this.decodeArrayHeader();
        const ops: AbstractPredicateOp[] = [];
        const op = new OpAnd(path, ops);
        for (let i = 0; i < length; i++) ops.push(this.decodeOp(op) as AbstractPredicateOp);
        return op;
      }
      case OPCODE.contains: {
        const path = this.decodePath(parent);
        const value = this.decodeString();
        const ignoreCase = length > 3;
        return new OpContains(path, value, ignoreCase);
      }
      case OPCODE.copy: {
        const path = this.decodeArray() as Path;
        const from = this.decodeArray() as Path;
        return new OpCopy(path, from);
      }
      case OPCODE.defined: {
        const path = this.decodePath(parent);
        return new OpDefined(path);
      }
      case OPCODE.ends: {
        const path = this.decodePath(parent);
        const value = this.decodeString();
        const ignoreCase = length > 3;
        return new OpEnds(path, value, ignoreCase);
      }
      case OPCODE.extend: {
        const path = this.decodeArray() as Path;
        const props = this.decodeObject() as Record<string, unknown>;
        const deleteNull = length > 3;
        return new OpExtend(path, props, deleteNull);
      }
      case OPCODE.flip: {
        const path = this.decodeArray() as Path;
        return new OpFlip(path);
      }
      case OPCODE.in: {
        const path = this.decodePath(parent);
        const value = this.decodeArray();
        return new OpIn(path, value);
      }
      case OPCODE.inc: {
        const path = this.decodePath(parent);
        const inc = this.val() as number;
        return new OpInc(path, inc);
      }
      case OPCODE.less: {
        const path = this.decodePath(parent);
        const value = this.val() as number;
        return new OpLess(path, value);
      }
      case OPCODE.matches: {
        const path = this.decodePath(parent);
        const value = this.decodeString();
        const ignoreCase = length > 3;
        return new OpMatches(path, value, ignoreCase);
      }
      case OPCODE.merge: {
        const hasProps = length > 3;
        const path = this.decodeArray() as Path;
        const pos = this.val() as number;
        const props = hasProps ? this.decodeObject() : null;
        return new OpMerge(path, pos, props);
      }
      case OPCODE.more: {
        const path = this.decodePath(parent);
        const value = this.val() as number;
        return new OpMore(path, value);
      }
      case OPCODE.move: {
        const path = this.decodeArray() as Path;
        const from = this.decodeArray() as Path;
        return new OpMove(path, from);
      }
      case OPCODE.not: {
        const path = this.decodePath(parent);
        const length = this.decodeArrayHeader();
        const ops: AbstractPredicateOp[] = [];
        const op = new OpNot(path, ops);
        for (let i = 0; i < length; i++) ops.push(this.decodeOp(op) as AbstractPredicateOp);
        return op;
      }
      case OPCODE.or: {
        const path = this.decodePath(parent);
        const length = this.decodeArrayHeader();
        const ops: AbstractPredicateOp[] = [];
        const op = new OpOr(path, ops);
        for (let i = 0; i < length; i++) ops.push(this.decodeOp(op) as AbstractPredicateOp);
        return op;
      }
      case OPCODE.remove: {
        const path = this.decodeArray() as Path;
        const hasOldValue = length > 2;
        const oldValue = hasOldValue ? this.val() : undefined;
        return new OpRemove(path, oldValue);
      }
      case OPCODE.replace: {
        const path = this.decodeArray() as Path;
        const value = this.val();
        const hasOldValue = length > 3;
        const oldValue = hasOldValue ? this.val() : undefined;
        return new OpReplace(path, value, oldValue);
      }
      case OPCODE.split: {
        const path = this.decodeArray() as Path;
        const pos = this.val() as number;
        const hasProps = length > 3;
        const props = hasProps ? this.decodeObject() : null;
        return new OpSplit(path, pos, props);
      }
      case OPCODE.starts: {
        const ignoreCase = length > 3;
        const path = this.decodePath(parent);
        const value = this.decodeString();
        return new OpStarts(path, value, ignoreCase);
      }
      case OPCODE.str_del: {
        const hasStr = length < 5;
        const path = this.decodeArray() as Path;
        const pos = this.val() as number;
        if (hasStr) {
          const str = this.decodeString();
          return new OpStrDel(path, pos, str, undefined);
        } else {
          this.u8();
          const len = this.val() as number;
          return new OpStrDel(path, pos, undefined, len);
        }
      }
      case OPCODE.str_ins: {
        const path = this.decodeArray() as Path;
        const pos = this.val() as number;
        const str = this.decodeString();
        return new OpStrIns(path, pos, str);
      }
      case OPCODE.test: {
        const not = length > 3;
        const path = this.decodePath(parent);
        const value = this.val();
        return new OpTest(path, value, not);
      }
      case OPCODE.test_string: {
        const not = length > 4;
        const path = this.decodePath(parent);
        const pos = this.val() as number;
        const str = this.decodeString();
        return new OpTestString(path, pos, str, not);
      }
      case OPCODE.test_string_len: {
        const not = length > 3;
        const path = this.decodePath(parent);
        const len = this.val() as number;
        return new OpTestStringLen(path, len, not);
      }
      case OPCODE.test_type: {
        const path = this.decodePath(parent);
        const type = this.decodeArray() as JsonPatchTypes[];
        return new OpTestType(path, type);
      }
      case OPCODE.type: {
        const path = this.decodePath(parent);
        const value = this.decodeString() as JsonPatchTypes;
        return new OpType(path, value);
      }
      case OPCODE.undefined: {
        const path = this.decodePath(parent);
        return new OpUndefined(path);
      }
    }
    throw new Error('OP_UNKNOWN');
  }

  protected decodePath(parent: Op | undefined): Path {
    const path = this.decodeArray() as Path;
    if (!parent) return path;
    return [...parent.path, ...path];
  }

  protected decodeObject(): object {
    const byte = this.u8();
    if (byte <= 0xbf) return this.obj(byte & 0b1111);
    else if (byte === 0xde) return this.obj(this.u16());
    /* 0xdf */ else return this.obj(this.u32());
  }

  protected decodeArray(): unknown[] {
    const byte = this.u8();
    if (byte < 0b10011111) return this.arr(byte & 0b1111);
    else if (byte === 0xdc) return this.arr(this.u16());
    else return this.arr(this.u32());
  }

  protected decodeArrayHeader(): number {
    const byte = this.u8();
    if (byte < 0b10011111) return byte & 0b1111;
    else if (byte === 0xdc) return this.u16();
    else return this.u32();
  }

  protected decodeString(): string {
    const byte = this.u8();
    if (byte <= 0xbf) return this.str(byte & 0b11111);
    else if (byte === 0xd9) return this.str(this.u8());
    else if (byte === 0xda) return this.str(this.u16());
    /* 0xDB */ else return this.str(this.u32());
  }
}
