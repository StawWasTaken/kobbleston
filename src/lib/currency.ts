/*
 * What Kobbleston runs on.
 *
 * The name is not settled. It has been Pixels and it is Kubes today, and it
 * will very likely be something of our own before the Catalog, games and the
 * Player are carrying prices between them. So nothing outside this file is
 * allowed to know what it is called: pages ask here for the word, the mark
 * and the way an amount reads in a sentence, and renaming the currency is
 * changing these few lines rather than hunting through fifty of them.
 *
 * The stored column is still `profiles.pixels`, from the first name it had.
 * That is a database rename with functions and policies hanging off it, so it
 * is a job of its own rather than something to fold into a rename of the
 * word people see. `docs/audit.md` keeps that on the list.
 */
import { formatCount } from './format'

export const currency = {
  /** One of them. */
  name: 'Kube',
  /** More than one. */
  plural: 'Kubes',
  /** Short form for anywhere a word will not fit. Never shown alone. */
  code: 'KUB',
  /** How an amount reads in a sentence: "1 Kube", "2,400 Kubes". */
  amount(n: number) {
    return `${formatCount(n)} ${n === 1 ? this.name : this.plural}`
  },
  /** "in Kubes", for a field label. */
  get inWord() {
    return `in ${this.plural}`
  },
} as const
