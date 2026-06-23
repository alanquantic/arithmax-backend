import { AuthController } from '../controllers/authController';
import { ConsultantController } from '../controllers/consultantController';
import { ConsultantGroupDataController } from '../controllers/consultantGroupDataController';
import { ConsultantPartnerDataController } from '../controllers/consultantPartnerDataController';
import express from 'express';
import { UserController } from '../controllers/userController';
import { ConsultantCreateNameController } from '../controllers/consultantCreateNameController';

export const initializeRoutes = (app: express.Express) => {
  new AuthController(app).initialize();
  new ConsultantController(app).initialize();
  new UserController(app).initialize();
  new ConsultantCreateNameController(app).initialize();
  new ConsultantGroupDataController(app).initialize();
  new ConsultantPartnerDataController(app).initialize();
};
