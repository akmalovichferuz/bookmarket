document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) window.location.href = '/auth.html';

    const zakazContainer = document.getElementById('zakazContainer');
    const tabs = document.querySelectorAll('.filter-tab');
    let allOrders = [];

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => {
                t.classList.remove('bg-indigo-500', 'text-white', 'shadow-lg', 'shadow-indigo-500/30');
                t.classList.add('text-grayText', 'hover:bg-darkCard');
            });
            const target = e.currentTarget; 
            target.classList.remove('text-grayText', 'hover:bg-darkCard');
            target.classList.add('bg-indigo-500', 'text-white', 'shadow-lg', 'shadow-indigo-500/30');

            const status = target.getAttribute('data-status');
            renderZakazlar(status);
        });
    });

    async function loadZakazlar() {
        zakazContainer.innerHTML = '<div class="text-center text-indigo-400 py-10"><i class="fa-solid fa-spinner fa-spin text-4xl"></i></div>';
        try {
            const res = await fetch('/api/market/orders/sales', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) {
                allOrders = data.data.reverse(); 
                renderZakazlar('all');
            }
        } catch (err) {
            zakazContainer.innerHTML = `<p class="text-red-500 text-center font-bold">Xatolik yuz berdi.</p>`;
        }
    }

    function renderZakazlar(filterStatus) {
        let filtered = allOrders;
        if (filterStatus !== 'all') {
            filtered = allOrders.filter(o => o.status === filterStatus);
        }

        if (filtered.length === 0) {
            zakazContainer.innerHTML = `
                <div class="text-center bg-darkCard p-12 rounded-3xl border border-darkBorder text-grayText">
                    <i class="fa-solid fa-box-open text-6xl mb-4 text-darkBorder"></i>
                    <p class="text-xl font-bold">Bu bo'limda buyurtmalar topilmadi.</p>
                </div>`;
            return;
        }

        zakazContainer.innerHTML = '';
        filtered.forEach(order => {
            if (!order) return; 

            const book = order.book || { 
                title: "Sotilgan / O'chirilgan Kitob", 
                images: [], 
                price: 0,
                genre: "Ma'lumot yo'q",
                author: "Ma'lumot yo'q"
            };
            const buyer = order.buyer || { firstName: "Noma'lum", lastName: "Xaridor", phoneNumber: "---" };

            const imgUrl = book.images && book.images.length > 0 ? `/uploads/${book.images[0]}` : '/uploads/default.jpg';
            const price = new Intl.NumberFormat('uz-UZ').format(book.price || 0);
            
            let statusBadge = '';
            if (order.status === 'kutilmoqda') statusBadge = '<span class="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase"><i class="fa-solid fa-clock"></i> Kutilmoqda</span>';
            if (order.status === 'tasdiqlandi') statusBadge = '<span class="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase"><i class="fa-solid fa-check"></i> Tasdiqlangan (Yetkazilmoqda)</span>';
            if (order.status === 'rad_etildi') statusBadge = '<span class="bg-red-500/20 text-red-500 border border-red-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase"><i class="fa-solid fa-xmark"></i> Rad etildi</span>';
            if (order.status === 'yetkazib_berildi') statusBadge = '<span class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase"><i class="fa-solid fa-box-check"></i> Yetkazib Berildi</span>';

            let actionButtons = '';
            if (order.status === 'kutilmoqda') {
                actionButtons = `
                    <div class="flex gap-2 mt-4 md:mt-0 md:flex-col justify-center w-full md:w-auto shrink-0">
                        <button onclick="changeStatus('${order._id}', 'tasdiqlandi')" class="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition w-full shadow-lg shadow-blue-500/30"><i class="fa-solid fa-check mr-1"></i> Tasdiqlash</button>
                        <button onclick="changeStatus('${order._id}', 'rad_etildi')" class="bg-red-500/10 text-red-500 border border-red-500/30 px-5 py-2.5 rounded-xl font-bold hover:bg-red-500 hover:text-white transition w-full"><i class="fa-solid fa-xmark mr-1"></i> Rad etish</button>
                    </div>
                `;
            } else if (order.status === 'tasdiqlandi') {
                actionButtons = `
                    <div class="flex mt-4 md:mt-0 justify-center w-full md:w-auto shrink-0 items-center">
                        <button onclick="changeStatus('${order._id}', 'yetkazib_berildi')" class="bg-emerald-600 text-white px-6 py-4 rounded-xl font-black hover:bg-emerald-500 transition w-full shadow-[0_0_15px_rgba(16,185,129,0.4)] transform hover:-translate-y-1"><i class="fa-solid fa-truck-fast mr-2"></i> Yetkazib berildi</button>
                    </div>
                `;
            } else if (order.status === 'rad_etildi') {
                actionButtons = `
                    <div class="flex mt-4 md:mt-0 flex-col justify-center w-full md:w-auto shrink-0 md:text-right bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                        <span class="text-[10px] text-grayText font-bold uppercase tracking-wider">Rad etilish sababi:</span>
                        <span class="text-sm text-red-400 font-bold mt-1"><i class="fa-solid fa-circle-info mr-1"></i> ${order.rejectReason || 'Noma\'lum sabab'}</span>
                    </div>
                `;
            }

            const el = document.createElement('div');
            el.className = "bg-darkCard border border-darkBorder rounded-2xl p-5 shadow-lg flex flex-col md:flex-row gap-5";
            el.innerHTML = `
                <div class="w-24 h-32 bg-darkBg rounded-lg overflow-hidden shrink-0 border border-darkBorder ${!order.book ? 'opacity-50 grayscale' : ''}">
                    <img src="${imgUrl}" onerror="this.src='/uploads/default.jpg'" class="w-full h-full object-cover">
                </div>
                <div class="flex-grow flex flex-col justify-center">
                    <div class="flex items-center gap-3 mb-2">
                        ${statusBadge}
                        <span class="text-xs text-grayText">${new Date(order.createdAt).toLocaleString('uz-UZ')}</span>
                    </div>
                    <h3 class="font-black text-xl text-lightText mb-1">${book.title}</h3>
                    
                    <div class="flex gap-2 text-[11px] text-grayText font-bold mb-3 uppercase">
                        <span class="bg-darkBg px-2 py-1 rounded-md border border-darkBorder/50"><i class="fa-solid fa-layer-group text-indigo-400/70 mr-1"></i> ${book.genre || "Noma'lum"}</span>
                        <span class="bg-darkBg px-2 py-1 rounded-md border border-darkBorder/50"><i class="fa-solid fa-pen-nib text-indigo-400/70 mr-1"></i> ${book.author || "Noma'lum"}</span>
                    </div>

                    <p class="font-black text-indigo-400 text-lg mb-3">${price} so'm</p>
                    
                    <div class="bg-darkBg p-3 rounded-lg border border-darkBorder/50 inline-block text-sm">
                        <p class="text-grayText font-bold mb-1">Xaridor ma'lumotlari:</p>
                        <p class="text-lightText"><i class="fa-solid fa-user text-indigo-400 w-4"></i> ${buyer.firstName} ${buyer.lastName}</p>
                        <p class="text-lightText mt-1"><i class="fa-solid fa-phone text-indigo-400 w-4"></i> ${buyer.phoneNumber}</p>
                    </div>
                </div>
                ${actionButtons}
            `;
            zakazContainer.appendChild(el);
        });
    }

    // YANGLIK: QO'LDA SABAB YOZISH QO'SHILDI
    window.changeStatus = async function(orderId, newStatus) {
        let reason = '';

        if (newStatus === 'tasdiqlandi') {
            if (!confirm("Diqqat: Buyurtmani tasdiqlasangiz, bu kitobga kelgan qolgan barcha zakazlar avtomatik rad etiladi. Tasdiqlaysizmi?")) return;
        } else if (newStatus === 'yetkazib_berildi') {
            if (!confirm("Kitob muvaffaqiyatli yetkazib berildimi?")) return;
        } else if (newStatus === 'rad_etildi') {
            // Muloqot oynasi chiqaramiz!
            const userReason = prompt("Rad etish sababini yozing (ixtiyoriy):", "Sotuvchi tomonidan rad etildi");
            // Agar "Otmena" bossa to'xtaydi
            if (userReason === null) return; 
            reason = userReason;
        }

        try {
            const res = await fetch(`/api/market/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus, reason: reason })
            });
            const data = await res.json();
            if (data.success) {
                loadZakazlar(); 
            } else {
                alert("Xato: " + data.message);
            }
        } catch (err) { console.error(err); }
    }

    loadZakazlar();
});