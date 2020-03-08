// nodenvが実行環境かどうかでローカルサーバかそうでないかを判定
export const isDevelopment = () => (process.env.node || '').includes('nodenv');
