import { 
  type User, 
  type InsertUser, 
  type Course,
  type InsertCourse,
  type StudyMaterial,
  type InsertStudyMaterial,
  type PracticeTest,
  type InsertPracticeTest,
  type TestSession,
  type InsertTestSession,
  type UserProgress,
  type InsertUserProgress,
  type Question
} from "@shared/schema";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Course methods
  getCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  getCoursesByExamType(examType: string): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;

  // Study material methods
  getStudyMaterials(): Promise<StudyMaterial[]>;
  getStudyMaterial(id: string): Promise<StudyMaterial | undefined>;
  getStudyMaterialsByExamType(examType: string): Promise<StudyMaterial[]>;
  getStudyMaterialsBySubject(subject: string): Promise<StudyMaterial[]>;
  createStudyMaterial(material: InsertStudyMaterial): Promise<StudyMaterial>;

  // Practice test methods
  getPracticeTests(): Promise<PracticeTest[]>;
  getPracticeTest(id: string): Promise<PracticeTest | undefined>;
  getPracticeTestsByExamType(examType: string): Promise<PracticeTest[]>;
  createPracticeTest(test: InsertPracticeTest): Promise<PracticeTest>;

  // Mock test methods
  getMockTests(): Promise<PracticeTest[]>;
  getMockTest(id: string): Promise<PracticeTest | undefined>;

  // Test session methods
  getTestSession(id: string): Promise<TestSession | undefined>;
  getTestSessionsByUser(userId: string): Promise<TestSession[]>;
  createTestSession(session: InsertTestSession): Promise<TestSession>;
  updateTestSession(id: string, updates: Partial<TestSession>): Promise<TestSession | undefined>;

  // User progress methods
  getUserProgress(userId: string): Promise<UserProgress[]>;
  getUserProgressByCourse(userId: string, courseId: string): Promise<UserProgress | undefined>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(id: string, updates: Partial<UserProgress>): Promise<UserProgress | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private courses: Map<string, Course>;
  private studyMaterials: Map<string, StudyMaterial>;
  private practiceTests: Map<string, PracticeTest>;
  private mockTests: Map<string, PracticeTest>;
  private testSessions: Map<string, TestSession>;
  private userProgress: Map<string, UserProgress>;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.studyMaterials = new Map();
    this.practiceTests = new Map();
    this.mockTests = new Map();
    this.testSessions = new Map();
    this.userProgress = new Map();
    
    this.seedData();
  }

  private loadQuestionsFromFile(filePath: string): Question[] {
    try {
      const fullPath = join(process.cwd(), filePath);
      const fileContent = readFileSync(fullPath, 'utf-8');
      const data = JSON.parse(fileContent);
      return data.questions;
    } catch (error) {
      console.warn(`Failed to load questions from ${filePath}:`, error);
      return [];
    }
  }

  private seedData() {
    // Seed courses
    const catCourse: Course = {
      id: randomUUID(),
      title: "CAT Preparation Course",
      description: "Complete preparation for Common Admission Test with quantitative aptitude, verbal ability, and data interpretation.",
      examType: "cat",
      duration: "6 months comprehensive program",
      price: 15999,
      originalPrice: 25999,
      features: ["200+ practice tests", "Expert mentorship", "Comprehensive study materials", "Mock interviews"],
      imageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
      isPopular: true
    };

    const gateCourse: Course = {
      id: randomUUID(),
      title: "GATE Preparation Course",
      description: "Comprehensive preparation for Graduate Aptitude Test in Engineering across all major branches.",
      examType: "gate",
      duration: "8 months intensive program",
      price: 18999,
      originalPrice: 28999,
      features: ["300+ practice tests", "All engineering branches", "Expert guidance", "Live doubt sessions"],
      imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
      isPopular: false
    };

    this.courses.set(catCourse.id, catCourse);
    this.courses.set(gateCourse.id, gateCourse);

    // Seed study materials
    const materials: StudyMaterial[] = [
      {
        id: randomUUID(),
        title: "Advanced Data Interpretation",
        description: "Comprehensive guide covering all types of DI questions with detailed solutions and shortcuts.",
        examType: "cat",
        subject: "Quantitative",
        type: "pdf",
        pages: 120,
        rating: 5,
        reviewCount: 324,
        isPremium: true,
        downloadUrl: "#",
        imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300"
      },
      {
        id: randomUUID(),
        title: "Digital Electronics Fundamentals",
        description: "Essential concepts in digital electronics with practice problems and solutions.",
        examType: "gate",
        subject: "Electronics",
        type: "pdf",
        pages: 95,
        rating: 5,
        reviewCount: 198,
        isPremium: false,
        downloadUrl: "#",
        imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300"
      },
      {
        id: randomUUID(),
        title: "Quick Math Formula Handbook",
        description: "Essential formulas and shortcuts for quantitative aptitude section.",
        examType: "cat",
        subject: "Mathematics",
        type: "pdf",
        pages: 45,
        rating: 5,
        reviewCount: 512,
        isPremium: true,
        downloadUrl: "#",
        imageUrl: "https://images.unsplash.com/photo-1635372722656-389f87a941b7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300"
      }
    ];

    materials.forEach(material => {
      this.studyMaterials.set(material.id, material);
    });

    // Seed practice tests from JSON files
    const practiceTestsData = [
      {
        title: "CAT Quantitative Aptitude Test",
        examType: "cat",
        subject: "Quantitative Aptitude",
        duration: 90,
        filePath: "data/cat/quantitative-aptitude.json"
      },
      {
        title: "CAT Verbal Ability Test",
        examType: "cat", 
        subject: "Verbal Ability",
        duration: 60,
        filePath: "data/cat/verbal-ability.json"
      },
      {
        title: "CAT Data Interpretation Test",
        examType: "cat",
        subject: "Data Interpretation",
        duration: 60,
        filePath: "data/cat/data-interpretation.json"
      },
      {
        title: "GATE Mathematics Test",
        examType: "gate",
        subject: "Mathematics",
        duration: 90,
        filePath: "data/gate/mathematics.json"
      },
      {
        title: "GATE General Aptitude Test",
        examType: "gate",
        subject: "General Aptitude", 
        duration: 60,
        filePath: "data/gate/general-aptitude.json"
      },
      {
        title: "GATE Computer Science Test",
        examType: "gate",
        subject: "Computer Science",
        duration: 120,
        filePath: "data/gate/computer-science.json"
      }
    ];

    practiceTestsData.forEach(testData => {
      const questions = this.loadQuestionsFromFile(testData.filePath);
      if (questions.length > 0) {
        const practiceTest: PracticeTest = {
          id: randomUUID(),
          title: testData.title,
          examType: testData.examType,
          subject: testData.subject,
          duration: testData.duration,
          totalQuestions: questions.length,
          questions: questions
        };
        
        this.practiceTests.set(practiceTest.id, practiceTest);
      }
    });

    // Seed mock tests from JSON files
    const mockTestsData = [
      {
        title: "CAT Mock Test 1",
        examType: "cat",
        subject: "General",
        duration: 120,
        filePath: "data/cat/mock-test-1.json"
      }
    ];

    mockTestsData.forEach(testData => {
      const fileContent = readFileSync(join(process.cwd(), testData.filePath), 'utf-8');
      const data = JSON.parse(fileContent);
      const questions = data.questions;
      if (questions.length > 0) {
        const mockTest: PracticeTest = {
          id: data.id,
          title: testData.title,
          examType: testData.examType,
          subject: testData.subject,
          duration: testData.duration,
          totalQuestions: questions.length,
          questions: questions
        };

        this.mockTests.set(mockTest.id, mockTest);
      }
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      enrollmentDate: new Date(),
      isTrialUser: true,
      currentStreak: 0,
      totalScore: 0,
      hashedPassword: insertUser.hashedPassword || null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Course methods
  async getCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async getCourse(id: string): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCoursesByExamType(examType: string): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(course => course.examType === examType);
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = randomUUID();
    const course: Course = { 
      ...insertCourse, 
      id,
      originalPrice: insertCourse.originalPrice || null,
      imageUrl: insertCourse.imageUrl || null,
      isPopular: insertCourse.isPopular || null
    };
    this.courses.set(id, course);
    return course;
  }

  // Study material methods
  async getStudyMaterials(): Promise<StudyMaterial[]> {
    return Array.from(this.studyMaterials.values());
  }

  async getStudyMaterial(id: string): Promise<StudyMaterial | undefined> {
    return this.studyMaterials.get(id);
  }

  async getStudyMaterialsByExamType(examType: string): Promise<StudyMaterial[]> {
    return Array.from(this.studyMaterials.values()).filter(material => material.examType === examType);
  }

  async getStudyMaterialsBySubject(subject: string): Promise<StudyMaterial[]> {
    return Array.from(this.studyMaterials.values()).filter(material => material.subject === subject);
  }

  async createStudyMaterial(insertMaterial: InsertStudyMaterial): Promise<StudyMaterial> {
    const id = randomUUID();
    const material: StudyMaterial = { 
      ...insertMaterial, 
      id,
      rating: 0,
      reviewCount: 0,
      imageUrl: insertMaterial.imageUrl || null,
      pages: insertMaterial.pages || null,
      isPremium: insertMaterial.isPremium || null,
      downloadUrl: insertMaterial.downloadUrl || null
    };
    this.studyMaterials.set(id, material);
    return material;
  }

  // Practice test methods
  async getPracticeTests(): Promise<PracticeTest[]> {
    return Array.from(this.practiceTests.values());
  }

  async getPracticeTest(id: string): Promise<PracticeTest | undefined> {
    return this.practiceTests.get(id);
  }

  async getPracticeTestsByExamType(examType: string): Promise<PracticeTest[]> {
    return Array.from(this.practiceTests.values()).filter(test => test.examType === examType);
  }

  async createPracticeTest(insertTest: InsertPracticeTest): Promise<PracticeTest> {
    const id = randomUUID();
    const test: PracticeTest = { ...insertTest, id };
    this.practiceTests.set(id, test);
    return test;
  }

  // Mock test methods
  async getMockTests(): Promise<PracticeTest[]> {
    return Array.from(this.mockTests.values());
  }

  async getMockTest(id: string): Promise<PracticeTest | undefined> {
    return this.mockTests.get(id);
  }

  // Test session methods
  async getTestSession(id: string): Promise<TestSession | undefined> {
    return this.testSessions.get(id);
  }

  async getTestSessionsByUser(userId: string): Promise<TestSession[]> {
    return Array.from(this.testSessions.values()).filter(session => session.userId === userId);
  }

  async createTestSession(insertSession: InsertTestSession): Promise<TestSession> {
    const id = randomUUID();
    const session: TestSession = { 
      ...insertSession, 
      id,
      startTime: new Date(),
      endTime: null,
      score: null,
      correctAnswers: 0,
      isCompleted: false
    };
    this.testSessions.set(id, session);
    return session;
  }

  async updateTestSession(id: string, updates: Partial<TestSession>): Promise<TestSession | undefined> {
    const session = this.testSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates };
    this.testSessions.set(id, updatedSession);
    return updatedSession;
  }

  // User progress methods
  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return Array.from(this.userProgress.values()).filter(progress => progress.userId === userId);
  }

  async getUserProgressByCourse(userId: string, courseId: string): Promise<UserProgress | undefined> {
    return Array.from(this.userProgress.values()).find(
      progress => progress.userId === userId && progress.courseId === courseId
    );
  }

  async createUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const id = randomUUID();
    const progress: UserProgress = { 
      ...insertProgress, 
      id,
      progressPercentage: 0,
      lastAccessedAt: new Date(),
      completedLessons: []
    };
    this.userProgress.set(id, progress);
    return progress;
  }

  async updateUserProgress(id: string, updates: Partial<UserProgress>): Promise<UserProgress | undefined> {
    const progress = this.userProgress.get(id);
    if (!progress) return undefined;
    
    const updatedProgress = { ...progress, ...updates };
    this.userProgress.set(id, updatedProgress);
    return updatedProgress;
  }
}

export const storage = new MemStorage();
