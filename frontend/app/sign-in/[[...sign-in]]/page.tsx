import { SignIn } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="flex items-center justify-center py-10">
            <SignIn appearance={{
                elements: {
                    formButtonPrimary: "bg-blue-600 hover:bg-blue-500 text-sm normal-case",
                    card: "bg-slate-900 border border-slate-800",
                    headerTitle: "text-white font-outfit",
                    headerSubtitle: "text-slate-400 font-sans",
                    socialButtonsBlockButton: "bg-slate-800 border-slate-700 text-white hover:bg-slate-700",
                    socialButtonsBlockButtonText: "text-white font-medium",
                    formFieldLabel: "text-slate-300",
                    formFieldInput: "bg-slate-800 border-slate-700 text-white",
                    footerActionText: "text-slate-400",
                    footerActionLink: "text-blue-500 hover:text-blue-400"
                }
            }} />
        </div>
    );
}
