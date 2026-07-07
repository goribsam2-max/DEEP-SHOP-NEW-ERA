export const getFriendlyErrorMessage = (error: any): string => {
  const code = error?.code || error?.message || "";
  
  if (typeof code !== "string") return "An unexpected error occurred. Please try again.";

  // Authentication Errors
  if (code.includes("auth/invalid-email")) return "Invalid email address format.";
  if (code.includes("auth/user-not-found") || code.includes("auth/invalid-credential")) return "Invalid email or password. Please try again.";
  if (code.includes("auth/wrong-password")) return "Invalid email or password. Please try again.";
  if (code.includes("auth/email-already-in-use")) return "An account already exists with this email address.";
  if (code.includes("auth/weak-password")) return "Password must be at least 6 characters long.";
  if (code.includes("auth/network-request-failed")) return "Network error. Please check your internet connection and try again.";
  if (code.includes("auth/too-many-requests")) return "Too many unsuccessful login attempts. Please try again later or reset your password.";
  if (code.includes("auth/user-disabled")) return "This account has been disabled. Please contact support.";
  if (code.includes("auth/expired-action-code")) return "The reset link has expired. Please request a new one.";
  if (code.includes("auth/invalid-action-code")) return "The reset link is invalid. It may have already been used.";
  
  // Phone Auth specific errors
  if (code.includes("auth/invalid-phone-number")) return "The phone number entered is invalid. Please check the country code and number.";
  if (code.includes("auth/missing-phone-number")) return "Please enter a valid phone number.";
  if (code.includes("auth/quota-exceeded")) return "SMS quota exceeded. Please try again later or use email signup.";
  if (code.includes("auth/unauthorized-domain")) return "This domain is not authorized for phone authentication in Firebase Console.";
  if (code.includes("auth/captcha-check-failed") || code.includes("auth/invalid-app-credential")) return "reCAPTCHA verification failed. Please try again.";

  // Generic fallback if none match but it's an auth error
  if (code.includes("auth/")) return "Authentication failed. Please check your details and try again.";

  // Firestore & other errors
  if (code.includes("permission-denied")) return "You do not have permission to perform this action.";
  if (code.includes("unavailable")) return "Service is currently unavailable. Please check your internet connection.";
  if (code.toLowerCase().includes("firebase")) return "A server error occurred. Please try again.";
  
  // Clean up standard error messages
  if (error instanceof Error) {
     return error.message.replace(/Firebase: /ig, "").replace(/\(auth\/.*\)\.?/ig, "").trim();
  }

  return "An unexpected error occurred. Please try again.";
};
