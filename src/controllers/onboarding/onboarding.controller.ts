import { NextFunction, Request, Response } from 'express';
import onboardingService from '../../services/onboarding/onboarding.service';
import { onboardingInterface } from '../../models/onboarding.model';
import { addScreeningMaterialValidator } from '../../utils/validators/onboarding.validator';
import { BadRequest } from '../../utils/errors';
import checkFileType from '../../utils/others/fileType';



class onboardingController {
  static async getScreeningMaterials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const materials = await onboardingService.getOnboardingMaterials();
      res.status(200).json({ success: true, message: 'materials fetched successfully', data: materials })
      return;
    } catch (error) {
      next(error);
    }
  }

  static async addOnboardingMaterial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error } = addScreeningMaterialValidator(req.body);
      if (error) {
        throw new BadRequest(`${error.details[0].message}`);
      }

      const file = req.file;

      let filePayload: Express.Multer.File | undefined;
      let fileType: string | undefined;

      if (file) {
        const { mimetype } = file;

        const mimeToExtension: Record<string, string> = {
          'image/jpeg': 'jpeg',
          'image/png': 'png',
          'image/webp': 'webp',
          'image/svg+xml': 'svg',
          'application/pdf': 'pdf',
          'application/msword': 'docs',
          'application/vnd.ms-excel': 'xls',
          'text/csv': 'csv',
          'video/mp4': 'mp4',
          'video/webm': 'webmv'
        };

        const extension = mimeToExtension[mimetype];
        if (!extension) {
          throw new BadRequest(`Unsupported file type: ${mimetype}`);
        }

        fileType = await checkFileType(extension);
        filePayload = file;
      }

      const material = await onboardingService.uploadMaterials(req.body, filePayload, fileType);

      res
        .status(200)
        .json({ success: true, message: 'Screening data added successfully', data: material });
    } catch (error) {
      next(error);
    }
  }


  static async updateOnboardingMaterial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        throw new BadRequest('Missing required parameter')
      }
      const { ...data } = req.body;
      const updatedMaterial = await onboardingService.updateMaterial(id, data);
      res.status(200).json({ success: true, message: 'Updated Successfully', data: updatedMaterial });
      return;

    } catch (error) {
      next(error)
    }
  }
  static async deleteOnboardingMaterial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ids = req.body;
      if (!ids || !Array.isArray(ids)) {
        throw new BadRequest('Missing parameter and ensure it\'s an array')
      }
      await onboardingService.removeOnboardingMaterials(ids);
      res.status(204).send()
    } catch (error) {
      next(error);
    }
  }

  static async getRandomQuest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as { id: string };
      if (!user || !user.id) {
        return next(new BadRequest('User is not authenticated or missing user ID'));
      }
      const userId = user.id;
      // console.log('user id:', userId)
      const { category } = req.query;
      if (!category) {
        return next(new BadRequest('Category parameter is required'));
      }
      const categoryBoardingMaterials = await onboardingService.provideRandomOnboardingQuest(category as string, userId as string);
      res.status(200).json({ success: true, categoryBoardingMaterials });
      return;
    } catch (error) {
      next(error)
    }
  }

  static async updateOnboardingProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { materialId } = req.params;
      const user = req.user;
      const userObj = Object(user);
      const userId = userObj?.id;
      // console.log('request user:', user)

      if (!materialId) {
        return next(new BadRequest('Missing required parameter: materialId'));
      }
      if (!userId) {
        return next(new BadRequest('User ID is missing from request context'));
      }

      await onboardingService.applicantCompletedMaterial(userId, materialId);
      res.status(200).json({ success: true, message: 'Onboarding progress updated successfully' });
    } catch (error) {
      next(error);
    }
  }

}

export default onboardingController;