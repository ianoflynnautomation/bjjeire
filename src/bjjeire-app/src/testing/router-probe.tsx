import type { JSX } from 'react'
import { useLocation, useNavigate } from 'react-router'

/** Exposes the router to integration tests: the current query string and a Back button. */
export function RouterProbe(): JSX.Element {
  const { search } = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <span data-testid="router-probe-search">{search}</span>
      <button type="button" onClick={() => void navigate(-1)}>
        Router back
      </button>
    </>
  )
}
