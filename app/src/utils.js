export function pickRandom(list) {
  if (!Array.isArray(list) || list.length === 0) return '';
  return list[Math.floor(Math.random() * list.length)] ?? '';
}

export function pickWeighted(list, seenSet) {
  if (!Array.isArray(list) || list.length === 0) return '';

  const UNSEEN_WEIGHT = 5;
  const SEEN_WEIGHT = 1;

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

  const last = list[list.length - 1];
  seenSet.add(key(last));
  return last;
}

export function getExcuseText(item) {
  if (item == null) return '';
  return typeof item === 'string' ? item : item.text ?? '';
}

/**
 * Picks a weighted line that is not `excludeText` when any alternative exists.
 * Fixes the “Next” button looking broken when the random draw matched the current card.
 */
export function pickDifferentWeighted(list, excludeText, seenSet) {
  if (!Array.isArray(list) || list.length === 0) return '';
  const ex = excludeText ?? '';
  const candidates = list.filter((item) => getExcuseText(item) !== ex);
  if (candidates.length === 0) {
    return pickWeighted(list, seenSet);
  }
  return pickWeighted(candidates, seenSet);
}
