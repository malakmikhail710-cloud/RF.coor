/* STARK RF VISUALIZER v5.2 - QUANTUM SPECTRAMETER ENGINE */

const canvas = document.getElementById('waterfall-canvas');
const ctx = canvas.getContext('2d', { alpha: false }); // تحسين الأداء بتعطيل الشفافية

const CONFIG = {
    maxHistory: 150,
    rowHeight: 3,
    colors: ['#000000', '#1a0033', '#4b0082', '#ff0000', '#ffcc00', '#ffffff'], // Thermal Scale
    fftSize: 128
};

let spectrumHistory = [];
let currentWaveform = new Array(CONFIG.fftSize).fill(0);

function initVisualizer() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}

window.addEventListener('resize', initVisualizer);
initVisualizer();

// 1. محرك حقن البيانات الذكي
window.pushToWaterfall = function(pulse) {
    // تحويل النبضة لقيمة كثافة (0 - 1)
    const intensity = Math.min(pulse / 1200, 1);
    
    // حقن البيانات في المصفوفة التاريخية
    spectrumHistory.unshift(intensity);
    if (spectrumHistory.length > CONFIG.maxHistory) spectrumHistory.pop();

    // تحديث شكل الموجة اللحظي (Waveform Pulse)
    updateWaveform(intensity);
    
    // طلب إعادة الرسم في الفريم القادم
    requestAnimationFrame(renderCore);
};

// 2. تحديث الرسم البياني للنبضة (Waveform Logic)
function updateWaveform(intensity) {
    const center = Math.floor(CONFIG.fftSize / 2);
    currentWaveform[center] = intensity * 0.9;
    // توزيع الطاقة على الجانبين لمحاكاة شكل الموجة اللاسلكية
    for(let i = 1; i < 10; i++) {
        const energy = intensity * (1 - i/10);
        currentWaveform[center + i] = energy;
        currentWaveform[center - i] = energy;
    }
}

// 3. المحرك الرسومي الرئيسي (The Render Engine)
function renderCore() {
    // خلفية سوداء عميقة
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawWaterfall();
    drawWaveformOverlay();
}

// 4. رسم الشلال الاحترافي
function drawWaterfall() {
    for (let i = 0; i < spectrumHistory.length; i++) {
        const intensity = spectrumHistory[i];
        ctx.fillStyle = getThermalColor(intensity);
        
        const y = i * CONFIG.rowHeight;
        // رسم الصف مع تأثير توهج طفيف
        ctx.fillRect(0, y, canvas.width, CONFIG.rowHeight - 0.5);
    }
}

// 5. رسم تراكب الموجة (Waveform Overlay)
function drawWaveformOverlay() {
    ctx.beginPath();
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    const step = canvas.width / CONFIG.fftSize;

    for (let i = 0; i < CONFIG.fftSize; i++) {
        const x = i * step;
        const y = (canvas.height / 3) - (currentWaveform[i] * 100);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        
        // تلاشي تدريجي للموجة اللحظية
        currentWaveform[i] *= 0.92;
    }
    ctx.stroke();
}

// 6. وظيفة تحويل القيمة للون حراري (Thermal Mapping)
function getThermalColor(v) {
    if (v < 0.2) return '#050505';
    if (v < 0.4) return '#2d004d'; // أرجواني عميق
    if (v < 0.6) return '#800000'; // أحمر دموي
    if (v < 0.8) return '#ff4500'; // برتقالي حارق
    return '#ffff00'; // أصفر (إشارة قصوى)
}

// تشغيل وضع الانتظار (Scanning Animation)
function idlePulse() {
    if (spectrumHistory.length === 0) {
        ctx.fillStyle = 'rgba(0, 255, 255, 0.02)';
        ctx.fillRect(0, Math.random() * canvas.height, canvas.width, 2);
    }
    requestAnimationFrame(idlePulse);
}
idlePulse();
