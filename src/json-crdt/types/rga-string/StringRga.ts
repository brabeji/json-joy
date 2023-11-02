import {ITimestampStruct, tick} from '../../../json-crdt-patch/clock';
import {AbstractRga, Chunk} from '../rga/AbstractRga';
import {next} from '../../../util/trees/util';
import type {JsonNode} from '../../types';

/**
 * @ignore
 * @category CRDT Node
 */
export class StringChunk implements Chunk<string> {
  public readonly id: ITimestampStruct;
  public span: number;
  public del: boolean;
  public data: string;
  public len: number;
  public p: StringChunk | undefined;
  public l: StringChunk | undefined;
  public r: StringChunk | undefined;
  public p2: StringChunk | undefined;
  public l2: StringChunk | undefined;
  public r2: StringChunk | undefined;
  public s: StringChunk | undefined;

  constructor(id: ITimestampStruct, span: number, str: string) {
    this.id = id;
    this.span = span;
    this.len = str ? span : 0;
    this.del = !str;
    this.p = undefined;
    this.l = undefined;
    this.r = undefined;
    this.p2 = undefined;
    this.l2 = undefined;
    this.r2 = undefined;
    this.s = undefined;
    this.data = str;
  }

  public merge(str: string) {
    this.data += str;
    this.span = this.data.length;
  }

  public split(ticks: number): StringChunk {
    if (!this.del) {
      const chunk = new StringChunk(tick(this.id, ticks), this.span - ticks, this.data.slice(ticks));
      this.data = this.data.slice(0, ticks);
      this.span = ticks;
      return chunk;
    }
    const chunk = new StringChunk(tick(this.id, ticks), this.span - ticks, '');
    this.span = ticks;
    return chunk;
  }

  public delete(): void {
    this.del = true;
    this.data = '';
  }

  public clone(): StringChunk {
    const chunk = new StringChunk(this.id, this.span, this.data);
    return chunk;
  }
}

/**
 * Represents the `str` type in JSON CRDT. The `str` type is a RGA (Replicated
 * Growable Array) of UTF-16 code units.
 *
 * @category CRDT Node
 */
export class StringRga<T extends string = string> extends AbstractRga<string> implements JsonNode<string> {
  // ----------------------------------------------------------------- JsonNode

  /** @ignore */
  public children() {}

  /** @ignore */
  public child() {
    return undefined;
  }

  /** @ignore */
  public container(): JsonNode | undefined {
    return undefined;
  }

  /** @ignore */
  private _view: string = '';
  public view(): T {
    if (this._view) return this._view as T;
    let str = '';
    for (let chunk = this.first(); chunk; chunk = next(chunk))
      // TODO: Check if this optimization improves performance: if (!chunk.del) str += chunk.data;
      str += chunk.data;
    return (this._view = str) as T;
  }

  /** @ignore */
  public api: undefined | unknown = undefined;

  // -------------------------------------------------------------- AbstractRga

  /** @ignore */
  public createChunk(id: ITimestampStruct, str: string | undefined): StringChunk {
    return new StringChunk(id, str ? str.length : 0, str || '');
  }

  /** @ignore */
  protected onChange(): void {
    this._view = '';
  }

  protected toStringName(): string {
    return super.toStringName() + ' "str"';
  }
}
