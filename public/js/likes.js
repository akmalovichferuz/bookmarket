document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'http://localhost:5000/api';
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/auth.html'; return; }

    let currentUserId = null;
    let userLikedBooks = [];
    let allActiveBooks = [];

    async function init() {
        await checkUserAuth();
        await fetchUserLikes();
        await fetchAllBooks();
    }

    async function checkUserAuth() {
        const res = await fetch(`${API_URL}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) currentUserId = data.data._id;
    }

    async function fetchUserLikes() {
        const res = await fetch(`${API_URL}/users/me/likes`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if(data.success) userLikedBooks = data.data || [];
    }

    async function fetchAllBooks() {
        const container = document.getElementById('likesContainer');
        container.innerHTML = '<div class="col-span-full text-center py-10"><i class="fa-solid fa-spinner fa-spin text-4xl text-primary"></i></div>';
        
        const res = await fetch(`${API_URL}/books`);
        const data = await res.json();
        
        if (data.success) {
            // Faqat faol va faqat layk bosilgan e'lonlarni qoldiramiz
            allActiveBooks = data.data.filter(b => !b.isSold && userLikedBooks.includes(b._id));
            renderLikedBooks();
        }
    }

    function renderLikedBooks() {
        const container = document.getElementById('likesContainer');
        if (allActiveBooks.length === 0) {
            container.innerHTML = `<div class="col-span-full text-center text-grayText py-12 bg-darkCard border border-darkBorder rounded-3xl font-bold">Sizda yoqtirilgan faol e'lonlar yo'q.</div>`;
            return;
        }

        container.innerHTML = allActiveBooks.map(book => {
            const isMe = book.seller._id === currentUserId;
            const imgUrl = book.images && book.images.length > 0 ? `/uploads/${book.images[0]}` : '/uploads/default.jpg';
            const price = new Intl.NumberFormat('uz-UZ').format(book.price || 0);
            
            // O'ZINGIZNIKI BO'LSA - TAHRIRLASH, BIROVNIKI BO'LSA - SAVAT/CHAT
            const actionButtons = isMe ? `
                <div class="flex gap-2 mt-auto pt-4">
                    <button onclick="window.location.href='/profile.html'" class="w-full bg-darkBg border border-darkBorder py-2.5 rounded-xl text-xs font-bold hover:text-primary hover:border-primary transition relative z-10">
                        Profilingizda tahrirlash
                    </button>
                </div>
            ` : `
                <div class="flex gap-2 mt-auto pt-4 border-t border-darkBorder/50">
                    <button onclick="window.addToCart(event, '${book._id}')" class="flex-1 bg-emerald-500/20 text-emerald-400 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-500 hover:text-white transition z-10">
                        <i class="fa-solid fa-cart-shopping"></i> Savatga
                    </button>
                    <button onclick="window.location.href='/seller.html?id=${book.seller._id}'" class="flex-1 bg-indigo-500/20 text-indigo-400 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-500 hover:text-white transition z-10">
                        Do'konga o'tish
                    </button>
                </div>
            `;

            return `
                <div class="bg-darkCard rounded-3xl shadow-lg border border-darkBorder flex flex-col overflow-hidden relative group cursor-pointer" onclick="window.location.href='/book-details.html?id=${book._id}'">
                    <button onclick="window.toggleLike(event, '${book._id}')" class="absolute top-3 right-3 bg-darkBg/80 backdrop-blur-md p-2.5 rounded-full border border-darkBorder flex items-center justify-center z-20">
                        <i id="heart-${book._id}" class="fa-solid fa-heart text-red-500 text-lg hover:scale-110 transition-all"></i>
                    </button>
                    
                    <div class="h-60 overflow-hidden relative">
                        <img src="${imgUrl}" class="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500">
                    </div>
                    
                    <div class="p-5 flex-grow flex flex-col relative z-10 bg-darkCard">
                        <div class="flex justify-between items-start mb-2">
                            <div class="text-[10px] text-primary font-bold uppercase bg-primary/10 px-2.5 py-1 rounded-md">${book.genre}</div>
                            <div class="text-xl font-black text-primary">${price} <span class="text-xs text-grayText">so'm</span></div>
                        </div>
                        <h3 class="text-lg font-black text-lightText truncate mb-2">${book.title}</h3>
                        <div class="text-xs text-grayText font-medium flex items-center gap-1.5"><i class="fa-solid fa-user text-primary"></i> ${book.seller.firstName} ${book.seller.lastName || ''}</div>
                        
                        ${actionButtons}
                    </div>
                </div>
            `;
        }).join('');
    }

    window.toggleLike = async function(e, bookId) {
        e.stopPropagation();
        try {
            await fetch(`${API_URL}/books/${bookId}/like`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            // Layk olib tashlansa ekrandan darhol o'chadi
            allActiveBooks = allActiveBooks.filter(b => b._id !== bookId);
            renderLikedBooks();
        } catch(e) {}
    };

    window.addToCart = async function(e, bookId) {
        e.stopPropagation(); 
        try {
            const res = await fetch(`${API_URL}/market/cart/${bookId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) alert("✅ Savatchaga qo'shildi!");
        } catch (err) {}
    };

    init();
});