import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  hashedPassword: text("hashed_password"),
  examType: text("exam_type").notNull(), // "cat", "gate", "both"
  enrollmentDate: timestamp("enrollment_date").default(sql`now()`),
  isTrialUser: boolean("is_trial_user").default(true),
  currentStreak: integer("current_streak").default(0),
  totalScore: integer("total_score").default(0),
});

export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  examType: text("exam_type").notNull(), // "cat", "gate"
  duration: text("duration").notNull(),
  price: integer("price").notNull(),
  originalPrice: integer("original_price"),
  features: jsonb("features").notNull(), // array of strings
  imageUrl: text("image_url"),
  isPopular: boolean("is_popular").default(false),
});

export const studyMaterials = pgTable("study_materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  examType: text("exam_type").notNull(), // "cat", "gate"
  subject: text("subject").notNull(),
  type: text("type").notNull(), // "pdf", "video", "practice_set"
  pages: integer("pages"),
  rating: integer("rating").default(0), // out of 5
  reviewCount: integer("review_count").default(0),
  isPremium: boolean("is_premium").default(false),
  downloadUrl: text("download_url"),
  imageUrl: text("image_url"),
});

export const practiceTests = pgTable("practice_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  examType: text("exam_type").notNull(), // "cat", "gate"
  subject: text("subject").notNull(),
  duration: integer("duration").notNull(), // in minutes
  totalQuestions: integer("total_questions").notNull(),
  questions: jsonb("questions").notNull(), // array of question objects
});

export const testSessions = pgTable("test_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  testId: varchar("test_id").references(() => practiceTests.id).notNull(),
  startTime: timestamp("start_time").default(sql`now()`),
  endTime: timestamp("end_time"),
  score: integer("score"),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").default(0),
  answers: jsonb("answers").notNull(), // array of user answers
  isCompleted: boolean("is_completed").default(false),
});

export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  progressPercentage: integer("progress_percentage").default(0),
  lastAccessedAt: timestamp("last_accessed_at").default(sql`now()`),
  completedLessons: jsonb("completed_lessons").default([]),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  enrollmentDate: true,
  currentStreak: true,
  totalScore: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
});

export const insertStudyMaterialSchema = createInsertSchema(studyMaterials).omit({
  id: true,
  rating: true,
  reviewCount: true,
});

export const insertPracticeTestSchema = createInsertSchema(practiceTests).omit({
  id: true,
});

export const insertTestSessionSchema = createInsertSchema(testSessions).omit({
  id: true,
  startTime: true,
  endTime: true,
  score: true,
  correctAnswers: true,
  isCompleted: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  lastAccessedAt: true,
  progressPercentage: true,
  completedLessons: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type StudyMaterial = typeof studyMaterials.$inferSelect;
export type InsertStudyMaterial = z.infer<typeof insertStudyMaterialSchema>;

export type PracticeTest = typeof practiceTests.$inferSelect;
export type InsertPracticeTest = z.infer<typeof insertPracticeTestSchema>;

export type TestSession = typeof testSessions.$inferSelect;
export type InsertTestSession = z.infer<typeof insertTestSessionSchema>;

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

// Question interface
export interface Question {
  id: string;
  text: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer: 'a' | 'b' | 'c' | 'd';
  marks: number;
  negativeMarks: number;
  explanation?: string;
}

// User answer interface
export interface UserAnswer {
  questionId: string;
  selectedAnswer: 'a' | 'b' | 'c' | 'd' | null;
  timeSpent: number; // in seconds
  isMarkedForReview: boolean;
}
