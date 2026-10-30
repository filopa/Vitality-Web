"use client";

import { Phone } from "lucide-react";
import { useMemo, useState } from "react";
import { countries, formatLocalPhone, resolveCountryCode } from "@/lib/phone";
import {
  parsePhoneNumberFromString,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
} from "libphonenumber-js";
export function CountryPhoneField({
  country,
  phone,
  onCountryChange,
  onPhoneChange,
  countryError,
  phoneError,
  idPrefix = "profile",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const selectedCountry = countries.find((item) => item.code === country);
  const filteredCountries = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    if (!search) return countries;
    return countries.filter(
      (item) =>
        item.name.toLocaleLowerCase().includes(search) ||
        item.arabicName.toLocaleLowerCase().includes(search) ||
        item.callingCode.includes(search),
    );
  }, [query]);
  const phoneStatus = useMemo(() => {
    if (!phone) return "empty";

    const digits = phone.replace(/\D/g, "");

    if (!digits) return "empty";

    const possible = isPossiblePhoneNumber(phone, country);
    const valid = isValidPhoneNumber(phone, country);

    if (valid) return "valid";

    if (!possible) return "invalid";

    return "incomplete";
  }, [phone, country]);
  function handlePhoneChange(event) {
    const input = event.target.value;

    if (/^\s*(\+|00)/.test(input)) {
      const international = input.trim().replace(/^00/, "+");
      const parsed = parsePhoneNumberFromString(international);
      const matchingCountry = resolveCountryCode(parsed?.country);

      if (parsed?.isValid() && matchingCountry) {
        onCountryChange(matchingCountry);
        onPhoneChange(
          formatLocalPhone(parsed.formatNational(), matchingCountry),
        );
        return;
      }
    }

    onPhoneChange(formatLocalPhone(input, country));
  }
  function selectCountry(nextCountry) {
    onCountryChange(nextCountry.code);
    onPhoneChange(formatLocalPhone(phone, nextCountry.code));
    setQuery("");
    setIsOpen(false);
  }

  function handlePhoneChange(event) {
    const input = event.target.value;
    if (/^\s*(\+|00)/.test(input)) {
      const international = input.trim().replace(/^00/, "+");
      const parsed = parsePhoneNumberFromString(international);
      const matchingCountry = resolveCountryCode(parsed?.country);
      if (parsed?.isValid() && matchingCountry) {
        onCountryChange(matchingCountry);
        onPhoneChange(
          formatLocalPhone(parsed.formatNational(), matchingCountry),
        );
        return;
      }
    }

    onPhoneChange(formatLocalPhone(input, country));
  }

  const phoneId = `${idPrefix}-phone`;
  const countryId = `${idPrefix}-country`;
  const countryOptionsId = `${idPrefix}-country-options`;

  return (
    <div className=" flex flex-col gap-4 ">
      <div className="flex min-w-0 flex-col gap-2">
        <input type="hidden" name="country" value={country} />
        <label
          htmlFor={countryId}
          className="text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-muted"
        >
          Country
        </label>
        <div className="relative">
          {selectedCountry && !isOpen && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 start-3 z-10 flex items-center text-lg"
            >
              {selectedCountry.flag}
            </span>
          )}
          <input
            id={countryId}
            type="search"
            role="combobox"
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={countryOptionsId}
            aria-invalid={countryError ? true : undefined}
            aria-describedby={countryError ? `${countryId}-error` : undefined}
            autoComplete="off"
            value={
              isOpen ? query : selectedCountry ? selectedCountry.name : query
            }
            onFocus={() => {
              setQuery("");
              setIsOpen(true);
            }}
            onBlur={() => {
              setQuery("");
              setIsOpen(false);
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setIsOpen(false);
            }}
            placeholder="Search country"
            className={`h-[58px] w-full min-w-0 rounded-xl border bg-surface pe-3 text-sm text-surface-foreground outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/20 ${
              selectedCountry ? "ps-11" : "ps-3"
            } ${countryError ? "border-red-500" : "border-border"}`}
          />
          {isOpen && (
            <div
              id={countryOptionsId}
              role="listbox"
              className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-lg"
            >
              {filteredCountries.length ? (
                filteredCountries.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    role="option"
                    aria-selected={item.code === country}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectCountry(item)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-surface-foreground hover:bg-primary/10"
                  >
                    <span aria-hidden="true" className="text-lg">
                      {item.flag}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    <span className="text-muted">{item.callingCode}</span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-muted">
                  No matching country.
                </p>
              )}
            </div>
          )}
        </div>
        {countryError && (
          <p
            id={`${countryId}-error`}
            role="alert"
            className="text-sm text-red-500"
          >
            {countryError}
          </p>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <label
          htmlFor={phoneId}
          className="text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-muted"
        >
          Phone number
        </label>
        <div
          className={`flex h-[58px] min-w-0 items-center rounded-xl border bg-surface transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20 ${
            phoneError ? "border-red-500" : "border-border"
          }`}
        >
          <span className="flex h-full shrink-0 items-center gap-2 border-e border-border px-2 text-sm text-muted sm:px-3">
            <Phone aria-hidden="true" className="hidden h-4 w-4 sm:block" />
            {selectedCountry?.callingCode ?? "+Code"}
          </span>
          <input
            id={phoneId}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            onBlur={() => setPhoneTouched(true)}
            value={phone}
            onChange={handlePhoneChange}
            aria-invalid={phoneError ? true : undefined}
            aria-describedby={phoneError ? `${phoneId}-error` : undefined}
            placeholder="Phone number"
            className="h-full min-w-0 flex-1 rounded-e-xl bg-transparent px-2 text-sm text-surface-foreground outline-none placeholder:text-muted/60 sm:px-3"
          />
        </div>
        {phone && phoneStatus === "invalid" && (
          <p role="alert" className="text-sm text-red-500">
            Invalid phone number for the selected country.
          </p>
        )}

        {phone && phoneStatus === "incomplete" && phoneTouched && (
          <p className="text-sm text-amber-600">Phone number is incomplete.</p>
        )}
        {phoneError && (
          <p
            id={`${phoneId}-error`}
            role="alert"
            className="text-sm text-red-500"
          >
            {phoneError}
          </p>
        )}
      </div>
    </div>
  );
}
