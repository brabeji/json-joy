import { findByPointer } from "../json-pointer";
import {Expr} from "./types";

export const evaluate = (expr: Expr | unknown, data: unknown): any => {
  if (!(expr instanceof Array)) return expr;
  if (expr.length === 1 && expr[0] instanceof Array) return expr[0];

  const fn = expr[0];

  switch (fn) {
    case '=': return findByPointer(String(expr[1]), data).val;
    case '&&':
    case 'and':
      return expr.slice(1).every(e => evaluate(e, data));
  }
};
