import mssql from 'mssql';
import { dbPool } from '../config/db.js';
import { type IProduct } from './productRepository.js'; // Solo referencia si fuera necesaria

export interface IUser {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role?: string;
  created_at: Date;
}

export const authRepository = {
  async getUserByEmail(email: string): Promise<IUser | null> {
    const result = await dbPool.request()
      .input('Email', mssql.VarChar(150), email)
      .execute('SP_GetUserByEmail');
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    return result.recordset[0] as IUser;
  },

  async registerUser(email: string, passwordHash: string, name: string): Promise<number> {
    const request = dbPool.request();
    
    // Asignar los inputs con tipos explícitos
    request.input('Email', mssql.VarChar(150), email);
    request.input('PasswordHash', mssql.VarChar(255), passwordHash);
    request.input('Name', mssql.VarChar(100), name);
    
    request.output('GeneratedUserId', mssql.Int, null);

    const result = await request.execute('SP_RegisterUser');
    
    // Retornar el ID generado por la base de datos
    return result.output.GeneratedUserId as number;
  },

  async saveRefreshToken(userId: number, token: string, expiresAt: Date): Promise<void> {
    await dbPool.request()
      .input('UserId', mssql.Int, userId)
      .input('Token', mssql.VarChar(255), token)
      .input('ExpiresAt', mssql.DateTime, expiresAt)
      .execute('SP_SaveRefreshToken');
  }
};
