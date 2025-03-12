// システムフォントの列挙
async function getSystemFonts() {
    const availableFonts = new Set();

    // WindowsのローカルフォントAPIを利用（可能な場合）
    if ('queryLocalFonts' in window) {
        try {
            const fonts = await window.queryLocalFonts();
            fonts.forEach(font => {
                availableFonts.add(font.family);
            });
        } catch (e) {
            console.log('Local fonts API not available:', e);
            // フォールバック：一般的なフォントをチェック
            checkCommonFonts(availableFonts);
        }
    } else {
        // APIが利用できない場合は一般的なフォントをチェック
        checkCommonFonts(availableFonts);
    }

    return Array.from(availableFonts).sort();
}

// 一般的なフォントの存在チェック
function checkCommonFonts(fontSet) {
    const commonFonts = [
        // 日本語フォント
        'メイリオ', 'MS PGothic', 'MS Gothic', 'Yu Gothic', 'Yu Gothic UI',
        'MS Mincho', 'MS PMincho', 'Yu Mincho', 'Meiryo UI', '游ゴシック', '游明朝',
        'ヒラギノ角ゴ Pro W3', 'ヒラギノ明朝 Pro W3', 'さざなみゴシック',
        // 英語フォント
        'Arial', 'Times New Roman', 'Calibri', 'Cambria', 'Segoe UI', 'Helvetica',
        'Georgia', 'Verdana', 'Courier New'
    ];

    commonFonts.forEach(font => {
        if (document.fonts.check(`12px "${font}"`)) {
            fontSet.add(font);
        }
    });
}

// フォントセレクトの初期化
async function populateFontSelect() {
    const fontSelect = document.getElementById('fontSelect');
    const fonts = await getSystemFonts();

    fonts.forEach(font => {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font;
        option.style.fontFamily = font;
        fontSelect.appendChild(option);
    });

    // 初期フォントを設定
    if (fonts.length > 0) {
        updateFontFamily(fonts[0]);
    }

    fontSelect.addEventListener('change', (e) => {
        updateFontFamily(e.target.value);
    });
}

// フォントファミリーの更新
function updateFontFamily(fontFamily) {
    const previewArea = document.getElementById('previewArea');
    if (previewArea) {
        previewArea.style.fontFamily = `"${fontFamily}", sans-serif`;
    }

    // グリッド内の各文字にも個別に適用
    const gridChars = document.querySelectorAll('#characterGrid span');
    gridChars.forEach(span => {
        span.style.fontFamily = `"${fontFamily}", sans-serif`;
    });

    // サンプルテキストにも適用
    const sampleText = document.getElementById('sampleText');
    if (sampleText) {
        sampleText.style.fontFamily = `"${fontFamily}", sans-serif`;
    }

    // フォントセレクトのオプションにも適用
    const option = document.querySelector(`#fontSelect option[value="${fontFamily}"]`);
    if (option) {
        option.style.fontFamily = `"${fontFamily}", sans-serif`;
    }
}

// 文字カテゴリーの定義と生成関数
const characterCategories = {
    basic: generateBasicCharacters(),
    geometric: generateGeometricCharacters(),
    usage: generateUsageCharacters(),
    surrogate: generateSurrogateCharacters(),
    ivs: generateIVSCharacters()
};

// 基本的な文字の生成（ひらがな、カタカナ、漢字の一部）
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

    // 基本漢字（教育漢字の一部）
    const basicKanji = '日月火水木金土一二三四五六七八九十百千万円年';
    characters.push(...basicKanji.split(''));

    return characters;
}

// 幾何学的な記号の生成
function generateGeometricCharacters() {
    const geometricRanges = [
        [0x25A0, 0x25FF], // 幾何学模様
        [0x2600, 0x26FF], // その他の記号
        [0x2700, 0x27BF]  // 装飾記号
    ];

    return generateCharactersFromRanges(geometricRanges);
}

// 使用領域の文字生成
function generateUsageCharacters() {
    const usageRanges = [
        [0x3200, 0x32FF], // 囲み文字
        [0x3300, 0x33FF]  // CJK互換文字
    ];

    return generateCharactersFromRanges(usageRanges);
}

// サロゲートペア文字の生成
function generateSurrogateCharacters() {
    const emojiRanges = [
        [0x1F600, 0x1F64F], // 感情
        [0x1F300, 0x1F5FF], // その他の記号や象形文字
        [0x1F680, 0x1F6FF]  // 輸送および地図の記号
    ];

    return generateCharactersFromRanges(emojiRanges);
}

// 文字範囲からの文字生成
function generateCharactersFromRanges(ranges) {
    const characters = [];
    ranges.forEach(([start, end]) => {
        for (let i = start; i <= end; i++) {
            try {
                const char = String.fromCodePoint(i);
                if (isCharacterRenderable(char)) {
                    characters.push(char);
                }
            } catch (e) {
                console.warn(`Unable to create character for code point: ${i}`);
            }
        }
    });
    return characters;
}

// IVS文字の生成
function generateIVSCharacters() {
    const baseCharacters = '葛芦茨悪惡';
    const characters = [];
    
    baseCharacters.split('').forEach(base => {
        for (let i = 0xE0100; i <= 0xE01EF; i++) {
            try {
                const ivs = String.fromCodePoint(i);
                const combined = base + ivs;
                if (isCharacterRenderable(combined)) {
                    characters.push(combined);
                }
            } catch (e) {
                console.warn(`Unable to create IVS character for: ${base} + ${i}`);
            }
        }
    });

    return characters;
}

// 文字が描画可能かチェック
function isCharacterRenderable(char) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = '16px sans-serif';
    return ctx.measureText(char).width > 0;
}

// 文字グリッドの更新
function updateCharacterGrid(category) {
    const grid = document.getElementById('characterGrid');
    grid.innerHTML = '';
    const currentFont = document.getElementById('fontSelect').value;
    const chars = characterCategories[category];
    
    // 表示する文字数を制限（パフォーマンス対策）
    const maxDisplay = 200;
    const displayChars = chars.slice(0, maxDisplay);

    displayChars.forEach(char => {
        const span = document.createElement('span');
        span.textContent = char;
        span.style.fontFamily = `"${currentFont}", sans-serif`;
        span.title = `Unicode: ${[...char].map(c => 'U+' + c.codePointAt(0).toString(16).toUpperCase()).join(' ')}`;
        grid.appendChild(span);
    });
}

// イベントリスナーの設定
function setupEventListeners() {
    const buttons = document.querySelectorAll('.character-categories button');
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            buttons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            updateCharacterGrid(e.target.dataset.category);
        });
    });
}

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    await populateFontSelect();
    setupEventListeners();
    // デフォルトで基本系を表示
    document.querySelector('[data-category="basic"]').click();
});