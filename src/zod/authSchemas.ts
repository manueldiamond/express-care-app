import { z } from 'zod';

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  fullname: z.string().min(1),
  role: z.string().min(1)
}); 