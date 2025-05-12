import React from 'react'
import clsx from 'clsx'
import { EventFormTestIds } from './eventForm.testIds'

interface FormActionsProps {
  onClose: () => void
  isSubmitting: boolean
  isEditMode: boolean
  canSubmit: boolean
}

export const FormActions: React.FC<FormActionsProps> = ({
  onClose,
  isSubmitting,
  isEditMode,
  canSubmit,
}) => {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 mt-6">
      <button
        type="button"
        onClick={onClose}
        className="rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-slate-800 disabled:opacity-50"
        disabled={isSubmitting}
        data-testid={EventFormTestIds.CANCEL_BUTTON}
      >
        Cancel
      </button>
      <button
        type="submit"
        className={clsx(
          'rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed',
          isSubmitting
            ? 'bg-slate-400 dark:bg-slate-600'
            : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 dark:from-emerald-500 dark:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-700'
        )}
        disabled={isSubmitting || !canSubmit} // Disable if submitting OR if validation fails (e.g., no hours)
        data-testid={EventFormTestIds.SUBMIT_BUTTON}
      >
        {isSubmitting ? 'Submitting...' : isEditMode ? 'Save Changes' : 'Submit for Review'}
      </button>
    </div>
  )
}
