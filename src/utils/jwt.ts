import { Role } from '@prisma/client';
import { Response } from 'express';
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_SECRET || 'jwtfallback';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refreshfallback';

export function signAccessToken(payload:JWTpayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '1m' });
}

export function verifyAccessToken(token: string): any | null {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch {
    return null;
  }
}

export function signRefreshToken(payload: object): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '30d' });
}

export function verifyRefreshToken(token: string): any | null {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch {
    return null;
  }
}

export function signJWT(res: Response, payload:JWTpayload): { accessToken: string, refreshToken: string } {
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return { accessToken, refreshToken };
}

// Helper function to create JWT payload with user info
export function createJWTPayload(user: any) {
  const payload: JWTpayload = {
    userId: user.id,
    role: user.role,
  };

  // Add role-specific IDs if they exist
  if (user.role === 'caregiver' && user.caregiver) {
    payload.caregiverId = user.caregiver.id;
  } else if (user.role === 'patient' && user.patient) {
    payload.patientId = user.patient.id;
  } else if (user.role === 'admin' && user.admin) {
    payload.adminId = user.admin.id;
  }

  return payload;
} 

// Type definition for JWT payload
export type JWTpayload = {
  userId: string | number;
  role: Role
  caregiverId?: string | number;
  patientId?: string | number;
  adminId?: string | number;
};