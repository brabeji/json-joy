import type {Identifiable} from '../../json-crdt-patch/Identifiable';

/**
 * Each JsonNode represents a structural unit of a JSON document. It is like an
 * AST node, where each node has one of the following types: "object",
 * "array", "string", "number", "boolean", and "null".
 *
 * "make" operations result into JSON nodes, for example, "make object" operation
 * create a new "object" JSON node, "make number" operation creates a number
 * JSON node, etc.
 */
export interface JsonNode<View = unknown> extends Identifiable {
  /**
   * Returns a POJO object which represents the "view" of this JSON node model.
   */
  view(): View;

  /**
   * Returns a list of immediate child nodes.
   */
  children(callback: (node: JsonNode) => void): void;

  /**
   * Returns its child (if not a container node), if any.
   */
  child?(): JsonNode | undefined;

  /**
   * Returns itself if the node is a container node. Or asks its child (if any)
   * to return a container node. A *container node* is one that holds other
   * multiple other nodes which can be addressed. For example, an object and
   * an array are container nodes, as they hold other nodes.
   */
  container(): JsonNode | undefined;

  /**
   * Instance which provides public API for this node.
   */
  api: undefined | unknown;
}

export type JsonNodeView<N> = N extends JsonNode<infer V> ? V : {[K in keyof N]: JsonNodeView<N[K]>};
