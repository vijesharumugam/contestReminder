import { SignIn } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="flex items-center justify-center py-10">
            <SignIn appearance={{
                elements: {
                    formButtonPrimary: "bg-primary hover:bg-primary/90 text-sm normal-case text-primary-foreground",
                    card: "bg-card border border-border shadow-lg",
                    headerTitle: "text-foreground font-outfit",
                    headerSubtitle: "text-muted-foreground font-sans",
                    socialButtonsBlockButton: "bg-muted border-border text-foreground hover:bg-muted/80",
                    socialButtonsBlockButtonText: "text-foreground font-medium",
                    formFieldLabel: "text-muted-foreground",
                    formFieldInput: "bg-input border-border text-foreground",
                    footerActionText: "text-muted-foreground",
                    footerActionLink: "text-primary hover:text-primary/80"
                }
            }} />
        </div>
    );
}
