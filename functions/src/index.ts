import * as functions from 'firebase-functions';
import admin from 'firebase-admin';
import { collectionName } from './services/mangarel/constants';

admin.initializeApp();

export const publishers = functions
  // リージョンを指定しないとデフォルトで'us-central1'になる
  .region('asia-northeast1') // firestoreで設定したリージョンに合わせる
  .https.onRequest(async (req, res) => {
    const snap = await admin
      .firestore()
      .collection(collectionName.publishers)
      .get();
    const data = snap.docs.map(doc => doc.data());
    res.send(data);
  });
