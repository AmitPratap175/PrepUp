import { Link } from "wouter";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="flex items-center justify-center min-h-[70vh] px-4">
        <Card className="w-full max-w-md mx-4 hover-elevate">
          <CardContent className="p-8 text-center">
            <span className="material-symbols-outlined text-6xl text-muted-foreground mb-4 block">
              search_off
            </span>
            <h1 className="text-3xl font-bold text-foreground mb-4">404</h1>
            <h2 className="text-xl font-semibold text-foreground mb-4">Page Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="space-y-3">
              <Link href="/">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  Go Home
                </Button>
              </Link>
              <Link href="/practice-test">
                <Button variant="outline" className="w-full">
                  Take a Practice Test
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <AppFooter />
    </div>
  );
}
