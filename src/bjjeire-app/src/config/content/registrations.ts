import { bjjEireCompetitions } from './bjjeire-competitions'

export const registrations = {
  signUp: {
    documentTitle: 'Sign Up | BJJ Éire',
    headingPrefix: 'Sign up for',
    backLink: 'Back to the competition',
    loadFailed: 'Failed to load the divisions you can enter. Please try again.',
    notOpen: 'Registration for this competition is not open.',
    profileIncomplete:
      'Your competitor profile is missing details a sign-up needs. Complete it, then come back to this page.',
    profileLink: 'Complete my profile',
    underEighteen:
      'You must be 18 or over on the competition day to compete in this competition.',
    noDivisions:
      'No division of this competition matches your gender, belt and age.',
    divisionsLegend: 'Choose your division',
    divisionsHint:
      'Only divisions for your gender and belt whose minimum age you reach on the competition day are shown. Pick your own weight class.',
    divisionRequired: 'Choose a division.',
    feeLabel: 'Entry fee to pay now',
    feeNote:
      'Each division is a separate sign-up with its own fee. Your place is held for 30 minutes while you pay.',
    consentsLegend: 'Before you pay',
    acceptPublicListing:
      'I agree that my name, academy, affiliation and division are listed publicly on this competition.',
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
      'Registration for this competition is not open.',
    'urn:bjjeire:not-eligible':
      'This division is not open to you. Choose one of the divisions listed.',
    'urn:bjjeire:under-18':
      'You must be 18 or over on the competition day to compete in this competition.',
    'urn:bjjeire:already-registered':
      'You already have a sign-up in this division. You have not been charged again.',
    'urn:bjjeire:competition-full':
      'This competition is full. You have not been charged.',
    'urn:bjjeire:profile-incomplete':
      'Your competitor profile is missing details a sign-up needs. Complete it first.',
    'urn:bjjeire:too-many-unpaid':
      'You already have two unpaid sign-ups in this competition. Pay for one first, or wait for its hold to end.',
    'urn:bjjeire:hold-expired':
      'This sign-up is no longer held. Choose a division to start again.',
    'urn:bjjeire:payment-received':
      'Your payment was received. Your sign-up is being confirmed and will show as confirmed shortly.',
    'urn:bjjeire:registration-closed':
      'Registration has closed. To change division, contact the organiser.',
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
      'Your payment arrived after your place had been released and the competition had no place left, so it was refunded in full to your original payment method. You are not signed up.',
    refundPendingMessage:
      'Your payment arrived after your place had been released and the competition had no place left. A full refund is on its way to your original payment method. You are not signed up.',
    unknown:
      'We could not find this sign-up on your account. Check My sign-ups.',
    bjjEireCompetitionLink: 'Back to the competition',
    mySignUpsLink: 'My sign-ups',
  },
  mine: {
    documentTitle: 'My Sign-Ups | BJJ Éire',
    heading: 'My sign-ups',
    intro: 'Every competition division you have signed up for.',
    loadFailed: 'Failed to load your sign-ups. Please try again.',
    empty: 'You have not signed up for a competition yet.',
    browseLink: 'See competitions',
    bjjEireCompetitionColumn: 'Competition',
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
    actionsColumn: 'Actions',
    cancel: 'Cancel sign-up',
    refundWarningPrefix: 'You will be refunded',
    refundWarningSuffix: 'in full to your original payment method.',
    noRefundWarning:
      'Registration has closed, so no refund is due. You will be removed from the competitor list.',
    cancelConfirm: 'Yes, cancel my sign-up',
    keep: 'Keep my sign-up',
    cancelling: 'Cancelling...',
    cancelledRefundPrefix: 'Your sign-up is cancelled. A refund of',
    cancelledRefundSuffix: 'is on its way.',
    cancelledNoRefund: 'Your sign-up is cancelled. No refund was due.',
    cancelledRefundPending:
      'Your sign-up is cancelled. Your refund is pending and the organiser has been told.',
    changeDivision: 'Change division',
    changeDivisionLabel: 'New division',
    changeDivisionSave: 'Move to this division',
    changeDivisionNone:
      'There is no other division you can move to in this competition.',
    changeDivisionLoadFailed: 'Failed to load the divisions you can enter.',
    changed: 'Your sign-up was moved. There is no extra charge.',
    closedContactOrganiser:
      'Registration has closed. To change division, contact the organiser.',
    actionFailed: 'That did not work. Please try again.',
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
  disciplines: bjjEireCompetitions.disciplines,
  genders: bjjEireCompetitions.genders,
  ageCategories: bjjEireCompetitions.ageCategories,
  belts: bjjEireCompetitions.belts,
} as const
