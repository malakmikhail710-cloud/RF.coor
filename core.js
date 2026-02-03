/* STARK RF CORE ENGINE - WEB SERIAL IMPLEMENTATION */

let port;
let reader;
let inputDone;
let inputStream;

const connectBtn = document.getElementById('connect-btn');
const connStatus = document.getElementById('conn-status');
const terminal = document.getElementById('mini-terminal');

// 1. وظيفة الاتصال الذكي بالـ COM Port
connectBtn.addEventListener('click', async () => {
    if ('serial' in navigator) {
        try {
            // طلب الوصول إلى المنفذ (تظهر قائمة بكل الـ COM المتصلة)
            port = await navigator.serial.requestPort();
            
            // فتح المنفذ بسرعة الباود المحددة في سوفت وير ستارك
            await port.open({ baudRate: 921600 });
            
            connStatus.innerText = "LINK_ESTABLISHED";
            connStatus.style.color = "#00ff41";
            connectBtn.style.display = "none";
            
            logToTerminal("SUCCESS: ADAPTER_LOCKED_AT_921600_BAUD");
            
            // بدء قراءة سيل البيانات
            readLoop();
            
        } catch (err) {
            logToTerminal("ERROR: " + err);
            connStatus.innerText = "LINK_FAILED";
        }
    } else {
        logToTerminal("CRITICAL: WEB_SERIAL_NOT_SUPPORTED_BY_BROWSER");
    }
});

// 2. حلقة القراءة المستمرة (The Continuous Stream)
async function readLoop() {
    const textDecoder = new TextDecoderStream();
    inputDone = port.readable.pipeTo(textDecoder.writable);
    inputStream = textDecoder.readable;
    reader = inputStream.getReader();

    while (true) {
        const { value, done } = await reader.read();
        if (done) {
            reader.releaseLock();
            break;
        }
        if (value) {
            handleRawData(value);
        }
    }
}

// 3. معالجة البيانات الخام وتحويلها لإشارات مرئية
function handleRawData(data) {
    // تنسيق الداتا: DISC:HEX:PULSE
    if (data.includes("DISC:")) {
        const parts = data.trim().split(":");
        if (parts.length === 3) {
            const hex = parts[1];
            const pulse = parts[2];

            logToTerminal(`DISCOVERY: ID[${hex}] PW[${pulse}us]`);
            
            // إرسال البيانات للمحرك الرسومي (الذي سنبنيه في الخطوة القادمة)
            updateTowers(hex, pulse);
            if (window.pushToWaterfall) {
                window.pushToWaterfall(pulse);
            }
        }
    }
}

// 4. تحديث الأبراج الجانبية (Visual Towers)
function updateTowers(hex, pulse) {
    const intensity = Math.min((pulse / 1000) * 100, 100);
    document.getElementById('intensity-fill').style.height = intensity + "%";
    
    // منطق تمييز البروتوكول باللون
    const protoFill = document.getElementById('proto-fill');
    protoFill.style.height = "80%"; // نبضة ثابتة للبيان
}

// 5. الطباعة في التيرمينال الصغير
function logToTerminal(msg) {
    const line = document.createElement('div');
    line.className = "log-line";
    line.innerText = `> ${msg}`;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

// 6. وظيفة إرسال الهجمات (Attack Injection)
async function executeAttack(type) {
    if (!port || !port.writable) {
        logToTerminal("ERROR: NO_HARDWARE_LINK");
        return;
    }
    
    const encoder = new TextEncoder();
    const writer = port.writable.getWriter();
    
    let command = "";
    if (type === 'JAM') command = "JAM:ON\n";
    if (type === 'REPLAY') command = "VAULT:DUMP\n"; // كمثال حالي

    await writer.write(encoder.encode(command));
    writer.releaseLock();
    logToTerminal(`COMMAND_SENT: ${type}`);
}
