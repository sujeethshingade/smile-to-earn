"use client";

import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/assets/logo.png';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/context/Theme';

declare global {
  interface Window {
    ethereum: any;
  }
}

export const Header = () => {
  const { theme } = useTheme() || {};

  return (
    <header className={`${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <div className={`container mx-auto py-4`}>
        <div className={`mx-auto max-w-3xl flex justify-between items-center p-2 border ${theme === 'dark' ? 'border-white' : 'border-black'} rounded-md`}>
          <div className="flex items-center">
            <Image
              src={Logo}
              alt="Smile Logo"
              width={50}
              height={50}
              className="mr-2"
              priority
            />
            <h1 className={`text-xl tracking-tight md:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
              <Link href="/">Smile to Earn</Link>
            </h1>
          </div>
          <nav className="flex items-center space-x-2 md:space-x-4 font-semibold">
            <div>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}