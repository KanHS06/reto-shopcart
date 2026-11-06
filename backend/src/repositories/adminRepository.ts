import mssql from 'mssql';
import { dbPool } from '../config/db.js';

export const adminRepository = {
  async getAllUsers() {
    // Invocación por Stored Procedure
    const result = await dbPool.request()
      .execute('SP_GetAllUsers');
    return result.recordset;
  },

  async getAllCoupons() {
    // Invocación por Stored Procedure
    const result = await dbPool.request()
      .execute('SP_GetAllCoupons');
    return result.recordset;
  },

  async createCoupon(code: string, discountPercentage: number) {
    // Invocación por Stored Procedure con parámetros
    await dbPool.request()
      .input('Code', mssql.VarChar(50), code)
      .input('Discount', mssql.Decimal(5, 2), discountPercentage)
      .execute('SP_CreateCoupon');
  }
};