import type {Document} from "../document";
import type {Path} from "../../json-pointer";
import {StringType} from "../types/rga-string/StringType";
import {PatchBuilder} from "../../json-crdt-patch/PatchBuilder";
import {Patch} from "../../json-crdt-patch/Patch";
import {NoopOperation} from "../../json-crdt-patch/operations/NoopOperation";
import {LogicalTimestamp} from "../../json-crdt-patch/clock";

export class DocumentApi {
  public patches: Patch[] = [];
  private builder: PatchBuilder;

  constructor(private readonly doc: Document) {
    this.builder = new PatchBuilder(doc.clock);
  }

  private asString(path: Path): StringType {
    const obj = this.doc.find(path);
    if (obj instanceof StringType) return obj;
    throw new Error('NOT_STRING');
  }

  public commit(): this {
    const patch = this.builder.patch;
    this.builder = new PatchBuilder(this.doc.clock);
    if (patch.ops.length) {
      this.patches.push(patch);
      this.doc.applyPatch(patch);
    }
    return this;
  }

  public flush(): Patch[] {
    const patches = this.patches;
    this.patches = [];
    return patches;
  }

  public flushPatch(): Patch {
    const patches = this.flush()
    const length = patches.length;
    const result = new Patch();
    let prev: null | Patch = null;
    for (let i = 0; i < length; i++) {
      const patch = patches[i];
      if (!patch.ops) continue;
      if (!prev) result.ops.push(...patch.ops);
      else {
        const id = patch.getId()!;
        const nextTime = prev.nextTime();
        const gap = id.time - nextTime;
        if (gap > 0) result.ops.push(new NoopOperation(new LogicalTimestamp(id.sessionId, nextTime), gap));
        result.ops.push(...patch.ops);
      }
      prev = patch;
    }
    return result;
  }

  public patch(cb: (api: this) => void) {
    this.commit();
    cb(this);
    this.commit();
  }

  public root(json: unknown): this {
    const value = this.builder.json(json);
    this.builder.root(value);
    return this;
  }

  public strIns(path: Path, index: number, substr: string): this {
    const obj = this.asString(path);
    const after = !index ? obj.id : obj.findId(index - 1);
    this.builder.insStr(obj.id, after, substr);
    return this;
  }

  public strDel(path: Path, index: number, length: number): this {
    const obj = this.asString(path);
    const after = obj.findId(index);
    this.builder.del(obj.id, after, length);
    return this;
  }
}
