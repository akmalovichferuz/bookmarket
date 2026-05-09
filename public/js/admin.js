document.addEventListener('DOMContentLoaded', () => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) { window.location.href = '/admin-login'; return; }

    const API_URL = 'http://localhost:5000/api/admin';
    const usersContainer = document.getElementById('usersContainer');
    const adminMainDisplay = document.getElementById('adminMainDisplay');
    
    const userProfileModal = document.getElementById('userProfileModal');
    const profileModalContent = document.getElementById('profileModalContent');
    
    const adminBookModal = document.getElementById('adminBookModal');
    const adminBookForm = document.getElementById('adminBookForm');

    // 1. Yuklash
    async function init() {
        try {
            const res = await fetch(`${API_URL}/dashboard`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
            const data = await res.json();
            if(data.success) renderUsers(data.users);
            fetchGenres();
        } catch (error) { console.error(error); }
    }

    function renderUsers(users) {
        usersContainer.innerHTML = users.map(u => `
            <div class="p-3 bg-darkBg/50 border border-darkBorder rounded-2xl flex items-center justify-between group hover:border-primary hover:bg-darkBg transition-all cursor-pointer" onclick="showUserDetails('${u._id}')">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center justify-center font-black text-sm shrink-0">${u.firstName[0]}${u.lastName[0]}</div>
                    <div>
                        <div class="font-black text-xs text-lightText group-hover:text-primary transition-colors">${u.firstName} ${u.lastName}</div>
                        <div class="text-[9px] text-grayText font-bold">${u.phoneNumber}</div>
                    </div>
                </div>
                <button onclick="event.stopPropagation(); adminGlobalAction('user', '${u._id}')" class="w-8 h-8 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </div>
        `).join('');
    }

    // 2. FOYDALANUVCHI PROFILI
    window.showUserDetails = async (id) => {
        profileModalContent.innerHTML = '<div class="text-center py-20"><i class="fa-solid fa-spinner fa-spin text-4xl text-primary"></i></div>';
        
        userProfileModal.classList.remove('hidden');
        userProfileModal.classList.add('flex');

        try {
            const res = await fetch(`${API_URL}/users/${id}`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
            const data = await res.json();
            
            if(data.success) {
                const u = data.data;
                let booksHtml = '';
                
                if (u.books && u.books.length > 0) {
                    booksHtml = u.books.map(b => {
                        const imgUrl = b.images && b.images.length > 0 ? '/uploads/' + b.images[0] : '/uploads/default.jpg';
                        const price = new Intl.NumberFormat('uz-UZ').format(b.price || 0);
                        
                        // Kichik, ixcham karta (Grid ichida o'zini yaxshi tutadi)
                        return `
                            <div class="bg-darkBg rounded-2xl border border-darkBorder overflow-hidden flex flex-col shadow-sm hover:shadow-lg hover:border-primary transition-all cursor-pointer group" onclick="openAdminBookModal('${b._id}')">
                                <div class="relative h-32 w-full overflow-hidden shrink-0">
                                    <img src="${imgUrl}" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
                                </div>
                                <div class="p-3 flex-grow flex flex-col">
                                    <h3 class="font-bold text-lightText mb-1 truncate text-sm group-hover:text-primary transition-colors">${b.title}</h3>
                                    <div class="text-primary font-black mb-3 text-xs">${price} so'm</div>
                                    <button class="mt-auto w-full bg-darkCard border border-darkBorder py-1.5 rounded-lg text-[10px] font-bold text-grayText group-hover:text-primary transition-all">
                                        <i class="fa-solid fa-pen-to-square"></i> Tahrirlash
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('');
                } else {
                    booksHtml = '<div class="col-span-full text-center text-grayText py-6 font-bold text-sm bg-darkBg rounded-xl border border-darkBorder">Ushbu foydalanuvchida e\'lonlar yo\'q.</div>';
                }

                profileModalContent.innerHTML = `
                    <div class="bg-darkBg rounded-2xl border border-darkBorder p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-inner">
                        <div class="flex items-center gap-5 w-full md:w-auto">
                            <div class="w-20 h-20 bg-primary/20 text-primary border-4 border-primary rounded-full flex items-center justify-center font-black text-2xl shrink-0">
                                ${u.firstName[0]}${u.lastName[0]}
                            </div>
                            <div>
                                <h2 class="text-xl font-black text-lightText mb-2">${u.firstName} ${u.lastName}</h2>
                                <div class="flex flex-wrap gap-2 text-[10px] font-bold">
                                    <span class="bg-darkCard px-2 py-1 rounded border border-darkBorder text-primary"><i class="fa-solid fa-phone"></i> ${u.phoneNumber}</span> 
                                    <span class="bg-darkCard px-2 py-1 rounded border border-darkBorder"><i class="fa-solid fa-location-dot text-primary"></i> ${u.region}, ${u.district}</span>
                                </div>
                            </div>
                        </div>
                        <button onclick="adminGlobalAction('user', '${u._id}')" class="w-full md:w-auto bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all text-xs shrink-0">
                            <i class="fa-solid fa-trash"></i> Profilni o'chirish
                        </button>
                    </div>

                    <div class="flex justify-between items-center mb-3 border-b border-darkBorder pb-2">
                        <h2 class="text-sm font-black text-lightText">Mavjud e'lonlar</h2>
                        <span class="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">${u.books ? u.books.length : 0} ta</span>
                    </div>

                    <!-- PROFIL ICHIDAGI GRID: Juda ixcham -->
                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 items-start pb-2">
                        ${booksHtml}
                    </div>
                `;
            }
        } catch (error) {
            profileModalContent.innerHTML = '<div class="text-center text-red-500 font-bold py-10">Xatolik yuz berdi!</div>';
        }
    };

    // 3. KENGAYTIRILGAN QIDIRUV
    document.getElementById('applyFiltersBtn').onclick = async () => {
        const q = document.getElementById('advSearchTitle').value.trim();
        const genre = document.getElementById('advSearchGenre').value;
        adminMainDisplay.innerHTML = '<div class="col-span-full text-center py-20"><i class="fa-solid fa-spinner fa-spin text-3xl text-secondary"></i></div>';
        
        try {
            const res = await fetch(`${API_URL}/search?q=${q}&genre=${genre}`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
            const data = await res.json();
            if(data.success) renderSearchCards(data.data);
        } catch (error) {
            adminMainDisplay.innerHTML = '<div class="col-span-full text-center text-red-500 font-bold">Xatolik yuz berdi!</div>';
        }
    };

    function renderSearchCards(books) {
        if(!books || books.length === 0) { 
            adminMainDisplay.innerHTML = '<div class="col-span-full text-center py-10 text-grayText font-black text-sm bg-darkCard border border-darkBorder rounded-2xl">Hech qanday natija topilmadi.</div>'; 
            return; 
        }

        // QIDIRUV GRIDI UCHUN KARTA: Kattalashib ketmaydi.
        adminMainDisplay.innerHTML = books.map(book => {
            const imgUrl = book.images && book.images.length > 0 ? '/uploads/' + book.images[0] : '/uploads/default.jpg';
            const price = new Intl.NumberFormat('uz-UZ').format(book.price || 0);
            
            return `
                <div class="bg-darkCard rounded-2xl shadow-sm border border-darkBorder flex flex-col overflow-hidden group cursor-pointer hover:border-secondary hover:shadow-md transition-all" onclick="openAdminBookModal('${book._id}')">
                    <div class="relative h-40 bg-darkBg shrink-0">
                        <img src="${imgUrl}" class="w-full h-full object-cover">
                    </div>
                    <div class="p-4 flex-grow flex flex-col">
                        <div class="text-[9px] text-secondary font-bold uppercase bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20 w-max mb-2">${book.genre || 'Janr yo\'q'}</div>
                        <h3 class="text-sm font-black text-lightText mb-1 truncate group-hover:text-secondary transition-colors">${book.title}</h3>
                        <div class="text-base font-black text-secondary mb-3">${price} <span class="text-[10px] font-bold text-grayText">so'm</span></div>
                        
                        <div class="mt-auto pt-3 border-t border-darkBorder/50 space-y-1 mb-3">
                            <div class="flex items-center text-[10px] text-grayText truncate">
                                <i class="fa-solid fa-user text-primary w-4"></i>
                                <span class="font-bold text-lightText">${book.seller ? book.seller.firstName + ' ' + book.seller.lastName : 'Noma\'lum'}</span>
                            </div>
                        </div>

                        <button class="w-full bg-darkBg border border-darkBorder py-2 rounded-lg text-xs font-bold text-grayText group-hover:text-secondary transition-all">
                            <i class="fa-solid fa-pen-to-square"></i> Tahrirlash
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 4. KITOB MODALINI OCHISH
    window.openAdminBookModal = async (id) => {
        try {
            const res = await fetch(`${API_URL}/books/${id}`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
            const data = await res.json();
            if(data.success) {
                const b = data.data;
                document.getElementById('adminEbId').value = b._id;
                document.getElementById('adminEbTitle').value = b.title;
                document.getElementById('adminEbAuthor').value = b.author;
                document.getElementById('adminEbPrice').value = b.price;
                document.getElementById('adminEbPages').value = b.pages;
                document.getElementById('adminEbPaper').value = b.paperType;
                
                adminBookModal.classList.remove('hidden');
                adminBookModal.classList.add('flex');
            }
        } catch(e) { console.error(e); }
    };

    // 5. KITOBNI SAQLASH
    if (adminBookForm) {
        adminBookForm.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('adminEbId').value;
            const updated = {
                title: document.getElementById('adminEbTitle').value,
                author: document.getElementById('adminEbAuthor').value,
                price: document.getElementById('adminEbPrice').value,
                pages: document.getElementById('adminEbPages').value,
                paperType: document.getElementById('adminEbPaper').value
            };

            try {
                const res = await fetch(`${API_URL}/books/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
                    body: JSON.stringify(updated)
                });
                const data = await res.json();
                if(data.success) {
                    adminBookModal.classList.add('hidden');
                    adminBookModal.classList.remove('flex');
                    
                    if (!userProfileModal.classList.contains('hidden')) {
                        // Agar profil ochiq bo'lsa, profilni yangilab qo'yamiz (bekitmasdan)
                        const sellerId = document.querySelector('#profileModalContent button[onclick^="adminGlobalAction(\'user\'"]').getAttribute('onclick').match(/'([^']+)'/g)[1].replace(/'/g, '');
                        if(sellerId) showUserDetails(sellerId);
                    }
                    document.getElementById('applyFiltersBtn').click(); 
                } else alert(data.message);
            } catch(e) { console.error(e); }
        };
    }

    // 6. GLOBAL O'CHIRISH
    window.adminGlobalAction = async (type, id) => {
        const typeName = type === 'user' ? "Foydalanuvchi va uning e'lonlarini" : "E'lonni";
        if(!confirm(`DIQQAT! ${typeName} o'chirasizmi?`)) return;

        try {
            const res = await fetch(`${API_URL}/delete/${type}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${adminToken}` } });
            const data = await res.json();
            if(data.success) {
                if(type === 'user') location.reload();
                if(type === 'book') {
                    if(adminBookModal) {
                        adminBookModal.classList.add('hidden'); 
                        adminBookModal.classList.remove('flex');
                    }
                    if (!userProfileModal.classList.contains('hidden')) {
                        const sellerId = document.querySelector('#profileModalContent button[onclick^="adminGlobalAction(\'user\'"]').getAttribute('onclick').match(/'([^']+)'/g)[1].replace(/'/g, '');
                        if(sellerId) showUserDetails(sellerId);
                    }
                    document.getElementById('applyFiltersBtn').click();
                }
            } else alert(data.message || "Xatolik");
        } catch (error) { alert("Server xatosi"); }
    };

    // YOPISH TUGMALARI
    const closeProfileBtn = document.getElementById('closeProfileModal');
    if (closeProfileBtn) {
        closeProfileBtn.onclick = () => { 
            userProfileModal.classList.add('hidden'); 
            userProfileModal.classList.remove('flex'); 
        };
    }

    const closeBookBtn = document.getElementById('closeBookModal');
    if (closeBookBtn) {
        closeBookBtn.onclick = () => { 
            adminBookModal.classList.add('hidden'); 
            adminBookModal.classList.remove('flex'); 
        };
    }
    
    window.logoutAdmin = () => { 
        localStorage.removeItem('adminToken'); 
        window.location.href = '/admin-login'; 
    };

    async function fetchGenres() {
        try {
            const res = await fetch('http://localhost:5000/api/books/suggestions?type=genre');
            const data = await res.json();
            if(data.success) {
                const select = document.getElementById('advSearchGenre');
                if (select) {
                    data.data.forEach(g => { 
                        const opt = document.createElement('option'); 
                        opt.value = g; opt.textContent = g; 
                        select.appendChild(opt); 
                    });
                }
            }
        } catch(e) {}
    }

    init();
});