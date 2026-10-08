import type { UserResponseDto } from '../../user/dto/user-response.dto.js';
import { z } from 'zod';
export interface AuthenticatedUser extends UserResponseDto {
  sessionId: string;
}
export const jwtPayloadSchema = z.object({
  sub: z.string(),
  email: z.email(),
  sid: z.uuid(),
});
export type JwtPayload = z.infer<typeof jwtPayloadSchema>;
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
