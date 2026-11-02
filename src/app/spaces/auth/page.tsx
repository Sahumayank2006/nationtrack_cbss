'use client';

import { getIdToken, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { Building2, Loader2, LogIn, UserPlus } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { auth } from '@/lib/firebase';

import type { Space } from '@/types/spaces';
import type { FormEvent } from 'react';

interface SpacesResponse {
  success: boolean;
  data: Space[];
}

interface AuthResponse {
  ok: boolean;
  message?: string;
}

const normalize = (value: string) => value.trim().toLowerCase();

export default function SpacesAuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [spaces, setSpaces] = useState<Array<{ id: string; name: string }>>([]);
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [openSpaceName, setOpenSpaceName] = useState('');

  useEffect(() => {
    const loadSpaces = async () => {
      const response = await fetch('/api/spaces', { cache: 'no-store' });
      const payload = (await response.json()) as SpacesResponse;
      if (payload.success) {
        setSpaces(payload.data.map((space) => ({ id: space.id, name: space.name })));
      }
    };

    const clearExistingSession = async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      await signOut(auth).catch(() => undefined);
    };

    void Promise.all([loadSpaces(), clearExistingSession()]);
  }, []);

  const isRegisteredSpace = useMemo(() => {
    if (!openSpaceName.trim()) return false;
    return spaces.some((space) => normalize(space.name) === normalize(openSpaceName));
  }, [openSpaceName, spaces]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus('Signing you in...');

    try {
      const credentials = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      const idToken = await getIdToken(credentials.user, true);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const payload = (await response.json()) as AuthResponse;
      if (!response.ok || !payload.ok) {
        setStatus(payload.message ?? 'Unable to sign in.');
        return;
      }

      setStatus('Signed in successfully. Redirecting...');
      window.location.href = '/spaces';
    } catch {
      setStatus('Invalid email or password, or your account is not linked to a registered space.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isRegisteredSpace) {
      setStatus('Please choose a valid registered open space name from the list.');
      return;
    }

    setIsSubmitting(true);
    setStatus('Creating your account...');

    try {
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: signupEmail.trim(),
          password: signupPassword,
          openSpaceName: openSpaceName.trim(),
        }),
      });

      const signupPayload = (await signupResponse.json()) as AuthResponse;
      if (!signupResponse.ok || !signupPayload.ok) {
        setStatus(signupPayload.message ?? 'Unable to create account.');
        return;
      }

      const credentials = await signInWithEmailAndPassword(
        auth,
        signupEmail.trim(),
        signupPassword
      );
      await updateProfile(credentials.user, { displayName: name.trim() });
      const idToken = await getIdToken(credentials.user, true);

      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const loginPayload = (await loginResponse.json()) as AuthResponse;
      if (!loginResponse.ok || !loginPayload.ok) {
        setStatus(
          loginPayload.message ?? 'Account created but auto sign-in failed. Please sign in.'
        );
        return;
      }

      setStatus('Account created successfully. Redirecting to your open space dashboard...');
      window.location.href = '/spaces';
    } catch {
      setStatus('Unable to complete signup. Please verify details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      id="maincontent"
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-slate-100 px-4 py-10"
    >
      <div
        className="pointer-events-none absolute -left-24 top-[-6rem] h-64 w-64 rounded-full bg-emerald-300/40 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-[-7rem] h-72 w-72 rounded-full bg-sky-300/35 blur-3xl"
        aria-hidden
      />

      <section className="relative z-10 w-full max-w-5xl rounded-3xl border border-slate-300 bg-white shadow-2xl">
        <div className="grid md:grid-cols-2">
          <aside className="rounded-t-3xl bg-slate-900 p-8 text-slate-100 md:rounded-l-3xl md:rounded-tr-none">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-200">
              Open Space Booking
            </div>

            <div className="flex items-center gap-3">
              <Image
                src="/NationTrack.png"
                alt="NationTrack logo"
                width={40}
                height={40}
                priority
              />
              <h1 className="text-2xl font-bold">NationTrack Spaces</h1>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-300">
              Secure sign in for registered open space owners and administrators. Each account is
              linked to one registered space and opens the same existing dashboard with isolated
              data.
            </p>

            <ul className="mt-8 space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <Building2 className="mt-0.5 h-4 w-4 text-emerald-300" aria-hidden />
                Space-linked access for registered open spaces
              </li>
              <li className="flex items-start gap-2">
                <LogIn className="mt-0.5 h-4 w-4 text-emerald-300" aria-hidden />
                Redirects to current spaces dashboard after login
              </li>
              <li className="flex items-start gap-2">
                <UserPlus className="mt-0.5 h-4 w-4 text-emerald-300" aria-hidden />
                Credentials saved in Firebase Auth and profile mapping in Firestore
              </li>
            </ul>
          </aside>

          <div className="p-8 md:p-10">
            <div className="mb-6 flex items-center gap-2 rounded-full bg-slate-100 p-1">
              <button
                type="button"
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mode === 'login' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200'
                }`}
                onClick={() => setMode('login')}
              >
                Login
              </button>
              <button
                type="button"
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mode === 'signup'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
                onClick={() => setMode('signup')}
              >
                Signup
              </button>
            </div>

            {mode === 'login' ? (
              <form className="space-y-4" onSubmit={handleLogin}>
                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-1.5 block text-sm font-medium text-slate-900"
                  >
                    Email address
                  </label>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    placeholder="owner@department.gov.in"
                  />
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="mb-1.5 block text-sm font-medium text-slate-900"
                  >
                    Password
                  </label>
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    placeholder="Enter your password"
                  />
                </div>

                <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                  Sign In
                </Button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleSignup}>
                <div>
                  <label
                    htmlFor="signup-name"
                    className="mb-1.5 block text-sm font-medium text-slate-900"
                  >
                    Full name
                  </label>
                  <Input
                    id="signup-name"
                    type="text"
                    autoComplete="name"
                    required
                    minLength={2}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Officer name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-email"
                    className="mb-1.5 block text-sm font-medium text-slate-900"
                  >
                    Email address
                  </label>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={signupEmail}
                    onChange={(event) => setSignupEmail(event.target.value)}
                    placeholder="owner@department.gov.in"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-password"
                    className="mb-1.5 block text-sm font-medium text-slate-900"
                  >
                    Password
                  </label>
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={signupPassword}
                    onChange={(event) => setSignupPassword(event.target.value)}
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div>
                  <label
                    htmlFor="open-space-name"
                    className="mb-1.5 block text-sm font-medium text-slate-900"
                  >
                    Registered Open Space Name
                  </label>
                  <Input
                    id="open-space-name"
                    list="registered-space-list"
                    type="text"
                    required
                    value={openSpaceName}
                    onChange={(event) => setOpenSpaceName(event.target.value)}
                    placeholder="Select or type exactly as registered"
                    aria-describedby="open-space-help"
                  />
                  <datalist id="registered-space-list">
                    {spaces.map((space) => (
                      <option key={space.id} value={space.name} />
                    ))}
                  </datalist>
                  <p id="open-space-help" className="mt-1 text-xs text-slate-600">
                    Only already registered open spaces are allowed.
                  </p>
                </div>

                <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                  Create Account
                </Button>
              </form>
            )}

            <p className="mt-4 min-h-6 text-sm text-slate-700" role="status" aria-live="polite">
              {status}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
