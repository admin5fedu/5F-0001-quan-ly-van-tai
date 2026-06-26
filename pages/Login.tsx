
import React, { useState, useMemo, useEffect } from 'react';
import { txt } from '../lib/text';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuthStore, useUIStore } from '../store/useStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { loginNameToSupabaseEmail } from '../lib/auth-email';
import { getAuthService } from '../lib/supabase/auth';
import { isMock } from '@/lib/data/config';

const AUTH_REMEMBER_KEY = 'auth-remember';

type LoginValues = {
  username: string;
  password: string;
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { companyInfo } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);

  const loginSchema = useMemo(() => z.object({
    username: z
      .string()
      .min(1, txt('page.login.usernameRequired'))
      .min(2, txt('page.login.usernameMin')),
    password: z.string().min(6, txt('page.login.passwordMin')),
  }), []);

  const initialUsername = useMemo(() => {
    if (typeof localStorage === 'undefined') return '';
    const remember = localStorage.getItem(AUTH_REMEMBER_KEY);
    if (remember === 'false') return '';
    return localStorage.getItem('auth_saved_username') || '';
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: isMock()
      ? { username: 'admin', password: '5fedu.com' }
      : {
          username: initialUsername,
          password: '',
        },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    const v = localStorage.getItem(AUTH_REMEMBER_KEY);
    return v === null || v === 'true';
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(AUTH_REMEMBER_KEY) === null) {
      localStorage.setItem(AUTH_REMEMBER_KEY, 'true');
    }
  }, []);

  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    localStorage.setItem(AUTH_REMEMBER_KEY, rememberMe ? 'true' : 'false');

    const username = data.username.trim();
    if (rememberMe) {
      localStorage.setItem('auth_saved_username', username);
    } else {
      localStorage.removeItem('auth_saved_username');
    }

    const result = await getAuthService().signIn({
      email: loginNameToSupabaseEmail(username),
      password: data.password,
    });

    setIsLoading(false);

    if ('error' in result) {
      toast.error(result.error);
      return;
    }

    login(result.user);
    toast.success(txt('page.login.loginSuccess'));
    navigate('/');
  };

  const handleRememberChange = (checked: boolean) => {
    setRememberMe(checked);
    localStorage.setItem(AUTH_REMEMBER_KEY, checked ? 'true' : 'false');
  };

  return (
    <div className="flex min-h-screen w-full bg-background items-center justify-center p-6 md:p-12 relative">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">{txt('page.login.welcome')}</h2>
          <p className="text-muted-foreground mt-2">{txt('page.login.welcomeDesc')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-4">
            <div>
              <Input
                label={txt('page.login.username')}
                type="text"
                autoComplete="username"
                placeholder={txt('page.login.usernamePlaceholder')}
                required
                {...register('username')}
                error={errors.username?.message}
                className="h-11"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none mb-2 block">{txt('page.login.password')}<span className="text-red-500 ml-0.5">*</span></label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={cn(
                    'flex h-11 w-full rounded-lg border bg-background pl-3 pr-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    errors.password ? 'border-destructive focus-visible:ring-destructive' : 'border-input'
                  )}
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? txt('page.login.hidePassword') : txt('page.login.showPassword')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-sm font-medium text-destructive mt-1">{errors.password.message}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => handleRememberChange(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
            <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">{txt('page.login.rememberMe')}</label>
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base shadow-lg shadow-primary/20"
            isLoading={isLoading}
          >
            {txt('page.login.loginButton')}
            {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
          </Button>
        </form>

      </motion.div>

      <div className="absolute bottom-6 text-center text-xs text-muted-foreground w-full left-0 px-4">
        {txt('page.login.copyright')} {companyInfo.companyName || txt('page.login.companyFallback')}. {txt('page.login.legal')}
      </div>
    </div>
  );
};

export default Login;
