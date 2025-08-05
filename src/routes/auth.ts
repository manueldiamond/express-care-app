import { Router, Request, Response } from 'express';
import { registerSchema } from '../zod/authSchemas';
import { hashPassword, comparePassword } from '../utils/password';
import { signJWT, verifyAccessToken, verifyRefreshToken, createJWTPayload, JWTpayload } from '../utils/jwt';
import { createUser, getUserByEmail, getUserById, getUserWithProfiles } from '../db/user';
import requireAuth from '../middleware/requireAuth';
import z from 'zod';
import { Role } from '@prisma/client';

const authRoutes = Router();

authRoutes.get('/register', (req: Request, res: Response) => {
  console.log('[AUTH] GET /register - Register endpoint accessed');
  res.json({ message: 'Register endpoint is working (GET)' });
});

authRoutes.post('/register', async (req: Request, res: Response) => {
  console.log('[AUTH] POST /register - Registration attempt started', { 
    body: { ...req.body, password: '[REDACTED]' },
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  console.log('[AUTH] POST /register - Validating request body');
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    console.log('[AUTH] POST /register - Validation failed', { 
      errors: z.treeifyError(parseResult.error) 
    });
    return res.status(400).json({ error: 'Invalid input', details: z.treeifyError(parseResult.error) });
  }

  const { email, password, fullname, role } = parseResult.data;
  
  // Reject admin registration through public endpoint
  if (role === 'admin') {
    console.log('[AUTH] POST /register - Admin registration rejected', { email, fullname, role });
    return res.status(403).json({ error: 'Admin registration not allowed through public endpoint' });
  }
  
  console.log('[AUTH] POST /register - Validation successful', { email, fullname, role });

  console.log('[AUTH] POST /register - Checking if user already exists');
  const existing = await getUserByEmail(email);
  if (existing) {
    console.log('[AUTH] POST /register - User already exists', { email });
    return res.status(409).json({ error: 'User already exists' });
  }

  console.log('[AUTH] POST /register - Hashing password');
  const passwordHash = await hashPassword(password);
  console.log('[AUTH] POST /register - Password hashed successfully');

  console.log('[AUTH] POST /register - Creating user in database');
  const user = await createUser(email, passwordHash, fullname, role as Role);
  console.log('[AUTH] POST /register - User created successfully', { userId: user.id, email, role: user.role });

  console.log('[AUTH] POST /register - Generating JWT token with role info');
  const jwtPayload = createJWTPayload(user);
  const token = signJWT(res, jwtPayload);
  console.log('[AUTH] POST /register - Registration completed successfully', { 
    userId: user.id, 
    email, 
    role: user.role,
    jwtPayload: { ...jwtPayload, userId: jwtPayload.userId } // Log payload without sensitive data
  });
  
  res.json({ token });
});

authRoutes.post('/login', async (req: Request, res: Response) => {
  console.log('[AUTH] POST /login - Login attempt started', { 
    body: { ...req.body, password: '[REDACTED]' },
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  const { email, password } = req.body;
  if (!email || !password) {
    console.log('[AUTH] POST /login - Missing email or password');
    return res.status(400).json({ error: 'Email and password required' });
  }

  console.log('[AUTH] POST /login - Looking up user by email');
  const user = await getUserByEmail(email);
  if (!user || typeof user.passwordHash !== 'string') {
    console.log('[AUTH] POST /login - User not found or invalid password hash', { email });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  console.log('[AUTH] POST /login - Getting user with profiles for JWT payload');
  const userWithProfiles = await getUserWithProfiles(user.id);
  if (!userWithProfiles) {
    console.log('[AUTH] POST /login - Failed to get user with profiles', { userId: user.id });
    return res.status(500).json({ error: 'Failed to get user profile' });
  }

  console.log('[AUTH] POST /login - Comparing passwords');
  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    console.log('[AUTH] POST /login - Password comparison failed', { email });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  console.log('[AUTH] POST /login - Password verified, generating token with role info');
  const jwtPayload = createJWTPayload(userWithProfiles);
  const token = signJWT(res, jwtPayload);
  console.log('[AUTH] POST /login - Login successful', { 
    userId: user.id, 
    email, 
    role: user.role,
    jwtPayload: { ...jwtPayload, userId: jwtPayload.userId } // Log payload without sensitive data
  });
  
  res.json({ token, user: userWithProfiles });
});

authRoutes.post('/refresh', (req: Request, res: Response) => {
  console.log('[AUTH] POST /refresh - Token refresh attempt started', { 
    body: { ...req.body, refreshToken: req.body.refreshToken ? '[REDACTED]' : undefined },
    ip: req.ip
  });

  const {refreshToken} = req.body
  if (!refreshToken) {
    console.log('[AUTH] POST /refresh - Missing refresh token');
    return res.status(401).json({ error: 'Missing refresh token' });
  }

  console.log('[AUTH] POST /refresh - Verifying refresh token');
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    console.log('[AUTH] POST /refresh - Invalid refresh token');
    return res.status(401).json({ error: 'Invalid token' });
  }

  console.log('[AUTH] POST /refresh - Refresh token valid, generating new tokens');
  const tokens = signJWT(res, {
    userId: payload.userId,
    role: payload.role,
    caregiverId: payload.caregiverId,
    patientId: payload.patientId,
    adminId: payload.adminId
  }as JWTpayload);
  console.log('[AUTH] POST /refresh - Token refresh successful', { userId: payload.userId });
  
  res.json({tokens});
});

authRoutes.post('/logout', (req: Request, res: Response) => {
  console.log('[AUTH] POST /logout - Logout attempt started', { 
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  console.log('[AUTH] POST /logout - Clearing refresh token cookie');
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  
  console.log('[AUTH] POST /logout - Logout completed successfully');
  res.json({ message: 'Logged out and refresh token revoked.' });
});

authRoutes.get('/me', requireAuth, async (req: Request & { user?: any }, res: Response) => {
  console.log('[AUTH] GET /me - User profile request', { 
    userId: req.user?.userId,
    ip: req.ip
  });

  console.log('[AUTH] GET /me - Fetching user by ID');
  const user = await getUserById(req.user.userId);
  if (!user) {
    console.log('[AUTH] GET /me - User not found', { userId: req.user.userId });
    return res.status(404).json({ error: 'User not found' });
  }

  console.log('[AUTH] GET /me - User profile retrieved successfully', { userId: user.id, email: user.email });
  res.json({ id: user.id, email: user.email });
});

authRoutes.get('/auth/google', (req: Request, res: Response) => {
  console.log('[AUTH] GET /auth/google - Google OAuth endpoint accessed (not implemented)');
  res.status(501).json({ error: 'Google OAuth not implemented yet' });
});

authRoutes.get('/auth/facebook', (req: Request, res: Response) => {
  console.log('[AUTH] GET /auth/facebook - Facebook OAuth endpoint accessed (not implemented)');
  res.status(501).json({ error: 'Facebook OAuth not implemented yet' });
});

export default authRoutes; 