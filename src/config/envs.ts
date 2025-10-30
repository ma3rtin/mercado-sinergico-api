import 'dotenv/config';
import { get } from 'env-var';
import { v2 as cloudinary } from 'cloudinary';

export const envs = {
  PORT: get('PORT').required().asPortNumber(),
  JWT_SECRET_KEY: get('JWT_SECRET_KEY').required().asString(),
  FIREBASE_PROJECT_ID: get('FIREBASE_PROJECT_ID').required().asString(),
  FIREBASE_PRIVATE_KEY: get('FIREBASE_PRIVATE_KEY').required().asString(),
  FIREBASE_CLIENT_EMAIL: get('FIREBASE_CLIENT_EMAIL').required().asString(),
};

cloudinary.config({
  cloud_name: get('CLOUDINARY_CLOUD_NAME').required().asString(),
  api_key: get('CLOUDINARY_API_KEY').required().asString(),
  api_secret: get('CLOUDINARY_API_SECRET').required().asString(),
});
