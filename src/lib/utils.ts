const SLUG_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
const CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomChars(chars: string, length: number): string {
  let result = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (const byte of array) {
    result += chars[byte % chars.length];
  }
  return result;
}

export function generateSlug(): string {
  return randomChars(SLUG_CHARS, 8);
}

export function generateConfirmationCode(): string {
  return `STR-${randomChars(CODE_CHARS, 6)}`;
}
