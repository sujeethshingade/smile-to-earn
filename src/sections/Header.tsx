import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/assets/logo.png';

export const Header = () => {
    return (
        <header className={`container py-4`}>
            <div className={`mx-auto flex justify-between items-center p-2 border border-black rounded-md`}>
                <div className="flex items-center">
                    <Image
                        src={Logo}
                        alt="Smile Logo"
                        width={50}
                        height={50}
                        className="mr-2"
                        priority
                    />
                    <h1 className={`text-xl tracking-tight md:text-3xl font-bold`}>
                        <Link href="/">Smile to Earn</Link>
                    </h1>
                </div>
                <nav className="flex items-center space-x-2 md:space-x-6 font-semibold">
                    <ul className="flex space-x-2 md:space-x-4">
                        <Link href="#" className={`text-white text-sm md:text-base border border-rose-500 p-2 mr-1 rounded-md tracking-tight bg-rose-500`}>
                            Connect Wallet
                        </Link>
                    </ul>
                </nav>
            </div>
        </header>
    );
}