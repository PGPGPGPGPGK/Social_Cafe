// PROTOTYPE ONLY: these checks run in the browser against data the client already
// has, so they protect nothing. They exist to model the product rules in the UI.
// Every rule here must be re-implemented server-side / in security rules.
// See SECURITY_REQUIREMENTS.md.
import type { Follow, ID, Plan, PlanJoinRequest, Relationship, User } from './types.ts'

const follows = (graph: Follow[], a: ID, b: ID, status: Follow['status'] = 'active') =>
  graph.some((f) => f.followerId === a && f.followeeId === b && f.status === status)

export function relationship(graph: Follow[], viewerId: ID, targetId: ID): Relationship {
  if (viewerId === targetId) return 'self'
  const out = follows(graph, viewerId, targetId)
  const back = follows(graph, targetId, viewerId)
  if (out && back) return 'mutual'
  if (out) return 'following'
  if (follows(graph, viewerId, targetId, 'pending')) return 'requested'
  if (back) return 'followed_by'
  return 'none'
}

/** SR-1: detailed café activity of a private profile only for self + approved followers. */
export const canViewActivity = (target: User, rel: Relationship) =>
  target.visibility === 'public' || rel === 'self' || rel === 'following' || rel === 'mutual'

/** SR-3: badge proof photos only between mutual followers. */
export const canViewProofPhotos = (rel: Relationship) => rel === 'self' || rel === 'mutual'

/** SR-2: exact café/time only for host + accepted participants. */
export const canViewPlanDetails = (plan: Plan, requests: PlanJoinRequest[], viewerId: ID) =>
  plan.hostId === viewerId ||
  requests.some((r) => r.planId === plan.id && r.userId === viewerId && r.status === 'accepted')
