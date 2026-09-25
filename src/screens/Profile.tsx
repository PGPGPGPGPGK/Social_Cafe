import { Link, useParams } from 'react-router-dom'
import { getProfileView, getViewerId, listUsers, toggleWantToGo } from '../data/api.ts'
import { useApi } from '../data/useApi.ts'
import { fmtDate } from '../components/format.ts'
import { Companions } from '../components/Companions.tsx'
import type { BadgeProgress } from '../domain/stats.ts'

const verificationLabel = {
  automatic: 'Automatic', mutual_confirmation: 'Both confirm', evidence_required: 'Photo evidence', manual_review: 'Reviewed',
}

export default function Profile() {
  const viewerId = getViewerId()
  const params = useParams()
  const view = useApi(async () => {
    const username = params.username ?? (await listUsers()).find((u) => u.id === viewerId)?.username ?? ''
    return getProfileView(viewerId, username)
  }, [params.username, viewerId])

  if (view === undefined) return <p className="muted pad">Loading…</p>
  if (view === null) return <p className="muted pad">No such user.</p>

  const { user, stats, isSelf } = view
  const earned = view.badges.filter((b) => b.earned).length
  const badges = view.badges.toSorted((a, b) => Number(b.earned) - Number(a.earned))

  return (
    <div className="profile">
      <header className="profile-head">
        <img className="avatar-lg" src={user.photoUrl} alt="" />
        <div>
          <h1>{user.displayName}</h1>
          <p className="handle">@{user.username}</p>
        </div>
      </header>
      {user.bio && <p className="bio">{user.bio}</p>}
      {(user.city || user.country) && <p className="muted">📍 {[user.city, user.country].filter(Boolean).join(', ')}</p>}

      <section>
        <h2>Café stats</h2>
        <div className="stats">
          <Stat n={stats.totalVisits} label="Visits" />
          <Stat n={stats.uniqueCafes} label="Cafés" />
          <Stat n={stats.uniqueCountries} label="Countries" />
          <Stat n={stats.totalConsumptions} label="Consumptions" />
          <Stat n={stats.uniqueItems} label="Unique items" />
          <Stat n={stats.maxRepeatsOfOneItem} label="Top repeat" />
        </div>
      </section>

      <section>
        <h2>Badge cabinet <span className="muted">{earned}/{view.badges.length}</span></h2>
        <div className="badges">{badges.map((b) => <Badge key={b.badge.id} p={b} />)}</div>
      </section>

      <section>
        <h2>Want to go</h2>
        {view.wantToGo.length === 0 && <p className="muted">Nothing saved yet.</p>}
        <div className="hscroll">
          {view.wantToGo.map(({ cafe, alsoWant }) => (
            <article key={cafe.id} className="cafe-card">
              <Link to={`/cafe/${cafe.id}`}><img src={cafe.coverPhotoUrl} alt="" /></Link>
              <div className="cafe-card-body">
                <Link to={`/cafe/${cafe.id}`} className="plain"><b>{cafe.name}</b></Link>
                <span className="muted">{cafe.area}, {cafe.city}</span>
                {alsoWant.length > 0 && (
                  <span className="overlap">
                    {isSelf ? 'You' : `@${user.username}`}
                    {alsoWant.map((u, i) => (
                      <span key={u.id}>{i === alsoWant.length - 1 ? ' and ' : ', '}<Link to={`/u/${u.username}`}>@{u.username}</Link></span>
                    ))}
                    {' '}want to go
                  </span>
                )}
                {isSelf && (
                  <button className="link-btn" onClick={() => toggleWantToGo(user.id, cafe.id)}>
                    Remove
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Recent visits</h2>
        {view.recentVisits.length === 0 && <p className="muted">No visits yet.</p>}
        <div className="visits">
          {view.recentVisits.map(({ visit, cafe, items, companions }) => (
            <article key={visit.id} className="visit">
              <div className="visit-photo">
                <img src={visit.photos[0].url} alt="" />
                {visit.photos.length > 1 && <span className="photo-count">1/{visit.photos.length}</span>}
                {visit.photos[0].menuItemId && <span className="photo-caption">{items.find((it) => it.id === visit.photos[0].menuItemId)?.name}</span>}
              </div>
              <div className="visit-body">
                <div className="visit-top">
                  <Link to={`/cafe/${cafe.id}`} className="plain"><b>{cafe.name}</b></Link>
                  {visit.rating && <span>{'★'.repeat(visit.rating)}</span>}
                </div>
                <span className="muted small">{cafe.city} · {fmtDate(visit.visitedAt)}</span>
                <Companions users={companions} />
                <p>{visit.text}</p>
                {visit.staffShoutout && <span className="small muted">🙌 Shout-out to {visit.staffShoutout.name}</span>}
                <div className="chips">
                  {items.map((it, i) => (
                    <span key={it.id} className="chip">{it.name}{visit.items[i].quantity > 1 && ` ×${visit.items[i].quantity}`}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {view.taggedVisits.length > 0 && (
        <section>
          <h2>{isSelf ? 'You were there too' : `@${user.username} was there too`}</h2>
          <div className="tagged">
            {view.taggedVisits.map(({ visit, cafe, author }) => (
              <Link key={visit.id} to={`/cafe/${cafe.id}`} className="tagged-row plain">
                <img src={visit.photos[0].url} alt="" />
                <span>
                  <b>{cafe.name}</b>
                  <span className="muted small">@{author.username} tagged {isSelf ? 'you' : `@${user.username}`} · {fmtDate(visit.visitedAt)}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return <div className="stat"><b>{n}</b><span>{label}</span></div>
}

function Badge({ p }: { p: BadgeProgress }) {
  const { badge, earned, current, target, award } = p
  return (
    <div className={`badge rarity-${badge.rarity} ${earned ? '' : 'badge-locked'}`} title={badge.description}>
      <div className="badge-icon">{badge.icon}</div>
      <b>{badge.name}</b>
      <span className="small muted">{badge.description}</span>
      {!earned && target !== undefined && current !== undefined && (
        <div className="progress"><div style={{ width: `${Math.min(100, (current / target) * 100)}%` }} /><span>{current}/{target}</span></div>
      )}
      {award?.status === 'pending_confirmation' && <span className="tag">Awaiting confirmation</span>}
      {award?.status === 'pending_review' && <span className="tag">In review</span>}
      <span className="tag tag-soft">{verificationLabel[badge.verification]} · {badge.rarity}</span>
    </div>
  )
}
