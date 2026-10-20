// Parse typed euros without floating-point arithmetic or accepting partial input.
export function eurosToCents(value: string): number | null {
  const text = value.trim();
  if (!/^\d+(?:[,.]\d{0,2})?$/.test(text)) return null;
  const [euros, fraction = ""] = text.split(/[,.]/);
  const cents = Number(euros) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}
