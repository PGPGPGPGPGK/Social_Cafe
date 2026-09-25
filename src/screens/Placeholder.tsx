export default function Placeholder({ title, lines }: { title: string; lines: string[] }) {
  return (
    <section className="placeholder">
      <h1>{title}</h1>
      {lines.length > 0 && <p className="muted">Coming next:</p>}
      <ul>{lines.map((l) => <li key={l}>{l}</li>)}</ul>
    </section>
  )
}
