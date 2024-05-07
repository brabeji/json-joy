import type {Peritext} from '../Peritext';
import type {SliceType} from '../slice/types';
import type {MarkerSlice} from '../slice/MarkerSlice';
import type {Slices} from '../slice/Slices';
import type {ITimestampStruct} from '../../../json-crdt-patch';
import type {PersistedSlice} from '../slice/PersistedSlice';
import type {Cursor} from './Cursor';

export class EditorSlices<T = string> {
  constructor(
    protected readonly txt: Peritext<T>,
    protected readonly slices: Slices<T>,
  ) {}

  protected insAtCursors<S extends PersistedSlice<T>>(callback: (cursor: Cursor<T>) => S): S[] {
    const slices: S[] = [];
    this.txt.editor.cursors((cursor) => {
      const slice = callback(cursor);
      slices.push(slice);
    });
    return slices;
  }

  public insStack(type: SliceType, data?: unknown | ITimestampStruct): PersistedSlice<T>[] {
    return this.insAtCursors((cursor) => this.slices.insStack(cursor.range(), type, data));
  }

  public insOverwrite(type: SliceType, data?: unknown | ITimestampStruct): PersistedSlice<T>[] {
    return this.insAtCursors((cursor) => this.slices.insOverwrite(cursor.range(), type, data));
  }

  public insErase(type: SliceType, data?: unknown | ITimestampStruct): PersistedSlice<T>[] {
    return this.insAtCursors((cursor) => this.slices.insErase(cursor.range(), type, data));
  }

  public insMarker(type: SliceType, data?: unknown, separator?: string): MarkerSlice<T>[] {
    return this.insAtCursors((cursor) => {
      cursor.collapse();
      const after = cursor.start.clone();
      after.refAfter();
      const marker = this.slices.insMarkerAfter(after.id, type, data, separator);
      return marker;
    });
  }
}
