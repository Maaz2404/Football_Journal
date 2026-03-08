import Link from 'next/link';
import Image from 'next/image';
import { UserButton, SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs';

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-brand shadow-md">
            <div className="container flex h-16 items-center justify-between mx-auto px-4 max-w-5xl">
                <Link href="/" className="flex items-center space-x-2">
                    <div className="relative h-10 w-32">
                        <Image
                            src="/FootBook Full Logo.jpg"
                            alt="FootBook Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </Link>

                <nav className="flex items-center space-x-6 text-sm font-medium">
                    <Link href="/" className="transition-colors hover:text-white text-white/90">Home</Link>
                    <Link href="/insights" className="transition-colors hover:text-white text-white/70">Insights</Link>
                </nav>

                <div className="flex items-center space-x-4">
                    <SignedIn>
                        <UserButton
                            afterSignOutUrl="/"
                            userProfileUrl="/profile"
                            userProfileMode="navigation"
                        />
                    </SignedIn>
                    <SignedOut>
                        <SignUpButton mode="modal">
                            <button className="h-9 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 border border-white/30 text-white/80 hover:border-white/60 hover:text-white bg-transparent cursor-pointer">
                                Sign Up
                            </button>
                        </SignUpButton>
                        <SignInButton mode="modal">
                            <button className="h-9 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 bg-accent text-white hover:bg-accent/90 shadow cursor-pointer">
                                Log In
                            </button>
                        </SignInButton>
                    </SignedOut>
                </div>
            </div>
        </header>
    );
}
