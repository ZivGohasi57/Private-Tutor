import { useState } from 'react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError('שגיאה בהתחברות: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-sm" dir="rtl">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-lg shadow-indigo-300/40 dark:shadow-indigo-900/30 mb-5">
            <span className="text-2xl font-black text-white">ז</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {isSignUp ? 'יצירת חשבון' : 'ניהול עבודה'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {isSignUp ? 'צור משתמש חדש לניהול העסק' : 'התחבר לניהול השיעורים שלך'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-none border border-slate-100 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input type="email" label="אימייל" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" label="סיסמה" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && (
              <p className="text-rose-600 dark:text-rose-400 text-xs font-bold bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl border border-rose-100 dark:border-rose-800/50">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'מתחבר...' : (isSignUp ? 'הרשמה' : 'כניסה')}
            </Button>
          </form>
        </div>

        <p className="text-center mt-5 text-sm text-slate-500 dark:text-slate-400">
          {isSignUp ? 'כבר רשום?' : 'אין לך משתמש?'}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            {isSignUp ? 'התחבר' : 'הירשם'}
          </button>
        </p>

      </div>
    </div>
  );
}
