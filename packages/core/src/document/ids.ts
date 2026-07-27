export type IdFactory = () => string;

export function createIdFactory(prefix = "id"): IdFactory {
  let counter = 0;
  return () => `${prefix}-${counter++}`;
}
