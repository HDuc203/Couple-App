const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_CODE_LENGTH = 8;

export function createInviteCode() {
  const bytes = new Uint8Array(INVITE_CODE_LENGTH);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => {
    const index = byte % INVITE_ALPHABET.length;
    return INVITE_ALPHABET[index] ?? "A";
  }).join("");
}
