'use client';

import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { auth, db, isFirebaseReady } from '@/lib/firebase';
import type { AutomobileStationAccount } from '@/types/automobiles';

interface UseAutomobilesAuthResult {
  loading: boolean;
  user: User | null;
  account: AutomobileStationAccount | null;
  isAuthenticated: boolean;
  signOutAccount: () => Promise<void>;
}

export function useAutomobilesAuth(): UseAutomobilesAuthResult {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<AutomobileStationAccount | null>(null);

  useEffect(() => {
    if (!isFirebaseReady) {
      setLoading(false);
      setUser(null);
      setAccount(null);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);

      if (!nextUser) {
        setAccount(null);
        setLoading(false);
        return;
      }

      try {
        const accountRef = doc(db, 'automobile_station_accounts', nextUser.uid);
        const snap = await getDoc(accountRef);
        if (snap.exists()) {
          setAccount(snap.data() as AutomobileStationAccount);
        } else {
          setAccount(null);
        }
      } catch {
        setAccount(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signOutAccount = useCallback(async () => {
    if (!isFirebaseReady) return;
    await signOut(auth);
  }, []);

  const isAuthenticated = useMemo(() => Boolean(user && account), [account, user]);

  return {
    loading,
    user,
    account,
    isAuthenticated,
    signOutAccount,
  };
}
