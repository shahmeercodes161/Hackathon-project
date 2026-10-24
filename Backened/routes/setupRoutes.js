import express from 'express';
import { getSetupStatus, runInitialSetup } from '../controllers/setupController.js';

const router = express.Router();

router.get('/status', getSetupStatus);
router.post('/init', runInitialSetup);

export default router;
