document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/auth.html';
        return;
    }

    const cartItemsContainer = document.getElementById('cartItems');
    const totalSelectedEl = document.getElementById('totalSelected');
    const totalPriceEl = document.getElementById('totalPrice'); 
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    let cartBooks = [];

    async function loadCart() {
        try {
            const res = await fetch('/api/market/cart', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (data.success) {
                // MUHIM: Agar kitob bazadan o'chgan bo'lsa (null bo'lsa), uni hisobga qo'shmaymiz
                cartBooks = data.data.filter(book => book !== null); 
                renderCart();
            }
        } catch (err) {
            cartItemsContainer.innerHTML = `<p class="text-red-500 text-center font-bold">Xatolik yuz berdi.</p>`;
        }
    }

    function renderCart() {
        if (cartBooks.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="text-center bg-darkCard p-12 rounded-3xl border border-darkBorder text-grayText">
                    <i class="fa-solid fa-basket-shopping text-6xl mb-4 text-darkBorder"></i>
                    <p class="text-xl font-bold">Savatchangiz bo'sh. Qani, kitoblar tanlaymiz!</p>
                </div>`;
            updateCheckoutButton(); // Narxlarni 0 qilish uchun
            return;
        }

        cartItemsContainer.innerHTML = '';
        cartBooks.forEach(book => {
            const imgUrl = book.images && book.images.length > 0 ? `/uploads/${book.images[0]}` : '/uploads/default.jpg';
            const formattedPrice = new Intl.NumberFormat('uz-UZ').format(book.price || 0);

            const el = document.createElement('div');
            el.className = "bg-darkCard border border-darkBorder rounded-2xl p-4 flex items-center justify-between shadow-lg transition hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]";
            el.innerHTML = `
                <div class="flex items-center gap-5 w-full">
                    <input type="checkbox" value="${book._id}" data-price="${book.price || 0}" class="book-checkbox w-6 h-6 text-primary bg-darkBg border-darkBorder rounded focus:ring-primary cursor-pointer accent-primary ml-2">
                    
                    <div class="w-20 h-28 bg-darkBg rounded-lg overflow-hidden shrink-0 border border-darkBorder">
                        <img src="${imgUrl}" class="w-full h-full object-cover">
                    </div>
                    
                    <div class="flex-grow">
                        <div class="text-[10px] text-primary font-bold uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded inline-block border border-primary/20 mb-1">${book.genre || 'KITOB'}</div>
                        <h3 class="font-black text-xl text-lightText mb-1 line-clamp-1">${book.title}</h3>
                        <p class="text-grayText text-sm font-medium mb-2"><i class="fa-solid fa-pen-nib opacity-60"></i> ${book.author}</p>
                        <p class="font-black text-primary text-lg">${formattedPrice} <span class="text-xs font-bold text-grayText">so'm</span></p>
                    </div>
                </div>
                
                <button onclick="removeFromCart('${book._id}')" class="text-red-500/70 hover:text-red-500 bg-red-500/10 p-4 rounded-xl transition shrink-0 ml-4 border border-red-500/20" title="Savatchadan olib tashlash">
                    <i class="fa-solid fa-trash-can text-lg"></i>
                </button>
            `;
            cartItemsContainer.appendChild(el);
        });

        const checkboxes = document.querySelectorAll('.book-checkbox');
        checkboxes.forEach(box => {
            box.addEventListener('change', updateCheckoutButton);
        });
        
        // Sahifa yuklanganda narxlarni hisoblab qo'yish
        updateCheckoutButton();
    }

    function updateCheckoutButton() {
        const checkedBoxes = document.querySelectorAll('.book-checkbox:checked');
        let totalSum = 0;

        checkedBoxes.forEach(box => {
            totalSum += Number(box.getAttribute('data-price') || 0); 
        });

        totalSelectedEl.textContent = `${checkedBoxes.length} ta`;
        totalPriceEl.textContent = new Intl.NumberFormat('uz-UZ').format(totalSum);
        
        // Agar birorta ham kitob belgilanmasa, tugma bloklanadi!
        checkoutBtn.disabled = checkedBoxes.length === 0;
    }

    checkoutBtn.addEventListener('click', async () => {
        const checkedBoxes = document.querySelectorAll('.book-checkbox:checked');
        const bookIds = Array.from(checkedBoxes).map(box => box.value);

        if (bookIds.length === 0) {
            alert("Iltimos, avval kitobni belgilang!");
            return;
        }

        checkoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kuting...';
        checkoutBtn.disabled = true;

        try {
            const res = await fetch('/api/market/checkout', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ bookIds })
            });
            const data = await res.json();
            
            if (data.success) {
                alert("🎉 Buyurtma muvaffaqiyatli rasmiylashtirildi! Uni 'Buyurtmalar' bo'limida kuzatishingiz mumkin.");
                loadCart(); 
            } else {
                alert("Xato: " + data.message);
            }
        } catch (err) {
            alert("Xatolik yuz berdi");
        } finally {
            checkoutBtn.innerHTML = 'Rasmiylashtirish <i class="fa-solid fa-paper-plane"></i>';
            updateCheckoutButton();
        }
    });

    loadCart();
});

window.removeFromCart = async function(bookId) {
    if (!confirm("Kitobni savatchadan o'chirmoqchimisiz?")) return;
    
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/market/cart/${bookId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            window.location.reload(); 
        }
    } catch (err) { console.error(err); }
}