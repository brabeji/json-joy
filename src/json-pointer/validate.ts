import {Path} from './util';

export const validateJsonPointer = (pointer: string | Path) => {
  if (typeof pointer === 'string') {
    if (pointer) {
      if (pointer[0] !== '/') throw new Error('JSON pointer must start with forward slash.');
      if (pointer.length > 1024) throw new Error('Pointer too long.');
    }
  } else validatePath(pointer);
};

const {isArray} = Array;

export const validatePath = (path: Path) => {
  if (!isArray(path)) throw new Error('Invalid path.');
  if (path.length > 256) throw new Error('Path too long.');
  for (const step of path) {
    switch (typeof step) {
      case 'string':
      case 'number':
        continue;
      default:
        throw new Error('Invalid path step.');
    }
  }
};
