# 1. ベースとなるNode.jsのイメージを指定
FROM node:18-slim

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    fonts-noto-cjk \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. 作業ディレクトリを作成
WORKDIR /app

COPY requirements.txt ./
# エラー回避のため --break-system-packages をつけています
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

# 3. package.json と package-lock.json をコピー
COPY package*.json ./

# 4. Node.jsライブラリをインストール
# ★重要: ビルドコマンド(tsc)を使うために devDependencies も必要なので
# --omit=dev は外しました（ビルド失敗を防ぐため）
RUN npm install

# 5. プロジェクトの全ファイルをコピー
COPY . .

# 6. TypeScriptをJavaScriptにビルド(コンパイル)
# (tsconfig.jsonの設定に従って server.js 等が生成される想定)
RUN npx tsc

# 7. ポート設定（Cloud Run用）
ENV PORT=8080
EXPOSE 8080

# 8. サーバーを起動するコマンド
# ビルド後のファイル名が server.js であることを前提としています
CMD [ "node", "server.js" ]