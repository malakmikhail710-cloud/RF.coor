/* STARK RF VISUALIZER - GPU ACCELERATED WATERFALL */

const canvas = document.getElementById('waterfall-canvas');
const ctx = canvas.getContext('2d');

// إعدادات الشلال
let waterfallData = [];
const maxLines = 100; // عدد الصفوف اللي هتظهر في الشلال
const rowHeight = 4;  // سمك الصف الواحد

// ضبط أبعاد الكانفاس لتناسب الشاشة
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// وظيفه استقبال النبضة وحقنها في الشلال
window.pushToWaterfall = function(pulse) {
    // تحويل قيمة النبضة لنسبة مئوية (للتلوين)
    // نفترض إن أقصى نبضة 1000us
    const intensity = Math.min(pulse / 1000, 1);
    
    // إضافة الصف الجديد في أول المصفوفة
    waterfallData.unshift(intensity);
    
    // مسح الصفوف القديمة عشان مياكلش رامات
    if (waterfallData.length > maxLines) {
        waterfallData.pop();
    }
    
    drawWaterfall();
};

function drawWaterfall() {
    // مسح الكانفاس قبل الرسم الجديد
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < waterfallData.length; i++) {
        const intensity = waterfallData[i];
        
        // حساب اللون (من الأزرق البارد للأحمر الحارق بناءً على الشدة)
        const red = Math.floor(intensity * 255);
        const blue = Math.floor((1 - intensity) * 255);
        const green = Math.floor(intensity * 50); // لمسة خضراء خفيفة

        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        
        // رسم الصف في مكانه (كل ما i تزيد، الصف ينزل لتحت)
        const y = i * rowHeight;
        
        // إضافة تأثير "توهج" بسيط
        ctx.shadowBlur = 5;
        ctx.shadowColor = `rgb(${red}, ${green}, ${blue})`;
        
        ctx.fillRect(0, y, canvas.width, rowHeight - 1);
    }
}

// تشغيل أنيميشن خفيف في حالة الثبات (Idle Effect)
function idleAnimation() {
    if (waterfallData.length === 0) {
        // لو مفيش داتا، نرسم خطوط وهمية خفيفة جداً كأن السيستم شغال
        ctx.fillStyle = "rgba(0, 255, 255, 0.05)";
        ctx.fillRect(0, Math.random() * canvas.height, canvas.width, 1);
    }
    requestAnimationFrame(idleAnimation);
}

idleAnimation();
