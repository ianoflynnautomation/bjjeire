import { tournaments } from './tournaments'

export const registrations = {
  signUp: {
    documentTitle: 'Sign Up | BJJ Éire',
    headingPrefix: 'Sign up for',
    backLink: 'Back to the tournament',
    loadFailed: 'Failed to load the divisions you can enter. Please try again.',
    notOpen: 'Registration for this tournament is not open.',
    profileIncomplete:
      'Your competitor profile is missing details a sign-up needs. Complete it, then come back to this page.',
    profileLink: 'Complete my profile',
    underEighteen:
      'You must be 18 or over on the tournament day to compete in this tournament.',
    noDivisions:
      'No division of this tournament matches your gender, belt and age.',
    divisionsLegend: 'Choose your division',
    divisionsHint:
      'Only divisions for your gender and belt whose minimum age you reach on the tournament day are shown. Pick your own weight class.',
    divisionRequired: 'Choose a division.',
    feeLabel: 'Entry fee to pay now',
    feeNote:
      'Each division is a separate sign-up with its own fee. Your place is held for 30 minutes while you pay.',
    consentsLegend: 'Before you pay',
    acceptPublicListing:
      'I agree that my name, academy, affiliation and division are listed publicly on this tournament.',
    acceptTerms: 'I accept the terms of entry, including the liability waiver.',
    consentsRequired: 'Tick both boxes to continue.',
    submit: 'Continue to payment',
    submitting: 'Opening payment...',
    abandoned:
      'Your payment was not completed and nothing was charged. Your place is still held for a short while.',
    resume: 'Return to payment',
    resumeExpired:
      'This sign-up is no longer held. Choose a division to start again.',
    mySignUpsLink: 'My sign-ups',
  },
  problems: {
    'urn:bjjeire:registration-not-open':
      'Registration for this tournament is not open.',
    'urn:bjjeire:not-eligible':
      'This division is not open to you. Choose one of the divisions listed.',
    'urn:bjjeire:under-18':
      'You must be 18 or over on the tournament day to compete in this tournament.',
    'urn:bjjeire:already-registered':
      'You already have a sign-up in this division. You have not been charged again.',
    'urn:bjjeire:tournament-full':
      'This tournament is full. You have not been charged.',
    'urn:bjjeire:profile-incomplete':
      'Your competitor profile is missing details a sign-up needs. Complete it first.',
    'urn:bjjeire:too-many-unpaid':
      'You already have two unpaid sign-ups in this tournament. Pay for one first, or wait for its hold to end.',
    'urn:bjjeire:hold-expired':
      'This sign-up is no longer held. Choose a division to start again.',
    'urn:bjjeire:payment-received':
      'Your payment was received. Your sign-up is being confirmed and will show as confirmed shortly.',
    'urn:bjjeire:payment-unavailable':
      'Payment is unavailable right now. Nothing was charged; please try again shortly.',
    fallback: 'The sign-up could not be started. Please try again.',
  },
  complete: {
    documentTitle: 'Sign-Up Payment | BJJ Éire',
    checking: 'Confirming your payment...',
    confirmedHeading: 'You are signed up',
    confirmedMessage:
      'Your payment was received and your place is confirmed. A confirmation email is on its way.',
    pendingHeading: 'Waiting for your payment',
    pendingMessage:
      'We have not received confirmation of your payment yet. If you paid, this page updates by itself; you will also get an email once it is confirmed.',
    failedHeading: 'Payment not completed',
    failedMessage:
      'Your sign-up was not confirmed and nothing was charged. You can try again.',
    tryAgain: 'Try again',
    refundedHeading: 'Payment refunded',
    refundedMessage:
      'Your payment arrived after your place had been released and the tournament had no place left, so it was refunded in full to your original payment method. You are not signed up.',
    refundPendingMessage:
      'Your payment arrived after your place had been released and the tournament had no place left. A full refund is on its way to your original payment method. You are not signed up.',
    unknown:
      'We could not find this sign-up on your account. Check My sign-ups.',
    tournamentLink: 'Back to the tournament',
    mySignUpsLink: 'My sign-ups',
  },
  mine: {
    documentTitle: 'My Sign-Ups | BJJ Éire',
    heading: 'My sign-ups',
    intro: 'Every tournament division you have signed up for.',
    loadFailed: 'Failed to load your sign-ups. Please try again.',
    empty: 'You have not signed up for a tournament yet.',
    browseLink: 'See tournaments',
    tournamentColumn: 'Tournament',
    divisionColumn: 'Division',
    amountColumn: 'Amount',
    statusColumn: 'Status',
    removedDivision: 'Division no longer offered',
    unpaidNote: 'Unpaid, held until',
    statuses: {
      AWAITING_PAYMENT: 'Awaiting payment',
      CONFIRMED: 'Confirmed',
      CANCELLED: 'Cancelled',
      EXPIRED: 'Expired, not paid',
    },
    refunds: {
      PENDING: 'Refund pending',
      REFUNDED: 'Refunded',
      FAILED: 'Refund pending',
    },
    resume: 'Pay now',
  },
  competitors: {
    heading: 'Competitors',
    intro: 'Confirmed competitors, by division.',
    loadFailed: 'Failed to load the competitor list.',
    empty: 'No confirmed competitors yet.',
    noAcademy: 'No academy',
    countSingular: 'competitor',
    countPlural: 'competitors',
  },
  callToAction: {
    signUp: 'Sign up',
    mySignUps: 'My sign-ups',
  },
  disciplines: tournaments.disciplines,
  genders: tournaments.genders,
  ageCategories: tournaments.ageCategories,
  belts: tournaments.belts,
} as const
