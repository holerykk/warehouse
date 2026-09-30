(function() {
    const BASE_URL = "http://wh33171.web3.maze-tech.ru/";
    const KEY_CODE_ESC = 27;

    const defaultTexts = {
        title: "Склад",
        close: "Esc Закрыть",
        take: "Взять",
        materials: "Материалы:",
        count: "Кол-во:"
    };

    document.documentElement.setAttribute('lang', 'ru');
    document.charset = 'utf-8';

    if (!document.querySelector('#wh-styles')) {
        const style = document.createElement('style');
        style.id = 'wh-styles';
        style.textContent = `
            .wh-container, .wh-container * { user-select: none; font-family: Arial, "Segoe UI", Roboto, sans-serif; font-weight: normal; box-sizing: border-box; }
            .wh-container { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(900px, 96vw); height: min(620px, 92vh); max-width: 900px; max-height: 620px; background: rgba(20, 20, 27, 0.96); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6); display: flex; flex-direction: column; z-index: 9999; }
            .wh-header { padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
            .wh-title { color: #ff6a00; font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
            .wh-close-btn { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.6); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; transition: 0.2s; }
            .wh-close-btn:hover { background: rgba(255, 74, 74, 0.2); color: #ff4a4a; border-color: #ff4a4a; }
            .wh-grid { flex: 1; padding: 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px; justify-content: center; justify-items: center; align-items: start; overflow-y: scroll; scrollbar-width: thin; scrollbar-color: #ff6a00 rgba(255, 255, 255, 0.05); }
            .wh-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 18px; padding: 18px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; min-height: 270px; width: 100%; position: relative; transition: transform 0.2s, background 0.2s; }
            .wh-card:hover { transform: translateY(-4px); border-color: rgba(255, 255, 255, 0.12); }
            .wh-item-title { color: #ffffff; font-size: 18px; font-weight: 700; text-align: center; margin-bottom: 14px; min-height: 48px; display: flex; align-items: center; justify-content: center; padding: 0 8px; line-height: 1.2; }
            .wh-item-image-box { width: 110px; height: 110px; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px auto; }
            .wh-item-image-box img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5)); }
            .wh-item-stats { width: 100%; display: flex; justify-content: space-between; gap: 10px; margin-bottom: 18px; }
            .wh-stat { width: 48%; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
            .wh-stat-label { color: rgba(255, 255, 255, 0.5); font-size: 11px; text-transform: uppercase; }
            .wh-stat-value { color: #ffffff; font-weight: 700; font-size: 16px; }
            .wh-take-btn { background: #ff6a00; border: none; color: #fff; width: 100%; padding: 12px 20px; font-size: 15px; font-weight: 700; border-radius: 10px; cursor: pointer; transition: all 0.1s ease; }
            .wh-take-btn:hover { background: #ff8522; }
            .wh-take-btn:active { transform: scale(0.95); background: #cc5600; }
        `;
        document.head.appendChild(style);
    }

    let warehouseItems = [];
    let currentOrgName = defaultTexts.title;
    let isClosing = false;

    function safeDecode(str) {
        if (!str || typeof str !== 'string') return "";
        try { if (str.indexOf('%') !== -1) str = decodeURIComponent(str); } catch (e) {}
        return str;
    }

    function initWarehouseStructure() {
        if (document.querySelector('.wh-container')) return;
        const html = `
        <div class="wh-container">
            <div class="wh-header">
                <div class="wh-title" id="whTitleObj">${defaultTexts.title}</div>
                <button class="wh-close-btn" id="whCloseBtn">${defaultTexts.close}</button>
            </div>
            <div class="wh-grid" id="whGridObj"></div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('whCloseBtn').onclick = () => closeWarehouse();
    }

    function sendWarehouseTake(index) {
        if (typeof sendClientEvent === 'function') {
            sendClientEvent(gm.EVENT_EXECUTE_PUBLIC, "Warehouse_OnPlayerTake", parseInt(index, 10));
        }
    }

    function renderWarehouse() {
        initWarehouseStructure();
        document.getElementById('whTitleObj').textContent = currentOrgName;
        const grid = document.getElementById('whGridObj');
        grid.innerHTML = '';

        warehouseItems.forEach((item) => {
            const card = document.createElement('div');
            card.className = 'wh-card';
            card.innerHTML = `
                <div class="wh-item-title">${safeDecode(item.name)}</div>
                <div class="wh-item-image-box">
                    <img src="${BASE_URL}images/sklad/${item.iconId}.png" onerror="this.src='${BASE_URL}images/sklad/default.png'">
                </div>
                <div class="wh-item-stats">
                    <div class="wh-stat"><span class="wh-stat-label">${defaultTexts.materials}</span><span class="wh-stat-value">${item.cost}</span></div>
                    <div class="wh-stat"><span class="wh-stat-label">${defaultTexts.count}</span><span class="wh-stat-value">${item.count}</span></div>
                </div>
                <button class="wh-take-btn">${defaultTexts.take}</button>
            `;
            card.querySelector('.wh-take-btn').onclick = () => sendWarehouseTake(item.itemIndex);
            grid.appendChild(card);
        });
    }

    function closeWarehouse() {
        if (isClosing) return;
        isClosing = true;
        document.removeEventListener('keydown', onKeyDown);

        if (typeof window.setCursorStatus === 'function') {
            window.setCursorStatus(1, 0);
        }
        const cont = document.querySelector('.wh-container');
        if (cont) cont.remove();
        if (typeof window.cef_warehouseClose === 'function') {
            window.cef_warehouseClose(false);
        }
        setTimeout(() => { isClosing = false; }, 100);
    }

    function onKeyDown(e) {
        if (e.keyCode === KEY_CODE_ESC || e.key === 'Escape') {
            e.preventDefault();
            closeWarehouse();
        }
    }
    window.cef_warehouseOpen = function(jsonData, orgNameEncoded) {
        if (document.querySelector('.wh-container')) {
            closeWarehouse();
        }
        isClosing = false;
        warehouseItems = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        currentOrgName = safeDecode(orgNameEncoded);
        renderWarehouse();
        document.addEventListener('keydown', onKeyDown);
        if (typeof window.setCursorStatus === 'function') {
            window.setCursorStatus(1, 1);
        }
    };
    window.cef_warehouseClose = function(remove = true) {
        closeWarehouse();
    };
})();