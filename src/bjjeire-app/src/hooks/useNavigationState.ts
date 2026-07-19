import { useState, useCallback } from 'react'

interface NavigationState {
  isSupportModalOpen: boolean
  isMobileMenuOpen: boolean
  openSupportModal: () => void
  closeSupportModal: () => void
  toggleMobileMenu: () => void
  closeMobileMenu: () => void
}

export function useNavigationState(): NavigationState {
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const openSupportModal = useCallback(() => setIsSupportModalOpen(true), [])
  const closeSupportModal = useCallback(() => setIsSupportModalOpen(false), [])
  const toggleMobileMenu = useCallback(
    () => setIsMobileMenuOpen(prev => !prev),
    []
  )
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), [])

  return {
    isSupportModalOpen,
    isMobileMenuOpen,
    openSupportModal,
    closeSupportModal,
    toggleMobileMenu,
    closeMobileMenu,
  }
}
