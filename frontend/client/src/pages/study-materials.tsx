import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { StudyMaterial } from "@shared/schema";

export default function StudyMaterials() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExamType, setSelectedExamType] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  const { data: allMaterials, isLoading } = useQuery<StudyMaterial[]>({
    queryKey: ["/api/study-materials"],
  });

  // Filter materials based on search and filters
  const filteredMaterials = allMaterials?.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExamType = selectedExamType === "all" || material.examType === selectedExamType;
    const matchesSubject = selectedSubject === "all" || material.subject === selectedSubject;
    
    return matchesSearch && matchesExamType && matchesSubject;
  }) || [];

  // Get unique subjects for filter
  const subjects = Array.from(new Set(allMaterials?.map(m => m.subject) || []));

  const handleDownload = (material: StudyMaterial) => {
    // In a real app, this would handle the actual download
    console.log("Downloading:", material.title);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Loading study materials...</div>
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
              Study Materials Library
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              Access comprehensive study materials organized by subjects and difficulty levels.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="search-materials"
              />
            </div>
            <Select value={selectedExamType} onValueChange={setSelectedExamType}>
              <SelectTrigger className="md:w-48" data-testid="filter-exam-type">
                <SelectValue placeholder="All Exams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exams</SelectItem>
                <SelectItem value="cat">CAT</SelectItem>
                <SelectItem value="gate">GATE</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="md:w-48" data-testid="filter-subject">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            <Button 
              variant={selectedExamType === "all" ? "default" : "outline"}
              onClick={() => setSelectedExamType("all")}
              className={selectedExamType === "all" ? "bg-primary text-primary-foreground" : ""}
              data-testid="tab-all-materials"
            >
              All Materials
            </Button>
            <Button 
              variant={selectedExamType === "cat" ? "default" : "outline"}
              onClick={() => setSelectedExamType("cat")}
              className={selectedExamType === "cat" ? "bg-primary text-primary-foreground" : ""}
              data-testid="tab-cat-materials"
            >
              CAT Materials
            </Button>
            <Button 
              variant={selectedExamType === "gate" ? "default" : "outline"}
              onClick={() => setSelectedExamType("gate")}
              className={selectedExamType === "gate" ? "bg-primary text-primary-foreground" : ""}
              data-testid="tab-gate-materials"
            >
              GATE Materials
            </Button>
          </div>

          {/* Materials Grid */}
          {filteredMaterials.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredMaterials.map((material) => (
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
                    <CardTitle className="mb-2" data-testid={`material-title-${material.id}`}>
                      {material.title}
                    </CardTitle>
                    <CardDescription className="mb-4">
                      {material.description}
                    </CardDescription>
                    
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
                      onClick={() => handleDownload(material)}
                      data-testid={`download-material-${material.id}`}
                    >
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <span className="material-symbols-outlined text-6xl text-muted-foreground mb-4 block">auto_stories</span>
                <h3 className="text-xl font-semibold mb-2">No Materials Found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || selectedExamType !== "all" || selectedSubject !== "all"
                    ? "Try adjusting your search or filters to find more materials."
                    : "Study materials are currently being prepared. Please check back soon!"
                  }
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedExamType("all");
                    setSelectedSubject("all");
                  }}
                  data-testid="clear-filters"
                >
                  Clear Filters
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
