/**
 * Calculates the similarity between two strings (0 to 1)
 * Handles typos and minor variations using Levenshtein distance algorithm.
 */
export const calculateSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase().trim().replace(/[^\w\s]/gi, '');
  const s2 = str2.toLowerCase().trim().replace(/[^\w\s]/gi, '');

  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;

  const editDistance = getLevenshteinDistance(longer, shorter);
  return (longerLength - editDistance) / longerLength;
};

/**
 * Standard Levenshtein Distance algorithm
 */
function getLevenshteinDistance(s1, s2) {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}
