// Splits on the first space so a multi-word surname ("De Vicenzo", "Van de
// Velde") still lands together as one unit.
export function splitName(fullName: string): [string, string] {
  const spaceIndex = fullName.indexOf(' ')
  if (spaceIndex === -1) return [fullName, '']
  return [fullName.slice(0, spaceIndex), fullName.slice(spaceIndex + 1)]
}

export function getSurname(fullName: string): string {
  const [, surname] = splitName(fullName)
  return surname || fullName
}
