import express from 'express';
import PublicController from './public.controller';
const router = express.Router();


router.get('/users-stats', PublicController.getUserStats);
router.post('/form-message', PublicController.sendFormMessage);




export default router