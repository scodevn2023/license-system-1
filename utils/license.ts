import { PrismaClient, LicenseStatus, LicenseType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Hàm tạo serial key mới
export const generateSerialKey = (): string => {
  // Tạo UUID v4
  const uuid = uuidv4();
  
  // Định dạng lại thành dạng XXXX-XXXX-XXXX-XXXX
  const parts = uuid.split('-');
  const formattedKey = [
    parts[0].substring(0, 4),
    parts[0].substring(4),
    parts[1],
    parts[2],
    parts[3],
    parts[4].substring(0, 4),
    parts[4].substring(4, 8),
    parts[4].substring(8)
  ].join('-');
  
  return formattedKey.toUpperCase();
};

// Hàm tạo license mới
export const createLicense = async (type: LicenseType, userId?: string): Promise<string> => {
  const key = generateSerialKey();
  
  const license = await prisma.license.create({
    data: {
      key,
      type,
      status: 'UNACTIVATED',
      userId
    }
  });
  
  return license.key;
};

// Hàm tạo nhiều license cùng lúc
export const createBulkLicenses = async (count: number, type: LicenseType): Promise<string[]> => {
  const keys: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const key = await createLicense(type);
    keys.push(key);
  }
  
  return keys;
};

// Hàm kích hoạt license với HWID
export const activateLicense = async (key: string, hardwareId: string): Promise<boolean> => {
  // Tìm license theo key
  const license = await prisma.license.findUnique({
    where: { key },
    include: { instances: true }
  });
  
  if (!license) {
    throw new Error('License key không tồn tại');
  }
  
  if (license.status === 'REVOKED') {
    throw new Error('License key đã bị thu hồi');
  }
  
  if (license.status === 'EXPIRED') {
    throw new Error('License key đã hết hạn');
  }
  
  // Kiểm tra xem license đã được kích hoạt chưa
  if (license.instances.length > 0) {
    // Nếu đã kích hoạt, kiểm tra HWID
    const instance = license.instances[0];
    
    if (instance.hardwareId !== hardwareId) {
      throw new Error('License key đã được sử dụng trên thiết bị khác');
    }
    
    // Nếu HWID khớp, kiểm tra thời hạn
    if (license.expiresAt && new Date() > license.expiresAt) {
      // Cập nhật trạng thái thành hết hạn
      await prisma.license.update({
        where: { id: license.id },
        data: { status: 'EXPIRED' }
      });
      
      throw new Error('License key đã hết hạn');
    }
    
    return true;
  }
  
  // Nếu chưa kích hoạt, tạo instance mới
  const now = new Date();
  let expiresAt = new Date();
  
  // Tính thời hạn dựa vào loại license
  if (license.type === 'ONE_MONTH') {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  } else if (license.type === 'ONE_YEAR') {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  }
  
  // Tạo instance mới
  await prisma.licenseInstance.create({
    data: {
      licenseId: license.id,
      hardwareId,
      status: 'ACTIVE'
    }
  });
  
  // Cập nhật license
  await prisma.license.update({
    where: { id: license.id },
    data: {
      status: 'ACTIVE',
      activatedAt: now,
      expiresAt
    }
  });
  
  return true;
};

// Hàm kiểm tra license
export const validateLicense = async (key: string, hardwareId: string): Promise<boolean> => {
  try {
    // Tìm license theo key
    const license = await prisma.license.findUnique({
      where: { key },
      include: { instances: true }
    });
    
    if (!license) {
      return false;
    }
    
    if (license.status === 'REVOKED' || license.status === 'EXPIRED') {
      return false;
    }
    
    // Kiểm tra HWID
    if (license.instances.length === 0) {
      return false;
    }
    
    const instance = license.instances[0];
    
    if (instance.hardwareId !== hardwareId) {
      return false;
    }
    
    // Kiểm tra thời hạn
    if (license.expiresAt && new Date() > license.expiresAt) {
      // Cập nhật trạng thái thành hết hạn
      await prisma.license.update({
        where: { id: license.id },
        data: { status: 'EXPIRED' }
      });
      
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

// Hàm thu hồi license
export const revokeLicense = async (key: string): Promise<boolean> => {
  try {
    // Tìm license theo key
    const license = await prisma.license.findUnique({
      where: { key }
    });
    
    if (!license) {
      return false;
    }
    
    // Cập nhật trạng thái thành thu hồi
    await prisma.license.update({
      where: { id: license.id },
      data: { status: 'REVOKED' }
    });
    
    return true;
  } catch (error) {
    return false;
  }
};

// Hàm reset HWID cho license
export const resetHardwareId = async (key: string): Promise<boolean> => {
  try {
    // Tìm license theo key
    const license = await prisma.license.findUnique({
      where: { key },
      include: { instances: true }
    });
    
    if (!license) {
      return false;
    }
    
    // Xóa tất cả instances
    await prisma.licenseInstance.deleteMany({
      where: { licenseId: license.id }
    });
    
    // Cập nhật license về trạng thái chưa kích hoạt
    await prisma.license.update({
      where: { id: license.id },
      data: {
        status: 'UNACTIVATED',
        activatedAt: null,
        expiresAt: null
      }
    });
    
    return true;
  } catch (error) {
    return false;
  }
};
