import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(priceBdt: number | string | undefined | null) {
  if (!priceBdt) return "৳0";
  const numPrice = typeof priceBdt === 'string' ? parseFloat(priceBdt) : priceBdt;
  
  if (typeof window !== 'undefined') {
    const region = localStorage.getItem('user_region');
    // BDT to INR approx 0.71
    if (region === 'IN') {
      const inr = Math.round(numPrice * 0.71);
      return `₹${inr.toLocaleString()}`;
    }
    // BDT to PKR approx 2.40
    if (region === 'PK') {
      const pkr = Math.round(numPrice * 2.40);
      return `Rs ${pkr.toLocaleString()}`;
    }
  }
  
  return `৳${numPrice.toLocaleString()}`;
}

const PROFANITY_LIST = [
  'fuck', 'shit', 'bitch', 'cunt', 'asshole', 'dick', 'pussy', 'porn', 'sex',
  'bal', 'baal', 'madarchod', 'bokachoda', 'gandu', 'khanki', 'bara', 'magi',
  'magi', 'chud', 'chudir', 'suor', 'shuor', 'kutta', 'nodi', 'shala', 'sala',
  'banchod', 'banxhod', 'haramzada', 'harami', 'besha', 'beshaya', 'matha',
  'kankir', 'খানকি', 'মাদারচোদ', 'গান্ডু', 'বাল', 'মাগী', 'চুদ', 'কুত্তা', 'শুয়োর', 'বোকাচোদা'
];

const FORBIDDEN_WORDS = ['test', 'example', 'user', 'fake', 'dummy', 'admin', 'root', 'vibegadget', 'demo', 'sample', 'anonymous', 'anon'];

function checkBanState(): string | null {
  const banEndTime = localStorage.getItem('vibe_ban_end_time');
  if (banEndTime) {
    if (Date.now() < parseInt(banEndTime)) {
      return "Due to repeated policy violations, your access has been temporarily blocked for 24 hours.";
    } else {
      localStorage.removeItem('vibe_ban_end_time');
      localStorage.removeItem('vibe_violations');
    }
  }
  return null;
}

function handleViolation(): string {
  let violations = parseInt(localStorage.getItem('vibe_violations') || '0');
  violations += 1;
  localStorage.setItem('vibe_violations', violations.toString());
  
  if (violations >= 3) {
    localStorage.setItem('vibe_ban_end_time', (Date.now() + 24 * 60 * 60 * 1000).toString());
    return "Due to repeated policy violations, your access has been temporarily blocked for 24 hours.";
  }
  return "Please do not use inappropriate, random, or fake details. Taking this lightly will result in a 24-hour ban. Warning " + violations + "/3.";
}

function isGibberish(text: string): boolean {
  // Check for repeated same letters
  if (/(.)\1{3,}/.test(text)) return true; // e.g. aaaa
  // Check for sequential keys
  const lower = text.toLowerCase();
  if (lower.includes('asdf') || lower.includes('qwer') || lower.includes('zxcv') || lower.includes('1234') || lower.includes('abcd')) return true;
  // Check ratio of consonants
  const noVowels = lower.replace(/[aeiou0-9\s.@]/g, '');
  if (noVowels.length > 0 && noVowels.length === lower.replace(/[\s.@]/g, '').length) return true; // all consonants
  if (lower.replace(/\s+/g, '').length < 4) return true; // too short overall
  return false;
}

export function validateInput(val: string, type: 'email' | 'phone' | 'name' | 'password'): string | null {
  const ban = checkBanState();
  if (ban) return ban;
  
  const lowerVal = val.toLowerCase();
  
  // Universal profanity check
  if (PROFANITY_LIST.some(word => lowerVal.includes(word))) {
    return handleViolation();
  }

  // Universal forbidden word check
  if (FORBIDDEN_WORDS.some(word => lowerVal.includes(word))) {
    return handleViolation();
  }
  
  // Gibberish / Too short check (excluding phone numbers format naturally)
  if (type !== 'phone') {
    if (val.trim().length < 4) return "Must be at least 4 characters long.";
    if (isGibberish(val)) return handleViolation();
  }

  // Check language rules
  const banglaRegex = /[\u0980-\u09FF]/;
  if (type === 'email' || type === 'password') {
    if (banglaRegex.test(lowerVal)) return "Bangla characters are not allowed for email or password.";
  }

  if (type === 'name') {
    if (/\d/.test(val)) return "Name cannot contain numbers.";
  }

  if (type === 'email') {
    const userPart = lowerVal.split('@')[0] || lowerVal;
    const domain = lowerVal.split("@")[1];
    if (!domain) return "Invalid email address.";
    const allowedDomains = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com"];
    
    // We can be a bit more permissive with email length but the username part has minimum
    if (userPart.length < 4) return "Email username must be at least 4 characters.";
  } else if (type === 'phone') {
    const cleanPhone = val.replace(/[-.\s+]/g, '');
    if (cleanPhone.includes('0177777777') || cleanPhone.includes('123456789') || cleanPhone.match(/(\d)\1{6,}/)) {
      return handleViolation();
    }
  }

  return null;
}

