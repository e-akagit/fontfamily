# Japanese Font Viewer

日本語フォントビューア - システムにインストールされているフォントで様々な文字を表示・確認できるWebアプリケーション

## 機能

- システムフォントの一覧表示と選択
- 文字カテゴリー別の表示
  - ひらがな・カタカナ（U+3040～U+30FF）
  - 第1・第2水準漢字（JIS X 0208）
  - 第3・第4水準漢字（拡張A含む）
  - CJK記号（U+3000～U+33FF他）
  - サロゲートペア漢字（拡張B～E）
  - 絵文字（U+1F300～U+1F9FF）
  - IVS文字（異体字セレクタ）
  - 互換文字（U+F900～U+FAFF）
- 文字の詳細情報表示
  - Unicodeコードポイント
  - JIS区点番号（対応する場合）
  - 文字種類の判定
  - UTF-8バイト数
- フォントサイズの動的調整

## 技術仕様

- Pure JavaScript（フレームワーク不使用）
- Local Font Access API対応
- Unicode/JIS X 0213対応
- レスポンシブデザイン

## 使用方法

1. ブラウザでindex.htmlを開く
2. システムにインストールされているフォントが一覧表示される
3. 左側のカテゴリーから表示したい文字種を選択
4. フォントやサイズを変更して文字の表示を確認
5. 文字をクリックすると詳細情報が表示される

## ブラウザ対応

- Chrome/Edge（推奨）: Local Font Access API完全対応
- Firefox/Safari: 基本機能のみ対応（一般的なフォントのみ表示）

## 注意事項

- Local Font Access APIを使用するため、初回アクセス時にフォントへのアクセス許可が必要
- フォントによっては一部の文字が表示されない場合があります
- サロゲートペア文字やIVS文字は、フォントが対応している場合のみ正しく表示されます

## ライセンス

MIT License

## 作者

[Your Name]

## 貢献

1. このリポジトリをフォーク
2. 新しいブランチを作成 (`git checkout -b feature/improvements`)
3. 変更をコミット (`git commit -am 'Add some improvements'`)
4. ブランチにプッシュ (`git push origin feature/improvements`)
5. Pull Requestを作成