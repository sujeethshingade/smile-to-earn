"use client";

import { useTheme } from "@/context/Theme";
import { ThemeToggle } from '@/components/ThemeToggle';

export const Footer = () => {
  const { theme } = useTheme() || {};

  return (
    <footer className={`${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      <div className={`container mx-auto py-2`}>
        <div className={`flex justify-between items-center border tracking-tight border-black rounded-md p-2 ${theme === 'dark' ? 'border-white text-white' : 'border-black text-black'}`}>
          <p>&copy; 2024 Smile to Earn</p>
          <p className="hidden md:block">Team Raptors</p>
          <div className='md:hidden'>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
};
