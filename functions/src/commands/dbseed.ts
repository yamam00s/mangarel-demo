import commander from 'commander';
import admin from 'firebase-admin';
import fs from 'fs';
import parse from 'csv-parse/lib/sync';

import { Publisher } from '../services/mangarel/models/publisher';
import { collectionName } from '../services/mangarel/constants';
import { addCounter } from '../firestore-admin/record-counter';

import serviceAccount from '../mangarel-demo-firebase-adminsdk.json';

// Firebase Admin SDKの初期化（nodeアプリケーションの場合必要）
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
});

const db = admin.firestore();

const uploadSeed = async (collection: string, seedFile: string) => {
  const buffer = fs.readFileSync(seedFile);
  // tsvをパースしてオブジェクトに変換
  const records = parse(buffer.toString(), {
    // columns: trueで最初のカラム名がkeyになったオブジェクトの配列になる
    columns: true,
    delimiter: '\t',
    // eslint-disable-next-line @typescript-eslint/camelcase
    skip_empty_lines: true
  });
  const ref = db.collection(collection);

  switch (collection) {
    case collectionName.publishers: {
      // recordsをPublisherオブジェクトに変換
      const docs: Required<Publisher>[] =
        records.map((record: Publisher) => ({
          ...record,
          website: record.website ? record.website : null,
          // admin.firestore.FieldValue.serverTimestamp() = サーバーにタイムスタンプを入れる
          createAt: admin.firestore.FieldValue.serverTimestamp(),
          updateAt: admin.firestore.FieldValue.serverTimestamp()
        })) || [];

      for await (const doc of docs) {
        const { id, ...docWithoutId } = doc;
        // コレクションリファレンス(ref)に対して、idのドキュメントをdocWithoutId（オブジェクト）で保存
        // FirestoreドキュメントのIDはドキュメントの外にあるので、オブジェクトからIDとそれ以外のデータを分けて抜き出し
        await ref.doc(id).set(docWithoutId);
      }
      // レコード数の統計処理
      await addCounter(db, collection, docs.length);

      return;
    }

    default: {
      throw new Error('specify target collection');
    }
  }
};

commander
  .version('0.1.0', '-v, --version')
  .arguments('<collection><seedFile>')
  .action(uploadSeed);

commander.parse(process.argv);
