import { UserProfile } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Profile Settings – FootBook",
    description: "Manage your FootBook profile and account settings.",
};

export default function ProfilePage() {
    return (
        <div className="flex flex-col items-center gap-6 py-8 animate-in fade-in duration-500">
            <div className="w-full max-w-2xl">
                <h1 className="text-2xl font-bold text-foreground mb-2">Profile Settings</h1>
                <p className="text-sm text-foreground/50 mb-8">
                    Manage your account, username, and security settings.
                </p>
                <UserProfile
                    appearance={{
                        elements: {
                            rootBox: "w-full",
                            card: "w-full shadow-none border border-border rounded-2xl bg-card",
                            navbar: "border-r border-border",
                            pageScrollBox: "p-6",
                        },
                    }}
                />
            </div>
        </div>
    );
}
