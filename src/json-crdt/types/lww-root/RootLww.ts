import {ORIGIN, SESSION} from '../../../json-crdt-patch/constants';
import {ValueLww} from '../lww-value/ValueLww';
import {Model, UNDEFINED} from '../../model';
import type {ITimestampStruct} from '../../../json-crdt-patch/clock';
import type {JsonNode} from '../types';

export class RootLww extends ValueLww {
  /**
   * @param val Latest value of the document root.
   */
  constructor(doc: Model<any>, val: ITimestampStruct) {
    super(doc, ORIGIN, val);
  }

  public node(): JsonNode {
    return this.val.sid === SESSION.SYSTEM ? <any>UNDEFINED : super.node();
  }
}
