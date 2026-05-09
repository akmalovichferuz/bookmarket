let currentUserId = null;
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/auth.html';
} else {
    document.getElementById('mainBody').style.display = 'block';
}

const API_URL = '/api';
let userLikedBooks = []; 
let allMyChats = [];
window.activeChatState = { bookId: null, receiverId: null, mode: null }; 

let CHAT_API = `${API_URL}/market/chat`; 

window.toggleLikeOnCard = async function(event, bookId) {
    event.stopPropagation(); 
    if (!token) return;

    const heartIcon = document.getElementById(`heart-${bookId}`);
    const countSpan = document.getElementById(`likeCount-${bookId}`);
    
    try {
        const res = await fetch(`${API_URL}/books/${bookId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if(data.success) {
            let currentCount = parseInt(countSpan.innerText);
            if (heartIcon.classList.contains('fa-regular')) {
                heartIcon.className = 'fa-solid fa-heart text-red-500 text-lg transition-all';
                countSpan.innerText = currentCount + 1;
                userLikedBooks.push(bookId);
            } else {
                heartIcon.className = 'fa-regular fa-heart text-gray-500 text-lg transition-all';
                countSpan.innerText = currentCount - 1;
                userLikedBooks = userLikedBooks.filter(id => id !== bookId);
            }
        }
    } catch(e) { console.error("Layk xatosi:", e); }
};

document.addEventListener('DOMContentLoaded', () => {
    const booksContainer = document.getElementById('booksContainer');
    const resultsCount = document.getElementById('resultsCount');
    const genreSelect = document.getElementById('genreSelect');
    const authorInput = document.getElementById('authorInput');
    const titleInput = document.getElementById('titleInput');
    const authorSuggestions = document.getElementById('authorSuggestions');
    const titleSuggestions = document.getElementById('titleSuggestions');
    const filterSearchBtn = document.getElementById('filterSearchBtn');
    const globalSearchInput = document.getElementById('globalSearchInput');

    const menuBtn = document.getElementById('menuBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mainBody = document.getElementById('mainBody'); 

    initApp();

    async function initApp() {
        await checkUserAuth();
        await fetchUserLikes();
        await fetchAllChats();
        await fetchBooks();
        await fetchGenres();
        await updateCartBadge(); 
        initSidebar(); 
        
        setInterval(fetchAllChats, 3000);
    }

    function initSidebar() {
        let isSidebarOpen = false;

        function updateSidebarUI() {
            if (isSidebarOpen) {
                if (window.innerWidth >= 1024) {
                    mainBody.classList.add('sidebar-desktop-open');
                    mainBody.classList.remove('sidebar-mobile-open');
                } else {
                    mainBody.classList.add('sidebar-mobile-open');
                    mainBody.classList.remove('sidebar-desktop-open');
                }
            } else {
                mainBody.classList.remove('sidebar-desktop-open');
                mainBody.classList.remove('sidebar-mobile-open');
            }
        }

        function toggleSidebar() {
            isSidebarOpen = !isSidebarOpen;
            updateSidebarUI();
        }

        function closeSidebar() {
            isSidebarOpen = false;
            updateSidebarUI();
        }

        if(menuBtn) menuBtn.addEventListener('click', toggleSidebar);
        if(closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
        if(sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

        window.addEventListener('resize', () => {
            if (isSidebarOpen) {
                updateSidebarUI();
            }
        });

        const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
        if(sidebarLogoutBtn) {
            sidebarLogoutBtn.addEventListener('click', () => {
                localStorage.removeItem('token');
                window.location.href = '/auth.html';
            });
        }
    }

    async function checkUserAuth() {
        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                currentUserId = data.data._id;
                const sbUserName = document.getElementById('sidebarUserName');
                const sbUserInitial = document.getElementById('sidebarUserInitial');
                if(sbUserName) sbUserName.textContent = `${data.data.firstName} ${data.data.lastName}`;
                if(sbUserInitial) sbUserInitial.textContent = `${data.data.firstName.charAt(0)}${data.data.lastName.charAt(0)}`.toUpperCase();
            } else {
                localStorage.removeItem('token');
                window.location.href = '/auth.html';
            }
        } catch (error) { console.error("Auth xato:", error); }
    }

    async function fetchUserLikes() {
        try {
            const res = await fetch(`${API_URL}/users/me/likes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if(data.success) userLikedBooks = data.data;
        } catch (e) { console.error("Layklar yuklanmadi"); }
    }

    async function fetchAllChats() {
        try {
            let res = await fetch(CHAT_API, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok && res.status === 404) {
                CHAT_API = `${API_URL}/chat`;
                res = await fetch(CHAT_API, { headers: { 'Authorization': `Bearer ${token}` } });
            }
            const data = await res.json();
            if (data.success) {
                allMyChats = data.data || []; 
                updateChatBadgesUI();
                
                if (window.currentActiveChatBookId && window.currentActiveReceiverId) {
                    window.refreshActiveChat();
                } else if (window.currentActiveChatBookId && !window.currentActiveReceiverId) {
                    window.renderChatListForSeller(window.currentActiveChatBookId);
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
                    if (lastMsg && lastMsg.sender !== currentUserId) {
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

    async function fetchBooks(queryParams = '') {
        try {
            booksContainer.innerHTML = '<div class="col-span-full text-center py-10"><i class="fa-solid fa-spinner fa-spin text-4xl text-primary"></i></div>';
            const response = await fetch(`${API_URL}/books${queryParams}`);
            const resData = await response.json();
            if (resData.success) {
                renderBooks(resData.data);
                resultsCount.textContent = `${resData.count} ta e'lon topildi`;
                updateChatBadgesUI();
            }
        } catch (error) {
            booksContainer.innerHTML = '<div class="col-span-full text-center text-red-400 py-10">Xatolik yuz berdi!</div>';
        }
    }

    function renderBooks(books) {
        // FERUZ: Eng muhim joyi - o'zining kitoblarini filtrlab tashlaymiz
        const filteredBooks = books.filter(book => {
            const sellerId = String(book.seller._id || book.seller);
            return sellerId !== String(currentUserId);
        });
    
        if (filteredBooks.length === 0) {
            booksContainer.innerHTML = '<div class="col-span-full text-center text-grayText py-10 text-lg font-bold bg-darkCard rounded-3xl border border-darkBorder text-white">Yangi e\'lonlar hozircha yo\'q.</div>';
            resultsCount.textContent = "0 ta e'lon topildi";
            return;
        }
    
        // Natijalar sonini to'g'ri ko'rsatamiz
        resultsCount.textContent = `${filteredBooks.length} ta e'lon topildi`;
    
        // Endi faqat boshqalarga tegishli kitoblarni chizamiz
        booksContainer.innerHTML = filteredBooks.map(book => {
            // Bu yerda eski mantiq (kartani chizish kodi) o'zgarishsiz qoladi
            const imgUrl = book.images && book.images.length > 0 ? `/uploads/${book.images[0]}` : '/uploads/default.jpg';
            const formattedPrice = new Intl.NumberFormat('uz-UZ').format(book.price || 0);
            const isLiked = userLikedBooks.includes(book._id);
            const heartClass = isLiked ? 'fa-solid fa-heart text-red-500' : 'fa-regular fa-heart text-gray-500';
    
            return `
                <div class="bg-darkCard rounded-3xl shadow-lg hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden border border-darkBorder flex flex-col cursor-pointer group isolate transform-gpu relative z-0" id="book-card-${book._id}">
                    <!-- Karta kontenti... (Oldingi kodingizni qoldiring) -->
                    <div onclick="window.location.href='/book-details.html?id=${book._id}'" class="flex-grow flex flex-col relative z-10">
                        <div class="relative overflow-hidden h-60 bg-darkBg rounded-t-3xl z-10 shrink-0">
                             <img src="${imgUrl}" class="w-full h-full object-cover border-b border-darkBorder group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100 transform-gpu">
                        </div>
                        <div class="p-5 flex-grow flex flex-col relative z-10 bg-darkCard">
                            <div class="flex justify-between items-start mb-3 text-white">
                                <div class="text-[10px] text-primary font-bold uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">${book.genre}</div>
                                <div class="text-xl font-black text-primary">${formattedPrice} <span class="text-xs font-bold text-grayText text-white">so'm</span></div>
                            </div>
                            <h3 class="text-lg font-black text-lightText mb-1 leading-tight truncate text-white" title="${book.title}">${book.title}</h3>
                            <div class="text-sm text-grayText mb-5 truncate font-medium text-white/50"><i class="fa-solid fa-pen-nib mr-1 opacity-60"></i> ${book.author}</div>
                        </div>
                    </div>
                    <div class="flex gap-2 px-4 pb-4 pt-2 border-t border-darkBorder/50 z-20 relative bg-darkCard shrink-0">
                        <button onclick="addToCart(event, '${book._id}')" class="flex-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 py-2 rounded-xl text-xs font-bold hover:bg-emerald-500 hover:text-white transition flex justify-center items-center gap-2">
                            <i class="fa-solid fa-cart-shopping"></i> Savatga
                        </button>
                        <button onclick="window.openChat(event, '${book._id}', '${book.seller._id}', '${book.seller.firstName}')" class="flex-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 py-2 rounded-xl text-xs font-bold hover:bg-indigo-500 hover:text-white transition flex justify-center items-center gap-2 relative">
                            <i class="fa-solid fa-comment-dots"></i> Admin Chat
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    let searchTimeout;
    globalSearchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const q = e.target.value.trim();
        searchTimeout = setTimeout(() => {
            fetchBooks(q ? `?q=${q}` : '');
        }, 400);
    });

    const handleSuggestion = async (input, suggestions, type) => {
        const val = input.value.trim();
        if (val.length < 1) { 
            suggestions.classList.add('hidden'); 
            return; 
        }

        try {
            const genre = genreSelect.value;
            const author = type === 'title' ? authorInput.value : '';
            const res = await fetch(`${API_URL}/books/suggestions?type=${type}&search=${val}&genre=${genre}&author=${author}`);
            const data = await res.json();
            
            if (data.success && data.data.length > 0) {
                suggestions.className = "absolute z-50 top-full left-0 right-0 bg-darkCard border-2 border-primary rounded-2xl shadow-2xl mt-2 overflow-hidden transform-gpu animate-fade-in";
                
                suggestions.innerHTML = data.data.map(item => 
                    `<div class="p-3 hover:bg-primary/10 hover:text-primary cursor-pointer text-sm border-b border-darkBorder/30 last:border-0 text-lightText font-bold transition-all suggestion-item flex items-center gap-2">
                        <i class="fa-solid fa-magnifying-glass text-[10px] text-primary/50"></i>
                        ${item}
                    </div>`
                ).join('');
                
                suggestions.classList.remove('hidden');

                suggestions.querySelectorAll('.suggestion-item').forEach(el => {
                    el.addEventListener('click', () => {
                        input.value = el.textContent.trim();
                        suggestions.classList.add('hidden');
                        if(type === 'author') titleInput.value = '';
                    });
                });
            } else { 
                suggestions.classList.add('hidden'); 
            }
        } catch (e) { console.error("Suggestion error", e); }
    };

    authorInput.addEventListener('input', () => handleSuggestion(authorInput, authorSuggestions, 'author'));
    titleInput.addEventListener('input', () => handleSuggestion(titleInput, titleSuggestions, 'title'));

    document.addEventListener('click', (e) => {
        if (!authorInput.contains(e.target)) authorSuggestions.classList.add('hidden');
        if (!titleInput.contains(e.target)) titleSuggestions.classList.add('hidden');
    });

    filterSearchBtn.addEventListener('click', () => {
        const params = new URLSearchParams();
        if (genreSelect.value) params.append('genre', genreSelect.value);
        if (authorInput.value) params.append('author', authorInput.value);
        if (titleInput.value) params.append('title', titleInput.value);
        fetchBooks(`?${params.toString()}`);
        globalSearchInput.value = '';
    });

    async function fetchGenres() {
        try {
            const response = await fetch(`${API_URL}/books/suggestions?type=genre`);
            const resData = await response.json();
            if (resData.success) {
                resData.data.forEach(genre => {
                    const option = document.createElement('option');
                    option.value = genre;
                    option.textContent = genre;
                    genreSelect.appendChild(option);
                });
            }
        } catch (error) {}
    }
});

// ==========================================
// GLOBAL FUNKSIYALAR
// ==========================================

window.addToCart = async function(event, bookId) {
    event.stopPropagation(); 
    if (!token) {
        window.location.href = '/auth.html';
        return;
    }
    try {
        const res = await fetch(`${API_URL}/market/cart/${bookId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            alert("✅ Kitob savatchaga qo'shildi!");
            window.updateCartBadge(); 
        } else {
            alert("Xatolik: " + data.message);
        }
    } catch (err) {
        console.error(err);
        alert("Server bilan aloqa yo'q!");
    }
};

window.updateCartBadge = async function() {
    const sidebarBadge = document.getElementById('sidebarCartBadge');
    if (!sidebarBadge || !token) return;
    try {
        const res = await fetch(`${API_URL}/market/cart`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.success && data.data.length > 0) {
            sidebarBadge.textContent = data.data.length;
            sidebarBadge.classList.remove('hidden');
            sidebarBadge.classList.add('inline-block');
        } else {
            sidebarBadge.classList.add('hidden');
            sidebarBadge.classList.remove('inline-block');
        }
    } catch (e) { console.error(e); }
};

// ==========================================
// YAShIRISH / KO'RSATISH MANTIG'I
// ==========================================

window.currentActiveChatBookId = null;
window.currentActiveReceiverId = null;

window.openChat = function(event, bookId, sellerId, sellerName) {
    event.stopPropagation();
    const chatWindow = document.getElementById(`chat-window-${bookId}`);
    if (!chatWindow) return;

    window.currentActiveChatBookId = bookId;
    window.currentActiveReceiverId = sellerId;
    
    document.getElementById(`chat-title-${bookId}`).textContent = `Admin: ${sellerName || ''}`;
    document.getElementById(`chat-back-btn-${bookId}`).classList.add('hidden'); 
    
    const inputWrapper = document.getElementById(`chat-input-wrapper-${bookId}`);
    inputWrapper.classList.remove('hidden');
    inputWrapper.classList.add('flex'); // Input joyini flex qilib ochamiz
    
    // YANGLIK: Yashirin holatni olib, Flex qilib ko'rsatamiz
    chatWindow.classList.remove('hidden');
    chatWindow.classList.add('flex');
    
    window.refreshActiveChat();
};

window.openChatList = function(event, bookId) {
    event.stopPropagation();
    const chatWindow = document.getElementById(`chat-window-${bookId}`);
    if (!chatWindow) return;

    window.currentActiveChatBookId = bookId;
    window.currentActiveReceiverId = null;

    document.getElementById(`chat-title-${bookId}`).textContent = "Mijozlar";
    document.getElementById(`chat-back-btn-${bookId}`).classList.add('hidden');
    
    const inputWrapper = document.getElementById(`chat-input-wrapper-${bookId}`);
    inputWrapper.classList.add('hidden');
    inputWrapper.classList.remove('flex'); // Listda input kerak emas
    
    // YANGLIK: Chat qutichasini ko'rsatamiz
    chatWindow.classList.remove('hidden');
    chatWindow.classList.add('flex');

    window.renderChatListForSeller(bookId);
};

window.openSpecificChatFromList = function(bookId, buyerId, buyerName) {
    window.currentActiveReceiverId = buyerId;
    document.getElementById(`chat-title-${bookId}`).textContent = `Mijoz: ${buyerName}`;
    document.getElementById(`chat-back-btn-${bookId}`).classList.remove('hidden'); 
    
    const inputWrapper = document.getElementById(`chat-input-wrapper-${bookId}`);
    inputWrapper.classList.remove('hidden');
    inputWrapper.classList.add('flex');
    
    window.refreshActiveChat();
};

window.closeChat = function(bookId) {
    const chatWindow = document.getElementById(`chat-window-${bookId}`);
    if (chatWindow) {
        // YANGLIK: Chatni butunlay yashirib tashlaymiz
        chatWindow.classList.add('hidden');
        chatWindow.classList.remove('flex');
    }
    window.currentActiveChatBookId = null;
    window.currentActiveReceiverId = null;
};

// --- EKRANGA CHIZISH ---

window.refreshActiveChat = function() {
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
        msgContainer.innerHTML = `<div class="text-center text-grayText text-xs mt-10">Chatni boshlang!</div>`;
        return;
    }

    let html = '';
    currentChat.messages.forEach(msg => {
        const isMe = msg.sender === currentUserId;
        const time = new Date(msg.createdAt || Date.now()).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'});
        
        if (isMe) {
            html += `
                <div class="flex justify-end w-full">
                    <div class="bg-primary text-white px-3 py-1.5 rounded-xl rounded-tr-none text-xs max-w-[85%] break-words">
                        ${msg.text}
                        <span class="block text-[8px] text-white/70 text-right mt-0.5">${time}</span>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="flex justify-start w-full">
                    <div class="bg-darkBg border border-darkBorder text-lightText px-3 py-1.5 rounded-xl rounded-tl-none text-xs max-w-[85%] break-words">
                        ${msg.text}
                        <span class="block text-[8px] text-grayText text-right mt-0.5">${time}</span>
                    </div>
                </div>
            `;
        }
    });

    if(msgContainer.innerHTML !== html) {
        msgContainer.innerHTML = html;
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }
};

window.renderChatListForSeller = function(bookId) {
    const msgContainer = document.getElementById(`chat-messages-${bookId}`);
    if(!msgContainer) return;

    const bookChats = allMyChats.filter(c => c.book && c.book._id === bookId);

    if (bookChats.length === 0) {
        msgContainer.innerHTML = `<div class="text-center text-grayText text-xs mt-10">Hech kim yozmagan</div>`;
        return;
    }

    let html = '';
    bookChats.forEach(chat => {
        const otherPerson = (chat.buyer && chat.buyer._id === currentUserId) ? chat.seller : chat.buyer;
        if (!otherPerson) return; 

        const lastMsg = (chat.messages && chat.messages.length > 0) ? chat.messages[chat.messages.length - 1] : null;
        const msgText = lastMsg ? lastMsg.text : '...';
        
        html += `
            <div onclick="window.openSpecificChatFromList('${bookId}', '${otherPerson._id}', '${otherPerson.firstName}')" class="bg-darkBg border border-darkBorder p-2 rounded-lg cursor-pointer flex items-center gap-2 hover:border-primary/50 transition">
                <div class="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    ${otherPerson.firstName.charAt(0)}
                </div>
                <div class="overflow-hidden flex-1">
                    <h4 class="text-xs font-bold text-lightText truncate">${otherPerson.firstName} ${otherPerson.lastName}</h4>
                    <p class="text-[10px] text-grayText truncate">${msgText}</p>
                </div>
            </div>
        `;
    });
    msgContainer.innerHTML = html;
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
        <div class="flex justify-end w-full opacity-50">
            <div class="bg-primary text-white px-3 py-1.5 rounded-xl rounded-tr-none text-xs max-w-[85%] break-words">
                ${text}
            </div>
        </div>
    `;
    msgContainer.scrollTop = msgContainer.scrollHeight;

    try {
        let res = await fetch(CHAT_API, { 
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
        if(data.success) {
            // Fonga yuborilgach bazani o'zini yangilab keladi
            let fetchRes = await fetch(CHAT_API, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!fetchRes.ok && fetchRes.status === 404) {
                fetchRes = await fetch(`${API_URL}/chat`, { headers: { 'Authorization': `Bearer ${token}` } });
            }
            const fetchJson = await fetchRes.json();
            if(fetchJson.success) {
                allMyChats = fetchJson.data;
                window.refreshActiveChat();
            }
        }
    } catch (e) { alert("Xabar ketmadi!"); }
};

window.chatEnter = function(e, bookId) {
    if (e.key === 'Enter') {
        e.preventDefault();
        window.sendMsg(bookId);
    }
};