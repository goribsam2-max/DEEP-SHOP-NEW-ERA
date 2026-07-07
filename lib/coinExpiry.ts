import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export const handleCoinDeductionWithExpiry = async (uid: string, amountToDeduct: number) => {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const data = snap.data();
  let remainingToDeduct = amountToDeduct;
  let newBatches = [...(data.coinBatches || [])];

  // Sort batches by nearest expiry (ascending) so they are used first
  newBatches.sort((a, b) => a.expiresAt - b.expiresAt);

  const nextBatches = [];
  for (const b of newBatches) {
    if (remainingToDeduct <= 0) {
      nextBatches.push(b);
      continue;
    }
    if (b.amount <= remainingToDeduct) {
      remainingToDeduct -= b.amount; // Batch fully consumed
    } else {
      nextBatches.push({ ...b, amount: b.amount - remainingToDeduct });
      remainingToDeduct = 0;
    }
  }

  // Deduct remaining from the "permanent/unbatched" coins
  // This is handled implicitly because we update total coins exactly by `amountToDeduct`

  await updateDoc(userRef, {
    coins: Math.max(0, (data.coins || 0) - amountToDeduct),
    coinBatches: nextBatches
  });
};

export const sweepExpiredCoins = async (uid: string) => {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const batches = data.coinBatches || [];
  if (batches.length === 0) return;

  const valid: any[] = [];
  let expiredAmount = 0;
  const now = Date.now();

  batches.forEach((b: any) => {
    if (b.expiresAt < now) expiredAmount += b.amount;
    else valid.push(b);
  });

  if (expiredAmount > 0) {
    await updateDoc(userRef, {
      coins: Math.max(0, (data.coins || 0) - expiredAmount),
      coinBatches: valid
    });
  }
};
