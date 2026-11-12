import { describe, expect, it } from 'vitest'
import type { GymDto } from '@/types/gyms'
import { createGym } from '@/testing/factories/gym.factory'
import { toGymPins } from '../gym-pins'

function gymAt(coordinates: unknown): GymDto {
  return createGym({
    location: {
      address: '1 Test Street',
      coordinates: { type: 'Point', coordinates },
    } as unknown as GymDto['location'],
  })
}

describe('toGymPins (#1009)', () => {
  it('given GeoJSON [lng, lat], when converted, then latitude and longitude are not swapped', () => {
    const { pins, unmappedCount } = toGymPins([gymAt([-8.47, 51.9])])

    expect(pins).toHaveLength(1)
    expect(pins[0]?.latitude).toBe(51.9)
    expect(pins[0]?.longitude).toBe(-8.47)
    expect(unmappedCount).toBe(0)
  })

  it.each([
    ['null', null],
    ['an empty pair', []],
    ['one number', [-6.26]],
    ['strings', ['-6.26', '53.33']],
    ['NaN', [Number.NaN, 53.33]],
    ['a latitude out of range', [-6.26, 95]],
    ['a longitude out of range', [190, 53.33]],
    ['the 0,0 placeholder', [0, 0]],
  ])(
    'given %s, when converted, then the gym has no pin and is counted',
    (_, value) => {
      const { pins, unmappedCount } = toGymPins([gymAt(value)])

      expect(pins).toEqual([])
      expect(unmappedCount).toBe(1)
    }
  )

  it('given a gym with no location at all, when converted, then it is counted and does not throw', () => {
    const gym = { ...createGym(), location: undefined } as unknown as GymDto

    expect(toGymPins([gym]).unmappedCount).toBe(1)
  })

  it('given a mix, when converted, then only usable gyms have pins', () => {
    const { pins, unmappedCount } = toGymPins([
      gymAt([-6.26, 53.33]),
      gymAt(null),
      gymAt([-9.05, 53.27]),
    ])

    expect(pins).toHaveLength(2)
    expect(unmappedCount).toBe(1)
  })
})
