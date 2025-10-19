import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Goal {
  subject: string;
  goal: number;
  questions_attempted: number;
}

const TodaySchedule: React.FC = () => {
  const [newGoals, setNewGoals] = useState<{ [subject: string]: number }>({});
  const queryClient = useQueryClient();

  const { data: goals = [], refetch } = useQuery<Goal[]>({ 
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
      const data = await response.json();
      console.log('Fetched goals:', data);
      return data;
    }
  });

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
    },
  });

  const handleGoalChange = (subject: string, value: string) => {
    setNewGoals({
      ...newGoals,
      [subject]: Number(value),
    });
  };

  const handleSetGoal = (subject: string) => {
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
        {goals.map(goal => (
          <div key={goal.subject} className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">{goal.subject}</span>
              <span>{goal.questions_attempted} / {goal.goal}</span>
            </div>
            <Progress value={goal.goal > 0 ? (goal.questions_attempted / goal.goal) * 100 : 0} />
            <div className="flex mt-2">
              <Input
                type="number"
                placeholder="Set new goal"
                onChange={e => handleGoalChange(goal.subject, e.target.value)}
              />
              <Button onClick={() => handleSetGoal(goal.subject)} className="ml-2">
                Set Goal
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TodaySchedule;