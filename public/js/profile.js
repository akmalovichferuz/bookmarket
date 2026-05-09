document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = '/api'; 
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = '/auth.html';
        return;
    }

    let currentUser = null;
    let allMyFetchedBooks = []; 
    let allMyChats = []; 
    window.currentBookFilter = 'active'; 
    window.currentActiveChatBookId = null;
    window.currentActiveReceiverId = null;

    const regionsData = {
        "Andijon": ["Andijon shahri", "Asaka", "Baliqchi", "Bo'z", "Buloqboshi", "Izboskan", "Jalaquduq", "Marhamat", "Oltinko'l", "Paxtaobod", "Qo'rg'ontepa", "Shahrixon", "Ulug'nor", "Xo'jaobod"],
        "Buxoro": ["Buxoro shahri", "Kogon shahri", "Olot", "Buxoro tuman", "G'ijduvon", "Jondor", "Kogon tuman", "Qorako'l", "Qorovulbozor", "Peshku", "Romitan", "Shofirkon", "Vobkent"],
        "Farg'ona": ["Farg'ona shahri", "Marg'ilon", "Qo'qon", "Beshariq", "Bog'dod", "Buvayda", "Dang'ara", "Farg'ona tuman", "Furqat", "Oltiariq", "Qo'shtepa", "Quva", "Rishton", "So'x", "Toshloq", "Uchko'prik", "Yozyovon"],
        "Jizzax": ["Jizzax shahri", "Arnasoy", "Baxmal", "Do'stlik", "Forish", "G'allaorol", "Sharof Rashidov", "Mirzacho'l", "Paxtakor", "Yangiobod", "Zomin", "Zafarobod", "Zarbdor"],
        "Xorazm": ["Urganch shahri", "Xiva shahri", "Bog'ot", "Gurlan", "Qo'shko'pir", "Shovot", "Urganch tuman", "Xazorasp", "Xiva tuman", "Yangiariq", "Yangibozor"],
        "Namangan": ["Namangan shahri", "Chortoq", "Chust", "Kosonsoy", "Mingbuloq", "Namangan tuman", "Norin", "Pop", "To'raqo'rg'on", "Uchqo'rg'on", "Uychi", "Yangiqo'rg'on"],
        "Navoiy": ["Navoiy shahri", "Zarafshon shahri", "Karmana", "Konimex", "Navbahor", "Nurota", "Qiziltepa", "Tomdi", "Uchquduq", "Xatirchi"],
        "Qashqadaryo": ["Qarshi shahri", "Shahrisabz shahri", "Chiroqchi", "Dehqonobod", "G'uzor", "Kasbi", "Kitob", "Koson", "Mirishkor", "Muborak", "Nishon", "Qamashi", "Qarshi tuman", "Shahrisabz tuman", "Yakkabog'"],
        "Qoraqalpog'iston Respublikasi": ["Nukus shahri", "Amudaryo", "Beruniy", "Chimboy", "Ellikqal'a", "Kegeyli", "Mo'ynoq", "Nukus tuman", "Qanliko'l", "Qo'ng'irot", "Qorao'zak", "Shumanay", "Taxtako'pir", "To'rtko'l", "Xo'jayli"],
        "Samarqand": ["Samarqand shahri", "Kattaqo'rg'on shahri", "Bulung'ur", "Ishtixon", "Jomboy", "Kattaqo'rg'on tuman", "Narpay", "Nurobod", "Oqdaryo", "Paxtachi", "Payariq", "Pastdarg'om", "Qo'shrabot", "Samarqand tuman", "Toyloq", "Urgut"],
        "Sirdaryo": ["Guliston shahri", "Shirin shahri", "Yangiyer shahri", "Boyovut", "Guliston tuman", "Oqoltin", "Sardoba", "Sayxunobod", "Sirdaryo tuman", "Xavos"],
        "Surxondaryo": ["Termiz shahri", "Angor", "Boysun", "Denov", "Jarqo'rg'on", "Karki", "Qiziriq", "Qumqo'rg'on", "Muzrabot", "Oltinsoy", "Sariosiyo", "Sherobod", "Sho'rchi", "Termiz tuman", "Uzun"],
        "Toshkent viloyati": ["Nurafshon shahri", "Olmaliq shahri", "Angren shahri", "Bekobod shahri", "Chirchiq shahri", "Oqqo'rg'on", "Ohangaron", "Bekobod tuman", "Bo'stonliq", "Buka", "Chinoz", "Qibray", "Quyi Chirchiq", "O'rta Chirchiq", "Parkent", "Piskent", "Toshkent tuman", "Yangiyo'l", "Yuqori Chirchiq", "Zangiota"],
        "Toshkent shahri": ["Bektemir", "Chilonzor", "Mirzo Ulug'bek", "Mirobod", "Olmazor", "Sergeli", "Shayxontohur", "Uchtepa", "Yakkasaroy", "Yashnobod", "Yunusobod"]
    };

    const editRegion = document.getElementById('editRegion');
    const editDistrict = document.getElementById('editDistrict');

    Object.keys(regionsData).forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        editRegion.appendChild(option);
    });

    editRegion.addEventListener('change', function() {
        const selectedRegion = this.value;
        editDistrict.innerHTML = '<option value="">Tanlang...</option>';
        if (selectedRegion && regionsData[selectedRegion]) {
            regionsData[selectedRegion].forEach(district => {
                const option = document.createElement('option');
                option.value = district;
                option.textContent = district;
                editDistrict.appendChild(option);
            });
        }
    });

    async function initApp() {
        await checkUserAuth();
        await fetchUserLikes();
        await fetchAllChats();
        await fetchBooks();
        setInterval(fetchAllChats, 3000);
    }

    async function checkUserAuth() {
        try {
            const res = await fetch(`${API_URL}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (!data.success) throw new Error();
            
            currentUser = data.data;

            if(currentUser.role === 'admin') {
                const adminBtn = document.getElementById('adminPanelBtn');
                if(adminBtn) adminBtn.classList.remove('hidden');
            }

            document.getElementById('pInitials').textContent = `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase();
            document.getElementById('pName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
            document.getElementById('pInfo').innerHTML = `
                <span class="bg-darkBg px-3 py-1.5 rounded-lg border border-darkBorder"><i class="fa-solid fa-phone text-primary mr-1"></i> ${currentUser.phoneNumber}</span> 
                <span class="bg-darkBg px-3 py-1.5 rounded-lg border border-darkBorder"><i class="fa-solid fa-location-dot text-primary mr-1"></i> ${currentUser.region}, ${currentUser.district}</span>
            `;
        } catch (error) { 
            window.location.href = '/auth.html'; 
        }
    }

    async function fetchUserLikes() {
        try {
            const res = await fetch(`${API_URL}/users/me/likes`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if(data.success) window.userLikedBooks = data.data || [];
        } catch (e) {}
    }

    async function fetchAllChats() {
        try {
            let res = await fetch(`${API_URL}/market/chat`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok && res.status === 404) {
                res = await fetch(`${API_URL}/chat`, { headers: { 'Authorization': `Bearer ${token}` } });
            }
            const data = await res.json();
            if (data.success) {
                allMyChats = data.data || []; 
                updateChatBadgesUI();
                
                if (window.currentActiveChatBookId) {
                    if (window.currentActiveReceiverId) {
                        window.refreshActiveChat();
                    } else {
                        window.renderChatListForSeller(window.currentActiveChatBookId);
                    }
                }
            }
        } catch (e) { console.error("Chat xatosi:", e); }
    }

    function updateChatBadgesUI() {
        const badges = document.querySelectorAll('.chat-badge');
        badges.forEach(badge => {
            const bookId = badge.getAttribute('data-book');
            let unread = 0;
            const bookChats = allMyChats.filter(c => c.book && c.book._id === bookId);
            
            bookChats.forEach(chat => {
                const storedCount = parseInt(localStorage.getItem(`chat_seen_${chat._id}`) || 0);
                if (chat.messages && chat.messages.length > storedCount) {
                    const lastMsg = chat.messages[chat.messages.length - 1];
                    if (lastMsg && lastMsg.sender !== currentUser._id) {
                        unread += (chat.messages.length - storedCount);
                    }
                }
            });

            if (unread > 0) {
                badge.textContent = unread > 9 ? '9+' : unread;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        });
    }

    async function fetchBooks() {
        try {
            const booksRes = await fetch(`${API_URL}/books/seller/${currentUser._id}`);
            const booksData = await booksRes.json();
            allMyFetchedBooks = booksData.data || [];
            window.renderBooksTab(window.currentBookFilter); 
        } catch (e) {}
    }

    initApp();

    const tabBooks = document.getElementById('tabBooks');
    const tabFollowing = document.getElementById('tabFollowing');
    const tabFollowers = document.getElementById('tabFollowers');
    const contentBooks = document.getElementById('contentBooks');
    const contentNetwork = document.getElementById('contentNetwork');

    const setActiveTab = (activeEl) => {
        [tabBooks, tabFollowing, tabFollowers].forEach(t => {
            t.className = "pb-4 text-xl font-black text-grayText border-b-2 border-transparent transition-colors focus:outline-none";
        });
        activeEl.className = "pb-4 text-xl font-black text-primary border-b-2 border-primary transition-colors focus:outline-none";
    };

    tabBooks.onclick = () => {
        setActiveTab(tabBooks);
        contentBooks.classList.remove('hidden');
        contentNetwork.classList.add('hidden');
        fetchBooks();
    };

    tabFollowing.onclick = () => {
        setActiveTab(tabFollowing);
        contentBooks.classList.add('hidden');
        contentNetwork.classList.remove('hidden');
        fetchNetwork('following');
    };

    tabFollowers.onclick = () => {
        setActiveTab(tabFollowers);
        contentBooks.classList.add('hidden');
        contentNetwork.classList.remove('hidden');
        fetchNetwork('followers');
    };

    async function fetchNetwork(type) {
        try {
            contentNetwork.innerHTML = '<div class="col-span-full text-center py-10"><i class="fa-solid fa-spinner fa-spin text-3xl text-primary"></i></div>';
            const res = await fetch(`${API_URL}/users/me/network?type=${type}`, { 
                headers: {'Authorization': `Bearer ${token}`} 
            });
            const data = await res.json();
            renderNetwork(data.data || [], type);
        } catch (e) {}
    }

    function renderNetwork(users, type) {
        if(users.length === 0) {
            contentNetwork.innerHTML = `<div class="col-span-full text-center text-grayText py-12 font-bold bg-darkCard border border-darkBorder rounded-3xl">Sizda hali ${type === 'following' ? 'obunalar' : 'obunachilar'} yo'q.</div>`;
            return;
        }

        contentNetwork.innerHTML = users.map(user => `
            <div onclick="window.location.href='/seller.html?id=${user._id}'" class="bg-darkBg border border-darkBorder rounded-xl p-4 flex items-center justify-between hover:border-primary/50 transition cursor-pointer group shadow-sm">
                <div class="flex items-center gap-4 flex-1">
                    <div class="w-12 h-12 bg-primary/20 text-primary border border-primary/30 rounded-full flex items-center justify-center font-black text-lg">
                        ${user.firstName[0]}${user.lastName ? user.lastName[0] : ''}
                    </div>
                    <div class="overflow-hidden">
                        <div class="font-bold text-lightText group-hover:text-primary transition truncate">${user.firstName} ${user.lastName || ''}</div>
                        <div class="text-xs text-grayText truncate">${user.region}, ${user.district}</div>
                    </div>
                </div>
                
                ${type === 'following' ? `
                    <button onclick="unfollowFromProfile(event, '${user._id}')" class="ml-3 text-xs font-bold text-red-400 bg-red-400/10 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg transition border border-red-400/20 shrink-0 shadow-sm relative z-10">
                        Bekor qilish
                    </button>
                ` : `
                    <button onclick="removeFollowerAction(event, '${user._id}')" class="ml-3 text-xs font-bold text-grayText border border-darkBorder hover:border-lightText hover:text-lightText px-4 py-2 rounded-lg transition shrink-0 shadow-sm relative z-10">
                        Chiqarib tashlash
                    </button>
                `}
            </div>
        `).join('');
    }

    window.unfollowFromProfile = async (event, id) => {
        event.stopPropagation(); 
        if(!confirm("Obunani bekor qilmoqchimisiz?")) return;
        try {
            await fetch(`${API_URL}/users/${id}/follow`, { method: 'POST', headers: {'Authorization': `Bearer ${token}`} });
            fetchNetwork('following');
        } catch (e) {}
    };

    window.removeFollowerAction = async (event, id) => {
        event.stopPropagation(); 
        if(!confirm("Bu foydalanuvchini obunachilaringiz ro'yxatidan chiqarib tashlaysizmi?")) return;
        try {
            const res = await fetch(`${API_URL}/users/remove-follower/${id}`, { method: 'PUT', headers: {'Authorization': `Bearer ${token}`} });
            const data = await res.json();
            if (data.success) fetchNetwork('followers');
        } catch (e) {}
    };

    // ==========================================
    // MUKAMMAL KARTA (O'Z PROFILI UCHUN)
    // ==========================================
    
    window.renderBooksTab = function(filter) {
        window.currentBookFilter = filter; 
        const container = document.getElementById('myBooksContainer');

        let html = `
            <div class="col-span-full flex gap-6 mb-2 border-b border-darkBorder">
                <button onclick="window.renderBooksTab('active')" class="pb-3 text-sm font-black transition-all ${filter === 'active' ? 'text-primary border-b-2 border-primary' : 'text-grayText hover:text-lightText'}">
                    <i class="fa-solid fa-store mr-1"></i> Faol e'lonlar
                </button>
                <button onclick="window.renderBooksTab('sold')" class="pb-3 text-sm font-black transition-all ${filter === 'sold' ? 'text-primary border-b-2 border-primary' : 'text-grayText hover:text-lightText'}">
                    <i class="fa-solid fa-box-archive mr-1"></i> Sotilganlar
                </button>
            </div>
        `;

        const filteredBooks = filter === 'active' ? allMyFetchedBooks.filter(b => !b.isSold) : allMyFetchedBooks.filter(b => b.isSold);

        if (filteredBooks.length === 0) {
            html += `<div class="col-span-full text-center text-grayText py-12 mt-4 bg-darkCard border border-darkBorder rounded-3xl font-bold">Bu bo'limda e'lonlar yo'q.</div>`;
        } else {
            html += `<div class="col-span-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">`;
            html += filteredBooks.map(book => generateDetailedMyBookCard(book, filter === 'active')).join('');
            html += `</div>`;
        }
        container.innerHTML = html;
        updateChatBadgesUI(); 
    };

    function generateDetailedMyBookCard(book, isActive) {
        const imgUrl = book.images && book.images.length > 0 ? `/uploads/${book.images[0]}` : '/uploads/default.jpg';
        const formattedPrice = new Intl.NumberFormat('uz-UZ').format(book.price || 0);
        
        const isLiked = (window.userLikedBooks || []).includes(book._id);
        const heartClass = isLiked ? 'fa-solid fa-heart text-red-500' : 'fa-regular fa-heart text-gray-500';

        let actionButtons = '';
        if (isActive) {
            actionButtons = `
                <div class="flex gap-2 px-4 pb-4 pt-2 border-t border-darkBorder/50 z-20 relative bg-darkCard shrink-0">
                    <button disabled class="flex-1 bg-gray-500/10 text-gray-500 border border-gray-500/20 py-2.5 rounded-xl text-xs font-bold cursor-not-allowed flex justify-center items-center gap-2">
                        <i class="fa-solid fa-user-check"></i> E'loningiz
                    </button>
                    <button onclick="window.openChatList(event, '${book._id}')" class="flex-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-500 hover:text-white transition flex justify-center items-center gap-2 relative z-10">
                        <i class="fa-solid fa-comments"></i> Chatlar
                        <span class="chat-badge absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full hidden shadow-lg" data-book="${book._id}">0</span>
                    </button>
                </div>
            `;
        } else {
            actionButtons = `
                <div class="flex gap-2 px-4 pb-4 pt-2 border-t border-darkBorder/50 z-20 relative bg-darkCard shrink-0">
                    <button disabled class="flex-1 bg-gray-500/10 text-gray-500 border border-gray-500/20 py-2.5 rounded-xl text-xs font-bold cursor-not-allowed flex justify-center items-center gap-2">
                        <i class="fa-solid fa-lock"></i> Sotilgan
                    </button>
                </div>
            `;
        }

        // YANGLIK: Agar e'lon faol bo'lsa, uni bosganda Tahrirlash ochiladi. Sotilgan bo'lsa, hech narsa bo'lmaydi.
        const cardClickAction = isActive ? `window.openEditBook('${book._id}')` : '';

        return `
            <div class="bg-darkCard mt-4 rounded-3xl shadow-lg hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden border border-darkBorder flex flex-col cursor-pointer group isolate transform-gpu relative z-0 ${!isActive ? 'opacity-80 grayscale-[30%]' : ''}" id="book-card-${book._id}">
                
                <!-- YANGLIK: O'zining profiliga emas, Tahrirlash modaliga yuboriladi -->
                <div onclick="${cardClickAction}" class="flex-grow flex flex-col relative z-10">
                    
                    <button onclick="toggleLikeOnCard(event, '${book._id}')" class="absolute top-3 right-3 bg-darkBg/80 hover:bg-darkBg backdrop-blur-md p-2.5 rounded-full border border-darkBorder transition-colors flex items-center justify-center shadow-lg group/btn z-20">
                        <i id="heart-${book._id}" class="${heartClass} text-lg group-hover/btn:scale-110 transition-all"></i>
                    </button>
                    
                    <div class="relative overflow-hidden h-60 bg-darkBg rounded-t-3xl z-10 shrink-0">
                        <img src="${imgUrl}" alt="${book.title}" class="w-full h-full object-cover border-b border-darkBorder group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100 transform-gpu">
                        <div class="absolute bottom-0 left-0 bg-gradient-to-t from-darkCard to-transparent w-full h-1/2"></div>
                        
                        ${isActive ? `
                        <div class="absolute top-3 right-16 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-[-10px] group-hover:translate-y-0 z-20">
                            <!-- Qalamcha bosilsayam Tahrirlash ochiladi -->
                            <button onclick="event.stopPropagation(); window.openEditBook('${book._id}')" class="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 shadow-lg"><i class="fa-solid fa-pen-to-square"></i></button>
                            <button onclick="event.stopPropagation(); deleteBook('${book._id}')" class="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"><i class="fa-solid fa-trash"></i></button>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="p-5 flex-grow flex flex-col relative z-10 bg-darkCard">
                        <div class="flex justify-between items-start mb-3">
                            <div class="text-[10px] text-primary font-bold uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">${book.genre}</div>
                            <div class="text-xl font-black text-primary">${formattedPrice} <span class="text-xs font-bold text-grayText">so'm</span></div>
                        </div>
                        <h3 class="text-lg font-black text-lightText mb-1 leading-tight truncate" title="${book.title}">${book.title}</h3>
                        <div class="text-sm text-grayText mb-5 truncate font-medium"><i class="fa-solid fa-pen-nib mr-1 opacity-60"></i> ${book.author}</div>
                        
                        <div class="mt-auto pt-4 border-t border-darkBorder/50 space-y-2">
                            <div class="flex items-center text-xs text-grayText">
                                <i class="fa-solid fa-user text-primary w-5 text-center"></i>
                                <span class="font-bold text-lightText">${currentUser.firstName} ${currentUser.lastName}</span>
                            </div>
                            <div class="flex items-center text-xs text-grayText">
                                <i class="fa-solid fa-location-dot text-primary w-5 text-center"></i>
                                <span class="truncate font-medium">${currentUser.region}, ${currentUser.district}</span>
                            </div>
                        </div>
                        <div class="flex gap-4 mt-5 text-xs text-grayText font-bold bg-darkBg/50 px-4 py-2.5 rounded-2xl border border-darkBorder/50">
                            <span class="flex items-center gap-1.5"><i class="fa-solid fa-heart text-red-500"></i> <span id="likeCount-${book._id}">${book.likesCount || 0}</span></span>
                            <span class="flex items-center gap-1.5"><i class="fa-solid fa-comment text-blue-400"></i> ${book.commentsCount || 0}</span>
                        </div>
                    </div>
                </div>
                
                ${actionButtons}

                <!-- CHAT OYNASI -->
                <div id="chat-window-${book._id}" class="hidden absolute inset-0 bg-darkCard z-40 flex-col rounded-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)]" onclick="event.stopPropagation()">
                    <div class="bg-darkBg p-3 border-b border-darkBorder flex items-center justify-between shadow-sm shrink-0">
                        <button onclick="window.closeChat('${book._id}')" class="text-grayText hover:text-white transition text-xs font-bold bg-darkCard px-3 py-1.5 rounded-lg border border-darkBorder">
                            <i class="fa-solid fa-chevron-down"></i> Yopish
                        </button>
                        <span id="chat-title-${book._id}" class="font-bold text-sm text-primary">Xaridorlar</span>
                        <button id="chat-back-btn-${book._id}" onclick="window.openChatList(event, '${book._id}')" class="text-grayText hover:text-white hidden px-2"><i class="fa-solid fa-arrow-left"></i></button>
                    </div>
                    
                    <div id="chat-messages-${book._id}" class="flex-1 overflow-y-auto p-4 flex flex-col gap-2 relative bg-darkCard/95">
                        <!-- Xabarlar / Ro'yxat chiqadi -->
                    </div>
                    
                    <div id="chat-input-wrapper-${book._id}" class="p-3 bg-darkBg border-t border-darkBorder flex gap-2 shrink-0 hidden">
                        <input type="text" id="chat-input-${book._id}" class="flex-1 bg-darkCard border border-darkBorder rounded-xl px-4 py-2 text-sm text-lightText outline-none focus:border-primary transition" placeholder="Xabar..." onkeypress="window.chatEnter(event, '${book._id}')">
                        <button onclick="window.sendMsg('${book._id}')" class="bg-primary hover:bg-emerald-500 text-white w-10 h-10 rounded-xl flex justify-center items-center transition shadow-lg shadow-primary/30 shrink-0"><i class="fa-solid fa-paper-plane"></i></button>
                    </div>
                </div>

            </div>
        `;
    }

    window.toggleLikeOnCard = async function(event, bookId) {
        event.stopPropagation(); 
        if (!token) return;

        const heartIcon = document.getElementById(`heart-${bookId}`);
        const countSpan = document.getElementById(`likeCount-${bookId}`);
        
        try {
            const res = await fetch(`${API_URL}/books/${bookId}/like`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            
            if(data.success) {
                let currentCount = parseInt(countSpan.innerText);
                if (heartIcon.classList.contains('fa-regular')) {
                    heartIcon.className = 'fa-solid fa-heart text-red-500 text-lg transition-all';
                    countSpan.innerText = currentCount + 1;
                    if(!window.userLikedBooks.includes(bookId)) window.userLikedBooks.push(bookId);
                } else {
                    heartIcon.className = 'fa-regular fa-heart text-gray-500 text-lg transition-all';
                    countSpan.innerText = currentCount - 1;
                    window.userLikedBooks = window.userLikedBooks.filter(id => id !== bookId);
                }
            }
        } catch(e) {}
    };

    // ==========================================
    // CHAT MANTIG'I
    // ==========================================
    window.openChatList = function(event, bookId) {
        event.stopPropagation();
        const chatWindow = document.getElementById(`chat-window-${bookId}`);
        if (!chatWindow) return;

        window.currentActiveChatBookId = bookId;
        window.currentActiveReceiverId = null; 

        document.getElementById(`chat-title-${bookId}`).innerHTML = `<i class="fa-solid fa-users text-blue-400 mr-1"></i> Xaridorlar`;
        document.getElementById(`chat-back-btn-${bookId}`).classList.add('hidden');
        
        const inputWrapper = document.getElementById(`chat-input-wrapper-${bookId}`);
        inputWrapper.classList.add('hidden');
        inputWrapper.classList.remove('flex'); 
        
        chatWindow.classList.remove('hidden');
        chatWindow.classList.add('flex');

        window.renderChatListForSeller(bookId);
    };

    window.openSpecificChatFromList = function(bookId, buyerId, buyerName) {
        window.currentActiveReceiverId = buyerId;
        document.getElementById(`chat-title-${bookId}`).innerHTML = `<i class="fa-solid fa-user text-primary mr-1"></i> ${buyerName}`;
        document.getElementById(`chat-back-btn-${bookId}`).classList.remove('hidden'); 
        
        const inputWrapper = document.getElementById(`chat-input-wrapper-${bookId}`);
        inputWrapper.classList.remove('hidden');
        inputWrapper.classList.add('flex');
        
        window.refreshActiveChat();
    };

    window.closeChat = function(bookId) {
        const chatWindow = document.getElementById(`chat-window-${bookId}`);
        if (chatWindow) {
            chatWindow.classList.add('hidden');
            chatWindow.classList.remove('flex');
        }
        window.currentActiveChatBookId = null;
        window.currentActiveReceiverId = null;
        updateChatBadgesUI();
    };

    window.renderChatListForSeller = function(bookId) {
        try {
            const msgContainer = document.getElementById(`chat-messages-${bookId}`);
            if(!msgContainer) return;

            const bookChats = allMyChats.filter(c => c.book && c.book._id === bookId);

            if (bookChats.length === 0) {
                msgContainer.innerHTML = `<div class="text-center text-grayText text-xs mt-10"><i class="fa-solid fa-ghost text-3xl mb-3 text-darkBorder"></i><br>Hali hech kim yozmadi.</div>`;
                return;
            }

            let html = '';
            bookChats.forEach(chat => {
                const otherPerson = (chat.buyer && chat.buyer._id === currentUser._id) ? chat.seller : chat.buyer;
                if (!otherPerson) return; 

                const lastMsg = (chat.messages && chat.messages.length > 0) ? chat.messages[chat.messages.length - 1] : null;
                const msgText = lastMsg ? lastMsg.text : '...';
                
                const storedCount = parseInt(localStorage.getItem(`chat_seen_${chat._id}`) || 0);
                const isUnread = chat.messages && chat.messages.length > storedCount && lastMsg && lastMsg.sender !== currentUser._id;

                html += `
                    <div onclick="window.openSpecificChatFromList('${bookId}', '${otherPerson._id}', '${otherPerson.firstName}')" class="bg-darkBg border border-darkBorder hover:border-primary/50 p-3 rounded-xl cursor-pointer transition flex items-center gap-3 relative overflow-hidden group mb-2">
                        <div class="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black shrink-0">
                            ${otherPerson.firstName.charAt(0)}
                        </div>
                        <div class="overflow-hidden flex-1">
                            <h4 class="text-sm font-bold text-lightText truncate ${isUnread ? 'text-primary' : ''}">${otherPerson.firstName} ${otherPerson.lastName}</h4>
                            <p class="text-xs text-grayText truncate">${msgText}</p>
                        </div>
                        ${isUnread ? `<div class="absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>` : ''}
                    </div>
                `;
            });
            msgContainer.innerHTML = html;
        } catch (e) {
            console.error("List render error:", e);
        }
    };

    window.refreshActiveChat = function() {
        try {
            if (!window.currentActiveChatBookId || !window.currentActiveReceiverId) return;
            
            const bId = window.currentActiveChatBookId;
            const rId = window.currentActiveReceiverId;
            const msgContainer = document.getElementById(`chat-messages-${bId}`);
            if(!msgContainer) return;

            const currentChat = allMyChats.find(c => 
                c.book && c.book._id === bId && 
                ((c.buyer && c.buyer._id === rId) || (c.seller && c.seller._id === rId))
            );

            if (!currentChat || !currentChat.messages || currentChat.messages.length === 0) {
                msgContainer.innerHTML = `<div class="text-center text-grayText text-xs mt-10"><i class="fa-solid fa-comment-medical text-3xl mb-3 text-darkBorder"></i><br>Chatni boshlang!</div>`;
                return;
            }

            localStorage.setItem(`chat_seen_${currentChat._id}`, currentChat.messages.length);

            let html = '';
            currentChat.messages.forEach(msg => {
                const isMe = msg.sender === currentUser._id;
                const time = new Date(msg.createdAt || Date.now()).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'});
                
                if (isMe) {
                    html += `
                        <div class="flex justify-end w-full animate-fade-in">
                            <div class="bg-primary text-white px-4 py-2 rounded-2xl rounded-tr-sm text-sm max-w-[85%] break-words shadow-md shadow-primary/20 relative">
                                ${msg.text}
                                <span class="block text-[9px] text-white/70 text-right mt-1">${time}</span>
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="flex justify-start w-full animate-fade-in">
                            <div class="bg-darkBg border border-darkBorder text-lightText px-4 py-2 rounded-2xl rounded-tl-sm text-sm max-w-[85%] break-words shadow-sm relative">
                                ${msg.text}
                                <span class="block text-[9px] text-grayText text-right mt-1">${time}</span>
                            </div>
                        </div>
                    `;
                }
            });

            if(msgContainer.innerHTML !== html) {
                msgContainer.innerHTML = html;
                msgContainer.scrollTop = msgContainer.scrollHeight;
            }
        } catch (e) { console.error("Chat message error:", e); }
    };

    window.sendMsg = async function(bookId) {
        const input = document.getElementById(`chat-input-${bookId}`);
        const text = input.value.trim();
        const receiverId = window.currentActiveReceiverId;

        if (!text || !receiverId) return;

        input.value = '';
        const msgContainer = document.getElementById(`chat-messages-${bookId}`);
        if (msgContainer.innerHTML.includes('Chatni boshlang')) msgContainer.innerHTML = '';
        
        msgContainer.innerHTML += `
            <div class="flex justify-end w-full animate-fade-in opacity-70">
                <div class="bg-primary text-white px-4 py-2 rounded-2xl rounded-tr-sm text-sm max-w-[85%] break-words">
                    ${text} <i class="fa-solid fa-clock text-[9px] ml-1"></i>
                </div>
            </div>
        `;
        msgContainer.scrollTop = msgContainer.scrollHeight;

        try {
            let res = await fetch(`${API_URL}/market/chat`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ bookId, text, receiverId })
            });
            
            if (!res.ok && res.status === 404) {
                res = await fetch(`${API_URL}/chat`, { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ bookId, text, receiverId })
                });
            }

            const data = await res.json();
            if(data.success) await fetchAllChats();
        } catch (e) { alert("Xabar ketmadi!"); }
    };

    window.chatEnter = function(e, bookId) {
        if (e.key === 'Enter') { e.preventDefault(); window.sendMsg(bookId); }
    };

    // ==========================================
    // PROFIL VA E'LON TAHRIRLASH
    // ==========================================
    const editModal = document.getElementById('editModal');
    
    document.getElementById('editProfileBtn').addEventListener('click', () => {
        document.getElementById('editFirstName').value = currentUser.firstName;
        document.getElementById('editLastName').value = currentUser.lastName;
        document.getElementById('oldPhone').value = currentUser.phoneNumber.replace('+998', '');
        document.getElementById('newPhone').value = '';
        document.getElementById('oldPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';

        editRegion.value = currentUser.region;
        editRegion.dispatchEvent(new Event('change'));
        setTimeout(() => { editDistrict.value = currentUser.district; }, 100);
        editModal.classList.remove('hidden');
    });

    document.getElementById('closeModalBtn').addEventListener('click', () => editModal.classList.add('hidden'));

    document.getElementById('editForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPhone = document.getElementById('newPhone').value.trim();
        const oldPass = document.getElementById('oldPassword').value;
        const newPass = document.getElementById('newPassword').value;
        const confirmPass = document.getElementById('confirmNewPassword').value;

        if (newPass && newPass !== confirmPass) return alert("Yangi parollar mos kelmadi!");

        const updatedData = { firstName: document.getElementById('editFirstName').value.trim(), lastName: document.getElementById('editLastName').value.trim(), region: editRegion.value, district: editDistrict.value };

        if (newPhone || newPass) {
            if (!oldPass) return alert("Login yoki parolni o'zgartirish uchun joriy parolingizni kiriting!");
            updatedData.oldPassword = oldPass;
            if(newPhone) { updatedData.oldPhoneNumber = currentUser.phoneNumber; updatedData.newPhoneNumber = `+998${newPhone}`; }
            if(newPass) updatedData.newPassword = newPass;
        }

        try {
            const res = await fetch(`${API_URL}/users/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(updatedData) });
            const data = await res.json();
            if(data.success) {
                alert("Ma'lumotlar yangilandi!");
                if(newPhone) { localStorage.removeItem('token'); window.location.href = '/auth.html'; } else { window.location.reload(); }
            } else alert(data.message || "Xatolik!");
        } catch(e) { alert("Server xatosi!"); }
    });

    window.deleteBook = async function(id) {
        if(!confirm("Haqiqatan ham bu e'lonni butunlay o'chirib tashlamoqchimisiz?")) return;
        try {
            const res = await fetch(`${API_URL}/books/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if(data.success) fetchBooks(); else alert(data.message);
        } catch(e) { alert("Xatolik yuz berdi!"); }
    };

    const bookModal = document.getElementById('editBookModal');
    
    // YANGLIK: O'zining e'lonini bossa Modal ochiladi
    window.openEditBook = async function(id) {
        try {
            const res = await fetch(`${API_URL}/books/${id}`).then(r => r.json());
            if(res.success) {
                const b = res.data;
                document.getElementById('editBookId').value = b._id;
                document.getElementById('ebTitle').value = b.title;
                document.getElementById('ebAuthor').value = b.author;
                document.getElementById('ebPrice').value = b.price;
                document.getElementById('ebPages').value = b.pages;
                document.getElementById('ebPaper').value = b.paperType;
                document.getElementById('ebWidth').value = b.dimensions.width;
                document.getElementById('ebHeight').value = b.dimensions.height;
                bookModal.classList.remove('hidden');
            }
        } catch(e) { alert("Ma'lumotlarni yuklashda xato!"); }
    };

    document.getElementById('closeBookModalBtn').onclick = () => bookModal.classList.add('hidden');

    document.getElementById('editBookForm').onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('editBookId').value;
        const saveBtn = document.getElementById('saveBookBtn');
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Saqlanmoqda...';
        saveBtn.disabled = true;

        const updatedBookData = { title: document.getElementById('ebTitle').value.trim(), author: document.getElementById('ebAuthor').value.trim(), price: document.getElementById('ebPrice').value, pages: document.getElementById('ebPages').value, paperType: document.getElementById('ebPaper').value, width: document.getElementById('ebWidth').value, height: document.getElementById('ebHeight').value };

        try {
            const res = await fetch(`${API_URL}/books/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(updatedBookData) });
            const result = await res.json();
            if(result.success) { bookModal.classList.add('hidden'); fetchBooks(); alert("E'lon yangilandi!"); } else alert(result.message);
        } catch(e) { alert("Xatolik!"); } finally { saveBtn.innerHTML = '<i class="fa-solid fa-check-double"></i> Saqlash'; saveBtn.disabled = false; }
    };
});