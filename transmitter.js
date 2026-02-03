/* STARK RF ATTACK VECTORS - PAYLOAD GENERATOR */

const AttackSuite = {
    // 1. نظام إرسال النبضات المخزنة (Replay Attack)
    replaySignal: async function(hexID, pulseWidth) {
        if (!hexID) {
            logToTerminal("CRITICAL: NO_SIGNAL_SELECTED_FOR_REPLAY");
            return;
        }
        
        // صيغة الأمر للهاردوير: ATK:HEX:PULSE
        const payload = `ATK:${hexID}:${pulseWidth}\n`;
        await this.transmit(payload);
        logToTerminal(`EXECUTING_REPLAY: ID[${hexID}]`);
    },

    // 2. نظام التشويش التكتيكي (Tactical Jamming)
    toggleJammer: async function(state) {
        const command = state ? "JAM:ON\n" : "JAM:OFF\n";
        await this.transmit(command);
        
        const statusElement = document.getElementById('conn-status');
        if(state) {
            statusElement.innerText = "JAMMING_ACTIVE";
            statusElement.style.color = "#ff0000";
            logToTerminal("WARNING: RF_JAMMER_ENABLED_ON_433MHZ");
        } else {
            statusElement.innerText = "LINK_ESTABLISHED";
            statusElement.style.color = "#00ff41";
            logToTerminal("INFO: JAMMER_DEACTIVATED");
        }
    },

    // 3. المحرك الموحد للإرسال عبر Serial
    transmit: async function(rawCommand) {
        if (!port || !port.writable) {
            logToTerminal("ERROR: HARDWARE_NOT_READY");
            return;
        }

        const encoder = new TextEncoder();
        const writer = port.writable.getWriter();
        
        try {
            await writer.write(encoder.encode(rawCommand));
            logToTerminal(`TX_SUCCESS: ${rawCommand.trim()}`);
        } catch (err) {
            logToTerminal(`TX_FAILED: ${err}`);
        } finally {
            writer.releaseLock();
        }
    }
};

// ربط أزرار الواجهة بالوظائف القتالية
function executeAttack(type) {
    switch(type) {
        case 'REPLAY':
            // بيسحب آخر HEX تم رصده من التيرمينال أو الذاكرة اللحظية
            AttackSuite.replaySignal(window.lastDetectedHex, window.lastDetectedPulse);
            break;
        case 'JAM':
            // تفعيل/تعطيل التشويش (Toggle)
            window.isJamming = !window.isJamming;
            AttackSuite.toggleJammer(window.isJamming);
            break;
    }
}
