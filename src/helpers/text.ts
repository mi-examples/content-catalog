/** Count plus its noun, handling the -y → -ies case ("2 subcategories"). */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) {
    return `${count} ${singular}`;
  }

  const many = plural ?? (singular.endsWith('y') ? `${singular.slice(0, -1)}ies` : `${singular}s`);

  return `${count} ${many}`;
}
