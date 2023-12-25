import {WsFrameDecoder} from '../WsFrameDecoder';
import {WsFrameEncoder} from '../WsFrameEncoder';
import {WsFrameOpcode} from '../constants';
import {WsPingFrame, WsPongFrame} from '../frames';

describe('control frames', () => {
  test('can encode an empty PING frame', () => {
    const encoder = new WsFrameEncoder();
    const encoded = encoder.encodePing(null);
    const decoder = new WsFrameDecoder();
    decoder.push(encoded);
    const frame = decoder.readFrameHeader()!;
    expect(frame).toBeInstanceOf(WsPingFrame);
    expect(frame.fin).toBe(1);
    expect(frame.opcode).toBe(WsFrameOpcode.PING);
    expect(frame.length).toBe(0);
    expect(frame.mask).toBeUndefined();
    expect((frame as WsPingFrame).data).toEqual(new Uint8Array(0));
  });

  test('can encode a PING frame with data', () => {
    const encoder = new WsFrameEncoder();
    const encoded = encoder.encodePing(new Uint8Array([1, 2, 3, 4]));
    const decoder = new WsFrameDecoder();
    decoder.push(encoded);
    const frame = decoder.readFrameHeader()!;
    expect(frame).toBeInstanceOf(WsPingFrame);
    expect(frame.fin).toBe(1);
    expect(frame.opcode).toBe(WsFrameOpcode.PING);
    expect(frame.length).toBe(4);
    expect(frame.mask).toBeUndefined();
    expect((frame as WsPingFrame).data).toEqual(new Uint8Array([1, 2, 3, 4]));
  });

  test('can encode an empty PONG frame', () => {
    const encoder = new WsFrameEncoder();
    const encoded = encoder.encodePong(null);
    const decoder = new WsFrameDecoder();
    decoder.push(encoded);
    const frame = decoder.readFrameHeader()!;
    expect(frame).toBeInstanceOf(WsPongFrame);
    expect(frame.fin).toBe(1);
    expect(frame.opcode).toBe(WsFrameOpcode.PONG);
    expect(frame.length).toBe(0);
    expect(frame.mask).toBeUndefined();
    expect((frame as WsPingFrame).data).toEqual(new Uint8Array(0));
  });

  test('can encode a PONG frame with data', () => {
    const encoder = new WsFrameEncoder();
    const encoded = encoder.encodePong(new Uint8Array([1, 2, 3, 4]));
    const decoder = new WsFrameDecoder();
    decoder.push(encoded);
    const frame = decoder.readFrameHeader()!;
    expect(frame).toBeInstanceOf(WsPongFrame);
    expect(frame.fin).toBe(1);
    expect(frame.opcode).toBe(WsFrameOpcode.PONG);
    expect(frame.length).toBe(4);
    expect(frame.mask).toBeUndefined();
    expect((frame as WsPingFrame).data).toEqual(new Uint8Array([1, 2, 3, 4]));
  });
});
