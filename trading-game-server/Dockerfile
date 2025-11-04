# 1. ベースとなるNode.jsのイメージを指定
FROM node:18-slim

# 2. 作業ディレクトリを作成
WORKDIR /app

# 3. package.json と package-lock.json をコピー
COPY package*.json ./

# 4. TypeScriptに必要なライブラリをインストール
# (本番用なので -D の開発用は除外)
RUN npm install --omit=dev

# 5. プロジェクトの全ファイルをコピー
COPY . .

# 6. TypeScriptをJavaScriptにビルド(コンパイル)
RUN npx tsc

# 7. サーバーを起動するコマンド
# (server.ts ではなく、ビルドされた server.js を実行)
CMD [ "node", "server.js" ]