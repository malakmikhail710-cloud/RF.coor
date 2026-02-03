/* STARK RF CORE ENGINE v4.2 - PROFESSIONAL EDITION 
   Engineered for High-Speed RF Analysis & Tactical Operations
*/

// الحالة العامة للنظام (Global State)
const STARK_SYSTEM = {
    port: null,
    reader: null,
    writer: null,
    isConnected: false,
    buffer: "", // لتجميع البيانات المقطوعة
    lastSignal: { hex: null, pulse: null, protocol: null }
};

const UI = {
    connectBtn: document.getElementById('connect-btn'),
    status: document.getElementById('conn-status'),
    terminal: document.getElementById('mini-terminal')
};

// 1. محرك الاتصال المتقدم
UI.connectBtn.addEventListener('click', async () => {
    if (!('serial' in navigator)) {
        logToTerminal("CRITICAL: BROWSER_INCOMPATIBLE_WITH_WEB_SERIAL", "error");
        return;
    }

    try {
        STARK_SYSTEM.port = await navigator.serial.requestPort();
        await STARK_SYSTEM.port.open({ 
            baudRate: 921600, 
            bufferSize: 255 // تحسين استهلاك الرامات للبيانات السريعة
        });

        STARK_SYSTEM.isConnected = true;
        UI.status.innerText = "SYSTEM_ARMED";
        UI.status.style.color = "#00ff41";
        UI.status.classList.add('pulse-animation'); // إضافة تأثير نبض بالـ CSS
        UI.connectBtn.style.display = "none";

        logToTerminal("ENGINE_INITIALIZED: ADAPTER_LOCKED_921600_BAUD", "success");
        
        startListening();
    } catch (err) {
        logToTerminal(`HARDWARE_LINK_FAILED: ${err}`, "error");
    }
});

// 2. محرك القراءة والتحليل الذكي (The Stream Processor)
async function startListening() {
    while (STARK_SYSTEM.port.readable) {
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = STARK_SYSTEM.port.readable.pipeTo(textDecoder.writable);
        STARK_SYSTEM.reader = textDecoder.readable.getReader();

        try {
            while (true) {
                const { value, done } = await STARK_SYSTEM.reader.read();
                if (done) break;
                if (value) {
                    processIncomingData(value);
                }
            }
        } catch (error) {
            logToTerminal(`STREAM_ERROR: ${error}`, "error");
        } finally {
            STARK_SYSTEM.reader.releaseLock();
        }
    }
}

// 3. معالج البيانات الخام (Raw Data Parser)
function processIncomingData(rawData) {
    // تجميع البيانات في البافر للتعامل مع السطور المكسورة
    STARK_SYSTEM.buffer += rawData;
    let lines = STARK_SYSTEM.buffer.split("\n");
    STARK_SYSTEM.buffer = lines.pop(); // الاحتفاظ بآخر سطر غير مكتمل

    for (let line of lines) {
        line = line.trim();
        if (line.startsWith("DISC:")) {
            handleSignalDiscovery(line);
        } else if (line.startsWith("SYS:")) {
            logToTerminal(`HARDWARE_LOG: ${line.substring(4)}`, "info");
        }
    }
}

// 4. تحليل الإشارة (Signal Intelligence)
function handleSignalDiscovery(line) {
    // DISC:HEX_DATA:PULSE_WIDTH
    const [_, hex, pulse] = line.split(":");
    
    if (hex && pulse) {
        const pulseInt = parseInt(pulse);
        const protocol = identifyProtocol(pulseInt);

        STARK_SYSTEM.lastSignal = { hex, pulse: pulseInt, protocol };

        // تحديث الواجهة الرسومية
        logToTerminal(`SIGNAL_INTERCEPTED: [${protocol}] ID:${hex} PW:${pulse}us`, "intercept");
        
        // ربط المحركات الأخرى
        if (window.pushToWaterfall) window.pushToWaterfall(pulseInt);
        if (window.Vault) window.Vault.saveSignal(hex, pulseInt, protocol);
        
        updateVisualTowers(pulseInt);
    }
}

// 5. محرك التعرف على البروتوكولات (Protocol Identification)
function identifyProtocol(pulse) {
    if (pulse > 300 && pulse < 450) return "EV1527_STD";
    if (pulse >= 450 && pulse < 600) return "PT2262_ENHANCED";
    if (pulse > 800) return "SUB_GHZ_RAW";
    return "UNKNOWN_RF";
}

// 6. التيرمينال التكتيكي (Advanced Logging)
function logToTerminal(msg, type = "info") {
    const line = document.createElement('div');
    line.className = `log-line type-${type}`;
    const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
    
    let prefix = "[#] ";
    if (type === "error") prefix = "[!] ";
    if (type === "intercept") prefix = "[>>>] ";
    if (type === "success") prefix = "[OK] ";

    line.innerText = `${timestamp} ${prefix}${msg}`;
    UI.terminal.appendChild(line);
    
    // Auto-scroll ذكي
    if (UI.terminal.childNodes.length > 100) UI.terminal.removeChild(UI.terminal.firstChild);
    UI.terminal.scrollTop = UI.terminal.scrollHeight;
}

// 7. تحديث الأبراج (GPU Accelerated Update)
function updateVisualTowers(pulse) {
    const intensity = Math.min((pulse / 1200) * 100, 100);
    const intensityFill = document.getElementById('intensity-fill');
    const protoFill = document.getElementById('proto-fill');

    if (intensityFill) intensityFill.style.height = `${intensity}%`;
    if (protoFill) {
        protoFill.style.height = "100%";
        setTimeout(() => protoFill.style.height = "0%", 150); // Flash effect
    }
}
