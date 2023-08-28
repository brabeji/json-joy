import {operatorsToMap} from '../util';
import {arithmeticOperators} from './arithmetic';
import {comparisonOperators} from './comparison';
import {logicalOperators} from './logical';
import {typeOperators} from './type';
import {stringOperators} from './string';
import {binaryOperators} from './binary';
import {branchingOperators} from './branching';
import {inputOperators} from './input';
import {bitwiseOperators} from './bitwise';

export const operators = [
  ...arithmeticOperators,
  ...comparisonOperators,
  ...logicalOperators,
  ...typeOperators,
  ...stringOperators,
  ...binaryOperators,
  ...branchingOperators,
  ...inputOperators,
  ...bitwiseOperators,
];

export const operatorsMap = operatorsToMap(operators);
