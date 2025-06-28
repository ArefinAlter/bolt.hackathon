'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { signIn, signUp, createProfileIfMissing } from '@/lib/auth';
import { AuthFormData, SignUpFormData } from '@/types/auth';

// Form validation schemas
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const signupSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirm_password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  business_name: z.string().min(2, { message: 'Business name must be at least 2 characters' }).optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

interface AuthFormProps {
  type: 'login' | 'signup';
}

export function AuthForm({ type }: AuthFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const schema = type === 'login' ? loginSchema : signupSchema;
  
  const form = useForm<AuthFormData | SignUpFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      ...(type === 'signup' ? { confirm_password: '', business_name: '' } : {}),
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('=== AUTH FORM DEBUG ===');
      console.log('Form type:', type);
      console.log('Email:', form.getValues('email'));
      console.log('Password length:', form.getValues('password').length);
      
      let result;
      
      if (type === 'signup') {
        result = await supabase.auth.signUp({
          email: form.getValues('email'),
          password: form.getValues('password'),
          options: {
            emailRedirectTo: `${window.location.origin}/auth/login`,
          },
        });
        console.log('Signup result:', result);
      } else {
        result = await supabase.auth.signInWithPassword({
          email: form.getValues('email'),
          password: form.getValues('password'),
        });
        console.log('Signin result:', result);
      }

      if (result.error) {
        console.error('Auth error:', result.error);
        setError(result.error.message);
        setLoading(false);
        return;
      }

      if (result.data.user && result.data.session) {
        console.log('Auth successful, user:', result.data.user.email);
        console.log('Session access token:', result.data.session.access_token ? 'PRESENT' : 'MISSING');
        
        // Store session in localStorage as backup
        localStorage.setItem('supabase.auth.token', result.data.session.access_token);
        
        // Navigate to role selection
        console.log('Redirecting to role selection');
        router.push('/dashboard/role-selection');
      } else if (type === 'signup' && result.data.user && !result.data.session) {
        // Email confirmation required
        setMessage('Please check your email to confirm your account before signing in.');
        setLoading(false);
      } else {
        console.error('Unexpected auth result:', result);
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Auth form error:', error);
      setError('An error occurred during authentication. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-0">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {type === 'login' ? 'Sign In' : 'Create an Account'}
        </CardTitle>
        <CardDescription className="text-center">
          {type === 'login' 
            ? 'Enter your email and password to sign in to your account'
            : 'Enter your details to create a new account'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="name@example.com" 
                      type="email" 
                      autoComplete="email"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        placeholder="••••••••" 
                        type={showPassword ? "text" : "password"}
                        autoComplete={type === 'login' ? 'current-password' : 'new-password'}
                        {...field} 
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-black" />
                      ) : (
                        <Eye className="h-4 w-4 text-black" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {type === 'signup' && (
              <>
                <FormField
                  control={form.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input 
                            placeholder="••••••••" 
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            {...field} 
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-black" />
                          ) : (
                            <Eye className="h-4 w-4 text-black" />
                          )}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="business_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your Business Name" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-black font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {type === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                type === 'login' ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>
        </Form>
        
        {type === 'login' && (
          <div className="text-center mt-4">
            <Link 
              href="/auth/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-black">
          {type === 'login' ? (
            <>
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}