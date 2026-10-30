import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js";

const countryCodes = getCountries();
const englishNames = new Intl.DisplayNames(["en"], { type: "region" });
const arabicNames = new Intl.DisplayNames(["ar"], { type: "region" });

export const PHONE_VALIDATION_ERROR =
  "Enter a valid phone number for the selected country, including the correct country code.";

export const countries = countryCodes
  .map((code) => ({
    code,
    callingCode: `+${getCountryCallingCode(code)}`,
    name: englishNames.of(code) ?? code,
    arabicName: arabicNames.of(code) ?? code,
    flag: String.fromCodePoint(
      ...[...code].map((letter) => letter.charCodeAt(0) + 127397),
    ),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function resolveCountryCode(value) {
  const country = String(value ?? "").trim();
  if (!country) return "";

  const code = country.toUpperCase();
  if (countryCodes.includes(code)) return code;

  const normalized = country.toLocaleLowerCase();
  return (
    countries.find(
      (item) =>
        item.name.toLocaleLowerCase() === normalized ||
        item.arabicName.toLocaleLowerCase() === normalized,
    )?.code ?? ""
  );
}

export function formatLocalPhone(value, countryCode) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!countryCodes.includes(countryCode) || !digits) return digits;
  return new AsYouType(countryCode).input(digits);
}

export function getPhoneE164(value, countryCode) {
  if (!countryCodes.includes(countryCode)) return "";

  try {
    const parsed = parsePhoneNumberFromString(String(value ?? ""), countryCode);
    if (!parsed?.isValid() || parsed.country !== countryCode) return "";
    return parsed.number;
  } catch {
    return "";
  }
}

export function getInitialPhoneValues(country, phone) {
  const savedPhone = String(phone ?? "");
  const parsed = savedPhone.startsWith("+")
    ? parsePhoneNumberFromString(savedPhone)
    : undefined;
  const countryCode =
    (parsed?.country && resolveCountryCode(parsed.country)) ||
    resolveCountryCode(country);

  if (!countryCode) {
    return { country: "", phone: savedPhone };
  }

  const nationalNumber = parsed?.formatNational() ?? savedPhone;
  return {
    country: countryCode,
    phone: formatLocalPhone(nationalNumber, countryCode),
  };
}
