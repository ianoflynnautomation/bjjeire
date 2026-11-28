import { uiContent } from '@/config/ui-content'
import type { DeliveryAddressDto, DeliveryCountry } from '@/types/orders'

const { validation } = uiContent.merch.checkout

/** What the shopper types at checkout (#6006, #6012). */
export interface CheckoutDetails {
  name: string
  email: string
  line1: string
  line2: string
  town: string
  county: string
  postcode: string
  country: DeliveryCountry
  phone: string
  acceptTerms: boolean
}

export type CheckoutField = keyof CheckoutDetails

export const EMPTY_DETAILS: CheckoutDetails = {
  name: '',
  email: '',
  line1: '',
  line2: '',
  town: '',
  county: '',
  postcode: '',
  country: 'IE',
  phone: '',
  acceptTerms: false,
}

/** The API's Eircode rule (research R3): a routing key and four characters. */
const EIRCODE = /^(?:[AC-FHKNPRTV-Y]\d{2}|D6W) ?[0-9AC-FHKNPRTV-Y]{4}$/u
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u

/** What is missing or wrong, by field; empty when the details can be sent. */
export function validateDetails(
  details: CheckoutDetails
): Partial<Record<CheckoutField, string>> {
  const errors: Partial<Record<CheckoutField, string>> = {}
  const blank = (value: string): boolean => value.trim() === ''
  if (blank(details.name) || details.name.length > 100) {
    errors.name = validation.name
  }
  if (!EMAIL.test(details.email.trim()) || details.email.length > 254) {
    errors.email = validation.email
  }
  if (blank(details.line1) || details.line1.length > 100) {
    errors.line1 = validation.line1
  }
  if (blank(details.town) || details.town.length > 60) {
    errors.town = validation.town
  }
  if (blank(details.county) || details.county.length > 60) {
    errors.county = validation.county
  }
  const postcode = details.postcode.trim().toUpperCase()
  if (details.country === 'GB' && !postcode.startsWith('BT')) {
    errors.postcode = validation.postcodeNi
  }
  if (details.country === 'IE' && postcode !== '' && !EIRCODE.test(postcode)) {
    errors.postcode = validation.postcodeIe
  }
  if (!details.acceptTerms) {
    errors.acceptTerms = validation.terms
  }
  return errors
}

function optional(value: string): string | null {
  return value.trim() === '' ? null : value.trim()
}

export function toAddress(details: CheckoutDetails): DeliveryAddressDto {
  return {
    name: details.name.trim(),
    line1: details.line1.trim(),
    line2: optional(details.line2),
    town: details.town.trim(),
    county: details.county.trim(),
    postcode: optional(details.postcode.toUpperCase()),
    country: details.country,
    phone: optional(details.phone),
  }
}
