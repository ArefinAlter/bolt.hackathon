'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, User } from 'lucide-react';
import { UserRole } from '@/types/auth';

interface RoleSelectionCardProps {
  onRoleSelect: (role: UserRole) => void;
}

export function RoleSelectionCard({ onRoleSelect }: RoleSelectionCardProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelection = async (role: UserRole) => {
    setSelectedRole(role);
    setIsLoading(true);
    
    try {
      // Store the selected role in localStorage for persistence
      localStorage.setItem('userRole', role);
      
      // Call the callback function
      onRoleSelect(role);
      
      // Redirect based on role
      if (role === 'business') {
        router.push('/dashboard');
      } else {
        router.push('/return');
      }
    } catch (error) {
      console.error('Error setting user role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-0">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          Choose Your Experience
        </CardTitle>
        <CardDescription>
          Select how you'd like to try out our product
        </CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6 p-6">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedRole === 'business' ? 'ring-2 ring-primary' : 'hover:border-primary/50'
          }`}
          onClick={() => handleRoleSelection('business')}
        >
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Business</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-gray-600">
            <p>Try out our product as a business owner managing returns</p>
          </CardContent>
          <CardFooter className="pt-0 justify-center">
            <Button 
              variant="outline" 
              className="border-primary text-primary hover:bg-primary/10"
              onClick={() => handleRoleSelection('business')}
              disabled={isLoading}
            >
              Select Business View
            </Button>
          </CardFooter>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedRole === 'customer' ? 'ring-2 ring-primary' : 'hover:border-primary/50'
          }`}
          onClick={() => handleRoleSelection('customer')}
        >
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Customer</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-gray-600">
            <p>Experience our product as a customer making a return request</p>
          </CardContent>
          <CardFooter className="pt-0 justify-center">
            <Button 
              variant="outline" 
              className="border-primary text-primary hover:bg-primary/10"
              onClick={() => handleRoleSelection('customer')}
              disabled={isLoading}
            >
              Select Customer View
            </Button>
          </CardFooter>
        </Card>
      </CardContent>
      <CardFooter className="text-center text-sm text-gray-500 pb-6">
        <p className="mx-auto">
          You can switch between views at any time from the dashboard
        </p>
      </CardFooter>
    </Card>
  );
}