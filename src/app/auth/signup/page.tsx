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
      <header className="py-6 px-4 sm:px-6 lg:px-8 border-b bg-white">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/main_logo.svg"
              alt="Dokani"
              width={180}
              height={48}
              className="h-12 w-auto"
            />
          </Link>
          <Link href="/auth/login" className="text-sm font-medium text-primary hover:underline">
            Already have an account?
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex">
        {/* Left side - Image and Info */}
        <div className="hidden lg:flex lg:w-1/2 bg-white relative">
          {/* Content */}
          <div className="flex flex-col justify-center p-12 w-full">
            <div className="max-w-md mx-auto text-center">
              <h1 className="text-4xl font-bold mb-6 text-gray-900">
                Transform Your Returns with AI
              </h1>
              <p className="text-xl mb-8 text-gray-600">
                Join thousands of businesses using Dokani to streamline their return processes with intelligent automation.
              </p>
              
              {/* Image */}
              <div className="relative w-3/5 h-64 mx-auto">
                <Image
                  src="/auth_page.jpg"
                  alt="Dokani Platform"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
              <p className="text-gray-600">
                Join thousands of businesses using Dokani
              </p>
            </div>
            
            <AuthForm type="signup" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 sm:px-6 lg:px-8 border-t bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} Dokani. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}