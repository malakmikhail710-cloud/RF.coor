/* STARK RF CORE ENGINE v5.0 - TACTICAL MASTER EDITION 
   Target: ESP32-C3 + HC-12 UART Transceiver
   Logistics: Optimized for High-Speed Asynchronous Sniffing
*/

const STARK_SYSTEM = {
    port: null,
    reader: null,
    writer: null,
    isConnected: false,
    buffer: "", 
    lastSignal: { hex: null, pulse: null, protocol: null },
    settings: {
        minPulse: 50,
        maxPulse: 2000,
        squelch: true
    }
};

const UI = {
    connectBtn: document.getElementById('connect-btn'),
    status: document.getElementById('conn-status'),
    terminal: document.getElementById('mini-terminal')
};

// 1. محرك الاتصال الاستراتيجي (Serial Initialization)
UI.connectBtn.addEventListener('click', async () => {
    if (!('serial' in navigator)) {
        logToTerminal("CRITICAL: WEB_SERIAL_NOT_SUPPORTED_BY_HOST", "error");
        return;
    }

    try {
        STARK_SYSTEM.port = await navigator.serial.requestPort();
        await STARK_SYSTEM.port.open({ 
            baudRate: 921600, 
            dataBits: 8,
            stopBits: 1,
            parity: "none",
            flowControl: "none"
        });

        STARK_SYSTEM.isConnected = true;
        UI.status.innerText = "HARDWARE_STRIKE_LINK_ARMED";
        UI.status.classList.add('danger-glow', 'pulse-animation');
        UI.connectBtn.style.display = "none";

        logToTerminal("LINK_ESTABLISHED: ESP32-C3_LOCKED_@921600", "success");
        
        startListening();
    } catch (err) {
        logToTerminal(`LINK_FAILURE: ${err.message}`, "error");
    }
});

// 2. معالج التدفق الفائق (High-Speed Stream Processor)
async function startListening() {
    while (STARK_SYSTEM.port.readable) {
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = STARK_SYSTEM.port.readable.pipeTo(textDecoder.writable);
        STARK_SYSTEM.reader = textDecoder.readable.getReader();

        try {
            while (true) {
                const { value, done } = await STARK_SYSTEM.reader.read();
                if (done) break;
                if (value) processBuffer(value);
            }
        } catch (error) {
            logToTerminal(`INTERRUPT: STREAM_SYNC_LOST (${error})`, "error");
        } finally {
            STARK_SYSTEM.reader.releaseLock();
        }
    }
}

// 3. مدير البافر (Buffer Control Unit)
function processBuffer(data) {
    STARK_SYSTEM.buffer += data;
    let lines = STARK_SYSTEM.buffer.split(/\r?\n/);
    STARK_SYSTEM.buffer = lines.pop(); // الحفاظ على بقايا السطر للمعالجة القادمة

    for (let line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine) continue;

        // تحليل صيغة الـ ESP32-C3: DISC:HEX:PULSE
        if (cleanLine.startsWith("DISC:")) {
            parseRFSignal(cleanLine);
        } else if (cleanLine.startsWith("[TX]")) {
            logToTerminal(cleanLine, "success"); // تأكيد الإرسال من الهاردوير
        } else if (cleanLine.includes("[STATUS]")) {
            logToTerminal(`HW_STATUS: ${cleanLine}`, "info");
        }
    }
}

// 4. محلل الإشارات التكتيكي (Signal Intelligence Parser)
function parseRFSignal(data) {
    const parts = data.split(":");
    if (parts.length < 3) return;

    const hexCode = parts[1].toUpperCase();
    const pulseWidth = parseInt(parts[2]);

    // نظام الـ Squelch للتصفية
    if (STARK_SYSTEM.settings.squelch) {
        if (pulseWidth < STARK_SYSTEM.settings.minPulse || pulseWidth > STARK_SYSTEM.settings.maxPulse) {
            return; // تجاهل النويز
        }
    }

    const proto = identifyProtocol(pulseWidth);
    STARK_SYSTEM.lastSignal = { hex: hexCode, pulse: pulseWidth, protocol: proto };

    // التوجيه للمحركات المتصلة (Waterfall & Vault)
    logToTerminal(`CAPTURED: [${proto}] ID:0x${hexCode} PW:${pulseWidth}us`, "intercept");
    
    // حقن البيانات في النظام المرئي
    if (window.pushToWaterfall) window.pushToWaterfall(pulseWidth);
    if (window.Vault) window.Vault.saveSignal(hexCode, pulseWidth, proto);
    
    triggerTacticalHUD(pulseWidth, proto);
}

// 5. محرك التمييز (Protocol Signature Recognition)
function identifyProtocol(pulse) {
    // بناءً على كود الـ SignalAnalyzer في الـ ESP32
    if (pulse >= 250 && pulse <= 400) return "SC2262_FIXED";
    if (pulse > 400 && pulse <= 650) return "EV1527_LEARNING";
    if (pulse > 650 && pulse <= 950) return "HT6P20_PROTO";
    return "RAW_RF_STRIKE";
}

// 6. نظام التيرمينال (Advanced Tactical Logger)
function logToTerminal(msg, type = "info") {
    const entry = document.createElement('div');
    entry.className = `log-line type-${type}`;
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, fractionDigits: 2 });
    
    let icon = "⚙️";
    if (type === "error") icon = "❌";
    if (type === "intercept") icon = "📡";
    if (type === "success") icon = "✅";

    entry.innerHTML = `<span class="t-stamp">${time}</span> <span class="t-icon">${icon}</span> ${msg}`;
    UI.terminal.appendChild(entry);
    
    // إدارة سعة التيرمينال لضمان السرعة
    if (UI.terminal.childNodes.length > 150) UI.terminal.removeChild(UI.terminal.firstChild);
    UI.terminal.scrollTop = UI.terminal.scrollHeight;
}

// 7. تحديث الـ HUD (Hardware Status Feedback)
function triggerTacticalHUD(pulse, proto) {
    const intensityFill = document.getElementById('intensity-fill');
    const protoFill = document.getElementById('proto-fill');
    
    const height = Math.min((pulse / 1000) * 100, 100);
    
    if (intensityFill) {
        intensityFill.style.height = `${height}%`;
        intensityFill.style.filter = `hue-rotate(${height}deg)`; // تغيير اللون بناء على القوة
    }
    
    if (protoFill) {
        protoFill.style.height = "100%";
        setTimeout(() => protoFill.style.height = "0%", 100);
    }
}
