export const triggerHaptic = () => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    try {
      window.navigator.vibrate(10); // Short vibration for light tap feel
    } catch (e) {
      // Ignore
    }
  }
};
