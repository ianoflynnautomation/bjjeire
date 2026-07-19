import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useNavigationState } from '@/hooks/useNavigationState'

describe('useNavigationState', () => {
  it('given a fresh hook, when it first renders, then the support modal and mobile menu are closed', () => {
    const { result } = renderHook(() => useNavigationState())

    expect(result.current.isSupportModalOpen).toBe(false)
    expect(result.current.isMobileMenuOpen).toBe(false)
  })

  it('given a closed support modal, when it is opened and closed, then the state follows each action', () => {
    const { result } = renderHook(() => useNavigationState())

    act(() => result.current.openSupportModal())
    expect(result.current.isSupportModalOpen).toBe(true)

    act(() => result.current.closeSupportModal())
    expect(result.current.isSupportModalOpen).toBe(false)
  })

  it('given a closed mobile menu, when it is toggled twice, then it opens and closes again', () => {
    const { result } = renderHook(() => useNavigationState())

    act(() => result.current.toggleMobileMenu())
    expect(result.current.isMobileMenuOpen).toBe(true)

    act(() => result.current.toggleMobileMenu())
    expect(result.current.isMobileMenuOpen).toBe(false)
  })

  it('given any mobile menu state, when close is called, then the menu is closed', () => {
    const { result } = renderHook(() => useNavigationState())

    act(() => result.current.closeMobileMenu())
    expect(result.current.isMobileMenuOpen).toBe(false)

    act(() => result.current.toggleMobileMenu())
    act(() => result.current.closeMobileMenu())
    expect(result.current.isMobileMenuOpen).toBe(false)
  })

  it('given both the modal and menu are used together, when one changes, then the other is unaffected', () => {
    const { result } = renderHook(() => useNavigationState())

    act(() => result.current.openSupportModal())
    act(() => result.current.toggleMobileMenu())
    act(() => result.current.closeSupportModal())

    expect(result.current.isSupportModalOpen).toBe(false)
    expect(result.current.isMobileMenuOpen).toBe(true)
  })
})
