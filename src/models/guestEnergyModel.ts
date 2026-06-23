import { GuestGroupMemberModel } from './guestGroupModel';
import { GuestModel } from './guestModel';
import { GuestPartnerModel } from './guestPartnerModel';

export type GuestEnergyModel = {
  guest: GuestModel;
  guestPartners: GuestPartnerModel[];
  guestGroupMembers: GuestGroupMemberModel[];
};
