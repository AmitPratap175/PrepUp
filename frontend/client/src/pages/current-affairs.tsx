import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { useEffect, useState } from "react";

/**
 * Renders a page that lists all available current affairs articles.
 *
 * This component displays a grid of cards, each representing a single
 * current affairs article that the user can navigate to and read.
 *
 * @returns {JSX.Element} The rendered current affairs page.
 */
export default function CurrentAffairsPage() {
  const [articles, setArticles] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/current-affairs/')
      .then((response) => response.json())
      .then((data) => setArticles(data));
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4">Current Affairs</h1>
          <p className="text-muted-foreground mb-8">
            Read today's top articles.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link key={article} href={`/current-affairs/${article}`}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{article.replace('.md', '')}</CardTitle>
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