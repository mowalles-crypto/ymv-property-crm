import en from "./en";

/**
 * Single source of truth for UI strings. Only English is populated today;
 * the dictionary shape is what a future `he`/`es` file must match, and
 * `getLocale()`/`t` are the only two exports components should ever import,
 * so switching locales later is a one-line change here, not a rewrite.
 */
export type Dictionary = typeof en;

const dictionaries: Record<string, Dictionary> = { en };

export function getLocale(): string {
  return "en";
}

export const t: Dictionary = dictionaries[getLocale()];

export const dir: "ltr" | "rtl" = "ltr";
