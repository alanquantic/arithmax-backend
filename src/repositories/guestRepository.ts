import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { GuestModel } from '../models/guestModel';
import { ValidationError, DatabaseError, NotFoundError } from '../utils/customErrors';
import { GuestPartnerModel } from '../models/guestPartnerModel';
import { GuestGroupMemberModel } from '../models/guestGroupModel';

export class GuestRepository {
    async createPartnerGuest(data: Prisma.GuestPartnerCreateInput): Promise<GuestPartnerModel> {
        if (!data) {
            throw new ValidationError('Guest data is required');
        }
        try {
            return await prisma.guestPartner.create({
                data: data,
            });
        } catch (error) {
            throw new DatabaseError('Failed to create guest partner', error as Error);
        }
    }
    async updatePartnerGuest(id: number, data: Prisma.GuestPartnerUpdateInput): Promise<GuestPartnerModel> {
        if (!id) {
            throw new ValidationError('Guest ID is required');
        }
        try {
            return await prisma.guestPartner.update({
                where: { id: id.toString() },
                data: data,
            });
        }
        catch (error) {
            throw new DatabaseError('Failed to update guest', error as Error);
        }
    }
    async getPartnerGuest(guestId: number): Promise<GuestPartnerModel> {
        if (!guestId) {
            throw new ValidationError('Guest ID is required');
        }
        try {
            const partner = await prisma.guestPartner.findUnique({
                where: { id: guestId.toString() },
                include: {
                    guest: true,
                },
            });
            if (!partner) {
                throw new NotFoundError('Guest partner not found');
            }
            return partner;
        }
        catch (error) {
            throw new DatabaseError('Failed to get guest partners', error as Error);
        }
    }
    async getGroupGuest(guestId: number): Promise<GuestGroupMemberModel> {
        if (!guestId) {
            throw new ValidationError('Guest ID is required');
        }
        try {
            const group = await prisma.guestGroupMember.findUnique({
                where: { id: guestId.toString() },
            });
            if (!group) {
                throw new NotFoundError('Guest group not found');
            }
            return group;
        }
        catch (error) {
            throw new DatabaseError('Failed to get guest groups', error as Error);
        }
    }
    async createGroupGuest(data: Prisma.GuestGroupMemberCreateInput): Promise<GuestGroupMemberModel> {
        if (!data) {
            throw new ValidationError('Guest data is required');
        }
        try {
            return await prisma.guestGroupMember.create({
                data: data,
            });
        }
        catch (error) {
            throw new DatabaseError('Failed to create guest group', error as Error);
        }
    }
    async updateGroupGuest(id: number, data: Prisma.GuestGroupMemberUpdateInput): Promise<GuestGroupMemberModel> {
        if (!id) {
            throw new ValidationError('Guest ID is required');
        }
        try {
            return await prisma.guestGroupMember.update({
                where: { id: id.toString() },
                data: data,
            });
        }
        catch (error) {
            throw new DatabaseError('Failed to update guest group', error as Error);
        }
    }
    async getGuest(userId: number): Promise<GuestModel> {
        if (!userId) {
            throw new ValidationError('User ID is required');
        }
        try {
            const guest = await prisma.guest.findUnique({
                where: { userId: userId },
            });
            if (!guest) {
                throw new NotFoundError('Guest not found');
            }
            return guest;
        }
        catch (error) {
            throw new DatabaseError('Failed to get guest', error as Error);
        }
    }
}
