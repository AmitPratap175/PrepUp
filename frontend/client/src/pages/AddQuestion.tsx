import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Question } from '@/types/Question';

const AddQuestionPage: React.FC = () => {
  const { token } = useAuth();
  const [examType, setExamType] = useState('cat'); // Default value
  const [subject, setSubject] = useState('');
  const [qid, setQid] = useState('');
  const [passageText, setPassageText] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [solutionText, setSolutionText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [fullMarkdown, setFullMarkdown] = useState('');
  const [isOptionsDisabled, setIsOptionsDisabled] = useState(false);
  const [correctOptionData, setCorrectOptionData] = useState('');
  const [message, setMessage] = useState('');

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 1) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      if (correctOptionIndex >= newOptions.length) {
        setCorrectOptionIndex(newOptions.length - 1);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const finalImageUrl = imageUrl.split(',').map(url => url.trim()).filter(url => url);

    const newQuestion: Omit<Question, 'qid'> & { qid?: string } = {
      passage_text: passageText || null,
      question_text: questionText,
      options: isOptionsDisabled ? [] : options.map((opt, i) => ({
        data_option: (i + 1).toString(),
        label: String.fromCharCode(65 + i),
        option_text: opt,
        is_correct: i === correctOptionIndex,
      })),
      correct_option_data: isOptionsDisabled ? correctOptionData : (correctOptionIndex + 1).toString(),
      solution_text: solutionText || null,
      image_url: finalImageUrl.length === 0 ? null : (finalImageUrl.length === 1 ? finalImageUrl[0] : finalImageUrl),
      full_markdown: fullMarkdown,
    };

    if (qid) {
        newQuestion.qid = qid;
    }

    try {
      const response = await fetch('/api/questions/add/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          examType,
          subject,
          question: newQuestion,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setMessage(`Success: ${result.message}`);
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to add question:', error);
      setMessage('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Add New Question</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="examType">Exam Type</Label>
                  <Select value={examType} onValueChange={setExamType}>
                    <SelectTrigger id="examType">
                      <SelectValue placeholder="Select exam type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cat">CAT</SelectItem>
                      <SelectItem value="gate">GATE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject*</Label>
                  <Select value={subject} onValueChange={setSubject} required>
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {examType === 'cat' && (
                        <>
                          <SelectItem value="data-interpretation">Data Interpretation</SelectItem>
                          <SelectItem value="quantitative-aptitude">Quantitative Aptitude</SelectItem>
                          <SelectItem value="verbal-ability">Verbal Ability</SelectItem>
                        </>
                      )}
                      {examType === 'gate' && (
                        <>
                          <SelectItem value="computer-science">Computer Science</SelectItem>
                          <SelectItem value="general-aptitude">General Aptitude</SelectItem>
                          <SelectItem value="mathematics">Mathematics</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passageText">Passage (optional)</Label>
                <Textarea id="passageText" value={passageText} onChange={(e) => setPassageText(e.target.value)} rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="questionText">Question Text*</Label>
                <Textarea id="questionText" value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={3} required />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="isOptionsDisabled" checked={isOptionsDisabled} onCheckedChange={() => setIsOptionsDisabled(!isOptionsDisabled)} />
                <Label htmlFor="isOptionsDisabled">Provide correct answer directly (no options)</Label>
              </div>

              {isOptionsDisabled ? (
                <div className="space-y-2">
                  <Label htmlFor="correctOptionData">Correct Answer Data*</Label>
                  <Input id="correctOptionData" type="text" value={correctOptionData} onChange={(e) => setCorrectOptionData(e.target.value)} required />
                </div>
              ) : (
                <div className="space-y-4">
                  <Label>Options*</Label>
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input type="radio" name="correctOption" checked={correctOptionIndex === index} onChange={() => setCorrectOptionIndex(index)} />
                      <Input type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + index)}`} required />
                      <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveOption(index)}>-</Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>Add Option</Button>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="solutionText">Solution (optional)</Label>
                <Textarea id="solutionText" value={solutionText} onChange={(e) => setSolutionText(e.target.value)} rows={3} />
              </div>

              <div className="flex justify-end">
                <Button type="submit">Add Question</Button>
              </div>
            </form>
            {message && <p className="mt-4 text-center text-sm text-muted-foreground">{message}</p>}
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
};

export default AddQuestionPage;
