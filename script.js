// 文字カテゴリーの定義
const characterCategories = {};

// キャッシュオブジェクト
const cache = {
    characters: new Map(),
    fonts: null
};

// ローディング状態の管理
let isGenerating = false;

// 文字カテゴリーの非同期生成
async function generateCharacterCategory(category) {
    if (cache.characters.has(category)) {
        return cache.characters.get(category);
    }

    showLoading(true);
    
    try {
        let characters;
        switch (category) {
            case 'kana':
                characters = await generateKanaCharacters();
                break;
            case 'kanji1_2':
                characters = await generateKanji1_2Characters();
                break;
            case 'kanji3_4':
                characters = await generateKanji3_4Characters();
                break;
            case 'symbols':
                characters = await generateSymbolCharacters();
                break;
            case 'surrogate':
                characters = await generateSurrogateCharacters();
                break;
            case 'emoji':
                characters = await generateEmojiCharacters();
                break;
            case 'ivs':
                characters = await generateIVSCharacters();
                break;
            case 'compatibility':
                characters = await generateCompatibilityCharacters();
                break;
            default:
                throw new Error('不正なカテゴリー');
        }
        
        cache.characters.set(category, characters);
        return characters;
    } catch (error) {
        showError(`文字の生成中にエラーが発生しました: ${error.message}`);
        return [];
    } finally {
        showLoading(false);
    }
}

// エラー表示
function showError(message) {
    const grid = document.getElementById('characterGrid');
    grid.innerHTML = `<div class="error-message">${message}</div>`;
}

// ローディング表示の制御
function showLoading(show) {
    const grid = document.getElementById('characterGrid');
    if (show) {
        grid.innerHTML = `
            <div class="loading">
                文字を生成中...
                <div class="spinner"></div>
                <div class="progress-bar">
                    <div class="fill" style="width: 0%"></div>
                </div>
            </div>
        `;
    }
}

// プログレス表示の更新
function updateProgress(percent) {
    const progressBar = document.querySelector('.progress-bar .fill');
    if (progressBar) {
        progressBar.style.width = `${percent}%`;
    }
}

// 基本文字の生成（ひらがな、カタカナ、CJK記号）
async function generateKanaCharacters() {
    const ranges = [
        [0x3040, 0x309F], // ひらがな
        [0x30A0, 0x30FF], // カタカナ
        [0x3000, 0x303F]  // CJK記号
    ];
    return generateCharactersFromRanges(ranges);
}

// 第1水準・第2水準漢字の生成
async function generateKanji1_2Characters() {
    const ranges = [
        [0x4E00, 0x9FBF]  // 基本漢字の範囲
    ];
    return generateCharactersFromRanges(ranges, isJISLevel1or2);
}

// 第3水準・第4水準漢字の生成
async function generateKanji3_4Characters() {
    const ranges = [
        [0x4E00, 0x9FFF],  // CJK統合漢字
        [0x3400, 0x4DBF],  // CJK統合漢字拡張A
        [0xF900, 0xFAFF]   // CJK互換漢字
    ];
    return generateCharactersFromRanges(ranges, isJISLevel3or4);
}

// CJK記号の生成
async function generateSymbolCharacters() {
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

// サロゲートペア文字の生成
async function generateSurrogateCharacters() {
    const ranges = [
        [0x20000, 0x2A6DF],  // CJK統合漢字拡張B
        [0x2A700, 0x2B73F],  // CJK統合漢字拡張C
        [0x2B740, 0x2B81F],  // CJK統合漢字拡張D
        [0x2B820, 0x2CEAF]   // CJK統合漢字拡張E
    ];
    return generateSurrogateCharactersFromRanges(ranges);
}

// 絵文字の生成
async function generateEmojiCharacters() {
    const ranges = [
        [0x1F300, 0x1F64F],  // その他の記号と絵文字
        [0x1F680, 0x1F6FF],  // 輸送と地図の記号
        [0x1F900, 0x1F9FF],  // 補助的な記号と絵文字
        [0x1FA70, 0x1FAFF]   // 絵文字拡張
    ];
    return generateSurrogateCharactersFromRanges(ranges);
}

// IVS文字の生成
async function generateIVSCharacters() {
    const baseCharacters = getCommonKanji();
    const characters = [];
    
    for (const base of baseCharacters) {
        characters.push(base);
        // 異体字セレクタ (VS1-VS16: U+FE00-U+FE0F)
        for (let i = 0xFE00; i <= 0xFE0F; i++) {
            const variant = base + String.fromCodePoint(i);
            if (await isCharacterRenderable(variant)) {
                characters.push(variant);
            }
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        // 漢字異体字セレクタ (U+E0100-U+E01EF)
        for (let i = 0xE0100; i <= 0xE01EF; i++) {
            try {
                const variant = base + String.fromCodePoint(i);
                if (await isCharacterRenderable(variant)) {
                    characters.push(variant);
                }
            } catch (e) {
                continue;
            }
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        updateProgress((baseCharacters.indexOf(base) + 1) / baseCharacters.length * 100);
    }
    
    return characters;
}

// 互換文字の生成
async function generateCompatibilityCharacters() {
    const ranges = [
        [0xF900, 0xFAFF]  // CJK互換漢字
    ];
    return generateCharactersFromRanges(ranges);
}

// 文字範囲から文字を生成
async function generateCharactersFromRanges(ranges, filterFn = null) {
    const characters = [];
    let processedCount = 0;
    const totalCount = ranges.reduce((sum, [start, end]) => sum + (end - start + 1), 0);

    for (const [start, end] of ranges) {
        for (let i = start; i <= end; i++) {
            try {
                const char = String.fromCodePoint(i);
                if (await isCharacterRenderable(char) && (!filterFn || filterFn(i))) {
                    characters.push(char);
                }
            } catch (e) {
                continue;
            }
            
            processedCount++;
            if (processedCount % 100 === 0) {
                updateProgress(processedCount / totalCount * 100);
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
    }
    return characters;
}

// サロゲートペア文字の生成
async function generateSurrogateCharactersFromRanges(ranges) {
    const characters = [];
    let processedCount = 0;
    const totalCount = ranges.reduce((sum, [start, end]) => sum + (end - start + 1), 0);

    for (const [start, end] of ranges) {
        for (let i = start; i <= end; i++) {
            try {
                const char = String.fromCodePoint(i);
                if (await isCharacterRenderable(char)) {
                    characters.push(char);
                }
            } catch (e) {
                continue;
            }
            
            processedCount++;
            if (processedCount % 100 === 0) {
                updateProgress(processedCount / totalCount * 100);
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
    }
    return characters;
}

// 文字が描画可能かチェック
async function isCharacterRenderable(char) {
    return new Promise(resolve => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = '16px sans-serif';
        try {
            const metrics = ctx.measureText(char);
            resolve(metrics.width > 0 && metrics.width < 100);
        } catch (e) {
            resolve(false);
        }
    });
}

// JIS X 0213の第1水準・第2水準漢字判定
function isJISLevel1or2(codePoint) {
    return codePoint >= 0x4E00 && codePoint <= 0x9FBF;
}

// JIS X 0213の第3水準・第4水準漢字判定
function isJISLevel3or4(codePoint) {
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

// 文字グリッドの更新
async function updateCharacterGrid(category) {
    const grid = document.getElementById('characterGrid');
    
    if (isGenerating) {
        return;
    }
    
    isGenerating = true;
    try {
        const chars = await generateCharacterCategory(category);
        
        grid.innerHTML = '';
        if (chars && chars.length > 0) {
            const fragment = document.createDocumentFragment();
            chars.forEach(char => {
                const span = document.createElement('span');
                span.textContent = char;
                span.title = `Unicode: ${[...char].map(c => 
                    'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')
                ).join(' ')}`;
                span.addEventListener('click', () => showCharacterDetail(char));
                fragment.appendChild(span);
            });
            
            grid.appendChild(fragment);
            document.getElementById('charCount').textContent = `${chars.length}文字`;
        } else {
            grid.innerHTML = '<div class="no-chars">表示可能な文字がありません</div>';
        }
    } catch (error) {
        showError(`文字の表示中にエラーが発生しました: ${error.message}`);
    } finally {
        isGenerating = false;
    }
}

// イベントリスナーの設定
function setupEventListeners() {
    // カテゴリーボタン
    document.querySelectorAll('.character-categories button').forEach(button => {
        button.addEventListener('click', async (e) => {
            if (isGenerating) return;
            
            const buttons = document.querySelectorAll('.character-categories button');
            buttons.forEach(btn => {
                btn.classList.remove('active');
                btn.disabled = true;
            });
            
            e.target.classList.add('active');
            
            try {
                await updateCharacterGrid(e.target.dataset.category);
            } finally {
                buttons.forEach(btn => btn.disabled = false);
            }
        });
    });

    // フォント選択
    document.getElementById('fontSelect').addEventListener('change', (e) => {
        updateFontFamily(e.target.value);
        document.getElementById('currentFont').textContent = e.target.value;
    });

    // 文字詳細を閉じるボタン
    document.querySelector('.close-button').addEventListener('click', () => {
        document.getElementById('characterDetail').classList.remove('show');
    });

    // ESCキーで文字詳細を閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('characterDetail').classList.remove('show');
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
    try {
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
    } catch (error) {
        showError(`初期化中にエラーが発生しました: ${error.message}`);
    }
});

// システムフォントの取得
async function getSystemFonts() {
    if (cache.fonts) {
        return cache.fonts;
    }

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

    const sortedFonts = Array.from(availableFonts).sort();
    cache.fonts = sortedFonts;
    return sortedFonts;
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
}

// 文字の種類を判定
function getCharacterType(char) {
    const code = char.codePointAt(0);
    
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
    } else {
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
    
    if (code >= 0x4E00 && code <= 0x9FBF) {
        const ku = Math.floor((code - 0x4E00) / 94) + 16;
        const ten = ((code - 0x4E00) % 94) + 1;
        return `${ku}-${ten}`;
    }
    
    return '非JIS漢字';
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