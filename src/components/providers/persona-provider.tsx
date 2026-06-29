'use client';

import { createContext, useContext, useEffect } from 'react';
import { useIdentity, useUsers } from '@/lib/api/hooks';
import type { User } from '@/lib/api/types';

export type Persona = 'developer' | 'admin';

export const PERSONA_STORAGE_KEY = 'ascendra:persona';

/** Default landing route for each persona. */
export const PERSONA_HOME: Record<Persona, string> = {
  developer: '/my-machines',
  admin: '/fleet',
};

interface PersonaContextValue {
  persona: Persona;
  /** The user whose perspective the current persona represents. */
  activeUser: User | undefined;
  developerUser: User | undefined;
  adminUser: User | undefined;
  isLoading: boolean;
}

const PersonaContext = createContext<PersonaContextValue | null>(null);

/**
 * Provides the active persona (derived from the route group) plus the resolved
 * "current user" for that persona. There is no real auth — the persona switcher
 * just swaps perspective. The choice is persisted so the root route can redirect
 * to the last-used persona.
 */
export function PersonaProvider({
  persona,
  children,
}: {
  persona: Persona;
  children: React.ReactNode;
}) {
  const identity = useIdentity();
  const users = useUsers();

  useEffect(() => {
    try {
      localStorage.setItem(PERSONA_STORAGE_KEY, persona);
    } catch {
      // ignore storage failures (private mode etc.)
    }
    // Mirror the persona onto <body> so portaled surfaces (dialogs, selects,
    // dropdowns) — which mount outside the AppShell wrapper — still inherit the
    // persona accent colour.
    document.body.dataset.persona = persona;
    return () => {
      delete document.body.dataset.persona;
    };
  }, [persona]);

  const byId = (id?: string) => users.data?.find((u) => u.id === id);
  const developerUser = byId(identity.data?.currentDeveloperId);
  const adminUser = byId(identity.data?.currentAdminId);
  const activeUser = persona === 'developer' ? developerUser : adminUser;

  const value: PersonaContextValue = {
    persona,
    activeUser,
    developerUser,
    adminUser,
    isLoading: identity.isLoading || users.isLoading,
  };

  return (
    <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>
  );
}

export function usePersona(): PersonaContextValue {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error('usePersona must be used within PersonaProvider');
  return ctx;
}
