import dotenv from 'dotenv';

dotenv.config();

const rawCorsOrigins =
  process.env.CORS_ORIGINS ||
  process.env.CORS_ORIGIN ||
  'http://localhost:3000';

const corsOrigins = rawCorsOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ksef-system',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigins,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  donationPaybillNumber: process.env.DONATION_PAYBILL_NUMBER || '522522',
  donationAccountNumber: process.env.DONATION_ACCOUNT_NUMBER || '1199328480',
  smsGatewayUrl: process.env.SMS_GATEWAY_URL || '',
  smsGatewayToken: process.env.SMS_GATEWAY_TOKEN || '',
  smsSenderId: process.env.SMS_SENDER_ID || '',
  textBeeBaseUrl: process.env.TEXTBEE_BASE_URL || 'https://api.textbee.dev/api/v1',
  textBeeApiKey: process.env.TEXTBEE_API_KEY || '',
  textBeeDeviceId: process.env.TEXTBEE_DEVICE_ID || '',
};
