import {LogicalClock, LogicalTimestamp} from '../../../../json-crdt/clock';
import {PatchBuilder} from '../../../PatchBuilder';
import {encode} from '../encode';

test('encodes a .obj() operation', () => {
  const clock = new LogicalClock(3, 5);
  const builder = new PatchBuilder(clock);
  builder.obj();
  const encoded = encode(builder.patch);
  expect([...encoded]).toEqual([
    3, 0, 0, 0, 5,
    0, 0, 0, 0
  ]);
});

test('encodes a .arr() operation', () => {
  const clock = new LogicalClock(3, 5);
  const builder = new PatchBuilder(clock);
  builder.arr();
  const encoded = encode(builder.patch);
  expect([...encoded]).toEqual([
    3, 0, 0, 0, 5,
    0, 0, 0, 1
  ]);
});

test('encodes a .str() operation', () => {
  const clock = new LogicalClock(6, 7);
  const builder = new PatchBuilder(clock);
  builder.str();
  const encoded = encode(builder.patch);
  expect([...encoded]).toEqual([
    6, 0, 0, 0, 7,
    0, 0, 0, 2
  ]);
});

test('encodes a .num() operation', () => {
  const clock = new LogicalClock(6, 7);
  const builder = new PatchBuilder(clock);
  builder.num();
  const encoded = encode(builder.patch);
  expect([...encoded]).toEqual([
    6, 0, 0, 0, 7,
    0, 0, 0, 3
  ]);
});

test('encodes a .root() operation', () => {
  const clock = new LogicalClock(6, 7);
  const builder = new PatchBuilder(clock);
  builder.root(new LogicalTimestamp(1, 2), new LogicalTimestamp(3, 4));
  const encoded = encode(builder.patch);
  expect([...encoded]).toEqual([
    6, 0, 0, 0, 7, 0, 0, 0,
    4,
    1, 0, 0, 0, 2, 0, 0, 0,
    3, 0, 0, 0, 4, 0, 0, 0,
  ]);
});

// test('encodes a simple patch', () => {`
//   const clock = new LogicalClock(3, 5);
//   const builder = new PatchBuilder(clock);
//   builder.root(new LogicalTimestamp(0, 0), new LogicalTimestamp(0, 3));
//   const encoded = encode(builder.patch);
//   expect(encoded).toEqual([
//     3, 5, // Patch ID
//     4, // root
//       0, 0, // root.after
//       0, 3, // root.value
//     ]);
// });

// test('create {foo: "bar"} object', () => {
//   const clock = new LogicalClock(5, 25);
//   const builder = new PatchBuilder(clock);
  
//   const strId = builder.str();
//   builder.insStr(strId, 'bar');
//   const objId = builder.obj();
//   builder.setKeys(objId, [['foo', strId]]);
//   builder.root(new LogicalTimestamp(0, 0), objId);

//   const encoded = encode(builder.patch);
//   expect(encoded).toEqual([
//     5, 25, // Patch ID
//     2, // str
//     7, 5, 25, "bar", // str_ins
//     0, // obj
//     5, 5, 29, ["foo", 5, 25], // obj_set
//     4, 0, 0, 5, 29 // root
//   ]);
// });

// test('test all operations', () => {
//   const clock = new LogicalClock(3, 100);
//   const builder = new PatchBuilder(clock);

//   const strId = builder.str();
//   const strInsertId = builder.insStr(strId, 'qq');
//   const arrId = builder.arr();
//   const objId = builder.obj();
//   builder.setKeys(objId, [['foo', strId], ['hmm', arrId]]);
//   const numId = builder.num();
//   builder.setNum(numId, 123.4);
//   const numInsertionId = builder.insArr(arrId, [numId])
//   builder.root(new LogicalTimestamp(0, 0), objId);
//   builder.delArr(numInsertionId, 1);
//   builder.delStr(strInsertId, 1);

//   const encoded = encode(builder.patch);
//   expect(encoded).toEqual([
//     3, 100, // Patch ID
//     2, // str 3!100
//     7, 3, 100, "qq", // str_ins 3!101,3!102
//     1, // arr 3!103
//     0, // obj 3!104
//     5, 3, 104, ["foo", 3, 100, "hmm", 3, 103], // obj_set 3!105,3!106
//     3, // num 3!107
//     6, 3, 107, 123.4, // num_set 3!108
//     8, 3, 103, [3, 107], // arr_ins 3!109
//     4, 0, 0, 3, 104, // root 3!110
//     10, 3, 109, 1, // arr_del
//     9, 3, 101, 1 // str_del
//   ]);
// });