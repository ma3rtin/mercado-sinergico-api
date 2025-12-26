import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import env from 'env-var';

export const envs = {
  PORT: env.get('PORT').required().asPortNumber(),
  JWT_SECRET_KEY: env.get('JWT_SECRET_KEY').required().asString(),
  FIREBASE_PROJECT_ID: env.get('FIREBASE_PROJECT_ID').required().asString(),
  FIREBASE_PRIVATE_KEY: env.get('FIREBASE_PRIVATE_KEY').required().asString(),
  FIREBASE_CLIENT_EMAIL: env.get('FIREBASE_CLIENT_EMAIL').required().asString(),
  FRONTEND_URL: env.get('FRONTEND_URL').required().asString(),
  API_URL: env.get('API_URL').required().asString(),
  MP_SUCCESS_URL: env.get('MP_SUCCESS_URL').required().asString(),
  MP_FAILURE_URL: env.get('MP_FAILURE_URL').required().asString(),
  MP_PENDING_URL: env.get('MP_PENDING_URL').required().asString(),
  MP_WEBHOOK_URL: env.get('MP_WEBHOOK_URL').required().asString(),
  MERCADOPAGO_ACCESS_TOKEN: env
    .get('MERCADOPAGO_ACCESS_TOKEN')
    .required()
    .asString(),
};

cloudinary.config({
  cloud_name: env.get('CLOUDINARY_CLOUD_NAME').required().asString(),
  api_key: env.get('CLOUDINARY_API_KEY').required().asString(),
  api_secret: env.get('CLOUDINARY_API_SECRET').required().asString(),
});
