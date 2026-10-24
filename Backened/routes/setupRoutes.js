import express from 'express';
import { getSetupStatus, runInitialSetup, resetSystemData } from '../controllers/setupController.js';

const router = express.Router();

router.get('/status', getSetupStatus);
router.post('/init', runInitialSetup);
router.post('/reset', resetSystemData);

export default router;
