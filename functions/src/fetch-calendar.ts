import * as functions from 'firebase-functions';
import admin from 'firebase-admin';
import puppeteer from 'puppeteer';

import { feedCalendar } from './crawlers/kodansha-calendar';
import { saveFeedMemo } from './firestore-admin/feed-memo';

const PUPPETEER_OPTIONS = {
  args: [
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--no-sandbox',
    '--no-zygote',
    '--single-process'
  ],
  headless: true
};

export const fetchCalendar = functions
  // リージョンを指定しないとデフォルトで'us-central1'になる
  .region('asia-northeast1') // firestoreで設定したリージョンに合わせる
  .runWith({
    timeoutSeconds: 300,
    memory: '2GB'
  })
  // 月 1・10・20 日の午前2時に起動
  .pubsub.schedule('0 2 1, 10, 20 * *')
  // タイムゾーンを指定しておかないとGMT時間になる
  .timeZone('Asia/Tokyo')
  .onRun(async () => {
    const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    const page = await browser.newPage();
    const db = admin.firestore();

    const memos = await feedCalendar(page);
    const fetchCount = await saveFeedMemo(db, memos, 'kodansha');

    await browser.close();
    console.log(`Fetched Kodansha calendar. Wrote ${fetchCount} memos.`);
  });
