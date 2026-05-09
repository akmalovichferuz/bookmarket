document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) window.location.href = '/auth.html';

    const ordersContainer = document.getElementById('ordersContainer');
    const tabs = document.querySelectorAll('.filter-tab');
    let allOrders = [];

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => {
                t.classList.remove('bg-primary', 'text-white', 'shadow-lg', 'shadow-primary/30');
                t.classList.add('text-grayText', 'hover:bg-darkCard');
            });
            const target = e.currentTarget; 
            target.classList.remove('text-grayText', 'hover:bg-darkCard');
            target.classList.add('bg-primary', 'text-white', 'shadow-lg', 'shadow-primary/30');

            const status = target.getAttribute('data-status');
            renderOrders(status);
        });
    });

    async function loadOrders() {
        ordersContainer.innerHTML = '<div class="text-center text-primary py-10"><i class="fa-solid fa-spinner fa-spin text-4xl"></i></div>';
        try {
            const res = await fetch('/api/market/orders/purchases', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) {
                allOrders = data.data.reverse();
                renderOrders('all');
            }
        } catch (err) {
            ordersContainer.innerHTML = `<p class="text-red-500 text-center font-bold">Xatolik yuz berdi.</p>`;
        }
    }

    function renderOrders(filterStatus) {
        let filtered = allOrders;
        if (filterStatus !== 'all') {
            filtered = allOrders.filter(o => o.status === filterStatus);
        }

        if (filtered.length === 0) {
            ordersContainer.innerHTML = `
                <div class="text-center bg-darkCard p-12 rounded-3xl border border-darkBorder text-grayText">
                    <i class="fa-solid fa-basket-shopping text-6xl mb-4 text-darkBorder"></i>
                    <p class="text-xl font-bold">Bu bo'limda xaridlar topilmadi.</p>
                </div>`;
            return;
        }

        ordersContainer.innerHTML = '';
        filtered.forEach(order => {
            if (!order) return; 

            const book = order.book || { 
                title: "Sotilgan / O'chirilgan Kitob", 
                images: [], 
                price: 0,
                genre: "Ma'lumot yo'q",
                author: "Ma'lumot yo'q"
            };
            const seller = order.seller || { firstName: "Noma'lum", lastName: "Sotuvchi", phoneNumber: "---" };

            const imgUrl = book.images && book.images.length > 0 ? `/uploads/${book.images[0]}` : '/uploads/default.jpg';
            const price = new Intl.NumberFormat('uz-UZ').format(book.price || 0);
            
            let statusBadge = '';
            if (order.status === 'kutilmoqda') statusBadge = '<span class="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase"><i class="fa-solid fa-clock"></i> Kutilmoqda</span>';
            if (order.status === 'tasdiqlandi') statusBadge = '<span class="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase"><i class="fa-solid fa-check"></i> Tasdiqlangan (Kuting)</span>';
            if (order.status === 'rad_etildi') statusBadge = '<span class="bg-red-500/20 text-red-500 border border-red-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase"><i class="fa-solid fa-xmark"></i> Rad etildi</span>';
            if (order.status === 'yetkazib_berildi') statusBadge = '<span class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-md text-xs font-bold uppercase"><i class="fa-solid fa-box-check"></i> Yetkazilgan</span>';

            let rejectInfo = '';
            if (order.status === 'rad_etildi') {
                rejectInfo = `
                    <div class="mt-4 bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                        <span class="text-xs text-grayText font-bold uppercase tracking-wider">Rad etilish sababi:</span>
                        <p class="text-sm text-red-400 font-bold mt-1"><i class="fa-solid fa-circle-info mr-1"></i> ${order.rejectReason || 'Noma\'lum sabab'}</p>
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
                        <span class="bg-darkBg px-2 py-1 rounded-md border border-darkBorder/50"><i class="fa-solid fa-layer-group text-primary/70 mr-1"></i> ${book.genre || "Noma'lum"}</span>
                        <span class="bg-darkBg px-2 py-1 rounded-md border border-darkBorder/50"><i class="fa-solid fa-pen-nib text-primary/70 mr-1"></i> ${book.author || "Noma'lum"}</span>
                    </div>
                    
                    <p class="font-black text-primary text-lg mb-3">${price} so'm</p>
                    
                    <div class="bg-darkBg p-3 rounded-lg border border-darkBorder/50 inline-block text-sm">
                        <p class="text-grayText font-bold mb-1">Sotuvchi ma'lumotlari:</p>
                        <p class="text-lightText"><i class="fa-solid fa-user text-primary w-4"></i> ${seller.firstName} ${seller.lastName}</p>
                        <p class="text-lightText mt-1"><i class="fa-solid fa-phone text-primary w-4"></i> ${seller.phoneNumber}</p>
                    </div>
                    ${rejectInfo}
                </div>
            `;
            ordersContainer.appendChild(el);
        });
    }

    loadOrders();
});