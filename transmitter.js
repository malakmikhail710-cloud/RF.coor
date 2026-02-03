/* STARK RF TRANSMITTER v6.0 - HARDWARE-LINKED PAYLOAD ENGINE 
   Optimized for: ESP32-C3 + HC-12 (UART Replay Mode)
*/

const Transmitter = {
    isTransmitting: false,
    queue: [],

    // 1. محرك إعادة الإرسال (The Replay Engine)
    executeReplay: async function(hexID, pulseWidth) {
        if (!hexID || hexID === "null") {
            logToTerminal("STRIKE_FAILED: NO_TARGET_HEX_LOCKED", "error");
            return;
        }

        // الصيغة المطابقة لكود الـ C++: ATK:HEX:PULSE
        // مثال: ATK:A1B2C3:450
        const cleanHex = hexID.replace('0x', '');
        const payload = `ATK:${cleanHex}:${pulseWidth}\n`;
        
        this.addToQueue(payload, `STRIKE_EXE: 0x${cleanHex}`);
    },

    // 2. نظام التشويش (Tactical Jammer Control)
    setJammerMode: async function(active) {
        // الصيغة المطابقة لكود الـ C++: JAM:ON
        const command = active ? "JAM:ON\n" : "JAM:OFF\n";
        this.addToQueue(command, active ? "JAMMER_ARMED" : "JAMMER_DISARMED");

        // تحديث HUD الواجهة
        const statusElement = document.getElementById('conn-status');
        if (active) {
            statusElement.innerText = "ACTIVE_JAMMING_MODE";
            statusElement.classList.add('danger-glow');
            logToTerminal("WARNING: RF_INTERFERENCE_SEQUENCE_STARTED", "error");
        } else {
            statusElement.innerText = "HARDWARE_STRIKE_LINK_ARMED";
            statusElement.classList.remove('danger-glow');
            logToTerminal("INFO: JAMMER_DEACTIVATED", "success");
        }
    },

    // 3. مدير الطابور الذكي (The Dispatcher)
    addToQueue: function(command, label) {
        this.queue.push({ command, label });
        if (!this.isTransmitting) {
            this.processQueue();
        }
    },

    async processQueue() {
        if (this.queue.length === 0) {
            this.isTransmitting = false;
            return;
        }

        this.isTransmitting = true;
        const task = this.queue.shift();

        try {
            await this.rawTransmit(task.command);
            // لاحظ: التأكيد الحقيقي بييجي من الهاردوير وبيظهر في التيرمينال عبر الـ core.js
            logToTerminal(`PAYLOAD_SENT: ${task.label}`, "info");
        } catch (err) {
            logToTerminal(`TX_CRITICAL_FAILURE: ${err.message}`, "error");
        }

        // انتظار 200ms بين الأوامر لضمان معالجة الـ ESP32 للـ Replay (لأن فيه Loop 10 مرات)
        setTimeout(() => this.processQueue(), 200);
    },

    // 4. السائق الخام (Low-Level Serial Writer)
    rawTransmit: async function(data) {
        if (!STARK_SYSTEM.port || !STARK_SYSTEM.port.writable) {
            throw new Error("HARDWARE_DISCONNECTED");
        }

        const encoder = new TextEncoder();
        const writer = STARK_SYSTEM.port.writable.getWriter();
        
        try {
            await writer.write(encoder.encode(data));
        } finally {
            writer.releaseLock();
        }
    }
};

// 5. موزع العمليات القتالية (Global Interaction Layer)
function executeAttack(type) {
    // جلب أحدث بيانات تم رصدها من الـ Core
    const targetHex = STARK_SYSTEM.lastSignal.hex;
    const targetPulse = STARK_SYSTEM.lastSignal.pulse;

    switch(type) {
        case 'REPLAY':
            Transmitter.executeReplay(targetHex, targetPulse);
            break;
        case 'JAM':
            window.isJamming = !window.isJamming;
            Transmitter.setJammerMode(window.isJamming);
            break;
    }
}
