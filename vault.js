/* STARK RF VAULT - PERSISTENT SIGNAL STORAGE */

const Vault = {
    // حفظ الإشارة في ذاكرة المتصفح (LocalStorage)
    saveSignal: function(hexID, pulse) {
        let history = JSON.parse(localStorage.getItem('stark_vault')) || [];
        
        const newSignal = {
            id: hexID,
            pw: pulse,
            timestamp: new Date().toLocaleString(),
            label: "SAVED_SIGNAL"
        };

        // منع التكرار
        if (!history.some(s => s.id === hexID)) {
            history.unshift(newSignal);
            localStorage.setItem('stark_vault', JSON.stringify(history.slice(0, 50))); // حفظ آخر 50 إشارة
            this.renderVault();
        }
    },

    // عرض الإشارات المخزنة في قائمة
    renderVault: function() {
        const vaultContainer = document.getElementById('mini-terminal'); // ممكن نخصصه أكتر بعدين
        let history = JSON.parse(localStorage.getItem('stark_vault')) || [];
        
        console.log("VAULT_DUMP:", history);
        // هنا ممكن نحدث الواجهة لعرض الإشارات القديمة
    }
};

// تحديث الـ core.js لاحقاً لاستدعاء Vault.saveSignal(hex, pulse)

