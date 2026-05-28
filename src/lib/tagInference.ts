export function inferTags(
  text: string
): string[] {

  const lower =
    text.toLowerCase();

  const tags = new Set<string>();

  // SCI-FI
  if (
    lower.includes("space") ||
    lower.includes("galaxy") ||
    lower.includes("future") ||
    lower.includes("empire")
  ) {
    tags.add("Science Fiction");
  }

  // FANTASY
  if (
    lower.includes("magic") ||
    lower.includes("wizard") ||
    lower.includes("dragon") ||
    lower.includes("kingdom")
  ) {
    tags.add("Fantasy");
  }

  // DARK ACADEMIA
  if (
    lower.includes("academy") ||
    lower.includes("gothic") ||
    lower.includes("elite school")
  ) {
    tags.add("Dark Academia");
  }

  // HORROR
  if (
    lower.includes("haunted") ||
    lower.includes("monster") ||
    lower.includes("terror")
  ) {
    tags.add("Horror");
  }

  // ROMANCE
  if (
    lower.includes("love") ||
    lower.includes("romance") ||
    lower.includes("relationship")
  ) {
    tags.add("Romance");
  }

  // POLITICAL
  if (
    lower.includes("revolution") ||
    lower.includes("politics") ||
    lower.includes("government")
  ) {
    tags.add("Political");
  }

  // PSYCHOLOGICAL
  if (
    lower.includes("obsession") ||
    lower.includes("grief") ||
    lower.includes("madness")
  ) {
    tags.add("Psychological");
  }

  return Array.from(tags);
}