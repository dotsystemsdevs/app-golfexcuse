/**
 * @param {readonly string[]} list
 * @returns {string}
 */
export function pickRandom(list) {
  if (!Array.isArray(list) || list.length === 0) return '';
  return list[Math.floor(Math.random() * list.length)] ?? '';
}
