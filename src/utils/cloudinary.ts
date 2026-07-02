import { createHash } from 'crypto';
import { ValidationError } from './customErrors';

const COMPANY_LOGO_FOLDER = 'company-logos';

export type CompanyLogoUploadSignature = {
  apiKey: string;
  cloudName: string;
  folder: string;
  publicId: string;
  signature: string;
  timestamp: number;
  uploadUrl: string;
};

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new ValidationError(
      'Cloudinary no esta configurado. Faltan CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY o CLOUDINARY_API_SECRET'
    );
  }

  return { cloudName, apiKey, apiSecret };
}

export function createCompanyLogoUploadSignature(userId: number): CompanyLogoUploadSignature {
  if (!userId || Number.isNaN(userId)) {
    throw new ValidationError('Se requiere un usuario valido para firmar la carga de imagen');
  }

  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `company_${userId}_${Date.now()}`;
  const paramsToSign = `folder=${COMPANY_LOGO_FOLDER}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash('sha1').update(paramsToSign).digest('hex');

  return {
    apiKey,
    cloudName,
    folder: COMPANY_LOGO_FOLDER,
    publicId,
    signature,
    timestamp,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  };
}
