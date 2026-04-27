import React from 'react';
import { GlobalSosWatcher } from './GlobalSosWatcher';
import { IncomingSosOverlay } from '../components/IncomingSosOverlay';

/**
 * Root-level shell that mounts global watchers/overlays.
 * In React Native, this wraps the children passed to it.
 *
 * Place this inside the navigation container but above/around the navigators.
 */
export const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {/* Victim side: auto-route to SOS screen when this user has an active SOS */}
      <GlobalSosWatcher />
      {/* Helper side: Uber/Rapido-style popup for nearby emergencies */}
      <IncomingSosOverlay />
      {children}
    </>
  );
};
