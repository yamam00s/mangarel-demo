import admin from 'firebase-admin';
import { parseFromTimeZone } from 'date-fns-timezone';

import { collectionName } from '../services/mangarel/constants';
import { Author } from '../services/mangarel/models/author';
import { Book, blankBook } from '../services/mangarel/models/book';
import { Publisher } from '../services/mangarel/models/publisher';
import { BookItem } from '../services/rakuten/models/book-item';
import { FeedMemo } from '../services/mangarel/models/feed-memo';
import { addCounter } from './record-counter';
import { tokenize, uniform } from '../utils/text-processor';

const buildTokenMap = (...words: string[]) => {
  const tokenMap: { [k: string]: boolean } = {};

  tokenize(...words).forEach(token => {
    tokenMap[token] = true;
  });

  return tokenMap;
};

// 単行本のデータを保存する
export const createBook = async (
  db: admin.firestore.Firestore,
  memo: FeedMemo,
  bookItem: BookItem,
  authors: Author[],
  publisher: Publisher
) => {
  const { title, titleKana, isbn, itemUrl, largeImageUrl } = bookItem;
  const match = itemUrl.match(/books.rakuten.co.jp\/rb\/(\d+)/);
  const rbCode = match ? match[1] : '';
  const hasImage = /\.jpg/.test(largeImageUrl);
  const tokenMap = buildTokenMap(
    title,
    titleKana,
    ...authors.map(a => `${a.name} ${a.nameReading}`)
  );
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const publishDate = parseFromTimeZone(memo.releaseDate!, {
    timeZone: 'Asia/Tokyo'
  });
  const publishedOn = admin.firestore.Timestamp.fromDate(publishDate);

  const book: Book = {
    ...blankBook,
    title: uniform(title),
    titleReading: uniform(titleKana),
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    publisherId: publisher.id!,
    publisher,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    authorIds: authors.map(a => a.id!),
    authors,
    isbn,
    rbCode,
    hasImage,
    tokenMap,
    publishedOn
  };

  const bookRef = db.collection(collectionName.books);
  await bookRef.doc(book.isbn).set({
    ...book,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updateAt: admin.firestore.FieldValue.serverTimestamp()
  });
  await addCounter(db, collectionName.books);

  return { ...book, id: isbn };
};
