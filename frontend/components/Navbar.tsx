import Link from 'next/link';
import Image from 'next/image';
import { UserButton, SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs';

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full bg-[#e5e7eb] dark:bg-[#b5c7bd] shadow-md transition-colors">
            <div className="container flex h-24 items-center justify-between mx-auto px-4 md:px-8 max-w-7xl">
                <Link href="/" className="flex items-center">
                    {/* Make logo significantly bigger and add scale so the text fills the box */}
                    <div className="relative h-16 w-48 md:h-20 md:w-64 transition-transform hover:scale-105 active:scale-95">
                        <Image
                            src="/unnamed-removebg-preview.png"
                            alt="FootBook Logo"
                            fill
                            className="object-contain scale-[1.2] md:scale-[1.3] origin-left"
                            priority
                        />
                    </div>
                </Link>

                <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center space-x-10">
                    <Link href="/" className="text-xl md:text-2xl font-black tracking-tighter transition-all hover:text-accent text-brand">HOME</Link>
                    <Link href="/insights" className="text-xl md:text-2xl font-black tracking-tighter transition-all hover:text-accent text-brand/80">INSIGHTS</Link>
                </nav>

                <div className="flex items-center space-x-4">
                    <div className="md:hidden flex items-center mr-2">
                        <Link href="/insights" className="text-xl font-black tracking-tighter text-brand/80 mr-4">INSIGHTS</Link>
                    </div>
                    <SignedIn>
                        <UserButton
                            afterSignOutUrl="/"
                            userProfileUrl="/profile"
                            userProfileMode="navigation"
                        />
                    </SignedIn>
                    <SignedOut>
                        <SignUpButton mode="modal">
                            <button className="h-10 px-5 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-bold transition-colors focus-visible:outline-none border border-brand/30 text-brand hover:border-brand/60 hover:bg-brand/5 bg-transparent cursor-pointer">
                                Sign Up
                            </button>
                        </SignUpButton>
                        <SignInButton mode="modal">
                            <button className="h-10 px-5 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-bold transition-colors focus-visible:outline-none bg-brand text-white hover:bg-brand/90 shadow cursor-pointer">
                                Log In
                            </button>
                        </SignInButton>
                    </SignedOut>
                </div>
            </div>
        </header>
    );
}
