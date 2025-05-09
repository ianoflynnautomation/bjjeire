import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api-client';
import { EventFormData, BackendBjjEventDto } from '../types/event';
import { mapEventFormDataToDto } from '../utils/dataMappers';

const postEvent = async (formData: EventFormData): Promise<BackendBjjEventDto> => {
  const apiPayload = mapEventFormDataToDto(formData);
  return api.post<BackendBjjEventDto>('/api/bjjevent', apiPayload);
};

export const useEventSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postEvent,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ['bjjEvents'] });
    },
    onError: (error) => {
      console.error('Event submission failed:', error);
    },
  });
};