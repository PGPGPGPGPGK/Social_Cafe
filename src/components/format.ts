import type { CafeSummary } from '../data/api.ts'
import type { User } from '../domain/types.ts'

export const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'Date not set'

const handles = (us: User[]) =>
  us.length <= 2 ? us.map((u) => `@${u.username}`).join(' and ') : `@${us[0].username} and ${us.length - 1} others`

/** People-first context lines, most personal first. */
export function socialLines(s: CafeSummary): string[] {
  const lines: string[] = []
  const w = s.followedWantToGo
  if (w.length) lines.push(s.viewerWantsToGo ? `You and ${handles(w)} want to go` : `${handles(w)} ${w.length === 1 ? 'wants' : 'want'} to go`)
  const v = s.followedVisitors
  if (v.length) lines.push(v.length === 1 ? `@${v[0].username} has been here` : `${v.length} people you follow have been here`)
  if (s.recommendation) {
    const { user, itemName } = s.recommendation
    lines.push(`@${user.username} recommends ${itemName ? `the ${itemName}` : 'it'}`)
  }
  return lines
}
