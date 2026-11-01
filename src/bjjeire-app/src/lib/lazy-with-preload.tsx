import { lazy, useState, type ComponentType, type JSX } from 'react'

export type PreloadableComponent = ComponentType & {
  preload: () => Promise<void>
}

/**
 * `React.lazy` plus a `preload()`. Once preloaded the component renders without
 * suspending, so no Suspense fallback commits. That also skips React's 300 ms
 * fallback throttle, which otherwise holds back the page and any fetch it starts.
 */
export function lazyWithPreload(
  load: () => Promise<{ default: ComponentType }>
): PreloadableComponent {
  const Lazy = lazy(load)
  let loaded: ComponentType | undefined

  function Preloadable(): JSX.Element {
    // Chosen once per mount: swapping the type later would remount and lose state.
    const [Component] = useState<ComponentType>(() => loaded ?? Lazy)
    return <Component />
  }

  Preloadable.preload = async (): Promise<void> => {
    const module = await load()
    loaded = module.default
  }

  return Preloadable
}
