import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const gradients = [
  'from-red-400 to-red-600',
  'from-orange-400 to-orange-600',
  'from-yellow-400 to-yellow-600',
  'from-green-400 to-green-600',
  'from-cyan-400 to-cyan-600',
  'from-blue-400 to-blue-600',
  'from-indigo-400 to-indigo-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
];

const getGradient = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

interface AvatarProps {
  id: string;
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ id, name, src, size = 'md', isOnline, className }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };

  const gradient = getGradient(id);

  return (
    <div className={cn('relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0', sizeClasses[size], className)}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <div className={cn('w-full h-full flex items-center justify-center text-white font-medium bg-gradient-to-br', gradient)}>
          {getInitials(name)}
        </div>
      )}
      {isOnline && (
        <span className="absolute bottom-0 right-0 block w-3 h-3 rounded-full bg-blue-500 ring-2 ring-white dark:ring-[var(--bg-sidebar)]" />
      )}
    </div>
  );
};
