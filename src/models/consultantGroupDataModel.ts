import { ConsultantGroupData, ConsultantGroupDataMember } from '@prisma/client';

export type ConsultantGroupDataModel = ConsultantGroupData;

export type ConsultantGroupDataMemberModel = ConsultantGroupDataMember;
export type ConsultantGroupDataModelWithRelations = ConsultantGroupDataModel & {
  members?: ConsultantGroupDataMemberModel[];
};
