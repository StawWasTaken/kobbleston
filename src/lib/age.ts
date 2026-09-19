/** Kobblon is 15 and over, checked against the birthday given at signup. */
export const MINIMUM_AGE = 15

export function ageOn(birthDate: string, now = new Date()) {
  const born = new Date(birthDate)
  let age = now.getFullYear() - born.getFullYear()
  const beforeBirthday =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())
  if (beforeBirthday) age -= 1
  return age
}

export function isOldEnough(birthDate: string) {
  return ageOn(birthDate) >= MINIMUM_AGE
}
