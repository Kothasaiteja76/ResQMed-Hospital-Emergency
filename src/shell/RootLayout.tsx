import { Outlet } from 'react-router-dom';
import { GlobalSosWatcher } from './GlobalSosWatcher';
import { IncomingSosOverlay } from '../components/IncomingSosOverlay';

export const RootLayout = () => {
  return (
    <div className="min-h-dvh bg-[#0a0b0f] text-white">
      {/* Victim side: auto-route to /app/sos when this user has an active SOS */}
      <GlobalSosWatcher />
      {/* Helper side: Uber/Rapido-style popup for nearby emergencies */}
      <IncomingSosOverlay />

      {/* Mobile-first frame on large screens */}
      <div className="mx-auto w-full max-w-lg min-h-dvh">
        <Outlet />
      </div>
    </div>
  );
};
