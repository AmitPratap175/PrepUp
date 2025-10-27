import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Link, useRoute } from "wouter";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

/**
 * Renders a single current affairs article.
 *
 * This component retrieves the article ID from the URL and displays the
 * corresponding content. It also provides navigation to the previous and
 * next articles.
 *
 * @returns {JSX.Element} The rendered article page.
 */
export default function CurrentAffairsArticlePage() {
  const [, params] = useRoute("/current-affairs/:articleId");
  const articleId = params?.articleId;
  const [articleContent, setArticleContent] = useState("");
  const [articles, setArticles] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/current-affairs/')
      .then((response) => response.json())
      .then((data) => setArticles(data));
  }, []);

  useEffect(() => {
    if (articleId) {
      fetch(`/api/current-affairs/${articleId}/`)
        .then((response) => response.json())
        .then((data) => setArticleContent(data.content));
    }
  }, [articleId]);

  const currentIndex = articles.indexOf(articleId ?? "");
  const prevArticle = currentIndex > 0 ? articles[currentIndex - 1] : null;
  const nextArticle = currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null;

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4">Current Affairs: {articleId?.replace('.md', '')}</h1>
          <div className="prose max-w-none text-foreground leading-relaxed preserve-whitespace">
            <ReactMarkdown>{articleContent}</ReactMarkdown>
          </div>
          <div className="flex justify-between mt-8">
            {prevArticle && (
              <Link href={`/current-affairs/${prevArticle}`}>
                <Button>Previous Article</Button>
              </Link>
            )}
            {nextArticle && (
              <Link href={`/current-affairs/${nextArticle}`}>
                <Button>Next Article</Button>
              </Link>
            )}
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
