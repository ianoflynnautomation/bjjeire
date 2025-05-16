import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postEvent } from '../api/get-bjj-events';

export const useEventSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bjjEvents'] });
    },
    onError: (error) => {
      console.error('Event submission failed:', error);
    },
  });
};  