/* STARK RF VAULT v4.8 - SECURE SIGNAL REPOSITORY */

const Vault = {
    storageKey: 'stark_intelligence_db',

    // 1. حفظ الإشارة مع التصنيف الذكي
    saveSignal: function(hexID, pulse, protocol = "UNKNOWN") {
        if (!hexID || hexID === "null") return;

        let vaultData = this.getRawData();
        
        // منع التكرار بناءً على الـ ID والنبضة معاً لدقة أعلى
        const isDuplicate = vaultData.some(s => s.id === hexID && s.pw === pulse);

        if (!isDuplicate) {
            const entry = {
                id: hexID,
                pw: pulse,
                proto: protocol,
                timestamp: new Date().toISOString(),
                alias: `SIG_${Math.random().toString(16).slice(2, 5).toUpperCase()}`
            };

            vaultData.unshift(entry);
            // الاحتفاظ بأهم 100 إشارة ملتقطة
            localStorage.setItem(this.storageKey, JSON.stringify(vaultData.slice(0, 100)));
            
            this.renderToTerminal(entry);
            logToTerminal(`VAULT_SECURED: SIGNAL_${hexID}`, "success");
        }
    },

    // 2. جلب البيانات الخام
    getRawData: function() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || [];
        } catch (e) {
            return [];
        }
    },

    // 3. عرض الإشارة المحفوظة بشكل تفاعلي (Interactive HUD)
    renderToTerminal: function(entry) {
        const terminal = document.getElementById('mini-terminal');
        const entryRow = document.createElement('div');
        entryRow.className = 'vault-entry-row';
        entryRow.innerHTML = `
            <span class="v-time">[${new Date(entry.timestamp).toLocaleTimeString()}]</span>
            <span class="v-proto">${entry.proto}</span>
            <span class="v-id">${entry.id}</span>
            <button class="v-action-btn" onclick="Transmitter.executeReplay('${entry.id}', ${entry.pw})">REJECT_STRIKE</button>
        `;
        // سيتم إضافة الـ CSS الخاص بها في الملف القادم
        terminal.prepend(entryRow);
    },

    // 4. تصدير البيانات (Tactical Backup)
    exportVault: function() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.getRawData()));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "stark_signals_backup.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    },

    // 5. مسح الخزنة (Purge Mode)
    wipeAll: function() {
        if (confirm("CRITICAL: WIPE ALL CAPTURED INTELLIGENCE?")) {
            localStorage.removeItem(this.storageKey);
            logToTerminal("VAULT_PURGED: ALL_DATA_DELETED", "error");
            location.reload();
        }
    }
};

// تهيئة أولية عند التحميل
window.addEventListener('DOMContentLoaded', () => {
    const data = Vault.getRawData();
    if (data.length > 0) {
        logToTerminal(`VAULT_LOADED: ${data.length} SIGNALS_RECOVERED`, "info");
    }
});
