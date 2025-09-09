import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Course, StudyMaterial } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const [trialFormData, setTrialFormData] = useState({
    name: "",
    email: "",
    examType: ""
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: studyMaterials } = useQuery<StudyMaterial[]>({
    queryKey: ["/api/study-materials"],
  });

  const handleTrialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trialFormData.name || !trialFormData.email || !trialFormData.examType) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest("POST", "/api/users", {
        name: trialFormData.name,
        email: trialFormData.email,
        examType: trialFormData.examType,
      });

      toast({
        title: "Success!",
        description: "Your free trial has been activated. Welcome to PrepUp!",
      });
      
      setTrialFormData({ name: "", email: "", examType: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start trial. Please try again.",
        variant: "destructive",
      });
    }
  };

  const displayedMaterials = studyMaterials?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/50 to-white/70"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')",
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          />
          
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tighter mb-6 text-black">
              Ace Your Exams with <span className="text-black font-bold">PrepUp</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-black mb-8">
              Prepare for CAT and GATE exams with our comprehensive study materials, practice tests, and expert guidance. Join thousands of successful students who have achieved their goals with PrepUp.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold transform hover:scale-105 transition-all duration-200"
                data-testid="hero-button-get-started"
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="bg-white/20 text-white border-white/30 backdrop-blur-sm hover:bg-white/30 font-bold"
                data-testid="hero-button-explore-courses"
              >
                Explore Courses
              </Button>
            </div>
          </div>
          
          {/* Floating stats cards */}
          <div className="absolute bottom-8 left-8 right-8 hidden lg:flex justify-between">
            <Card className="bg-card/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary" data-testid="stat-students">25,000+</div>
                <div className="text-sm text-muted-foreground">Students Enrolled</div>
              </CardContent>
            </Card>
            <Card className="bg-card/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary" data-testid="stat-success-rate">95%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </CardContent>
            </Card>
            <Card className="bg-card/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary" data-testid="stat-practice-tests">500+</div>
                <div className="text-sm text-muted-foreground">Practice Tests</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
                Why Choose PrepUp?
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
                PrepUp offers a unique blend of features designed to maximize your exam preparation efficiency and effectiveness.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-20">
              <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover-elevate">
                <CardContent className="p-6">
                  <div className="flex size-12 items-center justify-center rounded-full bg-accent text-primary mb-4">
                    <span className="material-symbols-outlined">auto_stories</span>
                  </div>
                  <CardTitle className="text-lg mb-2">Comprehensive Study Materials</CardTitle>
                  <CardDescription>Access a vast library of study materials for CAT and GATE exams.</CardDescription>
                </CardContent>
              </Card>
              
              <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover-elevate">
                <CardContent className="p-6">
                  <div className="flex size-12 items-center justify-center rounded-full bg-accent text-primary mb-4">
                    <span className="material-symbols-outlined">quiz</span>
                  </div>
                  <CardTitle className="text-lg mb-2">Interactive Practice Tests</CardTitle>
                  <CardDescription>Engage with tests that simulate the actual exam environment and provide instant feedback.</CardDescription>
                </CardContent>
              </Card>
              
              <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover-elevate">
                <CardContent className="p-6">
                  <div className="flex size-12 items-center justify-center rounded-full bg-accent text-primary mb-4">
                    <span className="material-symbols-outlined">groups</span>
                  </div>
                  <CardTitle className="text-lg mb-2">Expert Guidance</CardTitle>
                  <CardDescription>Benefit from personalized support and mentorship from experienced instructors.</CardDescription>
                </CardContent>
              </Card>
              
              <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover-elevate">
                <CardContent className="p-6">
                  <div className="flex size-12 items-center justify-center rounded-full bg-accent text-primary mb-4">
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <CardTitle className="text-lg mb-2">Flexible Learning</CardTitle>
                  <CardDescription>Study at your own pace, balancing preparation with other commitments.</CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Community Initiative Section */}
        <section className="py-20 px-4 lg:px-8 bg-gradient-to-br from-primary/5 to-accent/10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
                Our Initiative: Learn More, Earn More
              </h2>
              <p className="max-w-3xl mx-auto text-lg text-muted-foreground">
                We build a collaborative exam-preparation community where every contribution matters and everyone benefits.
              </p>
            </div>

            {/* How it Works */}
            <div className="grid gap-8 md:grid-cols-3 mb-16">
              <Card className="text-center hover-elevate">
                <CardContent className="p-8">
                  <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-6">
                    <span className="material-symbols-outlined text-2xl">upload</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">1. Upload Questions & Solutions</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Students upload questions or their solutions for community review. Reviewed and accepted submissions become part of the shared learning pool. Accepted contributions earn credits, stars, or other community benefits.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover-elevate">
                <CardContent className="p-8">
                  <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-6">
                    <span className="material-symbols-outlined text-2xl">groups</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">2. Review & Improve Together</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Members can submit alternate solutions to existing problems. Accepted solutions receive recognition and rewards. Multiple solutions provide varied approaches and deepen understanding for everyone.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover-elevate">
                <CardContent className="p-8">
                  <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-6">
                    <span className="material-symbols-outlined text-2xl">star</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">3. Star System & Benefits</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    A star/points system recognizes contributions and quality. Increased participation unlocks benefits such as access to top-rated content, peer support, and community recognition.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Star System Features */}
            <div className="grid gap-8 lg:grid-cols-2 mb-16">
              <Card className="hover-elevate">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">military_tech</span>
                    Levels & Badges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm">Stars accumulate toward levels: Beginner → Explorer → Mentor → Master</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm">Badges mark achievements like Top Reviewer, Problem Creator, Community Helper</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm">Weekly and monthly leaderboards highlight top contributors</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">workspace_premium</span>
                    Collaboration Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm">Access to premium-quality questions and solutions</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm">Entry to exclusive discussion groups</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm">Early access to new problem sets and content</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm">Peer recognition and community upvotes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Community Challenges */}
            <Card className="bg-gradient-to-br from-primary/10 to-accent/20 border-primary/20 hover-elevate">
              <CardContent className="p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-primary mb-4 block">
                  emoji_events
                </span>
                <h3 className="text-2xl font-bold text-foreground mb-4">Community Challenges & Milestones</h3>
                <p className="text-muted-foreground mb-6 max-w-3xl mx-auto">
                  Participate in topic-focused challenges and achieve milestones to earn rewards. From advanced study tips to curated problem sets, every contribution is recognized and celebrated in our collaborative learning environment.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Join Community
                  </Button>
                  <Button variant="outline">
                    Learn More About Stars
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Courses Section */}
        <section className="py-20 px-4 lg:px-8 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
                Our Popular Courses
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
                Comprehensive preparation courses designed by experts to help you succeed in your target exam.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {courses?.map((course) => (
                <Card key={course.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden hover-elevate">
                  {course.imageUrl && (
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={course.imageUrl} 
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                      />
                      {course.isPopular && (
                        <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                          Most Popular
                        </Badge>
                      )}
                    </div>
                  )}
                  <CardContent className="p-8">
                    <CardTitle className="text-2xl mb-3">{course.title}</CardTitle>
                    <CardDescription className="mb-6">{course.description}</CardDescription>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="material-symbols-outlined text-primary">schedule</span>
                        <span>{course.duration}</span>
                      </div>
                      {Array.isArray(course.features) && course.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 text-sm">
                          <span className="material-symbols-outlined text-primary">
                            {index === 0 ? 'quiz' : index === 1 ? 'person' : 'auto_stories'}
                          </span>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-foreground">₹{course.price.toLocaleString()}</span>
                        {course.originalPrice && (
                          <span className="text-sm text-muted-foreground line-through ml-2">₹{course.originalPrice.toLocaleString()}</span>
                        )}
                      </div>
                      <Button 
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        data-testid={`enroll-button-${course.examType}`}
                      >
                        Enroll Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Study Materials Preview */}
        <section className="py-20 px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
                Study Materials Library
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
                Access comprehensive study materials organized by subjects and difficulty levels.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
              {displayedMaterials.map((material) => (
                <Card key={material.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden hover-elevate">
                  {material.imageUrl && (
                    <div className="relative h-40 overflow-hidden">
                      <img 
                        src={material.imageUrl}
                        alt={material.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      <Badge 
                        className={`absolute top-3 right-3 ${
                          material.isPremium 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-card text-foreground'
                        }`}
                      >
                        {material.isPremium ? 'Premium' : 'Free'}
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {material.examType.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {material.subject}
                      </Badge>
                    </div>
                    <CardTitle className="mb-2">{material.title}</CardTitle>
                    <CardDescription className="mb-4">{material.description}</CardDescription>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">description</span>
                        <span>{material.pages} Pages</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">star</span>
                        <span>{material.rating}.0 ({material.reviewCount} reviews)</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      data-testid={`download-material-${material.id}`}
                    >
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Link href="/study-materials">
                <Button variant="outline" size="lg" data-testid="view-all-materials">
                  View All Materials
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 px-4 lg:px-8 bg-gradient-to-br from-primary/10 to-accent/20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
              Ready to Take the Next Step?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Begin your journey to exam success with a free trial of PrepUp. Explore our features and experience the difference.
            </p>
            
            {/* Free Trial Form */}
            <Card className="max-w-md mx-auto mb-8">
              <CardHeader>
                <CardTitle>Start Your Free 7-Day Trial</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTrialSubmit} className="space-y-4">
                  <Input 
                    type="text" 
                    placeholder="Full Name" 
                    value={trialFormData.name}
                    onChange={(e) => setTrialFormData(prev => ({ ...prev, name: e.target.value }))}
                    data-testid="input-trial-name"
                  />
                  <Input 
                    type="email" 
                    placeholder="Email Address" 
                    value={trialFormData.email}
                    onChange={(e) => setTrialFormData(prev => ({ ...prev, email: e.target.value }))}
                    data-testid="input-trial-email"
                  />
                  <Select 
                    value={trialFormData.examType} 
                    onValueChange={(value) => setTrialFormData(prev => ({ ...prev, examType: value }))}
                  >
                    <SelectTrigger data-testid="select-trial-exam-type">
                      <SelectValue placeholder="Select Exam" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cat">CAT</SelectItem>
                      <SelectItem value="gate">GATE</SelectItem>
                      <SelectItem value="both">Both CAT & GATE</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold transform hover:scale-105 transition-all duration-200"
                    data-testid="button-start-trial"
                  >
                    Start Free Trial
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-4">
                  No credit card required. Cancel anytime.
                </p>
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">security</span>
                <span>100% Secure & Private</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">verified</span>
                <span>Trusted by 25,000+ Students</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">support</span>
                <span>24/7 Expert Support</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
