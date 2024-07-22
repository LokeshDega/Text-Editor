const fontFamilySelect = document.getElementById('fontFamily');
const fontWeightSelect = document.getElementById('fontWeight');
const italicButton = document.getElementById('italicButton');
const textEditor = document.getElementById('textEditor');

let fonts = {};
let currentFontStyle = 'normal';
let currentFontWeight = '400'; 


async function loadFonts() {
    try {
        const response = await fetch('punt-frontend-assignment.json');
        fonts = await response.json();
        populateFontFamily();
        loadEditor();
    } catch (error) {
        console.error('Error loading font data:', error);
    }
}

function populateFontFamily() {
    fontFamilySelect.innerHTML = '<option value="" disabled selected>Select font</option>';

    for (const font in fonts) {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font;
        fontFamilySelect.appendChild(option);
    }
    populateFontWeight();
}

function populateFontWeight() {
    const selectedFontWeight = fontWeightSelect.value;

    fontWeightSelect.innerHTML = '<option value="" disabled selected>Select font weight</option>';

    const allWeights = new Set();
    for (const font in fonts) {
        Object.keys(fonts[font]).forEach(weight => allWeights.add(weight));
    }

    Array.from(allWeights).sort((a, b) => {
        const aIsItalic = a.includes('italic');
        const bIsItalic = b.includes('italic');
        if (aIsItalic && !bIsItalic) return 1;
        if (!aIsItalic && bIsItalic) return -1;
        return parseInt(a) - parseInt(b);
    }).forEach(weight => {
        const option = document.createElement('option');
        option.value = weight;
        option.textContent = weight.includes('italic') ? `${weight.replace('italic', '')} Italic` : weight;
        fontWeightSelect.appendChild(option);
    });

    if (selectedFontWeight) {
        fontWeightSelect.value = selectedFontWeight; 
    }

    updateItalicButton();
}

function updateItalicButton() {
    const selectedWeight = fontWeightSelect.value;
    const isItalicAvailable = selectedWeight.includes('italic');

    if (isItalicAvailable) {
        italicButton.disabled = false;
        italicButton.classList.add('active');
        currentFontStyle = 'italic';
    } else {
        italicButton.disabled = true;
        italicButton.classList.remove('active');
        currentFontStyle = 'normal';
    }
    updateFont();
}

function toggleItalic() {
    italicButton.classList.toggle('active');
    currentFontStyle = italicButton.classList.contains('active') ? 'italic' : 'normal';
    updateFont();
}

function updateFont() {
    const fontFamily = fontFamilySelect.value;
    let fontWeight = fontWeightSelect.value;
    const fontStyle = currentFontStyle;

    if (fontStyle === 'italic' && !fontWeight.includes('italic')) {
        fontWeight += 'italic';
    }

    if (fontFamily && fontWeight) {
        const fontUrl = fonts[fontFamily][fontWeight] || findClosestVariant(fontFamily, fontWeight, fontStyle);
        const newFont = new FontFace(fontFamily, `url(${fontUrl})`);

        newFont.load().then(loadedFont => {
            document.fonts.add(loadedFont);
            textEditor.style.fontFamily = fontFamily;
            textEditor.style.fontWeight = fontWeight.replace('italic', '');
            textEditor.style.fontStyle = fontStyle;
            saveEditor();
        }).catch(error => console.error('Error loading font:', error));
    }
}

function findClosestVariant(fontFamily, fontWeight, fontStyle) {
    const weights = Object.keys(fonts[fontFamily]);
    const isItalic = fontStyle === 'italic';

    let closestWeight = weights[0];
    weights.forEach(weight => {
        if (Math.abs(parseInt(weight) - parseInt(fontWeight)) < Math.abs(parseInt(closestWeight) - parseInt(fontWeight))) {
            closestWeight = weight;
        }
    });

    if (isItalic && !weights.includes(closestWeight + 'italic')) {
        closestWeight = weights.find(weight => weight.includes('italic')) || closestWeight;
    }

    return fonts[fontFamily][closestWeight];
}

function resetEditor() {
    textEditor.value = '';
    textEditor.style.fontFamily = 'Arial';
    textEditor.style.fontWeight = '400';
    textEditor.style.fontStyle = 'normal';

    fontFamilySelect.value = '';
    fontWeightSelect.innerHTML = '<option value="" disabled selected>Select font weight</option>'; 
    italicButton.classList.remove('active');
    italicButton.disabled = true;

    currentFontStyle = 'normal';
    currentFontWeight = '400';

    saveEditor();
}

function saveEditor() {
    const content = textEditor.value;
    const fontFamily = fontFamilySelect.value;
    let fontWeight = fontWeightSelect.value;
    const fontStyle = currentFontStyle;

    if (fontStyle === 'italic' && !fontWeight.includes('italic')) {
        fontWeight += 'italic';
    }

    localStorage.setItem('textEditorContent', content);
    localStorage.setItem('fontFamily', fontFamily);
    localStorage.setItem('fontWeight', fontWeight);
    localStorage.setItem('fontStyle', fontStyle);
}

function loadEditor() {
    const content = localStorage.getItem('textEditorContent');
    const fontFamily = localStorage.getItem('fontFamily');
    const fontWeight = localStorage.getItem('fontWeight');
    const fontStyle = localStorage.getItem('fontStyle');

    if (content) textEditor.value = content;
    if (fontFamily) fontFamilySelect.value = fontFamily;

    currentFontStyle = fontStyle || 'normal';
    currentFontWeight = fontWeight || '400';

    populateFontWeight();

    setTimeout(() => {
        if (fontWeight) fontWeightSelect.value = fontWeight;
        if (fontStyle === 'italic') italicButton.classList.add('active');
        else italicButton.classList.remove('active');
        updateFont();
    }, 100);
}

setInterval(saveEditor, 5000);

fontFamilySelect.addEventListener('change', populateFontWeight);
fontWeightSelect.addEventListener('change', updateItalicButton);
italicButton.addEventListener('click', toggleItalic);
textEditor.addEventListener('input', saveEditor);

loadFonts();
