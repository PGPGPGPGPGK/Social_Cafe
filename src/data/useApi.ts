import { useEffect, useState } from 'react'
import { dataChanged } from './api.ts'

/** Runs an api loader and re-runs it whenever the data layer reports a write.
 *  `undefined` = loading. `deps` works like useEffect deps (put the loader's inputs there). */
export function useApi<T>(load: () => Promise<T>, deps: unknown[]): T | undefined {
  const [data, setData] = useState<T>()
  useEffect(() => {
    let live = true
    const run = () => { load().then((d) => { if (live) setData(d) }) }
    run()
    dataChanged.addEventListener('change', run)
    return () => { live = false; dataChanged.removeEventListener('change', run) }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller owns deps, like useEffect
  }, deps)
  return data
}
