import Link from 'next/link';
import Image from 'next/image';
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between mx-auto px-4 max-w-5xl">
                <Link href="/" className="flex items-center space-x-2">
                    <div className="relative h-10 w-32">
                        <Image
                            src="/FootBook Text Logo.jpg"
                            alt="FootBook Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </Link>

                <nav className="flex items-center space-x-6 text-sm font-medium">
                    <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground">Home</Link>
                    <Link href="/insights" className="transition-colors hover:text-foreground/80 text-foreground/60">Insights</Link>
                </nav>

                <div className="flex items-center space-x-4">
                    <SignedIn>
                        <UserButton afterSignOutUrl="/" />
                    </SignedIn>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="h-9 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 bg-[#06402B] text-white hover:bg-[#06402B]/90 shadow cursor-pointer">
                                Log In
                            </button>
                        </SignInButton>
                    </SignedOut>
                </div>
            </div>
        </header>
    );
}
