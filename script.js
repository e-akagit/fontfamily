// 文字カテゴリーの定義
const characterCategories = {
    kana: generateKanaCharacters(),
    kanji1_2: generateKanji1_2Characters(),
    kanji3_4: generateKanji3_4Characters(),
    symbols: generateSymbolCharacters(),
    surrogate: generateSurrogateCharacters(),
    emoji: generateEmojiCharacters(),
    ivs: generateIVSCharacters(),
    compatibility: generateCompatibilityCharacters()
};

// ひらがな・カタカナ・CJK記号の生成
function generateKanaCharacters() {
    const ranges = [
        [0x3040, 0x309F], // ひらがな
        [0x30A0, 0x30FF], // カタカナ
        [0x3000, 0x303F]  // CJK記号
    ];
    return generateCharactersFromRanges(ranges);
}

// 第1水準・第2水準漢字の生成
function generateKanji1_2Characters() {
    // JIS X 0208の範囲（CP932と重なる部分）
    const ranges = [
        [0x4E00, 0x9FBF]  // 基本漢字の範囲
    ];
    return generateCharactersFromRanges(ranges, isJISLevel1or2);
}

// 第3水準・第4水準漢字の生成
function generateKanji3_4Characters() {
    const ranges = [
        [0x4E00, 0x9FFF],  // CJK統合漢字
        [0x3400, 0x4DBF],  // CJK統合漢字拡張A
        [0xF900, 0xFAFF]   // CJK互換漢字
    ];
    return generateCharactersFromRanges(ranges, isJISLevel3or4);
}

// CJK記号の生成
function generateSymbolCharacters() {
    const ranges = [
        [0x3000, 0x303F],  // CJK記号と句読点
        [0x31F0, 0x31FF],  // かな拡張
        [0x3200, 0x32FF],  // 囲みCJK文字
        [0x3300, 0x33FF],  // CJK互換文字
        [0x2E80, 0x2EFF],  // CJK部首補助
        [0x2F00, 0x2FDF]   // 康熙部首
    ];
    return generateCharactersFromRanges(ranges);
}

// サロゲートペア文字の生成（BMP外の漢字）
function generateSurrogateCharacters() {
    const ranges = [
        [0x20000, 0x2A6DF],  // CJK統合漢字拡張B
        [0x2A700, 0x2B73F],  // CJK統合漢字拡張C
        [0x2B740, 0x2B81F],  // CJK統合漢字拡張D
        [0x2B820, 0x2CEAF]   // CJK統合漢字拡張E
    ];
    return generateSurrogateCharactersFromRanges(ranges);
}

// 絵文字の生成
function generateEmojiCharacters() {
    const ranges = [
        [0x1F300, 0x1F64F],  // その他の記号と絵文字
        [0x1F680, 0x1F6FF],  // 輸送と地図の記号
        [0x1F900, 0x1F9FF],  // 補助的な記号と絵文字
        [0x1FA70, 0x1FAFF]   // 絵文字拡張
    ];
    return generateSurrogateCharactersFromRanges(ranges);
}

// IVS文字の生成
function generateIVSCharacters() {
    const baseCharacters = getCommonKanji();
    const characters = [];
    
    baseCharacters.forEach(base => {
        characters.push(base);
        // 異体字セレクタ (VS1-VS16: U+FE00-U+FE0F)
        for (let i = 0xFE00; i <= 0xFE0F; i++) {
            const variant = base + String.fromCodePoint(i);
            if (isCharacterRenderable(variant)) {
                characters.push(variant);
            }
        }
        // 漢字異体字セレクタ (U+E0100-U+E01EF)
        for (let i = 0xE0100; i <= 0xE01EF; i++) {
            try {
                const variant = base + String.fromCodePoint(i);
                if (isCharacterRenderable(variant)) {
                    characters.push(variant);
                }
            } catch (e) {
                continue;
            }
        }
    });
    
    return characters;
}

// 互換文字の生成
function generateCompatibilityCharacters() {
    const ranges = [
        [0xF900, 0xFAFF]  // CJK互換漢字
    ];
    return generateCharactersFromRanges(ranges);
}

// 文字範囲から文字を生成（BMP内）
function generateCharactersFromRanges(ranges, filterFn = null) {
    const characters = [];
    for (const [start, end] of ranges) {
        for (let i = start; i <= end; i++) {
            try {
                const char = String.fromCodePoint(i);
                if (isCharacterRenderable(char) && (!filterFn || filterFn(i))) {
                    characters.push(char);
                }
            } catch (e) {
                continue;
            }
        }
    }
    return characters;
}

// サロゲートペア文字の生成（BMP外）
function generateSurrogateCharactersFromRanges(ranges) {
    const characters = [];
    for (const [start, end] of ranges) {
        for (let i = start; i <= end; i++) {
            try {
                const char = String.fromCodePoint(i);
                if (isCharacterRenderable(char)) {
                    characters.push(char);
                }
            } catch (e) {
                continue;
            }
        }
    }
    return characters;
}

// 文字が描画可能かチェック
function isCharacterRenderable(char) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = '16px sans-serif';
    try {
        const metrics = ctx.measureText(char);
        return metrics.width > 0 && metrics.width < 100;
    } catch (e) {
        return false;
    }
}

// JIS X 0213の第1水準・第2水準漢字判定
function isJISLevel1or2(codePoint) {
    // JIS X 0208の範囲チェック（簡易版）
    return codePoint >= 0x4E00 && codePoint <= 0x9FBF;
}

// JIS X 0213の第3水準・第4水準漢字判定
function isJISLevel3or4(codePoint) {
    // 第1・第2水準以外の漢字をチェック
    return !isJISLevel1or2(codePoint);
}

// 常用漢字の取得（IVS用）
function getCommonKanji() {
    return [
        '葛', '芦', '茨', '悪', '惡', '虫', '蝶', '鳥', '魚', '馬',
        '龍', '韋', '諸', '飯', '飼', '館', '鶴', '麻', '鮎', '鯰',
        '德', '齊', '戶', '步', '海', '淵', '漢', '瀨', '煮', '社'
    ];
}

// 文字の種類を判定
function getCharacterType(char) {
    const code = char.codePointAt(0);
    
    // BMP内の文字
    if (code <= 0xFFFF) {
        if (code >= 0x3040 && code <= 0x309F) return 'ひらがな';
        if (code >= 0x30A0 && code <= 0x30FF) return 'カタカナ';
        if (code >= 0x3000 && code <= 0x303F) return 'CJK記号';
        if (code >= 0x4E00 && code <= 0x9FFF) {
            if (isJISLevel1or2(code)) return '第1・第2水準漢字';
            return '第3・第4水準漢字';
        }
        if (code >= 0x3400 && code <= 0x4DBF) return 'CJK統合漢字拡張A';
        if (code >= 0xF900 && code <= 0xFAFF) return 'CJK互換漢字';
        if (code >= 0xFE00 && code <= 0xFE0F) return '異体字セレクタ';
    }
    // サロゲートペア文字
    else {
        if (code >= 0x20000 && code <= 0x2A6DF) return 'CJK統合漢字拡張B';
        if (code >= 0x2A700 && code <= 0x2B73F) return 'CJK統合漢字拡張C';
        if (code >= 0x2B740 && code <= 0x2B81F) return 'CJK統合漢字拡張D';
        if (code >= 0x2B820 && code <= 0x2CEAF) return 'CJK統合漢字拡張E';
        if (code >= 0x1F300 && code <= 0x1F9FF) return '絵文字';
    }
    
    return '不明';
}

// JIS区点コードを取得
function getJISCode(char) {
    const code = char.codePointAt(0);
    
    // JIS X 0208の範囲内かチェック
    if (code >= 0x4E00 && code <= 0x9FBF) {
        // 簡易的な変換（完全な実装ではありません）
        const ku = Math.floor((code - 0x4E00) / 94) + 16;
        const ten = ((code - 0x4E00) % 94) + 1;
        return `${ku}-${ten}`;
    }
    
    return '非JIS漢字';
}

// システムフォントの取得
async function getSystemFonts() {
    const availableFonts = new Set();

    if ('queryLocalFonts' in window) {
        try {
            const fonts = await window.queryLocalFonts();
            fonts.forEach(font => availableFonts.add(font.family));
        } catch (e) {
            console.warn('Local fonts API not available:', e);
            checkCommonFonts(availableFonts);
        }
    } else {
        checkCommonFonts(availableFonts);
    }

    return Array.from(availableFonts).sort();
}

// 一般的なフォントの存在チェック
function checkCommonFonts(fontSet) {
    const commonFonts = [
        'メイリオ', 'MS PGothic', 'MS Gothic', 'Yu Gothic', 'Yu Gothic UI',
        'MS Mincho', 'MS PMincho', 'Yu Mincho', 'Meiryo UI', '游ゴシック', '游明朝',
        'Arial', 'Times New Roman', 'Calibri', 'Cambria', 'Segoe UI'
    ];

    commonFonts.forEach(font => {
        if (document.fonts.check(`12px "${font}"`)) {
            fontSet.add(font);
        }
    });
}

// 文字詳細の表示
function showCharacterDetail(char) {
    const detail = document.getElementById('characterDetail');
    const preview = detail.querySelector('.char-preview');
    const unicode = detail.querySelector('.unicode');
    const charType = detail.querySelector('.char-type');
    const byteLength = detail.querySelector('.byte-length');
    const jisCode = detail.querySelector('.jis-code');

    preview.textContent = char;
    preview.style.fontFamily = document.getElementById('fontSelect').value;

    const codePoints = [...char].map(c => {
        const hex = c.codePointAt(0).toString(16).toUpperCase();
        return `U+${hex.padStart(4, '0')}`;
    });
    unicode.textContent = codePoints.join(' ');
    charType.textContent = getCharacterType(char);
    byteLength.textContent = new TextEncoder().encode(char).length;
    jisCode.textContent = getJISCode(char);

    detail.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// 文字グリッドの更新
function updateCharacterGrid(category) {
    const grid = document.getElementById('characterGrid');
    const chars = characterCategories[category];
    
    grid.innerHTML = '';
    if (chars && chars.length > 0) {
        chars.forEach(char => {
            const span = document.createElement('span');
            span.textContent = char;
            span.title = `Unicode: ${[...char].map(c => 
                'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')
            ).join(' ')}`;
            span.addEventListener('click', () => showCharacterDetail(char));
            grid.appendChild(span);
        });
        
        document.getElementById('charCount').textContent = `${chars.length}文字`;
    } else {
        grid.innerHTML = '<div class="no-chars">表示可能な文字がありません</div>';
    }
}

// フォントファミリーの更新
function updateFontFamily(fontFamily) {
    const grid = document.getElementById('characterGrid');
    const preview = document.querySelector('.char-preview');
    const styleValue = `"${fontFamily}", sans-serif`;
    
    grid.style.fontFamily = styleValue;
    if (preview) {
        preview.style.fontFamily = styleValue;
    }
    document.getElementById('currentFont').textContent = fontFamily;
}

// イベントリスナーの設定
function setupEventListeners() {
    // カテゴリーボタン
    document.querySelectorAll('.character-categories button').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.character-categories button').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');
            updateCharacterGrid(e.target.dataset.category);
        });
    });

    // フォント選択
    document.getElementById('fontSelect').addEventListener('change', (e) => {
        updateFontFamily(e.target.value);
    });

    // 文字詳細を閉じる
    document.querySelector('.close-button').addEventListener('click', () => {
        document.getElementById('characterDetail').classList.remove('show');
        document.body.style.overflow = '';
    });

    // ESCキーで閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('characterDetail').classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    // フォントサイズ制御
    const sizeSlider = document.getElementById('fontSize');
    const sizeValue = document.getElementById('fontSizeValue');
    sizeSlider.addEventListener('input', (e) => {
        const size = e.target.value;
        sizeValue.textContent = `${size}px`;
        document.getElementById('characterGrid').style.fontSize = `${size}px`;
    });
}

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    const fontSelect = document.getElementById('fontSelect');
    const fonts = await getSystemFonts();

    fonts.forEach(font => {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font;
        option.style.fontFamily = font;
        fontSelect.appendChild(option);
    });

    if (fonts.length > 0) {
        updateFontFamily(fonts[0]);
    }

    setupEventListeners();

    // 初期カテゴリーを選択
    const defaultButton = document.querySelector('[data-category="kana"]');
    if (defaultButton) {
        defaultButton.click();
    }
});