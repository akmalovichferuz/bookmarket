document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'http://localhost:5000/api';
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/auth.html'; return; }

    let currentUserId = null;
    let allConversations = [];
    let dmInterval = null;
    window.activeChatUserId = null;

    async function init() {
        try {
            const authRes = await fetch(`${API_URL}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
            const authData = await authRes.json();
            if (authData.success) {
                currentUserId = String(authData.data._id); // ID ni stringga o'tkazamiz
                fetchInbox();
            } else {
                window.location.href = '/auth.html';
            }
        } catch (e) {
            window.location.href = '/auth.html';
        }
    }

    async function fetchInbox() {
        const container = document.getElementById('inboxContainer');
        if(!container) return;
        container.innerHTML = '<div class="text-center py-10"><i class="fa-solid fa-spinner fa-spin text-3xl text-indigo-400"></i></div>';
        
        try {
            const res = await fetch(`${API_URL}/messages/inbox/conversations`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            
            if (data.success) {
                allConversations = data.data || [];
                renderInbox();
            } else {
                container.innerHTML = `<div class="text-center text-red-500 py-10">Xatolik: Ma'lumotlarni yuklab bo'lmadi.</div>`;
            }
        } catch (e) {
            container.innerHTML = `<div class="text-center text-red-500 py-10">Xatolik yuz berdi! Server ulanishini tekshiring.</div>`;
        }
    }

    function renderInbox() {
        const container = document.getElementById('inboxContainer');
        if(!container) return;
        
        if (allConversations.length === 0) {
            container.innerHTML = `<div class="text-center text-grayText py-12 bg-darkCard border border-darkBorder rounded-3xl font-bold"><i class="fa-solid fa-envelope-open text-4xl mb-4 opacity-50"></i><br>Pochtangiz bo'sh. Hech kim bilan suhbat qurmadingiz.</div>`;
            return;
        }

        container.innerHTML = allConversations.map(conv => {
            const time = new Date(conv.lastMessage.createdAt).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'});
            const msgSenderId = String(conv.lastMessage.sender._id || conv.lastMessage.sender);
            const isMe = msgSenderId === currentUserId;

            return `
                <div onclick="window.openDirectMessage('${conv.user._id}', '${conv.user.firstName}', '${conv.user.lastName || ''}')" class="bg-darkCard border border-darkBorder hover:border-indigo-500/50 p-4 rounded-2xl cursor-pointer transition flex items-center gap-4 group mb-4 shadow-sm">
                    <div class="w-14 h-14 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xl shrink-0 group-hover:scale-110 transition-transform">
                        ${conv.user.firstName.charAt(0).toUpperCase()}
                    </div>
                    <div class="overflow-hidden flex-1">
                        <div class="flex justify-between items-center mb-1">
                            <h4 class="text-base font-bold text-lightText group-hover:text-indigo-400 transition truncate">${conv.user.firstName} ${conv.user.lastName || ''}</h4>
                            <span class="text-xs text-grayText">${time}</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <p class="text-sm text-grayText truncate ${conv.unreadCount > 0 ? 'text-lightText font-bold' : ''}">
                                ${isMe ? '<i class="fa-solid fa-check-double text-[10px] mr-1 text-indigo-400"></i>' : ''} ${conv.lastMessage.text}
                            </p>
                            ${conv.unreadCount > 0 ? `<span class="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-red-500/50">${conv.unreadCount}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    window.openDirectMessage = function(userId, fName, lName) {
        window.activeChatUserId = userId;
        const dmOverlay = document.getElementById('dmOverlay');
        if(!dmOverlay) return;

        document.getElementById('dmInitials').textContent = fName.charAt(0).toUpperCase();
        document.getElementById('dmName').textContent = `${fName} ${lName || ''}`;
        dmOverlay.classList.remove('hidden');
        dmOverlay.classList.add('flex');
        
        window.refreshDM();
        if(dmInterval) clearInterval(dmInterval);
        dmInterval = setInterval(window.refreshDM, 3000);
    };

    window.closeDM = function() {
        const dmOverlay = document.getElementById('dmOverlay');
        if(dmOverlay) {
            dmOverlay.classList.add('hidden');
            dmOverlay.classList.remove('flex');
        }
        if(dmInterval) clearInterval(dmInterval);
        window.activeChatUserId = null;
        fetchInbox(); 
    };

    window.refreshDM = async function() {
        if(!window.activeChatUserId) return;
        try {
            const res = await fetch(`${API_URL}/messages/${window.activeChatUserId}`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            const data = await res.json();
            const msgContainer = document.getElementById('dmMessages');
            if(!msgContainer) return;
            
            if (!data.success || data.data.length === 0) {
                if(!msgContainer.innerHTML.includes('Suhbatni boshlang')) {
                    msgContainer.innerHTML = `<div class="text-center text-grayText text-xs mt-10"><i class="fa-regular fa-comments text-3xl mb-3 text-darkBorder"></i><br>Suhbatni boshlang!</div>`;
                }
                return;
            }

            let html = '';
            data.data.forEach(msg => {
                const msgSenderId = String(msg.sender._id || msg.sender);
                const isMe = msgSenderId === currentUserId;
                const time = new Date(msg.createdAt).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'});
                
                if (isMe) {
                    // O'ZINGIZNIKI - CHAP TOMONDA (Indigo fonda)
                    html += `
                        <div class="flex justify-start w-full animate-fade-in mb-2">
                            <div class="bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-tl-none text-sm max-w-[80%] break-words shadow-md">
                                <p class="leading-relaxed">${msg.text}</p>
                                <div class="flex items-center justify-start gap-1 mt-1 opacity-70">
                                    <span class="text-[10px] font-bold">${time}</span>
                                    ${msg.isRead ? '<i class="fa-solid fa-check-double text-[10px]"></i>' : '<i class="fa-solid fa-check text-[10px]"></i>'}
                                </div>
                            </div>
                        </div>`;
                } else {
                    // SOTUVCHINIKI - O'NG TOMONDA (To'q fonda)
                    html += `
                        <div class="flex justify-end w-full animate-fade-in mb-2">
                            <div class="bg-darkBg border border-darkBorder text-lightText px-4 py-2 rounded-2xl rounded-tr-none text-sm max-w-[80%] break-words shadow-sm text-right">
                                <p class="leading-relaxed">${msg.text}</p>
                                <span class="block text-[10px] text-grayText mt-1 font-bold">${time}</span>
                            </div>
                        </div>`;
                }
            });

            if(msgContainer.innerHTML !== html) {
                msgContainer.innerHTML = html;
                msgContainer.scrollTop = msgContainer.scrollHeight;
            }
        } catch (e) {}
    };

    window.sendDM = async function() {
        const input = document.getElementById('dmInput');
        const text = input.value.trim();
        if (!text || !window.activeChatUserId) return;
        input.value = '';
        
        try {
            await fetch(`${API_URL}/messages`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ receiverId: window.activeChatUserId, text })
            });
            window.refreshDM();
        } catch(e) { alert("Xabar jo'natilmadi!"); }
    };

    window.dmEnter = function(e) { if (e.key === 'Enter') { e.preventDefault(); window.sendDM(); } };
    init();
});