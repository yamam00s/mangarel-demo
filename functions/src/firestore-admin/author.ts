import admin from 'firebase-admin';

import { collectionName } from '../services/mangarel/constants';
import { BookItem } from '../services/rakuten/models/book-item';
import { Author, blankAuthor } from '../services/mangarel/models/author';
import { addCounter } from './record-counter';
import { normalize, uniform } from '../utils/text-processor';

// 著者データを取得／保存
export const findOrCreateAuthors = async (
  db: admin.firestore.Firestore,
  bookItem: BookItem
) => {
  const authorsRef = db.collection(collectionName.authors);
  // bookItemからauthorを取得
  const authorsName = bookItem.author.split('/');
  const authorsNameReadings = bookItem.authorKana
    .split('/')
    .map(name => name.replace(/\s+/g, ' ').replace(/,/g, ' '));
  // modelに展開し配列を生成
  const authors: Author[] = authorsName.map((name, i) => ({
    ...blankAuthor,
    name: uniform(name),
    nameReading: uniform(authorsNameReadings[i]),
    variation: normalize(name)
  }));

  let i = 0;

  for await (const author of authors) {
    // dbと取得したdataで一致するものがあるか検索
    const snap = await authorsRef
      .where('variation', '==', normalize(author.name))
      .get();

    if (snap.size) {
      // 一致している場合は取得dataのidを既存のdbのidに
      authors[i].id = snap.docs[0].id;
    } else {
      // 一致していない（既存にない）場合は登録してaddCounterを更新
      const docRef = authorsRef.doc();
      await docRef.set({
        ...author,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      await addCounter(db, collectionName.authors);
      authors[i].id = docRef.id;
    }

    i += 1;
  }

  return authors;
};
