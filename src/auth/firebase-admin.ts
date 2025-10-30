import admin from 'firebase-admin';
import { envs } from '../config/envs';

// Configuración de Firebase Admin
const firebaseConfig = {
  projectId: envs.FIREBASE_PROJECT_ID,
  privateKey: envs.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  clientEmail: envs.FIREBASE_CLIENT_EMAIL,
};

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
  });
}

export const auth = admin.auth();
export default admin;
