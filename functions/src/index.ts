/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import admin from 'firebase-admin';
import forEach from 'lodash/forEach';
import { isDevelopment } from './utils/env';

import serviceAccount from './mangarel-demo-firebase-adminsdk.json';

// Firebase Admin SDKの初期化（nodeアプリケーションの場合必要）
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
});

const functionMap = {
  fetchCalendar: './fetch-calendar',
  registerBooks: './register-books'
};

const devFunctionMap = {
  publishers: './publishers',
  searchBooks: './search-books'
};

const loadFunctions = (fnMap: typeof functionMap) => {
  forEach(fnMap, (path, functionName) => {
    if (
      // Cloud Functions が起動されると環境変数process.env.FUNCTION_TARGET にその関数名が入る
      !process.env.FUNCTION_TARGET ||
      process.env.FUNCTION_TARGET === functionName
    ) {
      module.exports[functionName] = require(path);
    }
  });
};

const fnMap = isDevelopment()
  ? { ...functionMap, ...devFunctionMap }
  : functionMap;

loadFunctions(fnMap);
