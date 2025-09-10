import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertTestSessionSchema,
  type UserAnswer
} from "@shared/schema";
import { z } from "zod";

// WebSocket connection store
const clients = new Map<string, WebSocket[]>();

// Function to broadcast bookmark changes to all clients for a user
function broadcastBookmarkUpdate(userId: string, action: 'create' | 'delete', bookmark: any) {
  const userClients = clients.get(userId);
  if (userClients) {
    const message = JSON.stringify({
      type: 'bookmark_update',
      action,
      data: bookmark
    });
    
    userClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
    
    // Clean up closed connections
    clients.set(userId, userClients.filter(client => client.readyState === WebSocket.OPEN));
  }
}

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

  // Bookmark proxy routes that broadcast changes
  app.post("/api/bookmarks/create", async (req, res) => {
    try {
      const { userId, subject, question_id } = req.body;
      
      // Forward to Django auth server
      const authResponse = await fetch(`http://localhost:8000/api/auth/bookmarks/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || '',
        },
        body: JSON.stringify({ subject, question_id }),
      });
      
      if (!authResponse.ok) {
        return res.status(authResponse.status).json({ error: 'Failed to create bookmark' });
      }
      
      const bookmark = await authResponse.json();
      
      // Broadcast to all clients for this user
      if (userId) {
        broadcastBookmarkUpdate(userId, 'create', { subject, question_id });
      }
      
      res.json(bookmark);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.delete("/api/bookmarks/delete/:questionId", async (req, res) => {
    try {
      const { questionId } = req.params;
      const { userId, subject } = req.query;
      
      // Forward to Django auth server
      const authResponse = await fetch(`http://localhost:8000/api/auth/bookmarks/delete/${questionId}/?subject=${subject}`, {
        method: 'DELETE',
        headers: {
          'Authorization': req.headers.authorization || '',
        },
      });
      
      if (!authResponse.ok) {
        return res.status(authResponse.status).json({ error: 'Failed to delete bookmark' });
      }
      
      // Broadcast to all clients for this user
      if (userId) {
        broadcastBookmarkUpdate(userId as string, 'delete', { subject, question_id: questionId });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer });
  
  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'auth' && message.userId) {
          // Associate this WebSocket connection with a user
          const userId = message.userId;
          if (!clients.has(userId)) {
            clients.set(userId, []);
          }
          clients.get(userId)!.push(ws);
          
          console.log(`WebSocket authenticated for user: ${userId}`);
          
          // Send confirmation
          ws.send(JSON.stringify({ type: 'auth_success', userId }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      // Clean up this connection from all user lists
      for (const [userId, userClients] of clients.entries()) {
        const filteredClients = userClients.filter(client => client !== ws);
        if (filteredClients.length === 0) {
          clients.delete(userId);
        } else {
          clients.set(userId, filteredClients);
        }
      }
    });
  });
  
  return httpServer;
}
