import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertTestSessionSchema,
  type UserAnswer
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Course routes
  app.get("/api/courses", async (req, res) => {
    try {
      const examType = req.query.examType as string;
      const courses = examType 
        ? await storage.getCoursesByExamType(examType)
        : await storage.getCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Study materials routes
  app.get("/api/study-materials", async (req, res) => {
    try {
      const examType = req.query.examType as string;
      const subject = req.query.subject as string;
      
      let materials;
      if (examType) {
        materials = await storage.getStudyMaterialsByExamType(examType);
      } else if (subject) {
        materials = await storage.getStudyMaterialsBySubject(subject);
      } else {
        materials = await storage.getStudyMaterials();
      }
      
      res.json(materials);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/study-materials/:id", async (req, res) => {
    try {
      const material = await storage.getStudyMaterial(req.params.id);
      if (!material) {
        return res.status(404).json({ error: "Study material not found" });
      }
      res.json(material);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Practice test routes
  app.get("/api/practice-tests", async (req, res) => {
    try {
      const examType = req.query.examType as string;
      const tests = examType 
        ? await storage.getPracticeTestsByExamType(examType)
        : await storage.getPracticeTests();
      res.json(tests);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/practice-tests/:id", async (req, res) => {
    try {
      const test = await storage.getPracticeTest(req.params.id);
      if (!test) {
        return res.status(404).json({ error: "Practice test not found" });
      }
      res.json(test);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Mock test routes
  app.get("/api/mock-tests", async (req, res) => {
    try {
      const tests = await storage.getMockTests();
      res.json(tests);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/mock-tests/:id", async (req, res) => {
    try {
      const test = await storage.getMockTest(req.params.id);
      if (!test) {
        return res.status(404).json({ error: "Mock test not found" });
      }
      res.json(test);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Sectional test routes
  app.get("/api/sectional-tests", async (req, res) => {
    try {
      const tests = await storage.getSectionalTests();
      res.json(tests);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/sectional-tests/:id", async (req, res) => {
    try {
      const test = await storage.getSectionalTest(req.params.id);
      if (!test) {
        return res.status(404).json({ error: "Sectional test not found" });
      }
      res.json(test);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Test session routes
  app.post("/api/test-sessions", async (req, res) => {
    try {
      const sessionData = insertTestSessionSchema.parse(req.body);
      const session = await storage.createTestSession(sessionData);
      res.json(session);
    } catch (error) {
      res.status(400).json({ error: "Invalid session data" });
    }
  });

  app.get("/api/test-sessions/:id", async (req, res) => {
    try {
      const session = await storage.getTestSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Test session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/test-sessions/:id", async (req, res) => {
    try {
      const updates = req.body;
      const session = await storage.updateTestSession(req.params.id, updates);
      if (!session) {
        return res.status(404).json({ error: "Test session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users/:userId/test-sessions", async (req, res) => {
    try {
      const sessions = await storage.getTestSessionsByUser(req.params.userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // User progress routes
  app.get("/api/users/:userId/progress", async (req, res) => {
    try {
      const progress = await storage.getUserProgress(req.params.userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users/:userId/progress/:courseId", async (req, res) => {
    try {
      const progress = await storage.getUserProgressByCourse(
        req.params.userId, 
        req.params.courseId
      );
      if (!progress) {
        return res.status(404).json({ error: "Progress not found" });
      }
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
