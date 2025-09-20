import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export default function CurrentAffairsPage() {
  const articles = Array.from({ length: 23 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4">Current Affairs - September 10, 2025</h1>
          <p className="text-muted-foreground mb-8">
            Read today's top articles.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((articleId) => (
              <Link key={articleId} href={`/current-affairs/${articleId}`}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>Article {articleId}</CardTitle>
                    <CardDescription>Click to read the full article.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}