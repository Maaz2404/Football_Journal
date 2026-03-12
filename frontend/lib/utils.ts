import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Timezone-aware date formatting utilities that handle SSR properly
export function formatMatchDateTimeWithTimezone(utcDateString: string) {
    // For SSR compatibility, return placeholder values when running on server
    if (typeof window === 'undefined') {
        return {
            date: '--',
            time: '--:--',
            timezone: '',
            fullDateTime: 'Loading...'
        };
    }
    
    const date = new Date(utcDateString);
    const userTimezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const shortTimezone = userTimezoneName.split('/').pop() || '';
    
    return {
        date: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timezone: shortTimezone,
        fullDateTime: date.toLocaleString([], { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            timeZoneName: 'short'
        })
    };
}

export function formatMatchTime(utcDateString: string): { date: string; time: string; isClientSide: boolean } {
  // Return placeholder values if running on server (SSR)
  if (typeof window === 'undefined') {
    return {
      date: '--',
      time: '--:--',
      isClientSide: false
    };
  }
  
  // Client-side: properly convert to user's local timezone
  const date = new Date(utcDateString);
  return {
    date: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
    time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isClientSide: true
  };
}

export function formatMatchDateTime(utcDateString: string): string {
  if (typeof window === 'undefined') {
    return 'Loading...';
  }
  
  const date = new Date(utcDateString);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
            timeZoneName: 'short'
        })
    };
}

export function formatMatchDateTimeWithTimezone(utcDateString: string) {
    const date = new Date(utcDateString);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    return {
        date: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timezone: date.toLocaleTimeString([], { timeZoneName: 'short' }).split(' ').pop(),
        fullDisplay: `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}`,
        userTimezone: timeZone
    };
}
