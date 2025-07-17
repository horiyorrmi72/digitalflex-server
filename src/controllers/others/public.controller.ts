import { NextFunction, Request, Response } from 'express';
import PublicService from '../../services/others/public.service';
import { BadRequest, NotFoundError } from '../../utils/errors';
import { contactFormValidation } from '../../utils/validators/mails.validation';

class PublicController {
  static async getActiveUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeUsers = await PublicService.getActiveUsers();
      if (!activeUsers || activeUsers.length === 0) {
        throw new NotFoundError('No active users at the moment');
      }
      res.status(200).json({ success: true, message: 'Active users fetched successfully', data: activeUsers });
      return;
    } catch (error) {
      next(error);
    }
  }

  static async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userStats = await PublicService.getUserStats();
      // console.log('users stats:', userStats);
      res.status(200).json({ success: true, message: 'stats fetched', data: userStats });
      return;
    } catch (error) {
      next(error);
    }
  }

  static async sendFormMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { error } = contactFormValidation(req.body);
      if (error) {
        throw new BadRequest(error.details[0].message);
      }
      const { name, email, message } = req.body;
      const sendMessage = await PublicService.sendFormMessage({ name, email, message });
      res.status(200).json({
        success: true,
        message: 'Message sent successfully',
        data: sendMessage
      });
      return;
    } catch (error) {
      next(error);
    }
  }
}

export default PublicController;