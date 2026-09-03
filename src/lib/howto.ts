/* Ordered by when you need them, not alphabetically: meeting someone comes
 * before ordering coffee. Shared so the index and the pager agree. */
export const HOWTO_ORDER = [
  "introduce-yourself",
  "greetings",
  "how-are-you",
  "ask-the-day-and-date",
  "tell-the-time",
  "talk-about-weather",
  "at-the-table",
  "give-directions",
];

export const rankHowto = (id: string) => {
  const i = HOWTO_ORDER.indexOf(id);
  return i === -1 ? 999 : i;
};
