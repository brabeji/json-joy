import {find, isArrayReference, isArrayEnd} from '../find';
import {parseJsonPointer} from '../util';

test('can find number root', () => {
  const res = find(123, []);
  expect(res.val).toBe(123);
});

test('can find string root', () => {
  const res = find('foo', []);
  expect(res.val).toBe('foo');
});

test('can find key in object', () => {
  const res = find({foo: 'bar'}, ['foo']);
  expect(res.val).toBe('bar');
});

test('returns container object and key', () => {
  const res = find({foo: {bar: {baz: 'qux', a: 1}}}, ['foo', 'bar', 'baz']);
  expect(res).toEqual({
    val: 'qux',
    obj: {baz: 'qux', a: 1},
    key: 'baz',
  });
});

test('can reference simple object key', () => {
  const doc = {a: 123};
  const path = parseJsonPointer('/a');
  const res = find(doc, path);
  expect(res).toEqual({
    val: 123,
    obj: {a: 123},
    key: 'a',
  });
});

test('throws when referencing missing key with multiple steps', () => {
  const doc = {a: 123};
  const path = parseJsonPointer('/b/c');
  expect(() => find(doc, path)).toThrowErrorMatchingInlineSnapshot(`"NOT_FOUND"`);
});

test('can reference array element', () => {
  const doc = {a: {b: [1, 2, 3]}};
  const path = parseJsonPointer('/a/b/1');
  const res = find(doc, path);
  expect(res).toEqual({
    val: 2,
    obj: [1, 2, 3],
    key: 1,
  });
});

test('can reference end of array', () => {
  const doc = {a: {b: [1, 2, 3]}};
  const path = parseJsonPointer('/a/b/-');
  const ref = find(doc, path);
  expect(ref).toEqual({
    val: undefined,
    obj: [1, 2, 3],
    key: 3,
  });
  expect(isArrayReference(ref)).toBe(true);
  if (isArrayReference(ref)) expect(isArrayEnd(ref)).toBe(true);
});

test('throws when pointing past array boundary', () => {
  const doc = {a: {b: [1, 2, 3]}};
  const path = parseJsonPointer('/a/b/-1');
  expect(() => find(doc, path)).toThrowErrorMatchingInlineSnapshot(`"INVALID_INDEX"`);
});

/*
test('throws when pointing past array boundary - 2', () => {
  const doc = {a: {b: [1, 2, 3]}};
  const path = parseJsonPointer('/a/b/99');
  expect(() => find(doc, path)).toThrowErrorMatchingInlineSnapshot(`"INVALID_INDEX"`);
});
*/

test('can point one element past array boundary', () => {
  const doc = {a: {b: [1, 2, 3]}};
  const path = parseJsonPointer('/a/b/3');
  const ref = find(doc, path);
  expect(ref).toEqual({
    val: undefined,
    obj: [1, 2, 3],
    key: 3,
  });
  expect(isArrayReference(ref)).toBe(true);
  if (isArrayReference(ref)) expect(isArrayEnd(ref)).toBe(true);
});

test('can reference missing object key', () => {
  const doc = {foo: 123};
  const path = parseJsonPointer('/bar');
  const ref = find(doc, path);
  expect(ref).toEqual({
    val: undefined,
    obj: {foo: 123},
    key: 'bar',
  });
});

test('can reference missing array key withing bounds', () => {
  const doc = {foo: 123, bar: [1, 2, 3]};
  const path = parseJsonPointer('/bar/3');
  const ref = find(doc, path);
  expect(ref).toEqual({
    val: undefined,
    obj: [1, 2, 3],
    key: 3,
  });
});

/*
test('can reference missing array index only within size of the actual array', () => {
  const doc = {foo: 123, bar: [1, 2, 3]};
  find(doc, parseJsonPointer('/bar/0'));
  find(doc, parseJsonPointer('/bar/1'));
  find(doc, parseJsonPointer('/bar/2'));
  find(doc, parseJsonPointer('/bar/3'));
  find(doc, parseJsonPointer('/bar/-'));
  expect(() => find(doc, parseJsonPointer('/bar/5'))).toThrowErrorMatchingInlineSnapshot(`"INVALID_INDEX"`);
  expect(() => find(doc, parseJsonPointer('/bar/6'))).toThrowErrorMatchingInlineSnapshot(`"INVALID_INDEX"`);
});
*/
