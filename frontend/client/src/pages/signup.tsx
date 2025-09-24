import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup as signupUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Renders the signup page for new users.
 *
 * This component provides a form for users to register by providing their
 * name, email, password, and selecting an exam type. It handles the signup
 * process and provides user feedback via toasts.
 *
 * @returns {JSX.Element} The rendered signup page.
 */
export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [examType, setExamType] = useState("");
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleSignup = async () => {
    try {
      await signupUser(name, email, password, examType);
      toast({
        title: "Signup Successful",
        description: "You have been successfully signed up. Please login.",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="exam-type">Exam Type</Label>
            <Select onValueChange={setExamType} value={examType}>
              <SelectTrigger>
                <SelectValue placeholder="Select an exam type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CAT">CAT</SelectItem>
                <SelectItem value="GATE">GATE</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleSignup}>
            Sign up
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
