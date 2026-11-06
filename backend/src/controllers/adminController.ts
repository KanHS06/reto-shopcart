import { type Request, type Response, type NextFunction } from 'express';
import { adminRepository } from '../repositories/adminRepository.js';

export const adminController = {
  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await adminRepository.getAllUsers();
      res.status(200).json({ status: 'success', data: users });
    } catch (error) {
      next(error);
    }
  },

  async getCoupons(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const coupons = await adminRepository.getAllCoupons();
      res.status(200).json({ status: 'success', data: coupons });
    } catch (error) {
      next(error);
    }
  },

  async createCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, discountPercentage } = req.body;
      await adminRepository.createCoupon(code, discountPercentage);
      res.status(201).json({ status: 'success', message: 'Cupón creado exitosamente' });
    } catch (error) {
      next(error);
    }
  },
  
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminRepository.getDashboardStats();
      res.status(200).json({ status: 'success', data: stats });
    } catch (error) {
      next(error);
    }
  }
};