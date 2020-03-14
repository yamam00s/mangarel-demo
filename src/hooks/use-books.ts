/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useContext, useEffect, useRef, useState } from 'react';
import { startOfDay } from 'date-fns';

import { Book } from 'services/mangarel/models/book';
import { collectionName } from 'services/mangarel/constants';
import { FirebaseContext } from 'contexts';

type BooksOptions = {
  limit?: number;
};
const defaultOptions: Required<BooksOptions> = {
  limit: 30
};

const useBooks = (options?: BooksOptions) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const firebaseRef = useRef(useContext(FirebaseContext));
  const optionsRef = useRef({ ...defaultOptions, ...options });

  useEffect(() => {
    const { db } = firebaseRef.current;
    if (!db) throw new Error('Firestore is not initialized');

    const query = db
      .collection(collectionName.books)
      .where('publishedOn', '>=', startOfDay(new Date()))
      .orderBy('publishOn', 'asc')
      .limit(optionsRef.current.limit);

    const load = async () => {
      setLoading(true);
      try {
        const snap = await query.get();
        const bookData = snap.docs.map(doc => ({
          ...(doc.data() as Book),
          id: doc.id
        }));
        setBooks(bookData);
        setError(null);
      } catch (err) {
        setError(err);
      }

      setLoading(false);
    };

    load();
  }, []);

  return { books, loading, error };
};

export default useBooks;
