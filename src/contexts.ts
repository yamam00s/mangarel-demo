/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext } from 'react';

type FirebaseContextValue = {
  db: firebase.firestore.Firestore | null;
};

export const FirebaseContext = createContext<FirebaseContextValue>({
  db: null
});
