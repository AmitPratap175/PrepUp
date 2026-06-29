import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, CheckCircle, FileText, BrainCircuit, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Types
interface EvaluationQuestion {
  question_number: string;
  extracted_question_text?: string;
  topic: string;
  marks_obtained: number;
  max_marks: number;
  feedback: string;
}

interface EvaluationSession {
  id: string;
  status: string;
  total_score: number | null;
  max_score: number | null;
  overall_feedback: string | null;
  created_at: string;
  gemini_insights: any;
  questions?: EvaluationQuestion[];
  file_url?: string;
}

export default function MathEvaluationPage() {
  const { isAuthenticated } = useAuth();
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Token ${token}` } : {};
  };
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sessions, setSessions] = useState<EvaluationSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<EvaluationSession | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (isAuthenticated) fetchSessions();
  }, [isAuthenticated]);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/evaluation/math/sessions/", {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) setSessions(data.evaluations || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSessionDetails = async (id: string) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/evaluation/math/sessions/${id}/`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) setSelectedSession(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/evaluation/math/upload/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });
      
      if (res.ok) {
        toast({
          title: "Upload Successful",
          description: "Your answer sheet is being evaluated by Gemini. Check back in a few moments.",
        });
        setFile(null);
        fetchSessions();
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your file.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Left Column: Upload & History */}
          <div className="w-full md:w-1/3 flex flex-col gap-6">
            <Card className="border-indigo-100 shadow-md">
              <CardHeader className="bg-indigo-50/50">
                <CardTitle className="text-xl text-indigo-900 flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-indigo-600" />
                  Upload Answer Sheet
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    id="file-upload"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <FileText className="w-12 h-12 text-slate-400 mb-3" />
                    <span className="text-sm font-medium text-indigo-600">Click to select a file</span>
                    <span className="text-xs text-slate-500 mt-1">PDF or Images (Max 10MB)</span>
                  </label>
                </div>
                {file && (
                  <div className="mt-4 flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                    <span className="text-sm text-slate-700 truncate">{file.name}</span>
                    <Button size="sm" onClick={handleUpload} disabled={uploading}>
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload & Evaluate"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Past Evaluations</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {sessions.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">No past evaluations found.</div>
                ) : (
                  <div className="divide-y max-h-[400px] overflow-y-auto">
                    {sessions.map(s => (
                      <div 
                        key={s.id} 
                        onClick={() => fetchSessionDetails(s.id)}
                        className={`p-4 cursor-pointer hover:bg-indigo-50 transition-colors ${selectedSession?.id === s.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-slate-800">
                            {new Date(s.created_at).toLocaleDateString()}
                          </span>
                          {s.status === 'completed' ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Ready</span>
                          ) : s.status === 'processing' ? (
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium animate-pulse">Evaluating</span>
                          ) : (
                            <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">{s.status}</span>
                          )}
                        </div>
                        {s.status === 'completed' && (
                          <div className="text-sm text-slate-600">Score: {s.total_score} / {s.max_score}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Details & Insights */}
          <div className="w-full md:w-2/3">
            {loadingDetails ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
                <p className="text-slate-500">Loading evaluation details...</p>
              </div>
            ) : selectedSession ? (
              selectedSession.status === 'completed' ? (
                <div className="space-y-6">
                  {/* Overview Card */}
                  <Card className="border-green-200 shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold text-slate-800 mb-2">Overall Performance</h2>
                          <p className="text-slate-600 text-sm leading-relaxed">{selectedSession.overall_feedback}</p>
                        </div>
                        <div className="text-center md:text-right bg-green-50 p-6 rounded-xl border border-green-100 min-w-[150px]">
                          <div className="text-4xl font-extrabold text-green-700">{selectedSession.total_score}</div>
                          <div className="text-sm text-green-600 font-medium mt-1">out of {selectedSession.max_score}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gemini Insights */}
                  {selectedSession.gemini_insights && (
                    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-purple-900 flex items-center gap-2">
                          <BrainCircuit className="w-5 h-5 text-purple-600" />
                          AI Insights & Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-rose-500" /> Weak Topics Detected
                            </h4>
                            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                              {selectedSession.gemini_insights.weak_topics?.map((topic: string, i: number) => (
                                <li key={i}>{topic}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-700 mb-2">Strategic Advice</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {selectedSession.gemini_insights.suggestions}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Question Breakdown */}
                  <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">Question Breakdown</h3>
                  <div className="space-y-4">
                    {selectedSession.questions?.map((q, idx) => (
                      <Card key={idx} className="overflow-hidden">
                        <div className="bg-slate-100 px-4 py-3 border-b flex justify-between items-center">
                          <div className="font-semibold text-slate-800">Question {q.question_number}</div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-medium">{q.topic}</span>
                            <span className="text-sm font-bold text-slate-700">{q.marks_obtained} / {q.max_marks}</span>
                          </div>
                        </div>
                        <CardContent className="p-4 bg-white flex flex-col gap-4">
                          {q.extracted_question_text && (
                            <div className="bg-slate-50 p-3 rounded border border-slate-200">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Problem statement</span>
                              <p className="text-sm font-medium text-slate-800 italic">"{q.extracted_question_text}"</p>
                            </div>
                          )}
                          <div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Evaluation Feedback</span>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{q.feedback}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-12 text-center">
                    <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-amber-800 mb-2">Evaluation in Progress</h3>
                    <p className="text-amber-700">Gemini is currently analyzing your answer sheet. Please check back in a few minutes.</p>
                  </CardContent>
                </Card>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <CheckCircle className="w-16 h-16 mb-4 opacity-20" />
                <p>Select a past evaluation or upload a new one to view details.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
