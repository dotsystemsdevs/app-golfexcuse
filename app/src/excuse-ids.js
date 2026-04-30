import { EXCUSES } from './excuses';

function hashId(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h) + text.charCodeAt(i);
  return Math.abs(h).toString(36);
}

export const ID_TO_TEXT = new Map();
export const TEXT_TO_ID = new Map();

for (const e of EXCUSES) {
  const id = hashId(e.text);
  ID_TO_TEXT.set(id, e.text);
  TEXT_TO_ID.set(e.text, id);
}

export function getExcuseId(text) {
  return TEXT_TO_ID.get(text) || null;
}

export function getExcuseText(id) {
  return ID_TO_TEXT.get(id) || null;
}
