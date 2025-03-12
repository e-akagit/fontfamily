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

    return characters;
}

// 記号・図形の生成
function generateGeometricCharacters() {
    const characters = [];
    for (let i = 0x25A0; i <= 0x25FF; i++) {
        characters.push(String.fromCodePoint(i));
    }
    return characters;
}

// 私用領域の文字生成
function generatePrivateUseCharacters() {
    const characters = [];
    for (let i = 0xE000; i <= 0xF8FF; i++) {
        characters.push(String.fromCodePoint(i));
    }
    return characters;
}

// サロゲートペア文字の生成
function generateSurrogateCharacters() {
    const characters = [];
    // 絵文字範囲（一部）
    for (let i = 0x1F600; i <= 0x1F64F; i++) {
        characters.push(String.fromCodePoint(i));
    }
    return characters;
}

// IVS文字の生成
function generateIVSCharacters() {
    const baseCharacters = ['葛', '芦', '茨', '悪', '惡'];
    const characters = [];
    
    baseCharacters.forEach(base => {
        characters.push(base);
        // IVSセレクタ（E0100-E01EF）の一部を使用
        for (let i = 0xE0100; i <= 0xE0110; i++) {
            characters.push(base + String.fromCodePoint(i));
        }
    });
    
    return characters;
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

    if (fonts.length > 0) {
        updateFontFamily(fonts[0]);
    }
}

// フォントファミリーの更新
function updateFontFamily(fontFamily) {
    const grid = document.getElementById('characterGrid');
    const sampleText = document.getElementById('sampleText');
    
    grid.style.fontFamily = `"${fontFamily}", sans-serif`;
    sampleText.style.fontFamily = `"${fontFamily}", sans-serif`;
}

// 文字グリッドの更新
function updateCharacterGrid(category) {
    const grid = document.getElementById('characterGrid');
    const chars = characterCategories[category];
    
    grid.innerHTML = '';
    chars.forEach(char => {
        const span = document.createElement('span');
        span.textContent = char;
        grid.appendChild(span);
    });
}

// フォントサイズの更新
function initFontSizeControl() {
    const sizeSlider = document.getElementById('fontSize');
    const sizeValue = document.getElementById('fontSizeValue');
    const grid = document.getElementById('characterGrid');

    sizeSlider.addEventListener('input', (e) => {
        const size = e.target.value;
        sizeValue.textContent = `${size}px`;
        grid.style.fontSize = `${size}px`;
    });
}

// イベントリスナーの設定
function setupEventListeners() {
    // カテゴリーボタンのイベント
    document.querySelectorAll('.character-categories button').forEach(button => {
        button.addEventListener('click', (e) => {
            // アクティブクラスを更新
            document.querySelectorAll('.character-categories button').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');

            // グリッドを更新
            updateCharacterGrid(e.target.dataset.category);
        });
    });

    // フォント選択のイベント
    document.getElementById('fontSelect').addEventListener('change', (e) => {
        updateFontFamily(e.target.value);
    });
}

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    await populateFontSelect();
    initFontSizeControl();
    setupEventListeners();

    // 初期カテゴリーを選択
    const defaultButton = document.querySelector('[data-category="basic"]');
    if (defaultButton) {
        defaultButton.click();
    }
});