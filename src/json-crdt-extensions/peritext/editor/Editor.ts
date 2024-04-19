import {Cursor} from '../slice/Cursor';
import {Anchor, SliceBehavior} from '../constants';
import {tick, type ITimestampStruct} from '../../../json-crdt-patch/clock';
import {PersistedSlice} from '../slice/PersistedSlice';
import type {Range} from '../slice/Range';
import type {Peritext} from '../Peritext';
import type {Printable} from '../../../util/print/types';
import type {Point} from '../point/Point';
import type {SliceType} from '../types';

export class Editor implements Printable {
  /**
   * Cursor is the the current user selection. It can be a caret or a
   * range. If range is collapsed to a single point, it is a caret.
   */
  public readonly cursor: Cursor;

  constructor(public readonly txt: Peritext) {
    const point = txt.point(txt.str.id, Anchor.After);
    const cursorId = txt.str.id; // TODO: should be autogenerated to something else
    this.cursor = new Cursor(cursorId, txt, point, point.clone());
  }

  /** @deprecated */
  public setCursor(start: number, length: number = 0): void {
    this.cursor.setAt(start, length);
  }

  /** @deprecated */
  public getCursorText(): string {
    return this.cursor.text();
  }

  /**
   * Ensures there is no range selection. If user has selected a range,
   * the contents is removed and the cursor is set at the start of the range as cursor.
   *
   * @todo If block boundaries are withing the range, remove the blocks.
   *
   * @returns Returns the cursor position after the operation.
   */
  public collapseSelection(): ITimestampStruct {
    const cursor = this.cursor;
    const isCaret = cursor.isCollapsed();
    if (!isCaret) {
      const {start, end} = cursor;
      const txt = this.txt;
      const deleteStartId = start.anchor === Anchor.Before ? start.id : start.nextId();
      const deleteEndId = end.anchor === Anchor.After ? end.id : end.prevId();
      const str = txt.str;
      if (!deleteStartId || !deleteEndId) throw new Error('INVALID_RANGE');
      const range = str.findInterval2(deleteStartId, deleteEndId);
      const model = txt.model;
      const api = model.api;
      api.builder.del(str.id, range);
      api.apply();
      if (start.anchor === Anchor.After) cursor.setAfter(start.id);
      else cursor.setAfter(start.prevId() || str.id);
    }
    return cursor.start.id;
  }

  /**
   * Insert inline text at current cursor position. If cursor selects a range,
   * the range is removed and the text is inserted at the start of the range.
   */
  public insert(text: string): void {
    if (!text) return;
    const after = this.collapseSelection();
    const textId = this.txt.ins(after, text);
    const shift = text.length - 1;
    this.cursor.setAfter(shift ? tick(textId, shift) : textId);
  }

  /**
   * Deletes the previous character at current cursor position. If cursor
   * selects a range, deletes the whole range.
   */
  public delete(): void {
    const isCollapsed = this.cursor.isCollapsed();
    if (isCollapsed) {
      const range = this.txt.findCharBefore(this.cursor.start);
      if (!range) return;
      this.cursor.set(range.start, range.end);
    }
    this.collapseSelection();
  }

  public start(): Point | undefined {
    const txt = this.txt;
    const str = txt.str;
    if (!str.length()) return;
    const firstChunk = str.first();
    if (!firstChunk) return;
    const firstId = firstChunk.id;
    const start = txt.point(firstId, Anchor.Before);
    return start;
  }

  public end(): Point | undefined {
    const txt = this.txt;
    const str = txt.str;
    if (!str.length()) return;
    const lastChunk = str.last();
    if (!lastChunk) return;
    const lastId = lastChunk.span > 1 ? tick(lastChunk.id, lastChunk.span - 1) : lastChunk.id;
    const end = txt.point(lastId, Anchor.After);
    return end;
  }

  public all(): Range | undefined {
    const start = this.start();
    const end = this.end();
    if (!start || !end) return;
    return this.txt.range(start, end);
  }

  public selectAll(): void {
    const range = this.all();
    if (range) this.cursor.setRange(range);
  }

  public insertSlice(type: SliceType, data?: unknown | ITimestampStruct): PersistedSlice {
    return this.txt.insSlice(this.cursor, SliceBehavior.Stack, type, data);
  }

  public insertOverwriteSlice(type: SliceType, data?: unknown | ITimestampStruct): PersistedSlice {
    return this.txt.insSlice(this.cursor, SliceBehavior.Overwrite, type, data);
  }

  public insertEraseSlice(type: SliceType, data?: unknown | ITimestampStruct): PersistedSlice {
    return this.txt.insSlice(this.cursor, SliceBehavior.Erase, type, data);
  }
}
