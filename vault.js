/* STARK RF VAULT v6.0 - TACTICAL INTELLIGENCE REPOSITORY 
   Targeted for: ESP32-C3 SPIFFS & Browser LocalStorage Sync
*/

const Vault = {
    storageKey: 'stark_rf_vault_v6',
    lastSavedHex: null,
    cooldownPeriod: 3000, // منع تكرار نفس الإشارة قبل 3 ثواني

    // 1. نظام الحفظ التكتيكي
    saveSignal: function(hexID, pulse, protocol = "UNKNOWN") {
        if (!hexID || hexID === "null") return;

        // فلترة التكرار اللحظي (Debouncing)
        if (this.lastSavedHex === hexID) return;

        let vaultData = this.getRawData();
        
        // التحقق من وجود الكود مسبقاً في قاعدة البيانات
        const existingIndex = vaultData.findIndex(s => s.id === hexID);

        const entry = {
            id: hexID.replace('0x', ''), // توحيد الصيغة بدون 0x
            pw: pulse,
            proto: protocol,
            timestamp: new Date().toISOString(),
            alias: `TARGET_${Math.random().toString(16).slice(2, 5).toUpperCase()}`
        };

        if (existingIndex !== -1) {
            // تحديث وقت آخر ظهور للإشارة لو موجودة قبل كدة
            vaultData[existingIndex].timestamp = entry.timestamp;
            vaultData[existingIndex].pw = pulse; // تحديث النبضة لو اتغيرت
        } else {
            // إضافة إشارة جديدة تماماً في الأول
            vaultData.unshift(entry);
            this.renderToTerminal(entry);
        }

        // الحفاظ على سعة 100 إشارة فقط (النوعية قبل الكمية)
        localStorage.setItem(this.storageKey, JSON.stringify(vaultData.slice(0, 100)));
        
        this.lastSavedHex = hexID;
        setTimeout(() => { this.lastSavedHex = null; }, this.cooldownPeriod);
    },

    // 2. جلب البيانات (Safe Fetch)
    getRawData: function() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("VAULT_CORRUPTED", e);
            return [];
        }
    },

    // 3. بناء الواجهة التفاعلية (Interactive HUD Rows)
    renderToTerminal: function(entry) {
        const terminal = document.getElementById('mini-terminal');
        if (!terminal) return;

        const row = document.createElement('div');
        row.className = 'vault-entry-row';
        row.setAttribute('data-id', entry.id);

        row.innerHTML = `
            <div class="v-info">
                <span class="v-time">${new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                <span class="v-proto">[${entry.proto}]</span>
                <span class="v-id">0x${entry.id}</span>
            </div>
            <div class="v-actions">
                <button class="v-strike-btn" onclick="executeReplayFromVault('${entry.id}', ${entry.pw})">STRIKE</button>
            </div>
        `;

        terminal.prepend(row);
        // تأثير وميض عند الإضافة
        row.style.animation = "pulse-gold 1s ease-out";
    },

    // 4. تصدير الاستخبارات (Intelligence Export)
    exportJSON: function() {
        const data = this.getRawData();
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `STARK_INTEL_${new Date().getTime()}.json`;
        a.click();
        logToTerminal("INTELLIGENCE_EXPORTED_TO_LOCAL_STORAGE", "success");
    },

    // 5. تدمير البيانات (Self-Destruct / Wipe)
    purge: function() {
        if (confirm("CRITICAL: DESTROY ALL CAPTURED SIGNALS?")) {
            localStorage.removeItem(this.storageKey);
            logToTerminal("VAULT_PURGED_CLEAN", "error");
            setTimeout(() => location.reload(), 1000);
        }
    }
};

// وظيفة وسيطة لضمان تنفيذ الهجوم من أزرار الخزنة
function executeReplayFromVault(hex, pulse) {
    if (window.Transmitter) {
        logToTerminal(`INITIATING_VAULT_STRIKE: 0x${hex}`, "intercept");
        window.Transmitter.executeReplay(hex, pulse);
    } else {
        logToTerminal("TRANSMITTER_OFFLINE", "error");
    }
}

// تحميل الإشارات السابقة عند الإقلاع
window.addEventListener('load', () => {
    const history = Vault.getRawData();
    if (history.length > 0) {
        logToTerminal(`VAULT_RECOVERED: ${history.length} TARGETS_LOADED`, "success");
        // عرض آخر 5 إشارات فقط في التيرمينال عشان الزحمة
        history.slice(0, 5).reverse().forEach(entry => Vault.renderToTerminal(entry));
    }
});
