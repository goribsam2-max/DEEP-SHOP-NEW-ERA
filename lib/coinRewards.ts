export function getProductCoinReward(productId: string): number {
  if (!productId) return 0;
  const date = new Date();
  const seedString = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${productId}`;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    const char = seedString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const rng = Math.abs(hash) / 2147483647; // Pseudo-random 0 to 1 based on hash
  
  // 75% chance to have a reward
  if (rng < 0.75) {
      // Reward is between 15 and 65
      return Math.floor(15 + ((rng / 0.75) * 50));
  }
  return 0; // No reward
}
