import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata: Metadata = {
  title: 'Sign Up - Dokani',
  description: 'Create a new Dokani account',
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 sm:px-6 lg:px-8 border-b">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/main_logo.svg"
              alt="Dokani"
              width={180}
              height={48}
              className="h-12 w-auto mx-auto"
            />
          </Link>
          <Link href="/auth/login" className="text-sm font-medium text-primary hover:underline">
            Already have an account?
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <AuthForm type="signup" />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 sm:px-6 lg:px-8 border-t bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-black">
            &copy; {new Date().getFullYear()} Dokani. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <Link href="/privacy" className="text-sm text-black hover:text-gray-900">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-black hover:text-gray-900">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}