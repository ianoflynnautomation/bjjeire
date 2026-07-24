import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, it, expect } from 'vitest'
import { GymsList } from './../gym-list'
import { createGym, resetGymIdCounter } from '@/testing/factories/gym.factory'
import { GymsPageTestIds } from '@/constants/gymDataTestIds'

describe('GymsList staggered reveal', () => {
  beforeEach(() => {
    resetGymIdCounter()
  })

  it('given a list of gyms, when rendered, then each item carries the rise-in animation with an incrementing stagger index', () => {
    const gyms = [
      createGym({ name: 'Alpha BJJ' }),
      createGym({ name: 'Bravo BJJ' }),
      createGym({ name: 'Charlie BJJ' }),
    ]

    render(<GymsList gyms={gyms} />)

    const list = screen.getByTestId(GymsPageTestIds.LIST)
    const items = within(list).getAllByRole('listitem')

    expect(items).toHaveLength(3)
    items.forEach((item, index) => {
      expect(item).toHaveClass('animate-rise')
      expect(item.style.getPropertyValue('--i')).toBe(String(index))
    })
  })
})
