import {PatchBuilder} from '../../../../json-crdt-patch/PatchBuilder';
import {Document} from '../../../document';
import {encode} from '../encode';
import {decode} from '../decode';
import {TRUE_ID} from '../../../../json-crdt-patch/constants';

test('encodes a simple document', () => {
  const doc = new Document;
  const builder = new PatchBuilder(doc.clock);
  const obj = builder.obj();
  const insert = builder.setKeys(obj, [['foo', TRUE_ID]]);
  const root = builder.root(obj);
  doc.applyPatch(builder.patch);
  const encoded = encode(doc);
  const doc2 = decode(encoded);
  expect(doc2.toJson()).toEqual({foo: true});
  expect(doc2 !== doc).toBe(true);
  expect(doc2.clock !== doc.clock).toBe(true);
  expect(doc2.clock.sessionId).toBe(doc.clock.sessionId);
  expect(doc2.clock.time).toBe(doc.clock.time);
});
