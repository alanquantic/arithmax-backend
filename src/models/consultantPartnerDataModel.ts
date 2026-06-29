import {
  ConsultantPartnerData,
  ConsultantPartnerDataPartner,
} from '@prisma/client';

export type ConsultantPartnerDataModel = ConsultantPartnerData;

export type ConsultantPartnerDataPartnerModel = ConsultantPartnerDataPartner;
export type ConsultantPartnerDataModelWithRelations = ConsultantPartnerDataModel & {
  partners?: ConsultantPartnerDataPartnerModel[];
};
