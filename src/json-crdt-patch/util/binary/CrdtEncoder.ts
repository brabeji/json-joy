import {Writer} from '../../../util/buffers/Writer';

export class CrdtWriter extends Writer {
  /**
   * In the below encoding diagrams bits are annotated as follows:
   *
   * - "x" - vector table index, reference to the logical clock.
   * - "y" - time difference.
   * - "?" - whether the next byte is used for encoding.
   *
   * If x is less than 8 and y is less than 16, the relative ID is encoded as a
   * single byte:
   *
   * ```
   * +--------+
   * |0xxxyyyy|
   * +--------+
   * ```
   *
   * Otherwise the top bit of the first byte is set to 1; and x and y are encoded
   * separately using b1vuint28 and vuint39, respectively.
   *
   * ```
   *       x          y
   * +===========+=========+
   * | b1vuint28 | vuint39 |
   * +===========+=========+
   * ```
   *
   * The boolean flag of x b1vuint28 value is always set to 1.
   */
  public id(x: number, y: number): void {
    if (x <= 0b111 && y <= 0b1111) {
      this.u8((x << 4) | y);
    } else {
      this.b1vu28(true, x);
      this.vu39(y);
    }
  }

  /**
   * #### `vuint57` (variable length unsigned 57 bit integer)
   *
   * Variable length unsigned 57 bit integer is encoded using up to 8 bytes. The maximum
   * size of the decoded value is 57 bits of data.
   *
   * The high bit "?" of each byte indicates if the next byte should be consumed, up
   * to 8 bytes.
   *
   * ```
   * byte 1                                                         byte 8
   * +--------+........+........+........+........+........+........+········+
   * |?zzzzzzz|?zzzzzzz|?zzzzzzz|?zzzzzzz|?zzzzzzz|?zzzzzzz|?zzzzzzz|zzzzzzzz|
   * +--------+........+........+........+........+........+........+········+
   *
   *            11111    2211111  2222222  3333332  4443333  4444444 55555555
   *   7654321  4321098  1098765  8765432  5432109  2109876  9876543 76543210
   *     |                        |                    |             |
   *     5th bit of z             |                    |             |
   *                              28th bit of z        |             57th bit of z
   *                                                   39th bit of z
   * ```
   *
   * @param num Number to encode as variable length unsigned 57 bit integer.
   */
  public vu57(num: number) {
    if (num <= 0b1111111) {
      this.u8(num);
    } else if (num <= 0b1111111_1111111) {
      this.ensureCapacity(2);
      const uint8 = this.uint8;
      uint8[this.x++] = 0b10000000 | (num & 0b01111111);
      uint8[this.x++] = num >>> 7;
    } else if (num <= 0b1111111_1111111_1111111) {
      this.ensureCapacity(3);
      const uint8 = this.uint8;
      uint8[this.x++] = 0b10000000 | (num & 0b01111111);
      uint8[this.x++] = 0b10000000 | ((num >>> 7) & 0b01111111);
      uint8[this.x++] = num >>> 14;
    } else if (num <= 0b1111111_1111111_1111111_1111111) {
      this.ensureCapacity(4);
      const uint8 = this.uint8;
      uint8[this.x++] = 0b10000000 | (num & 0b01111111);
      uint8[this.x++] = 0b10000000 | ((num >>> 7) & 0b01111111);
      uint8[this.x++] = 0b10000000 | ((num >>> 14) & 0b01111111);
      uint8[this.x++] = num >>> 21;
    } else {
      let lo32 = num | 0;
      if (lo32 < 0) lo32 += 4294967296;
      const hi32 = (num - lo32) / 4294967296;
      if (num <= 0b1111111_1111111_1111111_1111111_1111111) {
        this.ensureCapacity(5);
        const uint8 = this.uint8;
        uint8[this.x++] = 0b10000000 | (num & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 7) & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 14) & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 21) & 0b01111111);
        uint8[this.x++] = (hi32 << 4) | (num >>> 28);
      } else if (num <= 0b1111111_1111111_1111111_1111111_1111111_1111111) {
        this.ensureCapacity(6);
        const uint8 = this.uint8;
        uint8[this.x++] = 0b10000000 | (num & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 7) & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 14) & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 21) & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((hi32 & 0b111) << 4) | (num >>> 28);
        uint8[this.x++] = hi32 >>> 3;
      } else if (num <= 0b1111111_1111111_1111111_1111111_1111111_1111111_1111111) {
        this.ensureCapacity(7);
        const uint8 = this.uint8;
        uint8[this.x++] = 0b10000000 | (num & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 7) & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 14) & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 21) & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((hi32 & 0b111) << 4) | (num >>> 28);
        uint8[this.x++] = 0b10000000 | ((hi32 & 0b1111111_000) >>> 3);
        uint8[this.x++] = hi32 >>> 10;
      } else {
        this.ensureCapacity(8);
        const uint8 = this.uint8;
        uint8[this.x++] = 0b10000000 | (num & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 7) & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 14) & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 21) & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((hi32 & 0b111) << 4) | (num >>> 28);
        uint8[this.x++] = 0b10000000 | ((hi32 & 0b1111111_000) >>> 3);
        uint8[this.x++] = 0b10000000 | ((hi32 & 0b1111111_0000000_000) >>> 10);
        uint8[this.x++] = hi32 >>> 17;
      }
    }
  }

  public vu39(num: number) {
    // TODO: perf: maybe just .ensureCapacity(6) at the top.
    if (num <= 0b1111111) {
      this.u8(num);
    } else if (num <= 0b1111111_1111111) {
      this.ensureCapacity(2);
      const uint8 = this.uint8;
      uint8[this.x++] = 0b10000000 | (num & 0b01111111);
      uint8[this.x++] = num >>> 7;
    } else if (num <= 0b1111111_1111111_1111111) {
      this.ensureCapacity(3);
      const uint8 = this.uint8;
      uint8[this.x++] = 0b10000000 | (num & 0b01111111);
      uint8[this.x++] = 0b10000000 | ((num >>> 7) & 0b01111111);
      uint8[this.x++] = num >>> 14;
    } else if (num <= 0b1111111_1111111_1111111_1111111) {
      this.ensureCapacity(4);
      const uint8 = this.uint8;
      uint8[this.x++] = 0b10000000 | (num & 0b01111111);
      uint8[this.x++] = 0b10000000 | ((num >>> 7) & 0b01111111);
      uint8[this.x++] = 0b10000000 | ((num >>> 14) & 0b01111111);
      uint8[this.x++] = num >>> 21;
    } else {
      let lo32 = num | 0;
      if (lo32 < 0) lo32 += 4294967296;
      const hi32 = (num - lo32) / 4294967296;
      if (num <= 0b1111111_1111111_1111111_1111111_1111111) {
        this.ensureCapacity(5);
        const uint8 = this.uint8;
        uint8[this.x++] = 0b10000000 | (num & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 7) & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 14) & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 21) & 0b01111111);
        uint8[this.x++] = (hi32 << 4) | (num >>> 28);
      } else if (num <= 0b1111111_1111111_1111111_1111111_1111111_1111111) {
        this.ensureCapacity(6);
        const uint8 = this.uint8;
        uint8[this.x++] = 0b10000000 | (num & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 7) & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 14) & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 21) & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((hi32 & 0b111) << 4) | (num >>> 28);
        uint8[this.x++] = (hi32 >>> 3) & 0b1111;
      }
    }
  }

  public b1vu56(flag: boolean, num: number) {
    if (num <= 0b111111) {
      this.u8((flag ? 0b10000000 : 0b00000000) | num);
    } else {
      const firstByteMask = flag ? 0b11000000 : 0b01000000;
      if (num <= 0b1111111_111111) {
        this.ensureCapacity(2);
        const uint8 = this.uint8;
        uint8[this.x++] = firstByteMask | (num & 0b00111111);
        uint8[this.x++] = num >>> 6;
      } else if (num <= 0b1111111_1111111_111111) {
        this.ensureCapacity(3);
        const uint8 = this.uint8;
        uint8[this.x++] = firstByteMask | (num & 0b00111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 6) & 0b01111111);
        uint8[this.x++] = num >>> 13;
      } else if (num <= 0b1111111_1111111_1111111_111111) {
        this.ensureCapacity(4);
        const uint8 = this.uint8;
        uint8[this.x++] = firstByteMask | (num & 0b00111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 6) & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 13) & 0b01111111);
        uint8[this.x++] = num >>> 20;
      } else {
        let lo32 = num | 0;
        if (lo32 < 0) lo32 += 4294967296;
        const hi32 = (num - lo32) / 4294967296;
        if (num <= 0b1111111_1111111_1111111_1111111_111111) {
          this.ensureCapacity(5);
          const uint8 = this.uint8;
          uint8[this.x++] = firstByteMask | (num & 0b00111111);
          uint8[this.x++] = 0b10000000 | ((num >>> 6) & 0b01111111);
          uint8[this.x++] = 0b10000000 | ((num >>> 13) & 0b01111111);
          uint8[this.x++] = 0b10000000 | ((num >>> 20) & 0b01111111);
          uint8[this.x++] = (hi32 << 5) | (num >>> 27);
        } else if (num <= 0b1111111_1111111_1111111_1111111_1111111_111111) {
          this.ensureCapacity(6);
          const uint8 = this.uint8;
          uint8[this.x++] = firstByteMask | (num & 0b00111111);
          uint8[this.x++] = 0b10000000 | ((num >>> 6) & 0b01111111);
          uint8[this.x++] = 0b10000000 | ((num >>> 13) & 0b01111111);
          uint8[this.x++] = 0b10000000 | ((num >>> 20) & 0b01111111);
          uint8[this.x++] = 0b10000000 | ((hi32 & 0b11) << 5) | (num >>> 27);
          uint8[this.x++] = hi32 >>> 2;
        } else if (num <= 0b1111111_1111111_1111111_1111111_1111111_1111111_111111) {
          this.ensureCapacity(7);
          const uint8 = this.uint8;
          uint8[this.x++] = firstByteMask | (num & 0b00111111);
          uint8[this.x++] = 0b10000000 | ((num >>> 6) & 0b01111111);
          uint8[this.x++] = 0b10000000 | ((num >>> 13) & 0b01111111);
          uint8[this.x++] = 0b10000000 | ((num >>> 20) & 0b01111111);
          uint8[this.x++] = 0b10000000 | ((hi32 & 0b11) << 5) | (num >>> 27);
          uint8[this.x++] = 0b10000000 | ((hi32 & 0b1111111_00) >>> 2);
          uint8[this.x++] = hi32 >>> 9;
        } else {
          this.ensureCapacity(8);
          const uint8 = this.uint8;
          uint8[this.x++] = firstByteMask | (num & 0b00111111);
          uint8[this.x++] = 0b10000000 | ((num >>> 6) & 0b01111111);
          uint8[this.x++] = 0b10000000 | ((num >>> 13) & 0b01111111);
          uint8[this.x++] = 0b10000000 | ((num >>> 20) & 0b01111111);
          uint8[this.x++] = 0b10000000 | ((hi32 & 0b11) << 5) | (num >>> 27);
          uint8[this.x++] = 0b10000000 | ((hi32 & 0b1111111_00) >>> 2);
          uint8[this.x++] = 0b10000000 | ((hi32 & 0b1111111_0000000_00) >>> 9);
          uint8[this.x++] = hi32 >>> 16;
        }
      }
    }
  }

  public b1vu28(flag: boolean, num: number) {
    if (num <= 0b111111) {
      this.u8((flag ? 0b10000000 : 0b00000000) | num);
    } else {
      const firstByteMask = flag ? 0b11000000 : 0b01000000;
      if (num <= 0b1111111_111111) {
        this.ensureCapacity(2);
        const uint8 = this.uint8;
        uint8[this.x++] = firstByteMask | (num & 0b00111111);
        uint8[this.x++] = num >>> 6;
      } else if (num <= 0b1111111_1111111_111111) {
        this.ensureCapacity(3);
        const uint8 = this.uint8;
        uint8[this.x++] = firstByteMask | (num & 0b00111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 6) & 0b01111111);
        uint8[this.x++] = num >>> 13;
      } else {
        this.ensureCapacity(4);
        const uint8 = this.uint8;
        uint8[this.x++] = firstByteMask | (num & 0b00111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 6) & 0b01111111);
        uint8[this.x++] = 0b10000000 | ((num >>> 13) & 0b01111111);
        uint8[this.x++] = num >>> 20;
      }
    }
  }

  /**
   * Encoding schema:
   *
   * ```
   * byte 1                                                          byte 8                              byte 12
   * +--------+--------+--------+--------+--------+--------+-----|---+--------+........+........+........+········+
   * |xxxxxxxx|xxxxxxxx|xxxxxxxx|xxxxxxxx|xxxxxxxx|xxxxxxxx|xxxxx|?zz|zzzzzzzz|?zzzzzzz|?zzzzzzz|?zzzzzzz|zzzzzzzz|
   * +--------+--------+--------+--------+--------+--------+-----^---+--------+........+........+........+········+
   *
   *  33322222 22222111 1111111           44444444 43333333 55554 .1           .1111111 .2222211 .3322222 33333333
   *  21098765 43210987 65432109 87654321 87654321 09876543 32109 .09 87654321 .7654321 .4321098 .1098765 98765432
   *  |                                     |               |      |                       |
   *  |                                     |               |      10th bit of z           |
   *  |                                     46th bit of x   |                              |
   *  |                                                     |                              22nd bit of z
   *  |                                                     53rd bit of x
   *  32nd bit of x
   * ```
   */
  public u53vu39(x: number, z: number): void {
    let x1 = x | 0;
    if (x1 < 0) x1 += 4294967296;
    const x2 = (x - x1) / 4294967296;
    const fiveXBits = (x2 >>> 16) << 3;
    const twoZBits = (z >>> 8) & 0b11;
    const zFitsIn10Bits = z <= 0b11_11111111;
    this.ensureCapacity(8);
    const uint8 = this.uint8;
    const view = this.view;
    view.setUint32(this.x, x1);
    this.x += 4;
    view.setUint16(this.x, x2 & 0xffff);
    this.x += 2;
    uint8[this.x++] = fiveXBits | (zFitsIn10Bits ? 0b000 : 0b100) | twoZBits;
    uint8[this.x++] = z & 0xff;
    if (zFitsIn10Bits) return;
    if (z <= 0b1111111_11_11111111) {
      this.u8(z >>> 10);
    } else if (z <= 0b1111111_1111111_11_11111111) {
      this.ensureCapacity(2);
      const uint8 = this.uint8;
      uint8[this.x++] = 0b1_0000000 | ((z >>> 10) & 0b0_1111111);
      uint8[this.x++] = z >>> 17;
    } else if (z <= 0b1111111_1111111_1111111_11_11111111) {
      this.ensureCapacity(3);
      const uint8 = this.uint8;
      uint8[this.x++] = 0b1_0000000 | ((z >>> 10) & 0b0_1111111);
      uint8[this.x++] = 0b1_0000000 | ((z >>> 17) & 0b0_1111111);
      uint8[this.x++] = z >>> 24;
    } else {
      let z1 = z | 0;
      if (z1 < 0) z1 += 4294967296;
      const z2 = (z - z1) / 4294967296;
      this.ensureCapacity(4);
      const uint8 = this.uint8;
      uint8[this.x++] = 0b1_0000000 | ((z1 >>> 10) & 0b0_1111111);
      uint8[this.x++] = 0b1_0000000 | ((z1 >>> 17) & 0b0_1111111);
      uint8[this.x++] = 0b1_0000000 | ((z1 >>> 24) & 0b0_1111111);
      uint8[this.x++] = (z1 >>> 31) | (z2 << 1);
    }
  }
}