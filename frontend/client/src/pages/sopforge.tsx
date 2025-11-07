import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateSop, submitFeedback } from "@/services/sopforge";

export default function SopForgePage() {
  const { toast } = useToast();
  const [userPrompt, setUserPrompt] = useState("");
  const [userProfile, setUserProfile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPrompt || !userProfile) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setResult(null);
    try {
      const response = await generateSop({ user_prompt: userPrompt, user_profile: userProfile });
      setResult(response);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate SOP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback) {
      toast({
        title: "Error",
        description: "Please provide feedback or approve.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await submitFeedback({ thread_id: result.thread_id, feedback });
      setResult(response);
      setFeedback("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black tracking-tighter text-foreground mb-4">
              SOP Forge
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              Generate a personalized Statement of Purpose with the help of AI agents.
            </p>
          </div>

          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Create Your SOP</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="user-prompt" className="text-sm font-medium">
                    Your Goal
                  </label>
                  <Textarea
                    id="user-prompt"
                    placeholder="e.g., MS in Computer Science at Stanford, focus on AI and ML"
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="user-profile" className="text-sm font-medium">
                    Your Background
                  </label>
                  <Textarea
                    id="user-profile"
                    placeholder="Your resume, experiences, and background as plain text."
                    value={userProfile}
                    onChange={(e) => setUserProfile(e.target.value)}
                    className="min-h-[200px]"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Generating..." : "Generate SOP"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {isLoading && (
            <div className="text-center mt-8">
              <p>AI agents are working on your SOP... Please wait.</p>
            </div>
          )}

          {result && (
            <Card className="max-w-4xl mx-auto mt-8">
              <CardHeader>
                <CardTitle>Generated SOP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  <p>{result.draft}</p>
                </div>

                {result.status === "paused_at_human_review" && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Review and Provide Feedback</h3>
                    <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                      <Textarea
                        placeholder='Type "APPROVE" to accept, or provide feedback for revisions.'
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Submitting..." : "Submit Feedback"}
                      </Button>
                    </form>
                  </div>
                )}

                {result.status === "completed" && (
                  <div className="mt-6 text-center text-green-600 font-semibold">
                    SOP generation complete!
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
