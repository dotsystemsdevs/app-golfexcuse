/**
 * @param {readonly any[]} list
 * @returns {any}
 */
export function pickRandom(list) {
  if (!Array.isArray(list) || list.length === 0) return '';
  return list[Math.floor(Math.random() * list.length)] ?? '';
}

/**
 * Weighted random pick — unseen items are 5× more likely.
 * Works with both plain strings and { text, tags } objects.
 * @param {readonly any[]} list
 * @param {Set} seenSet - mutable Set tracking seen items
 * @returns {any}
 */
export function pickWeighted(list, seenSet) {
  if (!Array.isArray(list) || list.length === 0) return '';

  const UNSEEN_WEIGHT = 5;
  const SEEN_WEIGHT = 1;

  // Reset if all have been seen
  if (seenSet.size >= list.length) {
    seenSet.clear();
  }

  const key = (item) => (typeof item === 'string' ? item : item?.text ?? '');

  let totalWeight = 0;
  const weights = list.map((item) => {
    const w = seenSet.has(key(item)) ? SEEN_WEIGHT : UNSEEN_WEIGHT;
    totalWeight += w;
    return w;
  });

  let roll = Math.random() * totalWeight;
  for (let i = 0; i < list.length; i++) {
    roll -= weights[i];
    if (roll <= 0) {
      const picked = list[i];
      seenSet.add(key(picked));
      return picked;
    }
  }

  // Fallback
  const last = list[list.length - 1];
  seenSet.add(key(last));
  return last;
}
