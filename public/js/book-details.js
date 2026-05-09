document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'http://localhost:5000/api';
    const bookContent = document.getElementById('bookContent');
    const token = localStorage.getItem('token');
    
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');

    if (!bookId) {
        bookContent.innerHTML = '<div class="text-center py-20 bg-darkCard rounded-3xl border border-darkBorder"><h2 class="text-3xl font-black text-red-500 mb-2">Xatolik!</h2><p class="text-grayText">Kitob ID si topilmadi.</p></div>';
        return;
    }

    // Foydalanuvchi roli (Adminlikni tekshirish uchun)
    let currentUserRole = '';
    let currentUserId = '';
    if(token) {
        try {
            const meRes = await fetch(`${API_URL}/auth/me`, { headers: {'Authorization': `Bearer ${token}`} });
            const meData = await meRes.json();
            if(meData.success) {
                currentUserRole = meData.data.role;
                currentUserId = meData.data._id;
            }
        } catch(e) { console.error("Auth error:", e); }
    }

    try {
        const [bookRes, commentsRes] = await Promise.all([
            fetch(`${API_URL}/books/${bookId}`),
            fetch(`${API_URL}/books/${bookId}/comments`)
        ]);
        
        const bookData = await bookRes.json();
        const commentsData = await commentsRes.json();

        if (bookData.success) {
            renderBookDetails(bookData.data, commentsData.data || []);
        } else {
            bookContent.innerHTML = '<div class="text-center py-20 bg-darkCard rounded-3xl border border-darkBorder"><h2 class="text-3xl font-black text-red-500 mb-2">Topilmadi!</h2><p class="text-grayText">Kitob o\'chirilgan yoki mavjud emas.</p></div>';
        }
    } catch (error) {
        bookContent.innerHTML = '<div class="text-center py-20 bg-darkCard rounded-3xl border border-darkBorder"><h2 class="text-3xl font-black text-red-500 mb-2">Aloqa uzildi!</h2><p class="text-grayText">Server bilan ulanishda xato.</p></div>';
    }

    function renderBookDetails(book, comments) {
        const imgUrl = book.images && book.images.length > 0 ? `/uploads/${book.images[0]}` : '/uploads/default.jpg';
        const seller = book.seller || { firstName: 'No\'malum', lastName: '', totalBooks: 0, followersCount: 0, _id: '' };
        const sellerInitials = `${seller.firstName.charAt(0)}${seller.lastName.charAt(0)}`.toUpperCase();
        const formattedPrice = new Intl.NumberFormat('uz-UZ').format(book.price || 0);

        bookContent.innerHTML = `
            <div class="bg-darkCard rounded-[2rem] shadow-2xl border border-darkBorder overflow-hidden mb-10 relative">
                
                <div class="absolute -left-32 -top-32 w-96 h-96 bg-primary opacity-10 rounded-full blur-[100px] pointer-events-none"></div>

                <div class="flex flex-col md:flex-row border-b border-darkBorder relative z-10">
                    
                    <!-- Rasm qismi -->
                    <div class="md:w-5/12 bg-darkBg/50 p-8 md:p-12 flex items-center justify-center border-r border-darkBorder">
                        <img src="${imgUrl}" alt="${book.title}" class="max-h-[500px] w-auto object-contain rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-500">
                    </div>
                    
                    <!-- Ma'lumotlar qismi -->
                    <div class="md:w-7/12 p-8 md:p-12 flex flex-col justify-center">
                        <div class="inline-block bg-primary/10 border border-primary/20 text-primary text-xs font-black px-4 py-1.5 rounded-lg uppercase tracking-widest mb-6 w-max shadow-inner">${book.genre}</div>
                        
                        <h1 class="text-3xl md:text-5xl font-black text-lightText mb-4 leading-tight">${book.title}</h1>
                        <p class="text-xl text-grayText font-bold mb-8"><i class="fa-solid fa-pen-nib text-primary mr-2"></i> ${book.author}</p>
                        
                        <div class="text-4xl font-black text-primary mb-10">${formattedPrice} <span class="text-xl text-grayText font-bold">so'm</span></div>

                        <!-- Tugmalar qatori (Katta layk tugmasi olib tashlandi) -->
                        <div class="flex flex-wrap items-center gap-4 mb-10">
                            <button onclick="window.location.href='/seller.html?id=${seller._id}'" class="flex-1 bg-primary text-darkBg text-lg font-black px-8 py-5 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-primaryHover hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all flex justify-center items-center gap-3 transform hover:-translate-y-1">
                                <i class="fa-solid fa-store"></i> Sotuvchi do'koniga o'tish
                            </button>
                        </div>

                        <!-- Sotuvchi Mini-Karta -->
                        <div class="bg-darkBg p-4 rounded-2xl border border-darkBorder flex items-center justify-between cursor-pointer hover:bg-darkBorder/40 transition-colors group" onclick="window.location.href='/seller.html?id=${seller._id}'">
                            <div class="flex items-center gap-4">
                                <div class="w-14 h-14 bg-primary/20 text-primary border border-primary/30 rounded-full flex items-center justify-center font-black text-xl shadow-inner group-hover:bg-primary/30 transition-colors">${sellerInitials}</div>
                                <div>
                                    <div class="font-bold text-lightText text-lg group-hover:text-primary transition-colors">${seller.firstName} ${seller.lastName}</div>
                                    <div class="text-sm text-grayText font-medium mt-0.5">${seller.totalBooks} ta e'lon &bull; <span class="text-primary">${seller.followersCount} sodiq mijoz</span></div>
                                </div>
                            </div>
                            <i class="fa-solid fa-chevron-right text-grayText group-hover:text-primary transition-colors text-xl mr-2"></i>
                        </div>
                    </div>
                </div>

                <div class="p-8 md:p-12 relative z-10">
                    <div class="flex gap-8 border-b border-darkBorder mb-8">
                        <button id="tabDetailsBtn" class="pb-4 text-xl font-black text-primary border-b-2 border-primary transition-colors focus:outline-none">Texnik ma'lumotlar</button>
                        <button id="tabCommentsBtn" class="pb-4 text-xl font-black text-grayText border-b-2 border-transparent hover:text-lightText transition-colors focus:outline-none">
                            Izohlar <span class="bg-darkBg px-2.5 py-0.5 rounded-lg text-sm ml-1 border border-darkBorder">${book.commentsCount}</span>
                        </button>
                    </div>

                    <!-- Texnik Ma'lumotlar Ekrami -->
                    <div id="contentDetails" class="block">
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div class="bg-darkBg p-6 rounded-2xl border border-darkBorder flex items-center gap-4 hover:border-primary/50 transition-colors">
                                <div class="w-12 h-12 bg-darkCard rounded-xl flex items-center justify-center text-primary text-xl shadow-inner"><i class="fa-solid fa-file-lines"></i></div>
                                <div>
                                    <div class="text-grayText text-xs font-bold uppercase tracking-wider mb-1">Sahifalar</div>
                                    <div class="text-2xl font-black text-lightText">${book.pages} bet</div>
                                </div>
                            </div>
                            <div class="bg-darkBg p-6 rounded-2xl border border-darkBorder flex items-center gap-4 hover:border-primary/50 transition-colors">
                                <div class="w-12 h-12 bg-darkCard rounded-xl flex items-center justify-center text-primary text-xl shadow-inner"><i class="fa-solid fa-ruler-combined"></i></div>
                                <div>
                                    <div class="text-grayText text-xs font-bold uppercase tracking-wider mb-1">O'lchami</div>
                                    <div class="text-2xl font-black text-lightText">${book.dimensions ? book.dimensions.width : '-'} x ${book.dimensions ? book.dimensions.height : '-'} sm</div>
                                </div>
                            </div>
                            <div class="bg-darkBg p-6 rounded-2xl border border-darkBorder flex items-center gap-4 hover:border-primary/50 transition-colors">
                                <div class="w-12 h-12 bg-darkCard rounded-xl flex items-center justify-center text-primary text-xl shadow-inner"><i class="fa-solid fa-scroll"></i></div>
                                <div>
                                    <div class="text-grayText text-xs font-bold uppercase tracking-wider mb-1">Qog'oz turi</div>
                                    <div class="text-lg font-black text-lightText leading-tight">${book.paperType}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Izohlar (Kommentlar) Ekrani -->
                    <div id="contentComments" class="hidden">
                        <form id="commentForm" class="mb-10 flex flex-col sm:flex-row gap-4 bg-darkBg p-4 rounded-2xl border border-darkBorder">
                            <input type="text" id="commentText" required placeholder="Kitob haqida o'z fikringizni yozing..." class="flex-grow bg-transparent text-lightText text-lg p-3 outline-none placeholder-grayText">
                            <button type="submit" class="bg-primary text-darkBg px-8 py-3 rounded-xl font-black hover:bg-primaryHover transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2">
                                <i class="fa-solid fa-paper-plane"></i> Yuborish
                            </button>
                        </form>

                        <div id="commentsList" class="flex flex-col gap-5">
                            ${comments.length === 0 ? '<div class="text-grayText text-center py-12 font-bold bg-darkBg rounded-2xl border border-darkBorder"><i class="fa-regular fa-comments text-4xl mb-3 opacity-50 block"></i>Hozircha izohlar yo\'q.</div>' : ''}
                            ${comments.map(c => `
                                <div class="bg-darkBg p-6 rounded-2xl border border-darkBorder relative group">
                                    <div class="flex justify-between items-start mb-3">
                                        <div class="flex items-center gap-4">
                                            <div class="w-12 h-12 bg-primary/10 border border-primary/20 text-primary rounded-full flex items-center justify-center font-black text-lg">
                                                ${c.user.firstName.charAt(0)}${c.user.lastName.charAt(0)}
                                            </div>
                                            <div>
                                                <span class="font-black text-lightText text-lg block leading-none">${c.user.firstName} ${c.user.lastName}</span>
                                                <span class="text-xs text-grayText font-bold mt-1 block"><i class="fa-regular fa-clock mr-1"></i> ${new Date(c.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        
                                        <!-- ADMIN YOKI IZOH EGASI UCHUN O'CHIRISH TUGMASI -->
                                        ${(currentUserRole === 'admin' || (currentUserId === c.user._id)) ? `
                                            <button onclick="deleteComment('${c._id}')" class="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/10 rounded-lg">
                                                <i class="fa-solid fa-trash-can"></i>
                                            </button>
                                        ` : ''}
                                    </div>
                                    <p class="text-lightText/90 text-md pl-[4.3rem] leading-relaxed">${c.text}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // === TABlarni almashtirish mantiqi ===
        const tabDetailsBtn = document.getElementById('tabDetailsBtn');
        const tabCommentsBtn = document.getElementById('tabCommentsBtn');
        const contentDetails = document.getElementById('contentDetails');
        const contentComments = document.getElementById('contentComments');

        tabDetailsBtn.addEventListener('click', () => {
            tabDetailsBtn.className = "pb-4 text-xl font-black text-primary border-b-2 border-primary transition-colors focus:outline-none";
            tabCommentsBtn.className = "pb-4 text-xl font-black text-grayText border-b-2 border-transparent hover:text-lightText transition-colors focus:outline-none";
            contentDetails.classList.remove('hidden');
            contentComments.classList.add('hidden');
        });

        tabCommentsBtn.addEventListener('click', () => {
            tabCommentsBtn.className = "pb-4 text-xl font-black text-primary border-b-2 border-primary transition-colors focus:outline-none";
            tabDetailsBtn.className = "pb-4 text-xl font-black text-grayText border-b-2 border-transparent hover:text-lightText transition-colors focus:outline-none";
            contentComments.classList.remove('hidden');
            contentDetails.classList.add('hidden');
        });

        // === IZOH (Komment) yozish mantiqi ===
        document.getElementById('commentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!token) { alert("Izoh yozish uchun tizimga kiring!"); return; }
            
            const textInput = document.getElementById('commentText');
            const text = textInput.value.trim();
            if(!text) return;

            try {
                const res = await fetch(`${API_URL}/books/${bookId}/comment`, {
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ text })
                });
                if (res.ok) window.location.reload();
            } catch(e) { console.error("Comment error", e); }
        });
    }

    // KOMMENTNI O'CHIRISH FUNKSIYASI
    window.deleteComment = async (id) => {
        if(!confirm("Ushbu izohni o'chirmoqchimisiz?")) return;
        try {
            const res = await fetch(`${API_URL}/books/comments/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if(res.ok) window.location.reload();
            else alert("O'chirishda xatolik!");
        } catch(e) { console.error(e); }
    };
});