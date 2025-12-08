import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Course } from "@shared/schema";

/**
 * Renders a page displaying available courses.
 *
 * This component fetches a list of all courses and allows users to filter
 * them by exam type (e.g., CAT, GATE). It displays course details in a card
 * format and provides an "Enroll Now" button for each course.
 *
 * @returns {JSX.Element} The rendered courses page.
 */
export default function Courses() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [selectedExamType, setSelectedExamType] = useState<string>("all");

  // Extract exam type from URL if provided
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const examTypeFromUrl = urlParams.get('exam');

  // Set initial filter from URL
  useState(() => {
    if (examTypeFromUrl && examTypeFromUrl !== selectedExamType) {
      setSelectedExamType(examTypeFromUrl);
    }
  });

  const { data: allCourses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Filter courses based on selected exam type
  const filteredCourses = allCourses?.filter(course => {
    if (selectedExamType === "all") return true;
    return course.examType === selectedExamType;
  }) || [];

  const handleEnrollment = (courseId: string, courseName: string) => {
    // In a real app, this would handle the enrollment process
    toast({
      title: "Enrollment Started",
      description: `You've started enrollment for ${courseName}. Complete payment to begin.`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Loading courses...</div>
            <div className="text-muted-foreground">Please wait</div>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
              Our Courses
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              Comprehensive preparation courses designed by experts to help you succeed in your target exam.
            </p>
          </div>

          {/* Filter */}
          <div className="flex justify-center mb-8">
            <Select value={selectedExamType} onValueChange={setSelectedExamType}>
              <SelectTrigger className="w-48" data-testid="filter-exam-type">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="cat">CAT Courses</SelectItem>
                <SelectItem value="gate">GATE Courses</SelectItem>
                <SelectItem value="xat">XAT Courses</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Tabs */}
          <div className="flex justify-center gap-2 mb-12">
            <Button
              variant={selectedExamType === "all" ? "default" : "outline"}
              onClick={() => setSelectedExamType("all")}
              className={selectedExamType === "all" ? "bg-primary text-primary-foreground" : ""}
              data-testid="tab-all-courses"
            >
              All Courses
            </Button>
            <Button
              variant={selectedExamType === "cat" ? "default" : "outline"}
              onClick={() => setSelectedExamType("cat")}
              className={selectedExamType === "cat" ? "bg-primary text-primary-foreground" : ""}
              data-testid="tab-cat-courses"
            >
              CAT Courses
            </Button>
            <Button
              variant={selectedExamType === "gate" ? "default" : "outline"}
              onClick={() => setSelectedExamType("gate")}
              className={selectedExamType === "gate" ? "bg-primary text-primary-foreground" : ""}
              data-testid="tab-gate-courses"
            >
              GATE Courses
            </Button>
            <Button
              variant={selectedExamType === "xat" ? "default" : "outline"}
              onClick={() => setSelectedExamType("xat")}
              className={selectedExamType === "xat" ? "bg-primary text-primary-foreground" : ""}
              data-testid="tab-xat-courses"
            >
              XAT Courses
            </Button>
          </div>

          {/* Courses Grid */}
          {filteredCourses.length > 0 ? (
            <div className="grid gap-8 lg:grid-cols-2">
              {filteredCourses.map((course) => (
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
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {course.examType.toUpperCase()}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl mb-3" data-testid={`course-title-${course.id}`}>
                      {course.title}
                    </CardTitle>
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
                        onClick={() => handleEnrollment(course.id, course.title)}
                        data-testid={`enroll-button-${course.id}`}
                      >
                        Enroll Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <span className="material-symbols-outlined text-6xl text-muted-foreground mb-4 block">school</span>
                <h3 className="text-xl font-semibold mb-2">No Courses Found</h3>
                <p className="text-muted-foreground mb-6">
                  {selectedExamType !== "all"
                    ? `No ${selectedExamType.toUpperCase()} courses available at the moment.`
                    : "Courses are currently being prepared. Please check back soon!"
                  }
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSelectedExamType("all")}
                  data-testid="view-all-courses"
                >
                  View All Courses
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}