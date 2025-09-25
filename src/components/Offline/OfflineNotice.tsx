// components/Offline/OfflineNotice.tsx
import { useOffline } from '@/hooks/useOffline';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineNotice() {
  const { isOnline, wasOffline } = useOffline();

  if (isOnline && !wasOffline) return null;

  return (
    <div
      className={`
        fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
        ${isOnline ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
      `}
    >
      {isOnline ? (
        <>
          <Wifi className="inline w-4 h-4 mr-2" />
          Back online
        </>
      ) : (
        <>
          <WifiOff className="inline w-4 h-4 mr-2" />
          You're offline
        </>
      )}
    </div>
  );
}