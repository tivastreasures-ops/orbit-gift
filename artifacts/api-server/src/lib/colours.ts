const colours = new Set([
  "pink", "red", "orange", "yellow", "green", "blue", "purple", "violet", "indigo",
  "black", "white", "gray", "grey", "brown", "beige", "cream", "ivory", "gold", "silver",
  "teal", "turquoise", "aqua", "cyan", "magenta", "fuchsia", "burgundy", "maroon",
  "lavender", "lilac", "mauve", "coral", "peach", "navy", "olive", "sage", "mint",
  "charcoal", "scarlet", "crimson", "emerald", "cobalt", "rose", "blush", "mustard", "rust", "tan", "plum",
]);
export function clearColour(text: string): string | null {
  const normal = text.toLowerCase().trim().replace(/[.!]+$/, "").replace(/\s+/g, " ");
  const stripped = normal.replace(/^(?:the )?colou?r(?: of)?\s+/, "").replace(/\s+colou?r$/, "");
  return colours.has(stripped) ? stripped : null;
}
export function colourMatch(text: string) {
  const colour = clearColour(text);
  return colour ? { id: `color:${colour}`, name: `The color ${colour}`, kind: "color" } : null;
}
