import React, { useState, useRef } from 'react';
import { useAppStore } from './store';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowRight, CheckCircle2, Loader2, Image as ImageIcon, AtSign } from 'lucide-react';

export const Auth: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register' | 'verify' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Файл слишком большой (макс. 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.startsWith('@')) {
      setError('Имя пользователя должно начинаться с @');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, username, avatar }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMode('verify');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAuth(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAuth(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMode('reset');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMode('login');
      setPassword('');
      setCode('');
      setError('Пароль успешно изменен. Теперь вы можете войти.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (mode === 'login') handleLogin(e);
    else if (mode === 'register') handleRegister(e);
    else if (mode === 'verify') handleVerify(e);
    else if (mode === 'forgot') handleForgot(e);
    else if (mode === 'reset') handleReset(e);
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-gradient-to-br from-emerald-500/20 to-blue-500/20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass p-8 rounded-[2rem] shadow-2xl relative overflow-hidden"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex justify-center mb-6"
          >
            <img src="/favicon2.png" alt="Liime Logo" className="h-16 object-contain" />
          </motion.div>
          <p className="text-[var(--text-secondary)] mt-2">
            {mode === 'login' ? 'С возвращением!' : 
             mode === 'register' ? 'Создать аккаунт' : 
             mode === 'verify' ? 'Подтвердите email' :
             mode === 'forgot' ? 'Восстановление пароля' : 'Новый пароль'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.div
                key="register-fields"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="flex flex-col items-center justify-center mb-4 gap-2">
                  {avatar && (
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
                      <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-sm text-[var(--accent)] hover:text-emerald-400 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                    {avatar ? 'Изменить аватар' : 'Загрузить аватар'}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                  <input
                    required
                    type="text"
                    placeholder="Отображаемое имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border-color)] rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                  <input
                    required
                    type="text"
                    placeholder="@username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.startsWith('@') ? e.target.value : '@' + e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border-color)] rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </motion.div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
              <motion.div key="email-field" className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                <input
                  required
                  type="email"
                  placeholder="Email адрес"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border-color)] rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </motion.div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'reset') && (
              <motion.div key="password-field" className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                <input
                  required
                  type="password"
                  placeholder={mode === 'reset' ? "Новый пароль" : "Пароль"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border-color)] rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </motion.div>
            )}

            {(mode === 'verify' || mode === 'reset') && (
              <motion.div
                key="verify-field"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative"
              >
                <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                <input
                  required
                  type="text"
                  placeholder="Код подтверждения"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border-color)] rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-center tracking-[1em] font-bold text-xl"
                  maxLength={6}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className={`text-sm text-center ${error.includes('успешно') ? 'text-emerald-500' : 'text-red-500'}`}
            >
              {error}
            </motion.p>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {mode === 'login' ? 'Войти' : 
                 mode === 'register' ? 'Создать аккаунт' : 
                 mode === 'forgot' ? 'Отправить код' :
                 mode === 'reset' ? 'Сменить пароль' : 'Подтвердить'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center space-y-2">
          {mode === 'login' && (
            <button
              onClick={() => setMode('forgot')}
              className="block w-full text-sm text-[var(--text-secondary)] hover:text-emerald-500 transition-colors"
            >
              Забыли пароль?
            </button>
          )}
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="block w-full text-sm text-[var(--text-secondary)] hover:text-emerald-500 transition-colors"
          >
            {mode === 'login' ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
          </button>
        </div>
        <div className="mt-8 text-center text-xs text-[var(--text-secondary)] opacity-70">
          Разработано ChromeTech<br/>при помощи Google Gemini
        </div>
      </motion.div>
    </div>
  );
};
