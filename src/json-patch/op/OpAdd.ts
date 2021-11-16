import type {CompactAddOp} from '../codec/compact/types';
import type {IMessagePackEncoder} from '../../json-pack/Encoder/types';
import {AbstractOp} from './AbstractOp';
import {OperationAdd} from '../types';
import {find, Path, formatJsonPointer} from '../../json-pointer';
import {OPCODE} from '../constants';
import {deepClone} from '../util';

/**
 * @category JSON Patch
 */
export class OpAdd extends AbstractOp<'add'> {
  constructor(path: Path, public readonly value: unknown) {
    super(path);
  }

  public op() {
    return 'add' as 'add';
  }

  public code() {
    return OPCODE.add;
  }

  public apply(doc: unknown) {
    const {val, key, obj} = find(doc, this.path) as any;
    const value = deepClone(this.value);
    if (!obj) doc = value;
    else if (typeof key === 'string') obj[key] = value;
    else {
      const length = obj.length;
      if (key < length) obj.splice(key, 0, value);
      else if (key > length) throw new Error('INVALID_INDEX');
      else obj.push(value);
    }
    return {doc, old: val};
  }

  public toJson(parent?: AbstractOp): OperationAdd {
    return {
      op: 'add',
      path: formatJsonPointer(this.path),
      value: this.value,
    };
  }

  public toCompact(parent?: AbstractOp): CompactAddOp {
    return [OPCODE.add, this.path, this.value];
  }

  public encode(encoder: IMessagePackEncoder) {
    encoder.encodeArrayHeader(3);
    encoder.u8(OPCODE.add);
    encoder.encodeArray(this.path as unknown[]);
    encoder.encodeAny(this.value);
  }
}
