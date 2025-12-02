import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface Goal {
  subject: string;
  goal: number;
  questions_attempted: number;
}

const TodaySchedule: React.FC = () => {
  const [newGoals, setNewGoals] = useState<{ [subject: string]: number }>({});
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['user-quiz-goals'],
    queryFn: async () => {
      const response = await fetch('/api/user-quiz-goals/', {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }
      return response.json();
    }
  });

  const { data: subjects = [] } = useQuery<string[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await fetch('/api/subjects/', {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }
      return response.json();
    }
  });

  useEffect(() => {
    if (goals.length > 0) {
      const incompleteGoals = goals.filter(g => g.questions_attempted < g.goal);
      if (incompleteGoals.length > 0) {
        toast({
          title: "Goal Reminder",
          description: `You have ${incompleteGoals.length} incomplete goals for today. Keep going!`,
          duration: 5000,
        });
      }
    }
  }, [goals, toast]);

  const mutation = useMutation({
    mutationFn: ({ subject, goal }: { subject: string, goal: number }) => {
      return fetch('/api/user-quiz-goals/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ subject, goal }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-quiz-goals'] });
      toast({
        title: "Goal Set",
        description: "Your daily goal has been updated.",
      });
    },
  });

  const handleGoalChange = (subject: string, value: string) => {
    setNewGoals({
      ...newGoals,
      [subject]: Number(value),
    });
  };

  const handleSetGoal = (subject: string | null) => {
    if (!subject) return;
    const goal = newGoals[subject];
    if (goal === undefined) return;
    mutation.mutate({ subject, goal });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        {goals.length > 0 ? (
          goals.map(goal => {
            const isCompleted = goal.questions_attempted >= goal.goal;
            return (
              <div key={goal.subject} className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{goal.subject}</span>
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {goal.questions_attempted} / {goal.goal} questions
                  </span>
                </div>
                <Progress
                  value={goal.goal > 0 ? Math.min((goal.questions_attempted / goal.goal) * 100, 100) : 0}
                  className={`h-2 ${isCompleted ? "bg-green-100" : "bg-secondary"}`}
                  indicatorClassName={isCompleted ? "bg-green-500" : ""}
                />
                <div className="flex mt-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Update goal"
                    className="h-8 text-sm"
                    onChange={e => handleGoalChange(goal.subject, e.target.value)}
                  />
                  <Button
                    onClick={() => handleSetGoal(goal.subject)}
                    size="sm"
                    variant="outline"
                  >
                    Update
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div>
            <p className="text-muted-foreground mb-4">No goals set yet. Set a goal to get started!</p>
            <div className="flex gap-2">
              <Select onValueChange={setSelectedSubject} value={selectedSubject || ''}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Target"
                className="w-24"
                onChange={e => handleGoalChange(selectedSubject || '', e.target.value)}
                disabled={!selectedSubject}
              />
              <Button onClick={() => handleSetGoal(selectedSubject)} disabled={!selectedSubject}>
                Set
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodaySchedule;