// 文字カテゴリーの定義
const characterCategories = {
    basic: generateBasicCharacters(),
    geometric: generateGeometricCharacters(),
    private: generatePrivateUseCharacters(),
    surrogate: generateSurrogateCharacters(),
    ivs: generateIVSCharacters()
};

// 基本文字の生成
function generateBasicCharacters() {
    const characters = [];
    
    // ひらがな（U+3041 ～ U+3096）
    for (let i = 0x3041; i <= 0x3096; i++) {
        characters.push(String.fromCodePoint(i));
    }
    
    // カタカナ（U+30A1 ～ U+30FA）
    for (let i = 0x30A1; i <= 0x30FA; i++) {
        characters.push(String.fromCodePoint(i));
    }

    // 漢字（教育漢字）
    const kanjiRanges = [
        [0x4E00, 0x4E80],  // 一画～二画
        [0x4E8C, 0x4EE4],  // 二画～三画
        [0x4F00, 0x4F60],  // 四画
        [0x5000, 0x502D],  // 五画
        [0x5100, 0x513F],  // 六画
        [0x5200, 0x524D],  // 七画
        [0x5300, 0x5351],  // 八画
        [0x5400, 0x5438],  // 九画
        [0x5500, 0x5553]   // 十画
    ];

    kanjiRanges.forEach(([start, end]) => {
        for (let i = start; i <= end; i++) {
            characters.push(String.fromCodePoint(i));
        }
    });

    return characters;
}

// 記号・図形の生成
function generateGeometricCharacters() {
    const geometricRanges = [
        [0x25A0, 0x25FF],  // 幾何学模様
        [0x2600, 0x26FF],  // その他の記号
        [0x2700, 0x27BF],  // 装飾記号
        [0x2800, 0x28FF],  // 点字パターン
        [0x2900, 0x297F],  // 追加の矢印
        [0x2B00, 0x2BFF]   // その他の記号と矢印
    ];

    return generateCharactersFromRanges(geometricRanges);
}

// 私用領域の文字生成
function generatePrivateUseCharacters() {
    return generateCharactersFromRanges([[0xE000, 0xF8FF]]);
}

// サロゲートペア文字の生成
function generateSurrogateCharacters() {
    const characters = [];
    
    // 基本の絵文字範囲
    const emojiRanges = [
        [0x1F300, 0x1F320],  // 自然
        [0x1F330, 0x1F335],  // 植物
        [0x1F400, 0x1F43F],  // 動物
        [0x1F600, 0x1F64F],  // 感情
        [0x1F680, 0x1F6FF],  // 輸送と地図
        [0x1F900, 0x1F9FF]   // 補助的な記号と絵文字
    ];

    // 基本の絵文字を追加
    characters.push(...generateCharactersFromRanges(emojiRanges));

    // 合成絵文字の追加
    const zwj = String.fromCodePoint(0x200D);
    const vs16 = String.fromCodePoint(0xFE0F);

    // 職業絵文字
    const professions = [
        ["👨", "💻"], ["👩", "💻"],  // 技術者
        ["👨", "🍳"], ["👩", "🍳"],  // シェフ
        ["👨", "🏫"], ["👩", "🏫"],  // 教師
        ["👨", "⚕️"], ["👩", "⚕️"]   // 医師
    ];

    // 家族絵文字
    const families = [
        ["👨", "👩", "👦"],
        ["👨", "👩", "👧"],
        ["👨", "👩", "👧", "👦"],
        ["👩", "👩", "👦"],
        ["👨", "👨", "👧"]
    ];

    // 職業絵文字の生成
    professions.forEach(([person, item]) => {
        characters.push(person + zwj + item);
    });

    // 家族絵文字の生成
    families.forEach(members => {
        characters.push(members.join(zwj));
    });

    return characters;
}

// IVS文字の生成
function generateIVSCharacters() {
    const baseCharacters = [
        '葛', '芦', '茨', '悪', '惡', '虫', '蝶', '鳥', '魚', '馬',
        '龍', '韋', '諸', '飯', '飼', '館', '鶴', '麻', '鮎', '鯰'
    ];
    const characters = [];

    baseCharacters.forEach(base => {
        characters.push(base);
        // IVSセレクタ（E0100-E01EF）を使用
        for (let i = 0xE0100; i <= 0xE012F; i++) {
            try {
                const combined = base + String.fromCodePoint(i);
                if (isCharacterRenderable(combined)) {
                    characters.push(combined);
                }
            } catch (e) {
                continue;
            }
        }
    });

    return characters;
}

// 文字範囲から文字を生成
function generateCharactersFromRanges(ranges) {
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

// システムフォントの列挙
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

    // プレビュー
    preview.textContent = char;
    preview.style.fontFamily = document.getElementById('fontSelect').value;

    // Unicode情報
    const codePoints = [...char].map(c => {
        const hex = c.codePointAt(0).toString(16).toUpperCase();
        return `U+${hex.padStart(4, '0')}`;
    });
    unicode.textContent = `Unicode: ${codePoints.join(' ')}`;

    // 文字種類
    charType.textContent = `種類: ${getCharacterType(char)}`;

    // バイト長
    const bytes = new TextEncoder().encode(char);
    byteLength.textContent = `バイト数: ${bytes.length}`;

    // 表示
    detail.classList.add('show');
}

// 文字の種類を判定
function getCharacterType(char) {
    const code = char.codePointAt(0);
    if (code >= 0x3040 && code <= 0x309F) return 'ひらがな';
    if (code >= 0x30A0 && code <= 0x30FF) return 'カタカナ';
    if (code >= 0x4E00 && code <= 0x9FFF) return '漢字';
    if (code >= 0x1F300 && code <= 0x1F9FF) return '絵文字';
    if (code >= 0xE000 && code <= 0xF8FF) return '私用領域';
    return '記号';
}

// UI更新関連の関数
function updateFontFamily(fontFamily) {
    const grid = document.getElementById('characterGrid');
    const sampleText = document.getElementById('sampleText');
    const styleValue = `"${fontFamily}", sans-serif`;
    
    grid.style.fontFamily = styleValue;
    sampleText.style.fontFamily = styleValue;
}

function updateCharacterGrid(category) {
    const grid = document.getElementById('characterGrid');
    const chars = characterCategories[category];
    
    grid.innerHTML = '';
    chars.forEach(char => {
        const span = document.createElement('span');
        span.textContent = char;
        span.addEventListener('click', () => showCharacterDetail(char));
        grid.appendChild(span);
    });
}

// イベントリスナーの設定
function setupEventListeners() {
    // カテゴリーボタンのイベント
    document.querySelectorAll('.character-categories button').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.character-categories button').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');
            updateCharacterGrid(e.target.dataset.category);
        });
    });

    // フォント選択のイベント
    document.getElementById('fontSelect').addEventListener('change', (e) => {
        updateFontFamily(e.target.value);
    });

    // 文字詳細を閉じるボタン
    document.querySelector('.close-button').addEventListener('click', () => {
        document.getElementById('characterDetail').classList.remove('show');
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
    const defaultButton = document.querySelector('[data-category="basic"]');
    if (defaultButton) {
        defaultButton.click();
    }
});