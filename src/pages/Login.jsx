import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fromUrl = searchParams.get('from_url') || '/dashboard';

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'verify'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

  const goHome = () => {
    try {
      const url = new URL(fromUrl, window.location.origin);
      navigate(url.pathname + url.search, { replace: true });
    } catch {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      goHome();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Login failed', description: 'Check your email and password and try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setMode('verify');
      toast({ title: 'Check your email', description: 'Enter the verification code we sent you.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Registration failed', description: error.message || 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.verifyOtp({ email, otpCode });
      await base44.auth.loginViaEmailPassword(email, password);
      goHome();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Verification failed', description: 'Check the code and try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider('google', fromUrl);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>The Binder</CardTitle>
          <CardDescription>
            {mode === 'login' && 'Log in to your account.'}
            {mode === 'register' && 'Create an account.'}
            {mode === 'verify' && 'Enter the code we emailed you.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode !== 'verify' ? (
            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-3">
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'login' ? 'Log in' : 'Create account'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-3">
              <div>
                <Label>Verification code</Label>
                <Input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} required autoFocus />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & log in'}
              </Button>
            </form>
          )}

          {mode !== 'verify' && (
            <>
              <Button variant="outline" className="w-full" onClick={handleGoogle} type="button">
                Continue with Google
              </Button>
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-sm text-blue-600 hover:underline w-full text-center"
              >
                {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
