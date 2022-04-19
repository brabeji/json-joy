import {ArrayType} from '../../../types/rga-array/ArrayType';
import {BinaryType} from '../../../types/rga-binary/BinaryType';
import {decode as decodeBinary} from '../../../../json-crdt-patch/codec/binary/decode';
import {decode as decodeCompact} from '../../../../json-crdt-patch/codec/compact/decode';
import {decode as decodeJson} from '../../../../json-crdt-patch/codec/json/decode';
import {Decoder as BinaryDecoder} from '../../../codec/binary/Decoder';
import {Decoder as CompactDecoder} from '../../../codec/compact/Decoder';
import {Decoder as JsonDecoder} from '../../../codec/json/Decoder';
import {DeleteOperation} from '../../../../json-crdt-patch/operations/DeleteOperation';
import {encode as encodeBinary} from '../../../../json-crdt-patch/codec/binary/encode';
import {encode as encodeCompact} from '../../../../json-crdt-patch/codec/compact/encode';
import {encode as encodeJson} from '../../../../json-crdt-patch/codec/json/encode';
import {Encoder as BinaryEncoder} from '../../../codec/binary/Encoder';
import {Encoder as CompactEncoder} from '../../../codec/compact/Encoder';
import {Encoder as JsonEncoder} from '../../../codec/json/Encoder';
import {InsertArrayElementsOperation} from '../../../../json-crdt-patch/operations/InsertArrayElementsOperation';
import {InsertBinaryDataOperation} from '../../../../json-crdt-patch/operations/InsertBinaryDataOperation';
import {InsertStringSubstringOperation} from '../../../../json-crdt-patch/operations/InsertStringSubstringOperation';
import {Model} from '../..';
import {ObjectType} from '../../../types/lww-object/ObjectType';
import {Patch} from '../../../../json-crdt-patch/Patch';
import {PatchBuilder} from '../../../../json-crdt-patch/PatchBuilder';
import {RandomJson} from '../../../../json-random/RandomJson';
import {SetObjectKeysOperation} from '../../../../json-crdt-patch/operations/SetObjectKeysOperation';
import {StringType} from '../../../types/rga-string/StringType';
import {UNDEFINED_ID} from '../../../../json-crdt-patch/constants';
import {ValueType} from '../../../types/lww-value/ValueType';
import type {JsonCrdtFuzzer} from './JsonCrdtFuzzer';
import {generateInteger} from './util';

const jsonEncoder = new JsonEncoder();
const jsonDecoder = new JsonDecoder();
const compactEncoder = new CompactEncoder();
const compactDecoder = new CompactDecoder();
const binaryEncoder = new BinaryEncoder();
const binaryDecoder = new BinaryDecoder();

export class SessionLogical {
  public models: Model[] = [];
  public patches: Patch[][] = [];

  public constructor(public fuzzer: JsonCrdtFuzzer, public concurrency: number) {
    for (let i = 0; i < concurrency; i++) {
      const model = fuzzer.model.fork();
      this.models.push(model);
      this.patches.push([]);
    }
  }

  public generateEdits() {
    for (let i = 0; i < this.concurrency; i++) {
      this.generatePeerEdits(i);
    }
  }

  private generatePeerEdits(peer: number) {
    const patchCount = generateInteger(...this.fuzzer.opts.patchesPerPeer);
    for (let patchIndex = 0; patchIndex < patchCount; patchIndex++) {
      this.generatePatchForPeer(peer);
    }
  }

  private generatePatchForPeer(peer: number) {
    const model = this.models[peer];
    const node = this.fuzzer.picker.pickNode(model);
    let patch: Patch | null = null;
    if (node instanceof StringType) patch = this.generateStringPatch(model, node);
    else if (node instanceof BinaryType) patch = this.generateBinaryPatch(model, node);
    else if (node instanceof ObjectType) patch = this.generateObjectPatch(model, node);
    else if (node instanceof ArrayType) patch = this.generateArrayPatch(model, node);
    else if (node instanceof ValueType) patch = this.generateValuePatch(model, node);
    else return;
    if (!patch) return;
    model.applyPatch(patch);

    if (Math.random() < 0.5) patch = decodeJson(encodeJson(patch));
    if (Math.random() < 0.5) patch = decodeCompact(encodeCompact(patch));
    if (Math.random() < 0.5) patch = decodeBinary(encodeBinary(patch));

    this.patches[peer].push(patch);
  }

  private generateStringPatch(model: Model, node: StringType): Patch | null {
    const opcode = this.fuzzer.picker.pickStringOperation(node);
    const builder = new PatchBuilder(model.clock);
    const size = node.length();
    if (opcode === InsertStringSubstringOperation) {
      const substring = this.fuzzer.picker.generateSubstring();
      const pos = !size ? 0 : Math.min(size - 1, Math.floor(Math.random() * (size + 1)));
      const posId = !size ? node.id : node.findId(pos);
      builder.insStr(node.id, posId, substring);
    } else if (opcode === DeleteOperation) {
      if (!size) return null;
      const pos = Math.floor(Math.random() & size);
      const length = Math.min(size - pos, Math.ceil(Math.random() * this.fuzzer.opts.maxStringDeleteLength));
      const posId = node.findId(pos);
      builder.del(node.id, posId, length);
    }
    return builder.patch;
  }

  private generateBinaryPatch(model: Model, node: BinaryType): Patch | null {
    const opcode = this.fuzzer.picker.pickBinaryOperation(node);
    const builder = new PatchBuilder(model.clock);
    const size = node.length();
    if (opcode === InsertBinaryDataOperation) {
      const substring = this.fuzzer.picker.generateBinaryData();
      const pos = !size ? 0 : Math.min(size - 1, Math.floor(Math.random() * (size + 1)));
      const posId = !size ? node.id : node.findId(pos);
      builder.insBin(node.id, posId, substring);
    } else if (opcode === DeleteOperation) {
      if (!size) return null;
      const pos = Math.floor(Math.random() & size);
      const length = Math.min(size - pos, Math.ceil(Math.random() * this.fuzzer.opts.maxStringDeleteLength));
      const posId = node.findId(pos);
      builder.del(node.id, posId, length);
    }
    return builder.patch;
  }

  private generateObjectPatch(model: Model, node: ObjectType): Patch {
    const [key, opcode] = this.fuzzer.picker.pickObjectOperation(node);
    const builder = new PatchBuilder(model.clock);
    if (opcode === SetObjectKeysOperation) {
      const json = RandomJson.generate({
        nodeCount: 3,
        odds: {
          null: 1,
          boolean: 2,
          number: 10,
          string: 8,
          binary: 4,
          array: 2,
          object: 2,
        },
      });
      // console.log('ADDING KEY', key, json);
      const valueId = builder.json(json);
      builder.setKeys(node.id, [[key, valueId]]);
    } else {
      // console.log('DELETING KEY', JSON.stringify(key))
      builder.setKeys(node.id, [[key, UNDEFINED_ID]]);
    }
    return builder.patch;
  }

  private generateArrayPatch(model: Model, node: ArrayType): Patch {
    const opcode = this.fuzzer.picker.pickArrayOperation(node);
    const builder = new PatchBuilder(model.clock);
    const length = node.length();
    if (opcode === InsertArrayElementsOperation) {
      const json = RandomJson.generate({nodeCount: Math.ceil(Math.random() * 5)});
      const valueId = builder.json(json);
      if (!length) builder.insArr(node.id, node.id, [valueId]);
      else {
        const pos = Math.ceil(Math.random() * length);
        if (!pos) builder.insArr(node.id, node.id, [valueId]);
        else {
          const afterId = node.findId(pos - 1);
          builder.insArr(node.id, afterId, [valueId]);
        }
      }
    } else {
      if (!length) return builder.patch;
      const pos = Math.floor(Math.random() * length);
      const valueId = node.findId(pos);
      builder.del(node.id, valueId, 1);
    }
    return builder.patch;
  }

  private generateValuePatch(model: Model, node: ValueType): Patch {
    const builder = new PatchBuilder(model.clock);
    const value = Math.random() > 0.5 ? RandomJson.genNumber() : RandomJson.generate();
    builder.setVal(node.id, value);
    return builder.patch;
  }

  public synchronize() {
    for (let i = 0; i < this.concurrency; i++) {
      let model = this.models[i];

      if (Math.random() < 0.5) model = jsonDecoder.decode(jsonEncoder.encode(model));
      if (Math.random() < 0.5) model = compactDecoder.decode(compactEncoder.encode(model));
      if (Math.random() < 0.5) model = binaryDecoder.decode(binaryEncoder.encode(model));

      for (let j = 0; j < this.concurrency; j++) {
        const patches = this.patches[j];
        for (const patch of patches) {
          model.applyPatch(patch);
        }
      }

      this.models[i] = model;
    }

    for (let j = 0; j < this.concurrency; j++) {
      const patches = this.patches[j];
      for (const patch of patches) this.fuzzer.model.applyPatch(patch);
    }
  }
}