import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
              About PrepUp
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              Empowering students to achieve their dreams through comprehensive exam preparation.
            </p>
          </div>

          {/* Mission Section */}
          <Card className="mb-12 hover-elevate">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl">rocket_launch</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Our Mission</h2>
                <p className="text-muted-foreground leading-relaxed">
                  PrepUp is dedicated to transforming the way students prepare for competitive exams. We believe that with the right guidance, 
                  resources, and technology, every student can achieve their academic goals and secure their future.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Story Section */}
          <div className="grid gap-8 md:grid-cols-2 mb-12">
            <Card className="hover-elevate">
              <CardContent className="p-8">
                <div className="flex size-12 items-center justify-center rounded-full bg-accent text-primary mb-4">
                  <span className="material-symbols-outlined">history</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Our Story</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Founded in 2020 by a team of educators and technology enthusiasts, PrepUp emerged from the need for 
                  accessible, high-quality exam preparation resources. Our founders experienced firsthand the challenges 
                  students face and were determined to create a solution.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-8">
                <div className="flex size-12 items-center justify-center rounded-full bg-accent text-primary mb-4">
                  <span className="material-symbols-outlined">lightbulb</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Our Approach</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We combine proven teaching methodologies with cutting-edge technology to deliver personalized learning 
                  experiences. Our adaptive learning platform adjusts to each student's pace and learning style.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Team Section */}
          <Card className="mb-12 hover-elevate">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-foreground text-center mb-8">Our Team</h2>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">AS</span>
                  </div>
                  <h4 className="font-semibold text-foreground">Dr. Arjun Sharma</h4>
                  <p className="text-sm text-muted-foreground">Founder & CEO</p>
                  <p className="text-xs text-muted-foreground mt-2">Former IIT Professor with 15+ years of teaching experience</p>
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">PK</span>
                  </div>
                  <h4 className="font-semibold text-foreground">Priya Krishnan</h4>
                  <p className="text-sm text-muted-foreground">Head of Academics</p>
                  <p className="text-xs text-muted-foreground mt-2">CAT 99.9 percentiler and curriculum design expert</p>
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">RG</span>
                  </div>
                  <h4 className="font-semibold text-foreground">Rajesh Gupta</h4>
                  <p className="text-sm text-muted-foreground">Chief Technology Officer</p>
                  <p className="text-xs text-muted-foreground mt-2">EdTech veteran with expertise in AI and machine learning</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Section */}
          <div className="grid gap-6 md:grid-cols-4 mb-12">
            <Card className="text-center p-6 hover-elevate">
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-primary mb-2" data-testid="stat-students">25,000+</div>
                <div className="text-sm text-muted-foreground">Students Enrolled</div>
              </CardContent>
            </Card>
            <Card className="text-center p-6 hover-elevate">
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-primary mb-2" data-testid="stat-success-rate">95%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </CardContent>
            </Card>
            <Card className="text-center p-6 hover-elevate">
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-primary mb-2" data-testid="stat-practice-tests">500+</div>
                <div className="text-sm text-muted-foreground">Practice Tests</div>
              </CardContent>
            </Card>
            <Card className="text-center p-6 hover-elevate">
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-primary mb-2" data-testid="stat-years">4+</div>
                <div className="text-sm text-muted-foreground">Years of Excellence</div>
              </CardContent>
            </Card>
          </div>

          {/* Values Section */}
          <Card className="hover-elevate">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-foreground text-center mb-8">Our Values</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex items-start gap-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                    <span className="material-symbols-outlined">emoji_people</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Student-Centric</h4>
                    <p className="text-sm text-muted-foreground">Every decision we make is focused on improving student outcomes and experience.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                    <span className="material-symbols-outlined">high_quality</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Excellence</h4>
                    <p className="text-sm text-muted-foreground">We maintain the highest standards in content quality and teaching methodologies.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                    <span className="material-symbols-outlined">emoji_people</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Innovation</h4>
                    <p className="text-sm text-muted-foreground">We continuously evolve our platform using the latest educational technology.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                    <span className="material-symbols-outlined">accessibility</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Accessibility</h4>
                    <p className="text-sm text-muted-foreground">Quality education should be accessible to students from all backgrounds.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}