import {WebSocketChannel} from '../../channel';
import {RpcPersistentClient} from '../RpcPersistentClient';
import {createWebSocketMock} from '../../channel/mock';
import {RequestCompleteMessage} from '../..';
import {until} from '../../../../__tests__/util';
import {Value} from '../../messages/Value';
import {RpcCodec} from '../../codec/RpcCodec';
import {Codecs} from '../../../../json-pack/codecs/Codecs';
import {Writer} from '../../../../util/buffers/Writer';
import {RpcMessageCodecs} from '../../codec/RpcMessageCodecs';

test('on remote method execution, sends message over WebSocket only once', async () => {
  const onSend = jest.fn();
  const Ws = createWebSocketMock({onSend});
  const ws = new Ws('');
  const valueCodecs = new Codecs(new Writer(128));
  const messageCodecs = new RpcMessageCodecs();
  const codec = new RpcCodec(valueCodecs.cbor, messageCodecs.compact);
  const client = new RpcPersistentClient({
    channel: {
      newChannel: () =>
        new WebSocketChannel({
          newSocket: () => ws,
        }),
    },
    codec,
  });
  client.start();
  setTimeout(() => {
    ws._open();
  }, 1);
  const observable = client.call$('foo.bar', {foo: 'bar'});
  observable.subscribe(() => {});
  observable.subscribe(() => {});
  observable.subscribe(() => {});
  await until(() => onSend.mock.calls.length === 1);
  expect(onSend).toHaveBeenCalledTimes(1);
  const message = onSend.mock.calls[0][0];
  const decoded = codec.decode(message);
  const messageDecoded = decoded[0];
  expect(messageDecoded).toBeInstanceOf(RequestCompleteMessage);
  expect(messageDecoded).toMatchObject(new RequestCompleteMessage(1, 'foo.bar', new Value({foo: 'bar'}, undefined)));
  client.stop();
});