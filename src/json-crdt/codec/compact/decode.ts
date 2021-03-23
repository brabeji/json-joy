import {json_string, JSON} from "ts-brand-json";
import {LogicalTimestamp} from "../../../json-crdt-patch/clock";
import {ORIGIN} from "../../../json-crdt-patch/constants";
import {SetRootOperation} from "../../../json-crdt-patch/operations/SetRootOperation";
import {Document} from "../../document";
import {LWWObjectType} from "../../lww-object/LWWObjectType";

export const decode = (packed: json_string<Array<unknown>>): Document => {
  const data = JSON.parse(packed);
  const length = data.length;

  const doc = new Document();
  doc.clock.sessionId = data[0] as number;
  doc.clock.time = data[1] as number;

  let i: number = 2;

  const decodeTimestamp = (): LogicalTimestamp => new LogicalTimestamp(data[i++] as number, data[i++] as number);

  if (data[i]) {
    const id = decodeTimestamp();
    const value = decodeTimestamp();
    doc.root.insert(new SetRootOperation(id, value));
  }

  while (i < length) {
    const packed = data[i++] as Array<number | string>;
    switch(packed[0]) {
      case 0: {
        const node = LWWObjectType.deserialize(doc, packed);
        doc.nodes.index(node);
        break;
      }
    }
  }

  return doc;
};
