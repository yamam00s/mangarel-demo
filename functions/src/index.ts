import * as functions from 'firebase-functions';
import admin from 'firebase-admin';
import { subDays } from 'date-fns';

import { collectionName } from './services/mangarel/constants';
import { FeedMemo } from './services/mangarel/models/feed-memo';
import { findBookItem } from './services/rakuten/api';
import { findOrCreateAuthors } from './firestore-admin/author';
import { findPublisher } from './firestore-admin/publisher';
import { createBook } from './firestore-admin/book';
import { sleep } from './utils/timer';

import rakutenId from './mangarel-demo-rakuten-app-id.json';

const RAKUTEN_APP_ID = rakutenId.id;

// 必ず行う
admin.initializeApp();

export const registerBooks = functions
  .region('asia-northeast1') // firestoreで設定したリージョンに合わせる
  .runWith({
    timeoutSeconds: 100,
    memory: '1GB'
  })
  .pubsub.schedule('5,10,15 2 1,10,20 * *')
  .timeZone('Asia/Tokyo')
  .onRun(async () => {
    const db = admin.firestore();
    const yesterday = subDays(new Date(), 1);
    const snap = await db
      .collection(collectionName.feedMemos)
      .where('isbn', '==', null)
      .where('fetchedAt', '<', yesterday)
      .limit(200)
      .get();

    let count = 0;

    for await (const doc of snap.docs) {
      const memo = doc.data() as FeedMemo;
      const title = memo.title || '';
      const publisherName = memo.publisher || '';

      // rakutenAPIからデータをfetch
      const bookItem = await findBookItem(
        { title, publisherName },
        RAKUTEN_APP_ID
      );

      if (bookItem) {
        // bookItemからauthorを登録して返す
        const authors = await findOrCreateAuthors(db, bookItem);
        // kodanshaのデータをdbから取得
        const publisher = await findPublisher(db, 'kodansha');
        // bookItemからbookを登録して返す
        const book = await createBook(db, memo, bookItem, authors, publisher);
        // isbnを更新することで２重登録を防ぐ
        await doc.ref.update({
          isbn: book.isbn,
          fetchedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        count += 1;
      } else {
        await doc.ref.update({
          fetchedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      await sleep(1000);
    }
    // eslint-disable-next-line no-console
    console.log(`Registered ${count} books.`);
  });
