import {AvlMap} from 'sonic-forest/lib/avl/AvlMap';
import {printTree} from 'tree-dump/lib/printTree';
import {PersistedSlice} from './PersistedSlice';
import {Timespan, compare, tss} from '../../../json-crdt-patch/clock';
import {Range} from '../rga/Range';
import {updateRga} from '../../../json-crdt/hash';
import {CONST, updateNum} from '../../../json-hash';
import {SliceBehavior, SliceHeaderShift, SliceTupleIndex} from './constants';
import {MarkerSlice} from './MarkerSlice';
import {VecNode} from '../../../json-crdt/nodes';
import type {Slice, SliceType} from './types';
import type {ITimespanStruct, ITimestampStruct} from '../../../json-crdt-patch/clock';
import type {Stateful} from '../types';
import type {Printable} from 'tree-dump/lib/types';
import type {ArrChunk, ArrNode} from '../../../json-crdt/nodes';
import type {AbstractRga} from '../../../json-crdt/nodes/rga';
import type {Peritext} from '../Peritext';
import {Chars} from '../constants';
import {Anchor} from '../rga/constants';

export class Slices<T = string> implements Stateful, Printable {
  private list = new AvlMap<ITimestampStruct, PersistedSlice<T>>(compare);

  protected readonly rga: AbstractRga<T>;

  constructor(
    /** The text RGA. */
    protected readonly txt: Peritext<T>,
    /** The `arr` node, used as a set, where slices are stored. */
    public readonly set: ArrNode,
  ) {
    this.rga = txt.str as unknown as AbstractRga<T>;
  }

  public ins<
    S extends PersistedSlice<T>,
    K extends new (...args: ConstructorParameters<typeof PersistedSlice<T>>) => S,
  >(
    range: Range<T>,
    behavior: SliceBehavior,
    type: SliceType,
    data?: unknown,
    Klass: K = behavior === SliceBehavior.Marker ? <any>MarkerSlice : PersistedSlice,
  ): S {
    const model = this.set.doc;
    const set = this.set;
    const api = model.api;
    const builder = api.builder;
    const tupleId = builder.vec();
    const start = range.start.clone();
    const end = range.end.clone();
    const header =
      (behavior << SliceHeaderShift.Behavior) +
      (start.anchor << SliceHeaderShift.X1Anchor) +
      (end.anchor << SliceHeaderShift.X2Anchor);
    const headerId = builder.const(header);
    const x1Id = builder.const(start.id);
    const x2Id = builder.const(compare(start.id, end.id) === 0 ? 0 : end.id);
    const subtypeId = builder.const(type);
    const tupleKeysUpdate: [key: number, value: ITimestampStruct][] = [
      [SliceTupleIndex.Header, headerId],
      [SliceTupleIndex.X1, x1Id],
      [SliceTupleIndex.X2, x2Id],
      [SliceTupleIndex.Type, subtypeId],
    ];
    if (data !== undefined) tupleKeysUpdate.push([SliceTupleIndex.Data, builder.json(data)]);
    builder.insVec(tupleId, tupleKeysUpdate);
    const chunkId = builder.insArr(set.id, set.id, [tupleId]);
    // TODO: Consider using `s` schema here.
    api.apply();
    const tuple = model.index.get(tupleId) as VecNode;
    const chunk = set.findById(chunkId)!;
    // TODO: Need to check if split slice text was deleted
    const slice = new Klass(model, this.txt, chunk, tuple, behavior, type, start, end);
    this.list.set(chunk.id, slice);
    return slice;
  }

  public insMarker(range: Range<T>, type: SliceType, data?: unknown | ITimestampStruct): MarkerSlice<T> {
    return this.ins(range, SliceBehavior.Marker, type, data) as MarkerSlice<T>;
  }

  public insMarkerAfter(
    after: ITimestampStruct,
    type: SliceType,
    data?: unknown,
    separator: string = Chars.BlockSplitSentinel,
  ): MarkerSlice<T> {
    // TODO: test condition when cursors is at absolute or relative starts
    const {txt, set} = this;
    const model = set.doc;
    const api = model.api;
    const builder = api.builder;
    const str = txt.str;
    /**
     * We skip one clock cycle to prevent Block-wise RGA from merging adjacent
     * characters. We want the marker chunk to always be its own distinct chunk.
     */
    builder.nop(1);
    const textId = builder.insStr(str.id, after, separator);
    const point = txt.point(textId, Anchor.Before);
    const range = txt.range(point, point.clone());
    return this.insMarker(range, type, data);
  }

  public insStack(range: Range<T>, type: SliceType, data?: unknown | ITimestampStruct): PersistedSlice<T> {
    return this.ins(range, SliceBehavior.Stack, type, data);
  }

  public insOverwrite(range: Range<T>, type: SliceType, data?: unknown | ITimestampStruct): PersistedSlice<T> {
    return this.ins(range, SliceBehavior.Overwrite, type, data);
  }

  public insErase(range: Range<T>, type: SliceType, data?: unknown | ITimestampStruct): PersistedSlice<T> {
    return this.ins(range, SliceBehavior.Erase, type, data);
  }

  protected unpack(chunk: ArrChunk): PersistedSlice<T> {
    const txt = this.txt;
    const model = this.set.doc;
    const tupleId = chunk.data ? chunk.data[0] : undefined;
    if (!tupleId) throw new Error('SLICE_NOT_FOUND');
    const tuple = model.index.get(tupleId);
    if (!(tuple instanceof VecNode)) throw new Error('NOT_TUPLE');
    let slice = PersistedSlice.deserialize<T>(model, txt, chunk, tuple);
    if (slice.isSplit())
      slice = new MarkerSlice<T>(model, txt, chunk, tuple, slice.behavior, slice.type, slice.start, slice.end);
    return slice;
  }

  public get(id: ITimestampStruct): PersistedSlice<T> | undefined {
    return this.list.get(id);
  }

  public del(id: ITimestampStruct): void {
    this.list.del(id);
    const api = this.set.doc.api;
    api.builder.del(this.set.id, [tss(id.sid, id.time, 1)]);
    api.apply();
  }

  public delSlices(slices: Slice[]): void {
    const api = this.set.doc.api;
    const spans: ITimespanStruct[] = [];
    const length = slices.length;
    for (let i = 0; i < length; i++) {
      const slice = slices[i];
      if (slice instanceof PersistedSlice) {
        const id = slice.id;
        spans.push(new Timespan(id.sid, id.time, 1));
      }
    }
    api.builder.del(this.set.id, spans);
    api.apply();
  }

  public size(): number {
    return this.list._size;
  }

  public iterator0(): () => Slice<T> | undefined {
    const iterator = this.list.iterator0();
    return () => iterator()?.v;
  }

  public forEach(callback: (item: Slice<T>) => void): void {
    this.list.forEach((node) => callback(node.v));
  }

  // ----------------------------------------------------------------- Stateful

  private _topologyHash: number = 0;
  public hash: number = 0;

  public refresh(): number {
    const topologyHash = updateRga(CONST.START_STATE, this.set);
    if (topologyHash !== this._topologyHash) {
      this._topologyHash = topologyHash;
      let chunk: ArrChunk | undefined;
      for (const iterator = this.set.iterator(); (chunk = iterator()); ) {
        const item = this.list.get(chunk.id);
        if (chunk.del) {
          if (item) this.list.del(chunk.id);
        } else {
          if (!item) this.list.set(chunk.id, this.unpack(chunk));
        }
      }
    }
    let hash: number = topologyHash;
    this.list.forEach(({v: item}) => {
      item.refresh();
      hash = updateNum(hash, item.hash);
    });
    return (this.hash = hash);
  }

  // ---------------------------------------------------------------- Printable

  public toString(tab: string = ''): string {
    return (
      this.constructor.name +
      printTree(
        tab,
        [...this.list.entries()].map(
          ({v}) =>
            (tab) =>
              v.toString(tab),
        ),
      )
    );
  }
}