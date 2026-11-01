import { useEffect } from 'react'

/** Names the page in the browser tab. React's own `<title>` would sit behind the one in `index.html`. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title
  }, [title])
}
