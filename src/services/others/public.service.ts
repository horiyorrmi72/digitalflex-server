import { redisClient } from '../../config/redisConfig';
import { BadRequest, NotFoundError } from '../../utils/errors';
import { BaseError } from '../../utils/errors/BaseError';
import logger from '../../utils/logger';
import Mailer from '../../utils/others/mailer';
import ApplicantService from '../apllicant/applicant.service';
import UserService from '../user/user.service';
import { configVariables } from '../../config/envConfig';
const salesTeamEmail = configVariables.accountManager.salesEmail;


class PublicService {
  static async getActiveUsers() {
    try {
      const keys = await redisClient.keys('activeUsers:*');

      if (keys.length === 0) {
        throw new NotFoundError('No active users at the moment');
      }

      const userJsons = await Promise.all(keys.map(key => redisClient.get(key)));
      const users = userJsons
        .filter((item): item is string => item !== null)
        .map(item => JSON.parse(item));

      return users;

    } catch (error) {
      if (error instanceof BaseError) {
        logger.error('❌ Error fetching active users:', error.message);
      } else {
        logger.error('Failed to fetch active users', error);
      }
      throw error;
    }
  }


  static async addToActiveUsersList(sessionId: any, data: any, exp: number): Promise<void> {
    try {
      const { generatedId } = sessionId;
      const { idStr, preferred_name } = data;
      const existingData = await redisClient.get(`activeUsers:${idStr}`);
      if (existingData) return;
      const payload = { generatedId, preferred_name }
      const ttl = exp - Math.floor(Date.now() / 1000);
      /*since it's only used to check for active users and i don't need to keep track of
      how many times they logged in or how many devices were connected so regardless it logs them out of all devices once it expires
      */
      await redisClient.set(`activeUsers:${idStr}`, JSON.stringify(payload), 'EX', ttl);

    } catch (error) {
      if (error instanceof BaseError) {
        logger.error('❌ Error adding to active users list:', error.message);
      } else {
        logger.error('Failed to add to active users list', error);
      }
      throw error;
    }
  }

  static async removeFromActiveList(userId: string) {
    try {
      await redisClient.del(`activeUsers:${userId}`)

    } catch (error) {
      if (error instanceof BaseError) {
        logger.error('❌ Error removing user from active users list:', error.message);
      } else {
        logger.error('Failed to remove user from list', error);
      }
      throw error;
    }

  }




  static async getUserStats() {
    try {
      let usersStats;
      const cachedStats = await redisClient.get('usersStats');
      if (cachedStats) {
        usersStats = JSON.parse(cachedStats);
        return usersStats;
      }
      const currentUsersLength = (await UserService.getUsers()).length || 0;
      const currentApplicantsLength = (await ApplicantService.getApplicants()).length || 0;
      const res = {
        'users': currentUsersLength,
        'applicants': currentApplicantsLength
      }
      console.log(res);
      usersStats = res;
      return usersStats;


    } catch (error) {
      if (error instanceof BaseError) {
        logger.error('❌ Error adding to active users list:', error.message);
      } else {
        logger.error('Failed to add to active users list', error);
      }
      throw error;

    }

  }

  static async sendFormMessage(data: any) {
    try {
      const { name, email, message } = data;
      if (!name || !email || !message) {
        throw new BadRequest('Missing required parameters');
      }
      const res = await Mailer.sendFormMessage(salesTeamEmail as string, name as string, email as string, message as string);
      console.log('contact form message email data:', res);
      return res;
    } catch (error) {
      if (error instanceof BaseError) {
        logger.error('Error sending contact-us form meesage', error.message);
      } else {
        logger.error('Unknown Error,Failed to send contact form message', error);
      }
      throw error;


    }
  }


}

export default PublicService