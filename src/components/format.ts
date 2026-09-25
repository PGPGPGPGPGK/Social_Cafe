import type { CafeSummary } from '../data/api.ts'
import type { User } from '../domain/types.ts'

export const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'Date not set'

/** ['a','b','c'] -> 'a, b and c' */
export const listText = (parts: string[]) => parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`
const names = (us: User[]) => listText(us.map((u) => `@${u.username}`))

/** Early-beta context lines: everyone is visible, so no "people you follow" wording. */
export function socialLines(s: CafeSummary): string[] {
  const lines: string[] = []
  const w = s.othersWantToGo
  if (w.length) {
    if (s.viewerWantsToGo) lines.push(w.length <= 2 ? `${listText(['You', ...w.map((u) => `@${u.username}`)])} want to go` : `You and ${w.length} others want to go`)
    else lines.push(w.length === 1 ? `@${w[0].username} wants to go` : w.length === 2 ? `${names(w)} want to go` : `${w.length} people want to go`)
  }
  const v = s.visitors
  if (v.length) lines.push(v.length === 1 ? `@${v[0].username} has been here` : `${v.length} people have been here`)
  if (s.recommendation) {
    const { user, itemName } = s.recommendation
    lines.push(`@${user.username} recommends ${itemName ? `the ${itemName}` : 'this'}`)
  }
  return lines
}
