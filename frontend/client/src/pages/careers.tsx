import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Careers() {
  const jobOpenings = [
    {
      title: "Senior Frontend Developer",
      department: "Engineering",
      location: "Noida, India",
      type: "Full-time",
      experience: "3-5 years",
      description: "Build beautiful, responsive user interfaces using React, TypeScript, and modern frontend technologies.",
      requirements: ["React", "TypeScript", "Tailwind CSS", "Next.js"]
    },
    {
      title: "Backend Developer",
      department: "Engineering", 
      location: "Remote",
      type: "Full-time",
      experience: "2-4 years",
      description: "Develop scalable APIs and microservices using Node.js, Python, and cloud technologies.",
      requirements: ["Node.js", "Python", "PostgreSQL", "AWS"]
    },
    {
      title: "Product Manager",
      department: "Product",
      location: "Noida, India",
      type: "Full-time", 
      experience: "4-6 years",
      description: "Drive product strategy and roadmap for our exam preparation platform.",
      requirements: ["Product Strategy", "EdTech Experience", "Data Analysis", "User Research"]
    },
    {
      title: "Content Creator - CAT",
      department: "Academics",
      location: "Hybrid",
      type: "Full-time",
      experience: "2-3 years",
      description: "Create high-quality content and practice questions for CAT preparation.",
      requirements: ["CAT 99+ %ile", "Content Writing", "Subject Expertise", "Teaching Experience"]
    },
    {
      title: "DevOps Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      experience: "3-5 years", 
      description: "Manage infrastructure, CI/CD pipelines, and ensure platform reliability.",
      requirements: ["AWS", "Docker", "Kubernetes", "Terraform"]
    },
    {
      title: "UI/UX Designer",
      department: "Design",
      location: "Noida, India",
      type: "Full-time",
      experience: "2-4 years",
      description: "Design intuitive and engaging user experiences for our learning platform.",
      requirements: ["Figma", "User Research", "Prototyping", "Design Systems"]
    }
  ];

  const benefits = [
    {
      icon: "health_and_safety",
      title: "Health & Wellness",
      description: "Comprehensive health insurance for you and your family"
    },
    {
      icon: "home",
      title: "Flexible Work",
      description: "Remote-first culture with flexible working hours"
    },
    {
      icon: "school",
      title: "Learning Budget",
      description: "Annual learning and development allowance"
    },
    {
      icon: "celebration",
      title: "Team Events",
      description: "Regular team outings and celebration events"
    },
    {
      icon: "trending_up",
      title: "Growth Path",
      description: "Clear career progression and mentorship programs"
    },
    {
      icon: "savings",
      title: "Stock Options",
      description: "Employee stock ownership program (ESOP)"
    }
  ];

  const values = [
    {
      title: "Student First",
      description: "Every decision we make prioritizes student success and learning outcomes."
    },
    {
      title: "Innovation",
      description: "We embrace new technologies and creative solutions to educational challenges."
    },
    {
      title: "Collaboration",
      description: "We work together as one team, supporting each other to achieve common goals."
    },
    {
      title: "Excellence",
      description: "We maintain the highest standards in everything we do, from code to content."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
              Join Our Mission
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
              Help us revolutionize exam preparation and empower millions of students to achieve their dreams.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                View Open Positions
              </Button>
              <Button size="lg" variant="outline">
                Learn About Our Culture
              </Button>
            </div>
          </div>

          {/* Company Stats */}
          <div className="grid gap-6 md:grid-cols-4 mb-16">
            <Card className="text-center p-6 hover-elevate">
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-primary mb-2">50+</div>
                <div className="text-sm text-muted-foreground">Team Members</div>
              </CardContent>
            </Card>
            <Card className="text-center p-6 hover-elevate">
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-primary mb-2">5</div>
                <div className="text-sm text-muted-foreground">Office Locations</div>
              </CardContent>
            </Card>
            <Card className="text-center p-6 hover-elevate">
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-primary mb-2">25,000+</div>
                <div className="text-sm text-muted-foreground">Students Impacted</div>
              </CardContent>
            </Card>
            <Card className="text-center p-6 hover-elevate">
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-primary mb-2">4.8★</div>
                <div className="text-sm text-muted-foreground">Employee Rating</div>
              </CardContent>
            </Card>
          </div>

          {/* Our Values */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-foreground text-center mb-8">Our Values</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {values.map((value, index) => (
                <Card key={index} className="hover-elevate">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                    <p className="text-muted-foreground text-sm">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-foreground text-center mb-8">Why Work With Us?</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit, index) => (
                <Card key={index} className="hover-elevate">
                  <CardContent className="p-6 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-4">
                      <span className="material-symbols-outlined">{benefit.icon}</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Open Positions */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-foreground text-center mb-8">Open Positions</h2>
            <div className="space-y-6">
              {jobOpenings.map((job, index) => (
                <Card key={index} className="hover-elevate">
                  <CardHeader>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl" data-testid={`job-title-${index}`}>
                          {job.title}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {job.description}
                        </CardDescription>
                      </div>
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground lg:flex-shrink-0">
                        Apply Now
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="secondary">{job.department}</Badge>
                      <Badge variant="outline">{job.location}</Badge>
                      <Badge variant="outline">{job.type}</Badge>
                      <Badge variant="outline">{job.experience}</Badge>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Requirements:</h4>
                      <div className="flex flex-wrap gap-1">
                        {job.requirements.map((req, reqIndex) => (
                          <Badge key={reqIndex} variant="secondary" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Application Process */}
          <Card className="mb-16 hover-elevate">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-foreground text-center mb-8">Our Hiring Process</h2>
              <div className="grid gap-6 md:grid-cols-4">
                <div className="text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground mx-auto mb-4 font-bold">
                    1
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Apply Online</h3>
                  <p className="text-sm text-muted-foreground">Submit your application and resume through our careers page</p>
                </div>
                <div className="text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground mx-auto mb-4 font-bold">
                    2
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Initial Screening</h3>
                  <p className="text-sm text-muted-foreground">HR screening call to discuss your background and interests</p>
                </div>
                <div className="text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground mx-auto mb-4 font-bold">
                    3
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Technical Round</h3>
                  <p className="text-sm text-muted-foreground">Technical assessment or case study relevant to the role</p>
                </div>
                <div className="text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground mx-auto mb-4 font-bold">
                    4
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Final Interview</h3>
                  <p className="text-sm text-muted-foreground">Cultural fit and leadership discussion with the team</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card className="bg-gradient-to-br from-primary/10 to-accent/20 border-primary/20">
            <CardContent className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-primary mb-4 block">
                diversity_3
              </span>
              <h3 className="text-2xl font-bold text-foreground mb-4">Ready to Make an Impact?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join our diverse team of educators, engineers, and dreamers who are passionate about transforming education. 
                Together, we're building the future of learning.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Explore All Jobs
                </Button>
                <Button size="lg" variant="outline">
                  Refer a Friend
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}