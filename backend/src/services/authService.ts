import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { authRepository } from '../repositories/authRepository.js';
import { CustomError } from '../middlewares/customError.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const authService = {
  async register(email: string, passwordPlain: string, name: string) {
    // Hashear contraseña de forma segura antes del INSERT
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordPlain, salt);

    try {
      const userId = await authRepository.registerUser(email, passwordHash, name);
      return { userId, message: 'Usuario registrado con éxito.' };
    } catch (error: any) {
      if (error.message && error.message.includes('EMAIL_ALREADY_EXISTS')) {
        throw new CustomError('El correo electrónico ya se encuentra registrado.', 409);
      }
      throw error;
    }
  },

  async login(email: string, passwordPlain: string) {
    const user = await authRepository.getUserByEmail(email);
    if (!user) {
      throw new CustomError('Credenciales incorrectas.', 401);
    }

    // Comparar hashes de contraseñas
    const isMatch = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!isMatch) {
      throw new CustomError('Credenciales incorrectas.', 401);
    }

    // Generar Access Token (Corta duración: 15 minutos)
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Generar Refresh Token (Larga duración: 7 días para persistir en BD)
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Guardar en la base de datos (INSERT / UPDATE)
    await authRepository.saveRefreshToken(user.id, refreshToken, expiresAt);

    return {
      user: { id: user.id, email: user.email, name: user.name, rol: user.role },
      accessToken,
      refreshToken
    };
  }
};
