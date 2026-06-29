import { Consultant } from '@prisma/client';

export type ConsultantModel = Consultant & {
  [key: string]: unknown;
};
