"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_zod_all_1 = require("@mohit-kumar/common-zod-all");
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
dotenv_1.default.config();
const cors = require("cors");
const jwt = require('jsonwebtoken');
const app = (0, express_1.default)();
// Create Prisma client with explicit connection URL for testing
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || "postgres://default:XZWut63GHflL@ep-aged-lake-a4afsql9.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require"
        }
    }
});
// Log database connection
console.log('Database URL:', process.env.DATABASE_URL ? 'Set (first 20 chars): ' + process.env.DATABASE_URL.substring(0, 20) + '...' : 'Using fallback URL');
app.use(express_1.default.json());
app.use(cors());
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(authHeader, process.env.JWT_SECRET);
        // Ensure userId is treated as a number
        req.userId = Number(decoded.id);
        next();
    }
    catch (error) {
        res.status(500).json({ message: 'Invalid token' });
    }
});
// Signup Route - Simplified version for troubleshooting
app.post('/api/v1/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            const existingUser = yield prisma.user.findUnique({
                where: { email }
            });
            if (existingUser) {
                return res.status(409).json({ error: 'Email already in use' });
            }
        }
        catch (dbError) {
            console.error('Database error when checking for existing user:', dbError);
            return res.status(500).json({ error: 'Database error. Please try again later.' });
        }
        // Create user with direct values (bypassing Zod validation for troubleshooting)
        try {
            const user = yield prisma.user.create({
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
        }
        catch (createError) {
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
    }
    catch (error) {
        console.error('Signup error:', error);
        // Default error response
        return res.status(500).json({
            error: 'Error while signing up. Please try again later.',
            details: error.message
        });
    }
}));
// Signin Route - Simplified version for troubleshooting
app.post('/api/v1/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Signin request received:', req.body);
    try {
        // Extract data from request
        const { email, password } = req.body;
        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        // Find user by email
        const user = yield prisma.user.findUnique({
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
    }
    catch (error) {
        console.error('Signin error:', error);
        // Generic error response
        return res.status(500).json({
            error: 'Error while signing in. Please try again later.',
            details: error.message
        });
    }
}));
app.post('/api/v1/blog', authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, content } = req.body;
    const result = common_zod_all_1.createPostInput.safeParse({ title, content });
    if (!result.success) {
        return res.status(400).json({ error: 'Invalid input' });
    }
    try {
        // Ensure userId is a number
        const userId = Number(req.userId);
        const post = yield prisma.post.create({
            data: {
                title: result.data.title,
                content: result.data.content,
                authorId: userId,
            },
        });
        return res.json({ id: post.id });
    }
    catch (error) {
        return res.status(500).json({ error: 'An error occurred while creating the post' });
    }
}));
app.put('/api/v1/blog', authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, title, content } = req.body;
    const result = common_zod_all_1.updatePostInput.safeParse({ id, title, content });
    if (!result.success) {
        return res.status(400).json({ error: 'Invalid input' });
    }
    try {
        // Ensure userId is a number
        const userId = Number(req.userId);
        // Ensure id is a number
        const postId = Number(result.data.id);
        yield prisma.post.update({
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
    }
    catch (error) {
        return res.status(500).json({ error: 'An error occurred while updating the post' });
    }
}));
app.delete('/api/v1/blog/:id', authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    const userId = req.userId;
    try {
        yield prisma.post.delete({
            where: {
                id: id,
                authorId: userId
            },
        });
        return res.status(200).json({ message: 'Post deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ error: 'An error occurred' });
    }
}));
app.get('/api/v1/blog/:id', authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    try {
        const post = yield prisma.post.findUnique({
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
    }
    catch (error) {
        return res.status(500).json({ error: 'An error occurred' });
    }
}));
app.get('/api/v1/all-blog', authenticate, (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const posts = yield prisma.post.findMany({
            select: {
                id: true,
                title: true,
                content: true,
                createdAt: true,
                authorId: true,
                author: {
                    select: {
                        name: true,
                    }
                }
            }
        });
        return res.status(200).json(posts);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'An error occurred while fetching posts' });
    }
}));
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
