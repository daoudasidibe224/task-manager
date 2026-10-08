import { registerAs } from '@nestjs/config';
export default registerAs('auth', () => {
  const jwtSecret = process.env.JWT_SECRET,
    refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
  if (
    !jwtSecret ||
    jwtSecret.length < 32 ||
    !refreshTokenSecret ||
    refreshTokenSecret.length < 32 ||
    jwtSecret === refreshTokenSecret
  )
    throw new Error(
      'JWT_SECRET et REFRESH_TOKEN_SECRET doivent être distincts et contenir au moins 32 caractères.',
    );
  return { jwtSecret, refreshTokenSecret, bcryptRounds: 12 };
});
