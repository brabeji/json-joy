import {runApiTests} from '../../../rpc/__tests__/api';
import {Encoder, Decoder} from '..';
import {createApiSetupWithCodec} from '../../compact/__tests__/createApiSetupWithCodec';

const decoder = new Decoder();
const setup = createApiSetupWithCodec({
  encoder: new Encoder(),
  decoder: {
    decode: (arr: Uint8Array) => decoder.decode(arr),
  },
});

runApiTests(setup);
