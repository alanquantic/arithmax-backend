import { Prisma } from '@prisma/client';

export const userPublicSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  email: true,
  role: true,
  mustChangePassword: true,
  lastLoginAt: true,
  firstName: true,
  lastName: true,
  scdLastName: true,
  birthDate: true,
  country: true,
  gender: true,
  phone: true,
  avatar: true,
  companyName: true,
  companyDirection: true,
  companyPhone: true,
  companyWebsite: true,
  companyLogo: true,
  devices: true,
  createdAt: true,
  updatedAt: true,
  license: true,
});

export type UserModel = Prisma.UserGetPayload<{
  select: typeof userPublicSelect;
}>;
