import 'reflect-metadata';

// Variables de entorno dummy para ejecución de tests en CI
process.env.PORT = process.env.PORT || '3000';
process.env.JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'test_secret_key';
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'test-project';
process.env.FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY || 'test-private-key';
process.env.FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || 'test@test.com';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
process.env.API_URL = process.env.API_URL || 'http://localhost:3000';
process.env.MP_SUCCESS_URL = process.env.MP_SUCCESS_URL || 'http://localhost:3000/success';
process.env.MP_FAILURE_URL = process.env.MP_FAILURE_URL || 'http://localhost:3000/failure';
process.env.MP_PENDING_URL = process.env.MP_PENDING_URL || 'http://localhost:3000/pending';
process.env.MP_WEBHOOK_URL = process.env.MP_WEBHOOK_URL || 'http://localhost:3000/webhook';
process.env.MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || 'test-access-token';
process.env.MAILER_SERVICE = process.env.MAILER_SERVICE || 'gmail';
process.env.MAILER_EMAIL = process.env.MAILER_EMAIL || 'test@gmail.com';
process.env.MAILER_SECRET_KEY = process.env.MAILER_SECRET_KEY || 'test-mailer-key';
process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'test-cloud';
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '1234567890';
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'test-cloudinary-secret';