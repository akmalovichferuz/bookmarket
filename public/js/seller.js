document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'http://localhost:5000/api';
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = '/auth.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const sellerId = urlParams.get('id');

    if (!sellerId) {
        window.location.href = '/';
        return;
    }

    let currentUserId = null;
    let sellerInfo = null;
    let allSellerBooks = []; 
    let allMyChats = []; 
    window.currentBookFilter = 'active'; 
    window.activeChatState = { bookId: null, receiverId: null }; 

    let CHAT_API = `${API_URL}/market/chat`; 

    // QAT'IY KETMA-KETLIK: Avval ma'lumot keladi, keyin tepadagi Headerni chizadi!
    async function initApp() {
        try {
            await checkUserAuth();
            await fetchUserLikes();
            await fetchSellerInfo(); 
            await fetchSellerBooks(); 
            
            // Hamma kitob va profillar yuklangach, Header raqamlari chiziladi!
            renderSellerHeader(); 
            
            await fetchAllChats();
            setInterval(fetchAllChats, 3000);
        } catch (e) {
            console.error("Dastur ishga tushishida xato:", e);
        }
    }

    async function checkUserAuth() {
        try {
            const res = await fetch(`${API_URL}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) currentUserId = data.data._id;
        } catch (error) { window.location.href = '/auth.html'; }
    }

    async function fetchUserLikes() {
        try {
            const res = await fetch(`${API_URL}/users/me/likes`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if(data.success) window.userLikedBooks = data.data || [];
        } catch (e) {}
    }

    async function fetchSellerInfo() {
        try {
            const res = await fetch(`${API_URL}/users/${sellerId}`);
            const data = await res.json();
            if (data.success) {
                sellerInfo = data.data;
            } else {
                alert("Foydalanuvchi topilmadi!");
                window.location.href = '/';
            }
        } catch(e) { console.error(e); }
    }

    function renderSellerHeader() {
        if (!sellerInfo) return;

        try {
            const sInitials = document.getElementById('sellerInitials');
            const sName = document.getElementById('sellerName');
            const sLocation = document.getElementById('sellerLocation');
            const sPhone = document.getElementById('sellerPhone');
            const sBooksCount = document.getElementById('sellerBooksCount');
            const sFollowersCount = document.getElementById('sellerFollowersCount');
            const sLikesCount = document.getElementById('sellerLikesCount');

            // Ma'lumotlarni yozish
            if(sInitials) sInitials.textContent = `${sellerInfo.firstName[0]}${sellerInfo.lastName ? sellerInfo.lastName[0] : ''}`.toUpperCase();
            if(sName) sName.textContent = `${sellerInfo.firstName} ${sellerInfo.lastName || ''}`;
            if(sLocation) sLocation.innerHTML = `<i class="fa-solid fa-location-dot text-primary mr-1"></i> ${sellerInfo.region}, ${sellerInfo.district}`;
            if(sPhone) sPhone.innerHTML = `<i class="fa-solid fa-phone text-primary mr-1"></i> ${sellerInfo.phoneNumber}`;
            
            // Statistika raqamlarini yozish
            if(sBooksCount) sBooksCount.textContent = allSellerBooks.length || 0;
            if(sFollowersCount) sFollowersCount.textContent = sellerInfo.followersCount || 0;
            if(sLikesCount) sLikesCount.textContent = allSellerBooks.reduce((sum, book) => sum + (book.likesCount || 0), 0);

            // =====================================
            // MANA O'SHA LICHKA VA OBUNA TUGMALARI
            // =====================================
            const btnContainer = document.getElementById('buttonsContainer'); // HTML dagi yangi qutini oladi
            
            // Agar buttonsContainer topilmasa, eski usul (followBtn orqali) qidiradi
            const containerToUse = btnContainer || document.getElementById('followBtn')?.parentElement;
            
            if (containerToUse) {
                // O'ziga o'zi yozmasligi uchun tekshiramiz
                const isMe = sellerId === currentUserId;
                
                containerToUse.innerHTML = isMe ? '' : `
                    <div class="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <button onclick="window.openDirectMessage(event)" class="bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-600 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                            <i class="fa-solid fa-paper-plane"></i> Xabar yozish
                        </button>
                        <button id="followBtn" onclick="toggleFollowSeller()" class="bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                            <i class="fa-solid fa-spinner fa-spin"></i>
                        </button>
                    </div>
                `;
                if(!isMe) checkFollowStatus(); // Obuna holatini tekshirishni chaqirib qo'yamiz
            }

            // Spinnerni yashirish
            const headerSpinner = document.getElementById('sellerLoading') || document.querySelector('.fa-spinner.fa-spin')?.closest('div');
            const headerContent = document.getElementById('sellerContent');
            if (headerSpinner && headerSpinner.id !== 'myBooksContainer') headerSpinner.classList.add('hidden');
            if (headerContent) headerContent.classList.remove('hidden');

        } catch (e) {
            console.error("Profil tepadagi qismini chizishda xatolik:", e);
        }
    }

    async function checkFollowStatus() {
        try {
            const followBtn = document.getElementById('followBtn');
            if (!followBtn) return;

            if (sellerId === currentUserId) {
                followBtn.style.display = 'none'; // O'ziga o'zi obuna bo'lolmaydi
                return;
            }

            const res = await fetch(`${API_URL}/users/${sellerId}/check-follow`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();

            if (data.isFollowing) {
                followBtn.innerHTML = `<i class="fa-solid fa-user-minus"></i> Obunani bekor qilish`;
                followBtn.className = 'bg-red-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-600 transition flex items-center gap-2 shadow-lg shadow-red-500/20';
            } else {
                followBtn.innerHTML = `<i class="fa-solid fa-user-plus"></i> Sodiq mijoz bo'lish`;
                followBtn.className = 'bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition flex items-center gap-2 shadow-lg shadow-emerald-500/20';
            }
        } catch(e) {}
    }

    // YANGLIK: Obuna bo'lganda ekrandagi son silliq (zavodskoy) o'zgaradi
    window.toggleFollowSeller = async function() {
        try {
            const res = await fetch(`${API_URL}/users/${sellerId}/follow`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if(data.success) {
                await checkFollowStatus(); // Tugma rangini o'zgartirish
                
                // Sahifani yangilamasdan Mijozlar sonini darhol o'zgartiramiz
                const fCountSpan = document.getElementById('sellerFollowersCount');
                if (fCountSpan) {
                    let currentCount = parseInt(fCountSpan.textContent) || 0;
                    fCountSpan.textContent = data.isFollowing ? currentCount + 1 : currentCount - 1;
                }
            }
        } catch (e) {}
    }

    // ==========================================
    // LICHKA MANTIG'I (Xabar yozish tugmasi uchun)
    // ==========================================
    let dmInterval = null;

    window.openDirectMessage = function(e) {
        if(e) e.stopPropagation();
        const dmOverlay = document.getElementById('dmOverlay');
        if(!dmOverlay) {
            console.error("Xatolik: Chat oynasi (dmOverlay) topilmadi!");
            return; 
        }

        document.getElementById('dmInitials').textContent = sellerInfo.firstName.charAt(0).toUpperCase();
        document.getElementById('dmName').textContent = `${sellerInfo.firstName} ${sellerInfo.lastName || ''}`;
        
        // YANGLIK: Animatsiya o'rniga aniq ko'rsatish
        dmOverlay.classList.remove('hidden');
        dmOverlay.classList.add('flex');
        
        window.refreshDM();
        if(dmInterval) clearInterval(dmInterval);
        dmInterval = setInterval(window.refreshDM, 3000);
    };

    window.closeDM = function() {
        const dmOverlay = document.getElementById('dmOverlay');
        if(dmOverlay) {
            // YANGLIK: Aniq yashirish
            dmOverlay.classList.add('hidden');
            dmOverlay.classList.remove('flex');
        }
        if(dmInterval) clearInterval(dmInterval);
    };

    window.refreshDM = async function() {
        try {
            const res = await fetch(`${API_URL}/messages/${sellerId}`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            const data = await res.json();
            const msgContainer = document.getElementById('dmMessages');
            
            if (!data.success || data.data.length === 0) {
                if(!msgContainer.innerHTML.includes('Suhbatni boshlang')) {
                    msgContainer.innerHTML = `<div class="text-center text-grayText text-xs mt-10"><i class="fa-regular fa-comments text-3xl mb-3 text-darkBorder"></i><br>Suhbatni boshlang!</div>`;
                }
                return;
            }

            let html = '';
            data.data.forEach(msg => {
                // ID larni String holatiga o'tkazib solishtirish (Xatoni oldini oladi)
                const msgSenderId = String(msg.sender._id || msg.sender);
                const myId = String(currentUserId);
                const isMe = msgSenderId === myId;
                
                const time = new Date(msg.createdAt).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'});
                
                if (isMe) {
                    // SIZ YOZGAN XABAR - O'NG TOMONDA (Indigo rangli quticha)
                    html += `
                        <div class="flex justify-end w-full animate-fade-in mb-2">
                            <div class="bg-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm max-w-[80%] break-words shadow-lg">
                                <p class="leading-relaxed">${msg.text}</p>
                                <div class="flex items-center justify-end gap-1 mt-1 opacity-70">
                                    <span class="text-[10px] font-bold">${time}</span>
                                    ${msg.isRead ? '<i class="fa-solid fa-check-double text-[10px]"></i>' : '<i class="fa-solid fa-check text-[10px]"></i>'}
                                </div>
                            </div>
                        </div>`;
                } else {
                    // SIZGA YOZILGAN XABAR - CHAP TOMONDA (Skrinshotdagi kabi to'q quticha)
                    html += `
                        <div class="flex justify-start w-full animate-fade-in mb-2">
                            <div class="bg-darkBg border border-darkBorder text-lightText px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm max-w-[80%] break-words shadow-sm">
                                <p class="leading-relaxed">${msg.text}</p>
                                <span class="block text-[10px] text-grayText mt-1 font-bold">${time}</span>
                            </div>
                        </div>`;
                }
            });

            // Faqat yangi xabar kelsa HTMLni yangilaymiz
            if(msgContainer.innerHTML !== html) {
                msgContainer.innerHTML = html;
                msgContainer.scrollTop = msgContainer.scrollHeight;
            }
        } catch (e) {
            console.error("Xabarlarni yuklashda xato:", e);
        }
    };

    window.sendDM = async function() {
        const input = document.getElementById('dmInput');
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        
        const msgContainer = document.getElementById('dmMessages');
        if (msgContainer.innerHTML.includes('Suhbatni boshlang')) msgContainer.innerHTML = '';
        msgContainer.innerHTML += `<div class="flex justify-end w-full animate-fade-in opacity-50"><div class="bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm text-sm max-w-[85%] break-words">${text} <i class="fa-regular fa-clock text-[9px] ml-1"></i></div></div>`;
        msgContainer.scrollTop = msgContainer.scrollHeight;

        try {
            await fetch(`${API_URL}/messages`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ receiverId: sellerId, text })
            });
            window.refreshDM();
        } catch(e) {}
    };

    window.dmEnter = function(e) { if (e.key === 'Enter') window.sendDM(); };

    // ==========================================
    // KITOB CHAT VA KITOBLAR RENDERI
    // ==========================================
    async function fetchAllChats() {
        try {
            let res = await fetch(CHAT_API, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok && res.status === 404) res = await fetch(`${API_URL}/chat`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) {
                allMyChats = data.data || []; 
                updateChatBadgesUI();
                if (window.activeChatState.bookId && window.activeChatState.receiverId) {
                    window.refreshActiveChat();
                }
            }
        } catch (e) {}
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
                    if (lastMsg && lastMsg.sender !== currentUserId) unread += (chat.messages.length - storedCount);
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

    async function fetchSellerBooks() {
        try {
            const booksRes = await fetch(`${API_URL}/books/seller/${sellerId}`);
            const booksData = await booksRes.json();
            allSellerBooks = booksData.data || [];
            window.renderSellerBooksTab(window.currentBookFilter); 
        } catch (e) {}
    }

    window.renderSellerBooksTab = function(filter) {
        window.currentBookFilter = filter; 
        const container = document.getElementById('booksContainer') || document.getElementById('sellerBooksContainer') || document.getElementById('myBooksContainer');
        if(!container) return;

        let html = `
            <div class="col-span-full flex gap-6 mb-2 border-b border-darkBorder">
                <button onclick="window.renderSellerBooksTab('active')" class="pb-3 text-sm font-black transition-all ${filter === 'active' ? 'text-primary border-b-2 border-primary' : 'text-grayText hover:text-lightText'}">
                    <i class="fa-solid fa-store mr-1"></i> Faol e'lonlar
                </button>
                <button onclick="window.renderSellerBooksTab('sold')" class="pb-3 text-sm font-black transition-all ${filter === 'sold' ? 'text-primary border-b-2 border-primary' : 'text-grayText hover:text-lightText'}">
                    <i class="fa-solid fa-box-archive mr-1"></i> Sotilganlar
                </button>
            </div>
        `;

        const filteredBooks = filter === 'active' ? allSellerBooks.filter(b => !b.isSold) : allSellerBooks.filter(b => b.isSold);

        if (filteredBooks.length === 0) {
            html += `<div class="col-span-full text-center text-grayText py-12 mt-4 bg-darkCard border border-darkBorder rounded-3xl font-bold">Ushbu bo'limda e'lonlar topilmadi.</div>`;
        } else {
            html += `<div class="col-span-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full mt-4">`;
            html += filteredBooks.map(book => generateSellerBookCard(book, filter === 'active')).join('');
            html += `</div>`;
        }
        container.innerHTML = html;
        updateChatBadgesUI(); 
    };

    function generateSellerBookCard(book, isActive) {
        const imgUrl = book.images && book.images.length > 0 ? `/uploads/${book.images[0]}` : '/uploads/default.jpg';
        const formattedPrice = new Intl.NumberFormat('uz-UZ').format(book.price || 0);
        const isLiked = (window.userLikedBooks || []).includes(book._id);
        const heartClass = isLiked ? 'fa-solid fa-heart text-red-500' : 'fa-regular fa-heart text-gray-500';

        let actionButtons = '';
        if (isActive) {
            actionButtons = `
                <div class="flex gap-2 px-4 pb-4 pt-2 border-t border-darkBorder/50 z-20 relative bg-darkCard shrink-0">
                    <button onclick="addToCart(event, '${book._id}')" class="flex-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-500 hover:text-white transition flex justify-center items-center gap-2 relative z-10">
                        <i class="fa-solid fa-cart-shopping"></i> Savatga
                    </button>
                    <button onclick="window.openBuyerChat(event, '${book._id}', '${sellerId}', '${sellerInfo.firstName}')" class="flex-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-500 hover:text-white transition flex justify-center items-center gap-2 relative z-10">
                        <i class="fa-solid fa-comment-dots"></i> Admin Chat
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

        return `
            <div class="bg-darkCard rounded-3xl shadow-lg hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden border border-darkBorder flex flex-col cursor-pointer group isolate transform-gpu relative z-0 ${!isActive ? 'opacity-80 grayscale-[30%]' : ''}">
                
                <div onclick="window.location.href='/book-details.html?id=${book._id}'" class="flex-grow flex flex-col relative z-10">
                    <button onclick="toggleLikeOnCard(event, '${book._id}')" class="absolute top-3 right-3 bg-darkBg/80 hover:bg-darkBg backdrop-blur-md p-2.5 rounded-full border border-darkBorder transition-colors flex items-center justify-center shadow-lg group/btn z-20">
                        <i id="heart-${book._id}" class="${heartClass} text-lg group-hover/btn:scale-110 transition-all"></i>
                    </button>
                    
                    <div class="relative overflow-hidden h-60 bg-darkBg rounded-t-3xl z-10 shrink-0">
                        <img src="${imgUrl}" alt="${book.title}" class="w-full h-full object-cover border-b border-darkBorder group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100 transform-gpu">
                        <div class="absolute bottom-0 left-0 bg-gradient-to-t from-darkCard to-transparent w-full h-1/2"></div>
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
                                <span class="font-bold text-lightText">${sellerInfo.firstName} ${sellerInfo.lastName || ''}</span>
                            </div>
                            <div class="flex items-center text-xs text-grayText">
                                <i class="fa-solid fa-location-dot text-primary w-5 text-center"></i>
                                <span class="truncate font-medium">${sellerInfo.region}, ${sellerInfo.district}</span>
                            </div>
                        </div>
                        <div class="flex gap-4 mt-5 text-xs text-grayText font-bold bg-darkBg/50 px-4 py-2.5 rounded-2xl border border-darkBorder/50">
                            <span class="flex items-center gap-1.5"><i class="fa-solid fa-heart text-red-500"></i> <span id="likeCount-${book._id}">${book.likesCount || 0}</span></span>
                            <span class="flex items-center gap-1.5"><i class="fa-solid fa-comment text-blue-400"></i> ${book.commentsCount || 0}</span>
                        </div>
                    </div>
                </div>
                
                ${actionButtons}

                <!-- KITOB UCHUN ADMIN CHAT -->
                <div id="chat-window-${book._id}" class="hidden absolute inset-0 bg-darkCard z-40 flex-col rounded-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)]" onclick="event.stopPropagation()">
                    <div class="bg-darkBg p-3 border-b border-darkBorder flex items-center justify-between shadow-sm shrink-0">
                        <button onclick="window.closeChat('${book._id}')" class="text-grayText hover:text-white transition text-xs font-bold bg-darkCard px-3 py-1.5 rounded-lg border border-darkBorder">
                            <i class="fa-solid fa-chevron-down"></i> Yopish
                        </button>
                        <span id="chat-title-${book._id}" class="font-bold text-sm text-primary">Admin Chat</span>
                        <button class="hidden px-2"></button>
                    </div>
                    
                    <div id="chat-messages-${book._id}" class="flex-1 overflow-y-auto p-4 flex flex-col gap-2 relative bg-darkCard/95"></div>
                    
                    <div id="chat-input-wrapper-${book._id}" class="p-3 bg-darkBg border-t border-darkBorder flex gap-2 shrink-0 hidden">
                        <input type="text" id="chat-input-${book._id}" class="flex-1 bg-darkCard border border-darkBorder rounded-xl px-4 py-2 text-sm text-lightText outline-none focus:border-indigo-500 transition shadow-inner" placeholder="Xabar..." onkeypress="window.chatEnter(event, '${book._id}')">
                        <button onclick="window.sendBookMsg('${book._id}')" class="bg-indigo-500 hover:bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center transition shadow-lg shadow-indigo-500/30"><i class="fa-solid fa-paper-plane"></i></button>
                    </div>
                </div>

            </div>
        `;
    }

    // ==========================================
    // LOKAL FUNKSIYALAR (Layk, Savat)
    // ==========================================
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
                    
                    const sLikesCount = document.getElementById('sellerLikesCount');
                    if(sLikesCount) sLikesCount.textContent = parseInt(sLikesCount.textContent) + 1;
                } else {
                    heartIcon.className = 'fa-regular fa-heart text-gray-500 text-lg transition-all';
                    countSpan.innerText = currentCount - 1;
                    window.userLikedBooks = window.userLikedBooks.filter(id => id !== bookId);

                    const sLikesCount = document.getElementById('sellerLikesCount');
                    if(sLikesCount) sLikesCount.textContent = parseInt(sLikesCount.textContent) - 1;
                }
            }
        } catch(e) {}
    };

    window.addToCart = async function(event, bookId) {
        event.stopPropagation(); 
        if (!token) { window.location.href = '/auth.html'; return; }
        try {
            const res = await fetch(`${API_URL}/market/cart/${bookId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) {
                alert("✅ Kitob savatchaga qo'shildi!");
                if(window.updateCartBadge) window.updateCartBadge();
            } else alert("Xatolik: " + data.message);
        } catch (err) { alert("Server bilan aloqa yo'q!"); }
    };

    window.openBuyerChat = function(e, bookId, sId, sellerName) {
        e.stopPropagation();
        const chatWindow = document.getElementById(`chat-window-${bookId}`);
        if (!chatWindow) return;

        window.activeChatState = { bookId, receiverId: sId };
        document.getElementById(`chat-title-${bookId}`).innerHTML = `<i class="fa-solid fa-headset text-indigo-400 mr-1"></i> ${sellerName}`;
        
        const inputWrapper = document.getElementById(`chat-input-wrapper-${bookId}`);
        inputWrapper.classList.remove('hidden');
        inputWrapper.classList.add('flex');
        
        chatWindow.classList.remove('hidden');
        chatWindow.classList.add('flex');

        window.refreshActiveChat();
    };

    window.closeChat = function(bookId) {
        const chatWindow = document.getElementById(`chat-window-${bookId}`);
        if (chatWindow) {
            chatWindow.classList.add('hidden');
            chatWindow.classList.remove('flex');
        }
        window.activeChatState = { bookId: null, receiverId: null };
        updateChatBadgesUI();
    };

    window.refreshActiveChat = function() {
        try {
            const { bookId, receiverId } = window.activeChatState;
            if (!bookId || !receiverId) return;
            
            const msgContainer = document.getElementById(`chat-messages-${bookId}`);
            if(!msgContainer) return;

            const currentChat = allMyChats.find(c => 
                c.book && c.book._id === bookId && 
                ((c.buyer && c.buyer._id === receiverId) || (c.seller && c.seller._id === receiverId))
            );

            if (!currentChat || !currentChat.messages || currentChat.messages.length === 0) {
                msgContainer.innerHTML = `<div class="text-center text-grayText text-xs mt-10"><i class="fa-solid fa-comment-medical text-3xl mb-3 text-darkBorder"></i><br>Chatni boshlang!</div>`;
                return;
            }

            localStorage.setItem(`chat_seen_${currentChat._id}`, currentChat.messages.length);

            let html = '';
            currentChat.messages.forEach(msg => {
                const isMe = msg.sender === currentUserId;
                const time = new Date(msg.createdAt || Date.now()).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'});
                
                if (isMe) {
                    html += `
                        <div class="flex justify-end w-full animate-fade-in">
                            <div class="bg-indigo-500 text-white px-4 py-2 rounded-2xl rounded-tr-sm text-sm max-w-[85%] break-words shadow-md shadow-indigo-500/20 relative">
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
        } catch (e) {}
    };

    window.sendBookMsg = async function(bookId) {
        const input = document.getElementById(`chat-input-${bookId}`);
        const text = input.value.trim();
        const receiverId = window.activeChatState.receiverId;
        if (!text || !receiverId) return;

        input.value = '';
        const msgContainer = document.getElementById(`chat-messages-${bookId}`);
        if (msgContainer.innerHTML.includes('Chatni boshlang')) msgContainer.innerHTML = '';
        
        msgContainer.innerHTML += `
            <div class="flex justify-end w-full animate-fade-in opacity-70">
                <div class="bg-indigo-500 text-white px-4 py-2 rounded-2xl rounded-tr-sm text-sm max-w-[85%] break-words">
                    ${text} <i class="fa-solid fa-clock text-[9px] ml-1"></i>
                </div>
            </div>`;
        msgContainer.scrollTop = msgContainer.scrollHeight;

        try {
            let res = await fetch(CHAT_API, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ bookId, text, receiverId }) });
            if (!res.ok && res.status === 404) {
                res = await fetch(`${API_URL}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ bookId, text, receiverId }) });
            }
            const data = await res.json();
            if (data.success) await fetchAllChats(); 
        } catch (e) { alert("Xabar yuborishda xatolik!"); }
    };

    window.chatEnter = function(e, bookId) {
        if (e.key === 'Enter') { e.preventDefault(); window.sendBookMsg(bookId); }
    };

    initApp();
});