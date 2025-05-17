import { createPostInput, updatePostInput } from "@mohit-kumar/common-zod-all";
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
dotenv.config();
const cors = require("cors");
const jwt = require('jsonwebtoken');

const app = express();

// Create Prisma client with explicit connection URL for testing
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgres://default:XZWut63GHflL@ep-aged-lake-a4afsql9.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require"
    }
  }
});

// Log database connection
console.log('Database URL:', process.env.DATABASE_URL ? 'Set (first 20 chars): ' + process.env.DATABASE_URL.substring(0, 20) + '...' : 'Using fallback URL');

app.use(express.json());
app.use(cors())




const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(authHeader, process.env.JWT_SECRET);
    // Ensure userId is treated as a number
    (req as any).userId = Number(decoded.id);
    next();
  } catch (error) {
    res.status(500).json({ message: 'Invalid token' });
  }
};




// Signup Route - Simplified version for troubleshooting
app.post('/api/v1/signup', async (req: Request, res: Response) => {
  console.log('Signup request received:', req.body);
  console.log('Database URL:', process.env.DATABASE_URL ? 'Set (first 20 chars): ' + process.env.DATABASE_URL.substring(0, 20) + '...' : 'Not set');
  console.log('JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'Not set');

  try {
    // Extract data from request
    const { email, password, name } = req.body;

    // Basic validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if email already exists - using a try/catch to handle potential DB errors
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    } catch (dbError) {
      console.error('Database error when checking for existing user:', dbError);
      return res.status(500).json({ error: 'Database error. Please try again later.' });
    }

    // Create user with direct values (bypassing Zod validation for troubleshooting)
    try {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password,
        },
      });

      console.log('User created successfully:', { id: user.id, name: user.name });

      // Generate JWT token with a hardcoded secret if environment variable is missing
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-testing';
      const token = jwt.sign({ id: user.id }, jwtSecret);

      // Return success response
      return res.status(200).json({
        jwt: token,
        name: user.name,
        id: user.id
      });
    } catch (createError: any) {
      console.error('Error creating user:', createError);

      // Handle specific Prisma errors
      if (createError.code === 'P2002') {
        return res.status(409).json({ error: 'Email already in use' });
      }

      // Handle other database errors
      return res.status(500).json({
        error: 'Failed to create user account. Please try again later.',
        details: createError.message
      });
    }
  } catch (error: any) {
    console.error('Signup error:', error);

    // Default error response
    return res.status(500).json({
      error: 'Error while signing up. Please try again later.',
      details: error.message
    });
  }
});




// Signin Route - Simplified version for troubleshooting
app.post('/api/v1/signin', async (req: Request, res: Response) => {
  console.log('Signin request received:', req.body);

  try {
    // Extract data from request
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Check if user exists
    if (!user) {
      return res.status(401).json({ error: 'User not found with this email' });
    }

    // Check if password matches
    if (user.password !== password) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    console.log('User authenticated successfully:', { id: user.id, name: user.name });

    // Generate JWT token with a hardcoded secret if environment variable is missing
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-testing';
    const token = jwt.sign({ id: user.id }, jwtSecret);

    // Return success response
    return res.status(200).json({
      jwt: token,
      name: user.name,
      id: user.id
    });
  } catch (error: any) {
    console.error('Signin error:', error);

    // Generic error response
    return res.status(500).json({
      error: 'Error while signing in. Please try again later.',
      details: error.message
    });
  }
});





app.post('/api/v1/blog', authenticate, async (req: Request, res: Response) => {
  const { title, content } = req.body;
  const result = createPostInput.safeParse({ title, content });

  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input'});
  }

  try {
    // Ensure userId is a number
    const userId = Number((req as any).userId);
    const post = await prisma.post.create({
      data: {
        title: result.data.title,
        content: result.data.content,
        authorId: userId,
      },
    });
    return res.json({ id: post.id });
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred while creating the post' });
  }
});





app.put('/api/v1/blog', authenticate, async (req: Request, res: Response) => {
  const { id, title, content } = req.body;
  const result = updatePostInput.safeParse({ id, title, content });

  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input'});
  }
  try {
    // Ensure userId is a number
    const userId = Number((req as any).userId);
    // Ensure id is a number
    const postId = Number(result.data.id);
    await prisma.post.update({
      where: {
        id: postId,
        authorId: userId,
      },
      data: {
        title: result.data.title,
        content: result.data.content,
      },
    });
    return res.status(200).json({ message: 'Updated post' });
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred while updating the post' });
  }
});




app.delete('/api/v1/blog/:id', authenticate, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const userId = (req as any).userId;
  try {
    await prisma.post.delete({
      where: {
        id:id,
        authorId:userId
       },
    });
    return res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred' });
  }
});




app.get('/api/v1/blog/:id', authenticate, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    return res.status(200).json(post);
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred' });
  }
});




app.get('/api/v1/all-blog', authenticate, async (_req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        createdAt:true,
        authorId:true,
        author: {
          select: {
            name: true,
          }
        }
      }
    });

    return res.status(200).json(posts);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'An error occurred while fetching posts' });
  }
});








const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});