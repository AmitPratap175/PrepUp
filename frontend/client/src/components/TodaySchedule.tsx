import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface Goal {
  subject: string;
  goal: number;
  questions_attempted: number;
}

const TodaySchedule: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoals, setNewGoals] = useState<{ [subject: string]: number }>({});

  useEffect(() => {
    // Fetch goals from the backend
    const fetchGoals = async () => {
      try {
        const response = await fetch('/api/user-quiz-goals/', {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setGoals(data);
        }
      } catch (error) {
        console.error('Failed to fetch goals:', error);
      }
    };

    fetchGoals();
  }, []);

  const handleGoalChange = (subject: string, value: string) => {
    setNewGoals({
      ...newGoals,
      [subject]: Number(value),
    });
  };

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/user-quiz-goals/', {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      }
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleSetGoal = async (subject: string) => {
    const goal = newGoals[subject];
    if (goal === undefined) return;

    try {
      const response = await fetch('/api/user-quiz-goals/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ subject, goal }),
      });

      if (response.ok) {
        // Refresh goals after setting a new one
        fetchGoals();
      }
    } catch (error) {
      console.error('Failed to set goal:', error);
    }
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