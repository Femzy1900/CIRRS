import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAW69lHoZSZn6fgmicRe2pRHo5cWaTxtLo',
  authDomain: 'cirs-ef473.firebaseapp.com',
  projectId: 'cirs-ef473',
  storageBucket: 'cirs-ef473.firebasestorage.app',
  messagingSenderId: '896769081131',
  appId: '1:896769081131:web:ffc6896cdb4d6c85110f6e',
  measurementId: 'G-YNN016P6Q5',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
