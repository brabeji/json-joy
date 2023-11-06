import {ITimestampStruct, Timestamp} from '../../../../json-crdt-patch/clock';
import {ClockTable} from '../../../../json-crdt-patch/codec/clock/ClockTable';
import {CrdtWriter} from '../../../../json-crdt-patch/util/binary/CrdtWriter';
import {CborEncoder} from '../../../../json-pack/cbor/CborEncoder';
import {Model} from '../../../model';
import * as nodes from '../../../nodes';
import {CRDT_MAJOR_OVERLAY} from '../../structural/binary/constants';
import {IndexedFields, FieldName} from './types';

const EMPTY = new Uint8Array(0);

export class Encoder {
  public readonly enc: CborEncoder<CrdtWriter>;
  protected clockTable?: ClockTable;
  protected model?: IndexedFields;

  constructor(writer?: CrdtWriter) {
    this.enc = new CborEncoder<CrdtWriter>(writer || new CrdtWriter());
  }

  public encode(doc: Model, clockTable: ClockTable = ClockTable.from(doc.clock)): IndexedFields {
    this.clockTable = clockTable;
    const writer = this.enc.writer;
    writer.reset();
    clockTable.write(writer);
    const encodedClock = writer.flush();
    const rootValueId = doc.root.val;
    const model: IndexedFields = (this.model = {
      c: encodedClock,
    });
    if (rootValueId.sid !== 0) {
      writer.reset();
      this.ts(rootValueId);
      model.r = writer.flush();
    }
    doc.index.forEach(({v: node}) => this.onNode(node));
    return model;
  }

  protected readonly onNode = (node: nodes.JsonNode) => {
    const id = node.id;
    const sid = id.sid;
    const time = id.time;
    const model = this.model!;
    const sidIndex = this.clockTable!.getBySid(sid).index;
    const sidFieldPart = sidIndex.toString(36) + '_';
    const field = (sidFieldPart + time.toString(36)) as FieldName;
    model[field] = this.encodeNode(node);
  };

  public encodeNode(node: nodes.JsonNode): Uint8Array {
    if (node instanceof nodes.ConNode) return this.encodeCon(node);
    else if (node instanceof nodes.ValNode) return this.encodeVal(node);
    else if (node instanceof nodes.ObjNode) return this.encodeObj(node);
    else if (node instanceof nodes.VecNode) return this.encodeVec(node);
    else if (node instanceof nodes.StrNode) return this.encodeStr(node);
    else if (node instanceof nodes.BinNode) return this.encodeBin(node);
    else if (node instanceof nodes.ArrNode) return this.encodeArr(node);
    else return EMPTY;
  }

  protected ts(id: ITimestampStruct): void {
    const index = this.clockTable!.getBySid(id.sid).index;
    this.enc.writer.id(index, id.time);
  }

  protected writeTL(majorOverlay: CRDT_MAJOR_OVERLAY, length: number): void {
    const writer = this.enc.writer;
    if (length < 24) writer.u8(majorOverlay + length);
    else if (length <= 0xff) writer.u16(((majorOverlay + 24) << 8) + length);
    else if (length <= 0xffff) writer.u8u16(majorOverlay + 25, length);
    else writer.u8u32(majorOverlay + 26, length);
  }

  public encodeCon(node: nodes.ConNode): Uint8Array {
    const encoder = this.enc;
    const writer = encoder.writer;
    const val = node.val;
    writer.reset();
    if (val instanceof Timestamp) {
      this.writeTL(CRDT_MAJOR_OVERLAY.CON, 1);
      this.ts(val as Timestamp);
    } else {
      this.writeTL(CRDT_MAJOR_OVERLAY.CON, 0);
      encoder.writeAny(val);
    }
    return writer.flush();
  }

  public encodeVal(node: nodes.ValNode): Uint8Array {
    const writer = this.enc.writer;
    const child = node.node();
    writer.reset();
    this.writeTL(CRDT_MAJOR_OVERLAY.VAL, 0);
    this.ts(child.id);
    return writer.flush();
  }

  public encodeObj(node: nodes.ObjNode): Uint8Array {
    const encoder = this.enc;
    const writer = encoder.writer;
    writer.reset();
    const keys = node.keys;
    this.writeTL(CRDT_MAJOR_OVERLAY.OBJ, keys.size);
    keys.forEach(this.onObjKey);
    return writer.flush();
  }

  private readonly onObjKey = (value: ITimestampStruct, key: string) => {
    this.enc.writeStr(key);
    this.ts(value);
  };

  public encodeVec(node: nodes.VecNode): Uint8Array {
    const writer = this.enc.writer;
    writer.reset();
    const length = node.elements.length;
    this.writeTL(CRDT_MAJOR_OVERLAY.VEC, length);
    for (let i = 0; i < length; i++) {
      const childId = node.val(i);
      if (!childId) writer.u8(0);
      else {
        writer.u8(1);
        this.ts(childId);
      }
    }
    return writer.flush();
  }

  public encodeStr(node: nodes.StrNode): Uint8Array {
    const encoder = this.enc;
    const writer = encoder.writer;
    writer.reset();
    this.writeTL(CRDT_MAJOR_OVERLAY.STR, node.count);
    for (let chunk = node.first(); chunk; chunk = node.next(chunk)) {
      this.ts(chunk.id);
      if (chunk.del) {
        writer.u8(0);
        writer.vu39(chunk.span);
      } else encoder.writeStr(chunk.data!);
    }
    return writer.flush();
  }

  public encodeBin(node: nodes.BinNode): Uint8Array {
    const encoder = this.enc;
    const writer = encoder.writer;
    writer.reset();
    this.writeTL(CRDT_MAJOR_OVERLAY.BIN, node.count);
    for (let chunk = node.first(); chunk; chunk = node.next(chunk)) {
      const length = chunk.span;
      const deleted = chunk.del;
      this.ts(chunk.id);
      writer.b1vu56(~~deleted as 0 | 1, length);
      if (deleted) continue;
      writer.buf(chunk.data!, length);
    }
    return writer.flush();
  }

  public encodeArr(node: nodes.ArrNode): Uint8Array {
    const encoder = this.enc;
    const writer = encoder.writer;
    writer.reset();
    this.writeTL(CRDT_MAJOR_OVERLAY.ARR, node.count);
    for (let chunk = node.first(); chunk; chunk = node.next(chunk)) {
      const length = chunk.span;
      const deleted = chunk.del;
      this.ts(chunk.id);
      writer.b1vu56(~~deleted as 0 | 1, length);
      if (deleted) continue;
      const data = chunk.data;
      for (let i = 0; i < length; i++) this.ts(data![i]);
    }
    return writer.flush();
  }
}
