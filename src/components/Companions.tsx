import { Link } from 'react-router-dom'
import type { User } from '../domain/types.ts'

/** "with @omar and @amara" */
export function Companions({ users }: { users: User[] }) {
  if (!users.length) return null
  return (
    <span className="small companions">
      with{' '}
      {users.map((u, i) => (
        <span key={u.id}>{i > 0 && (i === users.length - 1 ? ' and ' : ', ')}<Link to={`/u/${u.username}`}>@{u.username}</Link></span>
      ))}
    </span>
  )
}
