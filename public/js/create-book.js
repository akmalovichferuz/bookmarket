document.addEventListener('DOMContentLoaded', () => {
    // 1. Foydalanuvchi tizimga kirganligini tekshirish (Himoya)
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Xatolik! E'lon berish uchun tizimga kirishingiz shart.");
        window.location.href = '/auth.html';
        return;
    }

    const API_URL = 'http://localhost:5000/api';
    
    // HTML Elementlar
    const createBookForm = document.getElementById('createBookForm');
    const bookImagesInput = document.getElementById('bookImages');
    const imagePreview = document.getElementById('imagePreview');
    const errorMessage = document.getElementById('errorMessage');
    const submitBtn = document.getElementById('submitBtn');

    let selectedFiles = []; // Yuklangan rasmlarni saqlab turuvchi massiv

    // 2. Rasmlar yuklanganda vizual chizish (Preview) mantiqi
    bookImagesInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        
        // 5 tadan ko'p rasm yuklashni taqiqlash
        if (selectedFiles.length + files.length > 5) {
            showError("Siz maksimal 5 ta rasm yuklay olasiz!");
            bookImagesInput.value = ''; // Inputni tozalash
            return;
        }

        files.forEach(file => {
            // Hajmi 5MB dan kattaligini tekshirish
            if (file.size > 5 * 1024 * 1024) {
                showError(`"${file.name}" fayl hajmi 5MB dan katta! Qabul qilinmadi.`);
                return;
            }

            selectedFiles.push(file);

            // Rasmni ekranda kichkina qilib chizish
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'relative w-24 h-24 border border-darkBorder rounded-lg overflow-hidden shadow-sm group';
                imgContainer.innerHTML = `
                    <img src="${e.target.result}" class="w-full h-full object-cover">
                    <button type="button" class="absolute inset-0 bg-black bg-opacity-60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity remove-img-btn" data-name="${file.name}">
                        <i class="fa-solid fa-trash text-xl"></i>
                    </button>
                `;
                imagePreview.appendChild(imgContainer);

                // Rasmni ustiga bosib o'chirish
                imgContainer.querySelector('.remove-img-btn').addEventListener('click', function() {
                    const nameToRemove = this.getAttribute('data-name');
                    selectedFiles = selectedFiles.filter(f => f.name !== nameToRemove);
                    imgContainer.remove();
                    if(selectedFiles.length === 0) bookImagesInput.value = '';
                });
            };
            reader.readAsDataURL(file);
        });
        
        hideError();
    });

    // 3. Formani yuborish (Backend bilan ulanish)
    createBookForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Sahifa yangilanishini to'xtatish

        if (selectedFiles.length === 0) {
            showError("Diqqat: Kamida 1 ta kitob rasmini yuklashingiz shart!");
            return;
        }

        // Tugmani "Yuklanmoqda..." holatiga o'tkazish
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-xl"></i> Biroz kuting...';
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-70', 'cursor-not-allowed');

        // Barcha matnli ma'lumotlarni va rasmlarni "FormData" qilib yig'ish
        const formData = new FormData();
        formData.append('title', document.getElementById('bookTitle').value.trim());
        formData.append('author', document.getElementById('bookAuthor').value.trim());
        
        // YANGLANGAN QISM: Narx (price) qo'shildi
        formData.append('price', document.getElementById('bookPrice').value); 
        
        formData.append('genre', document.getElementById('bookGenre').value);
        formData.append('paperType', document.getElementById('bookPaperType').value);
        formData.append('pages', document.getElementById('bookPages').value);
        formData.append('width', document.getElementById('bookWidth').value);
        formData.append('height', document.getElementById('bookHeight').value);

        selectedFiles.forEach(file => {
            formData.append('images', file);
        });

        // Backend API ga POST so'rov jo'natish
        try {
            const res = await fetch(`${API_URL}/books`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (data.success) {
                alert("Tabriklaymiz! E'loningiz muvaffaqiyatli saqlandi va platformaga joylandi.");
                window.location.href = '/index.html'; // Bosh sahifaga qaytish
            } else {
                showError(data.message || "Xatolik yuz berdi!");
                resetBtn();
            }
        } catch (error) {
            showError("Server bilan ulanishda xato yuz berdi. Internetni tekshiring.");
            resetBtn();
        }
    });

    function showError(msg) {
        errorMessage.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> ${msg}`;
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }

    function resetBtn() {
        submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> E\'lonni platformaga joylash';
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
});