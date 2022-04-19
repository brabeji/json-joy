import {PatchBuilder} from '../../../../json-crdt-patch/PatchBuilder';
import {Model} from '../../../model';
import {BinaryType} from '../BinaryType';

test('merges sequential chunks', () => {
  const doc = Model.withLogicalClock();
  const builder1 = new PatchBuilder(doc.clock);

  const bin = builder1.bin();
  builder1.root(bin);
  doc.applyPatch(builder1.patch);

  const builder2 = new PatchBuilder(doc.clock);
  const ins1 = builder2.insBin(bin, bin, new Uint8Array([1, 2]));
  doc.applyPatch(builder2.patch);

  const builder3 = new PatchBuilder(doc.clock);
  const ins2 = builder3.insBin(bin, ins1.tick(1), new Uint8Array([3, 4]));
  doc.applyPatch(builder3.patch);

  const node = doc.node(bin) as BinaryType;
  const origin = node.start;
  const firstChunk = origin.right;

  expect(firstChunk!.buf).toStrictEqual(new Uint8Array([1, 2, 3, 4]));
  expect(doc.toView()).toStrictEqual(new Uint8Array([1, 2, 3, 4]));
});