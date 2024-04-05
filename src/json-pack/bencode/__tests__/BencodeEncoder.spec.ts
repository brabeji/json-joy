import {utf8} from '../../../util/buffers/strings';
import {Writer} from '../../../util/buffers/Writer';
import {PackValue} from '../../types';
import {BencodeEncoder} from '../BencodeEncoder';

const writer = new Writer(32);
const encoder = new BencodeEncoder(writer);

const assertEncoder = (value: PackValue, expected: Uint8Array) => {
  const encoded = encoder.encode(value);
  expect(encoded).toEqual(expected);
};

// describe('null', () => {
//   test('null', () => {
//     assertEncoder(null);
//   });
// });

// describe('undefined', () => {
//   test('undefined', () => {
//     const encoded = encoder.encode(undefined);
//     const txt = Buffer.from(encoded).toString('utf-8');
//     expect(txt).toBe('"data:application/cbor,base64;9w=="');
//   });

//   test('undefined in object', () => {
//     const encoded = encoder.encode({foo: undefined});
//     const txt = Buffer.from(encoded).toString('utf-8');
//     expect(txt).toBe('{"foo":"data:application/cbor,base64;9w=="}');
//   });
// });

// describe('boolean', () => {
//   test('true', () => {
//     assertEncoder(true);
//   });

//   test('false', () => {
//     assertEncoder(false);
//   });
// });

describe('number', () => {
  test('integers', () => {
    assertEncoder(0, utf8`i0e`);
    assertEncoder(1, utf8`i1e`);
    assertEncoder(-1, utf8`i-1e`);
    assertEncoder(123, utf8`i123e`);
    assertEncoder(-123, utf8`i-123e`);
    assertEncoder(-12321321123, utf8`i-12321321123e`);
    assertEncoder(+2321321123, utf8`i2321321123e`);
  });

  test('bigints', () => {
    assertEncoder(BigInt('0'), utf8`i0e`);
    assertEncoder(BigInt('1'), utf8`i1e`);
    assertEncoder(BigInt('-1'), utf8`i-1e`);
    assertEncoder(BigInt('123456'), utf8`i123456e`);
    assertEncoder(BigInt('-123456'), utf8`i-123456e`);
  });

  test('floats', () => {
    assertEncoder(0.0, utf8`i0e`);
    assertEncoder(1.1, utf8`i1e`);
    assertEncoder(-1.45, utf8`i-1e`);
    assertEncoder(123.34, utf8`i123e`);
    assertEncoder(-123.234, utf8`i-123e`);
    assertEncoder(-12321.321123, utf8`i-12321e`);
    assertEncoder(+2321321.123, utf8`i2321321e`);
  });
});

describe('string', () => {
  test('empty string', () => {
    assertEncoder('', utf8`0:`);
  });

  test('one char strings', () => {
    assertEncoder('a', utf8`1:a`);
    assertEncoder('b', utf8`1:b`);
    assertEncoder('z', utf8`1:z`);
    assertEncoder('~', utf8`1:~`);
    assertEncoder('"', utf8`1:"`);
    assertEncoder('\\', utf8`1:\\`);
    assertEncoder('*', utf8`1:*`);
    assertEncoder('@', utf8`1:@`);
    assertEncoder('9', utf8`1:9`);
  });

  test('short strings', () => {
    assertEncoder('abc', utf8`3:abc`);
    assertEncoder('abc123', utf8`6:abc123`);
  });

  test('long strings', () => {
    const txt = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit.';
    assertEncoder(
      txt,
      utf8(`${txt.length}:${txt}`)
    );
  });
});

describe('binary', () => {
  test('empty blob', () => {
    assertEncoder(new Uint8Array(0), utf8`0:`);
  });

  test('small blob', () => {
    assertEncoder(new Uint8Array([65]), utf8`1:A`);
  });
});

describe('array', () => {
  test('empty array', () => {
    assertEncoder([], utf8`le`);
  });

  test('array with one integer element', () => {
    assertEncoder([1], utf8`li1ee`);
  });

  test('array with two integer elements', () => {
    assertEncoder([1, 2], utf8`li1ei2ee`);
  });

  test('array of array', () => {
    assertEncoder([[123]], utf8`lli123eee`);
  });

  test('array of various types', () => {
    assertEncoder([0, 1.32, 'str', [1, 2, 3]], utf8`li0ei1e3:strli1ei2ei3eee`);
  });
});

// describe('object', () => {
//   test('empty object', () => {
//     assertEncoder({});
//   });

//   test('object with one key', () => {
//     assertEncoder({foo: 'bar'});
//   });

//   test('object with two keys', () => {
//     assertEncoder({foo: 'bar', baz: 123});
//   });

//   test('object with various nested types', () => {
//     assertEncoder({
//       '': null,
//       null: false,
//       true: true,
//       str: 'asdfasdf ,asdf asdf asdf asdf asdf, asdflkasjdflakjsdflajskdlfkasdf',
//       num: 123,
//       arr: [1, 2, 3],
//       obj: {foo: 'bar'},
//       obj2: {1: 2, 3: 4},
//     });
//   });
// });

// describe('nested object', () => {
//   test('large array/object', () => {
//     assertEncoder({
//       foo: [
//         1,
//         2,
//         3,
//         {
//           looongLoooonnnngggg: 'bar',
//           looongLoooonnnngggg2: 'bar',
//           looongLoooonnnngggg3: 'bar',
//           looongLoooonnnngggg4: 'bar',
//           looongLoooonnnngggg5: 'bar',
//           looongLoooonnnngggg6: 'bar',
//           looongLoooonnnngggg7: 'bar',
//           someVeryVeryLongKeyNameSuperDuperLongKeyName: 'very very long value, I said, very very long value',
//           someVeryVeryLongKeyNameSuperDuperLongKeyName1: 'very very long value, I said, very very long value',
//           someVeryVeryLongKeyNameSuperDuperLongKeyName2: 'very very long value, I said, very very long value',
//           someVeryVeryLongKeyNameSuperDuperLongKeyName3: 'very very long value, I said, very very long value',
//           someVeryVeryLongKeyNameSuperDuperLongKeyName4: 'very very long value, I said, very very long value',
//           someVeryVeryLongKeyNameSuperDuperLongKeyName5: 'very very long value, I said, very very long value',
//           someVeryVeryLongKeyNameSuperDuperLongKeyName6: 'very very long value, I said, very very long value',
//         },
//       ],
//     });
//   });
// });
