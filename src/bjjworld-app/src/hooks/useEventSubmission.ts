import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api-client';
import { EventFormData, BackendBjjEventDto } from '../types/event';
import { mapEventFormDataToDto } from '../utils/dataMappers';

const postEvent = async (formData: EventFormData): Promise<BackendBjjEventDto> => {
  const apiPayload = mapEventFormDataToDto(formData);
  const response = await api.post<BackendBjjEventDto>('/api/bjjevent', apiPayload);
  return response.data;
};

export const useEventSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bjjEvents'] });
    },
  });
};