import React from 'react';
import { cn } from '@/lib/utils';

// Grid Container Component
interface GridProps {
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: {
    sm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    xl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  };
}

export function Grid({ 
  children, 
  className, 
  cols = 12, 
  gap = 'md',
  responsive 
}: GridProps) {
  const gapClasses = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const gridClasses = [
    'grid',
    `grid-cols-${cols}`,
    gapClasses[gap],
    responsive?.sm && `sm:grid-cols-${responsive.sm}`,
    responsive?.md && `md:grid-cols-${responsive.md}`,
    responsive?.lg && `lg:grid-cols-${responsive.lg}`,
    responsive?.xl && `xl:grid-cols-${responsive.xl}`,
    className
  ].filter(Boolean);

  return (
    <div className={cn(gridClasses)}>
      {children}
    </div>
  );
}

// Grid Item Component
interface GridItemProps {
  children: React.ReactNode;
  className?: string;
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  responsive?: {
    sm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    xl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  };
}

export function GridItem({ 
  children, 
  className, 
  span = 12,
  responsive 
}: GridItemProps) {
  const itemClasses = [
    `col-span-${span}`,
    responsive?.sm && `sm:col-span-${responsive.sm}`,
    responsive?.md && `md:col-span-${responsive.md}`,
    responsive?.lg && `lg:col-span-${responsive.lg}`,
    responsive?.xl && `xl:col-span-${responsive.xl}`,
    className
  ].filter(Boolean);

  return (
    <div className={cn(itemClasses)}>
      {children}
    </div>
  );
}

// Flex Container Component
interface FlexProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: {
    sm?: {
      direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
      wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
      justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
      align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
    };
    md?: {
      direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
      wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
      justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
      align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
    };
    lg?: {
      direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
      wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
      justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
      align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
    };
    xl?: {
      direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
      wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
      justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
      align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
    };
  };
}

export function Flex({ 
  children, 
  className, 
  direction = 'row',
  wrap = 'nowrap',
  justify = 'start',
  align = 'start',
  gap = 'md',
  responsive 
}: FlexProps) {
  const gapClasses = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const flexClasses = [
    'flex',
    `flex-${direction}`,
    `flex-${wrap}`,
    `justify-${justify}`,
    `items-${align}`,
    gapClasses[gap],
    responsive?.sm && responsive.sm.direction && `sm:flex-${responsive.sm.direction}`,
    responsive?.sm && responsive.sm.wrap && `sm:flex-${responsive.sm.wrap}`,
    responsive?.sm && responsive.sm.justify && `sm:justify-${responsive.sm.justify}`,
    responsive?.sm && responsive.sm.align && `sm:items-${responsive.sm.align}`,
    responsive?.md && responsive.md.direction && `md:flex-${responsive.md.direction}`,
    responsive?.md && responsive.md.wrap && `md:flex-${responsive.md.wrap}`,
    responsive?.md && responsive.md.justify && `md:justify-${responsive.md.justify}`,
    responsive?.md && responsive.md.align && `md:items-${responsive.md.align}`,
    responsive?.lg && responsive.lg.direction && `lg:flex-${responsive.lg.direction}`,
    responsive?.lg && responsive.lg.wrap && `lg:flex-${responsive.lg.wrap}`,
    responsive?.lg && responsive.lg.justify && `lg:justify-${responsive.lg.justify}`,
    responsive?.lg && responsive.lg.align && `lg:items-${responsive.lg.align}`,
    responsive?.xl && responsive.xl.direction && `xl:flex-${responsive.xl.direction}`,
    responsive?.xl && responsive.xl.wrap && `xl:flex-${responsive.xl.wrap}`,
    responsive?.xl && responsive.xl.justify && `xl:justify-${responsive.xl.justify}`,
    responsive?.xl && responsive.xl.align && `xl:items-${responsive.xl.align}`,
    className
  ].filter(Boolean);

  return (
    <div className={cn(flexClasses)}>
      {children}
    </div>
  );
}

// Container Component for consistent spacing
interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export function Container({ 
  children, 
  className, 
  size = 'lg',
  padding = 'md'
}: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    full: 'max-w-full'
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4',
    md: 'px-6',
    lg: 'px-8',
    xl: 'px-12'
  };

  const containerClasses = [
    'mx-auto',
    'w-full',
    sizeClasses[size],
    paddingClasses[padding],
    className
  ].filter(Boolean);

  return (
    <div className={cn(containerClasses)}>
      {children}
    </div>
  );
} 