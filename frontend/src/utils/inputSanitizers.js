export function keepLettersAndSpaces(value) {
  return value
    .replace(/[^\p{L}\s]/gu, "")
    .replace(/\s{2,}/g, " ");
}

export function keepDigits(value, maxLength) {
  const digits = value.replace(/\D/g, "");
  return maxLength ? digits.slice(0, maxLength) : digits;
}

export function keepDecimal(value) {
  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
  const [integerPart, ...decimalParts] = normalized.split(".");
  const decimalPart = decimalParts.join("").slice(0, 2);

  return decimalParts.length ? `${integerPart}.${decimalPart}` : integerPart;
}
