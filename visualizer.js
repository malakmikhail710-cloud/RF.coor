/* STARK RF VISUALIZER v6.0 - TACTICAL SDR WATERFALL 
   Precision Engine for HC-12 / ESP32-C3 Data Streams
*/

const canvas = document.getElementById('waterfall-canvas');
const ctx = canvas.getContext('2d', { alpha: false });

const CONFIG = {
    rowHeight: 2,         // سمك خيط الشلال
    maxHistory: 200,      // عمق الذاكرة المرئية
    waveformHeight: 80,   // ارتفاع الموجة العلوية
    decayRate: 0.94,      // سرعة تلاشي الموجة
    thermalScale: [
        {p: 0.0, c: '#000000'}, // صمت
        {p: 0.2, c: '#000055'}, // نويز خفيف جداً
        {p: 0.4, c: '#aa0000'}, // إشارة متوسطة
        {p: 0.7, c: '#ffaa00'}, // إشارة قوية
        {p: 1.0, c: '#ffffff'}  // قمة النبضة (Saturation)
    ]
};

let waterfallBuffer = []; 
let liveWave = new Array(100).fill(0);

function initCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', initCanvas);
initCanvas();

// 1. استقبال النبضة من الـ Core وتجسيدها رسومياً
window.pushToWaterfall = function(pulse) {
    // معايرة الكثافة بناءً على منطق الـ ESP32 (من 100 إلى 1000 ميكروثانية)
    const intensity = Math.max(0, Math.min((pulse - 100) / 900, 1));
    
    // حقن الصف في الشلال
    waterfallBuffer.unshift(intensity);
    if (waterfallBuffer.length > CONFIG.maxHistory) waterfallBuffer.pop();

    // تفجير الموجة اللحظية (Spike)
    injectWaveform(intensity);
};

// 2. محرك رسم الموجة اللاسلكية (SDR-Style Waveform)
function injectWaveform(intensity) {
    const mid = Math.floor(liveWave.length / 2);
    liveWave[mid] = intensity;
    // انتشار الطاقة على الجانبين (Gaussian-like distribution)
    for (let i = 1; i < 15; i++) {
        const energy = intensity * (1 - i / 15);
        if (mid + i < liveWave.length) liveWave[mid + i] = Math.max(liveWave[mid + i], energy);
        if (mid - i >= 0) liveWave[mid - i] = Math.max(liveWave[mid - i], energy);
    }
}

// 3. المحرك الرئيسي (The Master Render Loop)
function render() {
    // مسح الشاشة بسواد مطلق
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawWaterfallLines();
    drawWaveformTop();

    requestAnimationFrame(render);
}

// 4. رسم صفوف الشلال (Waterfall Implementation)
function drawWaterfallLines() {
    for (let i = 0; i < waterfallBuffer.length; i++) {
        const val = waterfallBuffer[i];
        if (val < 0.05) continue; // تجاهل القيم الضعيفة جداً للنقاء

        ctx.fillStyle = interpolateColor(val);
        const y = (i * CONFIG.rowHeight) + CONFIG.waveformHeight + 10;
        
        // رسم الخط بعرض الكانفاس بالكامل
        ctx.fillRect(0, y, canvas.width, CONFIG.rowHeight);
    }
}

// 5. رسم تراكب الموجة (Live Spectrum Overlay)
function drawWaveformTop() {
    ctx.beginPath();
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1.5;
    const step = canvas.width / liveWave.length;

    for (let i = 0; i < liveWave.length; i++) {
        const x = i * step;
        const y = CONFIG.waveformHeight - (liveWave[i] * CONFIG.waveformHeight);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        // تلاشي الموجة تدريجياً (Phosphor effect)
        liveWave[i] *= CONFIG.decayRate;
    }
    ctx.stroke();

    // رسم خط الأساس (Noise Floor Line)
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(0, CONFIG.waveformHeight);
    ctx.lineTo(canvas.width, CONFIG.waveformHeight);
    ctx.stroke();
}

// 6. مفسر الألوان الحراري (Thermal Mapping)
function interpolateColor(val) {
    const scale = CONFIG.thermalScale;
    for (let i = 0; i < scale.length - 1; i++) {
        if (val >= scale[i].p && val <= scale[i+1].p) {
            return scale[i+1].c; // اختيار اللون الأقرب للشدة
        }
    }
    return scale[0].c;
}

// انطلاق المحرك
render();
