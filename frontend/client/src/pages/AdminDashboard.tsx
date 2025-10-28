import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SuggestedEdit } from "@shared/schema";
import { useLocation } from "wouter";

export function AdminDashboardPage() {
  const [suggestions, setSuggestions] = useState<SuggestedEdit[]>([]);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const fetchSuggestions = async () => {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        setLocation("/admin/login");
        return;
      }

      const response = await fetch("/api/admin/suggested-edits/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      } else {
        // Handle error
      }
    };

    fetchSuggestions();
  }, []);

  const handleApprove = async (id: string) => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      setLocation("/admin/login");
      return;
    }

    await fetch(`/api/admin/suggested-edits/${id}/approve/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setSuggestions(suggestions.filter((s) => s.id !== id));
  };

  const handleReject = async (id: string) => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      setLocation("/admin/login");
      return;
    }

    await fetch(`/api/admin/suggested-edits/${id}/reject/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setSuggestions(suggestions.filter((s) => s.id !== id));
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setLocation("/admin/login");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>Logout</Button>
      </div>
      <div className="space-y-4">
        {suggestions.map((suggestion) => (
          <Card key={suggestion.id}>
            <CardHeader>
              <CardTitle>Suggestion for {suggestion.question_id}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                <strong>User:</strong> {suggestion.user.email}
              </p>
              <p>
                <strong>Comment:</strong> {suggestion.comment}
              </p>
              <div>
                <strong>Suggested Changes:</strong>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <h4 className="font-semibold">Original</h4>
                    <p>{suggestion.original_question_text}</p>
                    <ul>
                      {suggestion.original_options.map((o, i) => <li key={i}>{o.option_text}</li>)}
                    </ul>
                    <p>{suggestion.original_solution}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Suggested</h4>
                    <p>{suggestion.suggested_question_text}</p>
                    <ul>
                      {suggestion.suggested_options.map((o, i) => <li key={i}>{o.option_text}</li>)}
                    </ul>
                    <p>{suggestion.suggested_solution}</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => handleReject(suggestion.id)}>
                  Reject
                </Button>
                <Button onClick={() => handleApprove(suggestion.id)}>Approve</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
