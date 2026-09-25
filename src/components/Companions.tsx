import { Link } from 'react-router-dom'
import type { User } from '../domain/types.ts'

/** "with @omar and @amara +1 other". Hidden = private companions the viewer may not see. */
export function Companions({ users, hidden }: { users: User[]; hidden: number }) {
  if (!users.length && !hidden) return null
  return (
    <span className="small companions">
      with{' '}
      {users.map((u, i) => (
        <span key={u.id}>{i > 0 && (i === users.length - 1 && !hidden ? ' and ' : ', ')}<Link to={`/u/${u.username}`}>@{u.username}</Link></span>
      ))}
      {hidden > 0 && `${users.length ? ' +' : ''}${hidden} other${hidden > 1 ? 's' : ''}`}
    </span>
  )
}
