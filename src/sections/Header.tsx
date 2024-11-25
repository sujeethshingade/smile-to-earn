import Link from 'next/link';
// import Image from 'next/image';
// import Logo from '@/assets/logo.png';

export const Header = () => {
    return (
        <header className={`container py-4`}>
            <div className={`mx-auto flex justify-between items-center p-4 border rounded-md`}>
                <div className="flex items-center">
                    {/*}
                    <Image
                        src={Logo}
                        alt="CarbonCare Logo"
                        width={50}
                        height={50}
                        className="md:mr-2 mb-2"
                        priority
                    />
                    */}
                    <h1 className={`text-md md:text-3xl font-bold`}>
                        <Link href="/">Smile to Earn</Link>
                    </h1>
                </div>
                <nav className="flex items-center space-x-2 md:space-x-6 font-semibold">
                    <ul className="flex space-x-2 md:space-x-4">
                        <Link href="#" className={`text-white text-sm md:text-base border p-2 rounded-md bg-rose-500`}>
                            Connect Wallet
                        </Link>
                    </ul>
                </nav>
            </div>
        </header>
    );
}