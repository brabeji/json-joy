import {CrdtReader} from '../../../../json-crdt-patch/util/binary/CrdtReader';
import {CborDecoderBase} from '../../../../json-pack/cbor/CborDecoderBase';
import {CRDT_MAJOR} from './constants';

export class ViewDecoder extends CborDecoderBase<CrdtReader> {
  protected time: number = -1;

  constructor() {
    super(new CrdtReader());
  }

  public decode(data: Uint8Array): unknown {
    const reader = this.reader;
    this.time = -1;
    reader.reset(data);
    const isServerTime = reader.u8() === 0;
    if (isServerTime) {
      this.time = reader.vu57();
    } else {
      reader.x += 4;
    }
    return this.cRoot();
  }

  protected ts(): any {
    if (this.time < 0) this.reader.idSkip();
    else this.reader.vu57Skip();
  }

  protected cRoot(): unknown {
    const reader = this.reader;
    const peek = reader.uint8[reader.x];
    return !peek ? undefined : this.cNode();
  }

  protected cNode(): unknown {
    const reader = this.reader;
    this.ts();
    const octet = reader.u8();
    const major = octet >> 5;
    const minor = octet & 0b11111;
    const length = minor < 24 ? minor : minor === 24 ? reader.u8() : minor === 25 ? reader.u16() : reader.u32();
    switch (major) {
      case CRDT_MAJOR.CON:
        return this.cCon(length);
      case CRDT_MAJOR.VAL:
        return this.cNode();
      case CRDT_MAJOR.VEC:
        return this.cVec(length);
      case CRDT_MAJOR.OBJ:
        return this.cObj(length);
      case CRDT_MAJOR.STR:
        return this.cStr(length);
      case CRDT_MAJOR.BIN:
        return this.cBin(length);
      case CRDT_MAJOR.ARR:
        return this.cArr(length);
    }
    return undefined;
  }

  protected cCon(length: number): unknown {
    return !length ? this.val() : (this.ts(), null);
  }

  protected cObj(length: number): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < length; i++) {
      const key: string = this.key();
      const value = this.cNode();
      if (value !== undefined) obj[key] = value;
    }
    return obj;
  }

  protected cVec(length: number): unknown[] {
    const reader = this.reader;
    const obj: unknown[] = [];
    for (let i = 0; i < length; i++) {
      const octet = reader.peak();
      if (!octet) {
        reader.x++;
        obj.push(undefined);
      } else obj.push(this.cNode());
    }
    return obj;
  }

  protected cArr(length: number): unknown[] {
    const arr: unknown[] = [];
    for (let i = 0; i < length; i++) {
      const values = this.cArrChunk();
      if (values && values.length) arr.push(...values);
    }
    return arr;
  }

  protected cArrChunk(): unknown[] | undefined {
    const [deleted, length] = this.reader.b1vu28();
    this.ts();
    if (deleted) {
      return undefined;
    } else {
      const values: unknown[] = [];
      for (let i = 0; i < length; i++) values.push(this.cNode());
      return values;
    }
  }

  protected cStr(length: number): string {
    const reader = this.reader;
    let str = '';
    for (let i = 0; i < length; i++) {
      this.ts();
      const isTombstone = reader.uint8[reader.x] === 0;
      if (isTombstone) {
        reader.x++;
        reader.vu39Skip();
        continue;
      }
      const text: string = this.val() as string;
      str += text;
    }
    return str;
  }

  protected cBin(length: number): Uint8Array {
    const reader = this.reader;
    const buffers: Uint8Array[] = [];
    let totalLength = 0;
    for (let i = 0; i < length; i++) {
      const [deleted, length] = reader.b1vu28();
      this.ts();
      if (deleted) continue;
      buffers.push(reader.buf(length));
      totalLength += length;
    }
    const res = new Uint8Array(totalLength);
    let offset = 0;
    for (let i = 0; i < buffers.length; i++) {
      const byteLength = buffers[i].length;
      res.set(buffers[i], offset);
      offset += byteLength;
    }
    return res;
  }
}