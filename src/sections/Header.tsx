"use client";

import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/assets/logo.png';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/context/Theme';
import { useState } from 'react';
import { Web3Provider } from '@ethersproject/providers';

declare global {
  interface Window {
    ethereum: any;
  }
}

export const Header = () => {
  const { theme } = useTheme() || {};
  const [account, setAccount] = useState<string | null>(null);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
      } catch (error) {
        console.error('User rejected the request');
      }
    } else {
      alert('MetaMask is not installed');
    }
  };

  return (
    <header className={`${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <div className={`container mx-auto py-4`}>
        <div className={`mx-auto flex justify-between items-center p-2 border ${theme === 'dark' ? 'border-white' : 'border-black'} rounded-md`}>
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
            <div className='hidden md:block'>
              <ThemeToggle />
            </div>
            <ul className="flex space-x-2 md:space-x-4">
              {account ? (
                <span className="text-sm md:text-base">{account.slice(0, 6)}...{account.slice(-4)}</span>
              ) : (
                <button
                  onClick={connectWallet}
                  className="text-sm text-white md:text-base border border-rose-500 p-2 mr-1 rounded-md tracking-tight bg-rose-500 hover:bg-rose-600 transition-colors duration-300"
                >
                  Connect Wallet
                </button>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}