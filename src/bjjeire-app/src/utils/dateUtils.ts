
import { format, parseISO } from 'date-fns';

export const formatTime = (time: string): string => {
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return format(date, 'h:mm a');
  } catch {
    return time;
  }
};

export const formatDate = (date: string): string => {
  try {
    return format(parseISO(date), 'MMMM d, yyyy');
  } catch {
    return date;
  }
};