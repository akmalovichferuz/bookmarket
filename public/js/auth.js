document.addEventListener('DOMContentLoaded', () => {
    // === 1. HTML ELEMENTLARNI USHLAB OLISH ===
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const showLoginBtn = document.getElementById('showLoginBtn');

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');

    // === 2. SAHIFALARNI ALMASHTIRISH (LOGIN / REGISTER) ===
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginSection.classList.add('hidden');
            registerSection.classList.remove('hidden');
        });
    }

    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            registerSection.classList.add('hidden');
            loginSection.classList.remove('hidden');
        });
    }

    // === 3. VILOYAT VA TUMANLAR BAZASI (Avtomatik ishlashi uchun) ===
    const locationData = {
        "Toshkent": ["Yunusobod", "Chilonzor", "Mirzo Ulug'bek", "Sergeli", "Olmazor", "Yashnobod", "Yakkasaroy", "Uchtepa"],
        "Buxoro": ["Buxoro shahri", "Vobkent", "G'ijduvon", "Jondor", "Kogon", "Olot", "Peshku", "Romitan", "Shofirkon", "Qorovulbozor", "Qorako'l"],
        "Samarqand": ["Samarqand shahri", "Kattaqo'rg'on", "Urgut", "Toyloq", "Oqdaryo", "Ishtixon"],
        "Farg'ona": ["Farg'ona shahri", "Marg'ilon", "Qo'qon", "Rishton", "Beshariq", "Quva"],
        "Andijon": ["Andijon shahri", "Asaka", "Shahrixon", "Xo'jaobod", "Baliqchi"],
        "Namangan": ["Namangan shahri", "Chust", "Kosonsoy", "Mingbuloq", "Uychi"],
        "Navoiy": ["Navoiy shahri", "Zarafshon", "Uchquduq", "Xatirchi", "Qiziltepa"],
        "Qashqadaryo": ["Qarshi", "Shahrisabz", "Kitob", "G'uzor", "Muborak", "Yakkabog'"],
        "Surxondaryo": ["Termiz", "Denov", "Boysun", "Sherobod", "Qumqo'rg'on"],
        "Xorazm": ["Urganch", "Xiva", "Hazorasp", "Xonqa", "Shovot"],
        "Qoraqalpog'iston": ["Nukus", "Mo'ynoq", "Qo'ng'irot", "Beruniy", "Xo'jayli"],
        "Jizzax": ["Jizzax shahri", "Do'stlik", "G'allaorol", "Zomin", "Paxtakor"],
        "Sirdaryo": ["Guliston", "Sirdaryo", "Yangiyer", "Shirin", "Oqoltin"]
    };

    const regRegion = document.getElementById('regRegion');
    const regDistrict = document.getElementById('regDistrict');

    if (regRegion && regDistrict) {
        // Viloyatlarni to'ldirish
        Object.keys(locationData).forEach(region => {
            const option = document.createElement('option');
            option.value = region;
            option.textContent = region;
            regRegion.appendChild(option);
        });

        // Viloyat tanlanganda tumanlarni ochish
        regRegion.addEventListener('change', function() {
            const selectedRegion = this.value;
            regDistrict.innerHTML = '<option value="">Tanlang...</option>'; // Tozalash
            
            if (selectedRegion) {
                regDistrict.disabled = false;
                regDistrict.classList.remove('bg-gray-100', 'cursor-not-allowed', 'text-gray-500');
                regDistrict.classList.add('bg-gray-50', 'text-gray-900');
                
                locationData[selectedRegion].forEach(district => {
                    const option = document.createElement('option');
                    option.value = district;
                    option.textContent = district;
                    regDistrict.appendChild(option);
                });
            } else {
                regDistrict.disabled = true;
                regDistrict.innerHTML = '<option value="">Avval viloyatni tanlang</option>';
                regDistrict.classList.add('bg-gray-100', 'cursor-not-allowed', 'text-gray-500');
                regDistrict.classList.remove('bg-gray-50', 'text-gray-900');
            }
        });
    }

    // === 4. TIZIMGA KIRISH (LOGIN) SO'ROVI ===
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginError.classList.add('hidden');
            
            const btn = document.getElementById('loginBtnSubmit');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kutmoqda...';
            btn.disabled = true;

            // XATOLIK HAL QILINDI: +998 ni ulash!
            const rawPhone = document.getElementById('loginPhone').value.trim();
            const phoneNumber = '+998' + rawPhone; 
            const password = document.getElementById('loginPassword').value;

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phoneNumber, password })
                });
                
                const data = await res.json();

                if (data.success) {
                    // Tokenni brauzerga saqlaymiz
                    localStorage.setItem('token', data.token);
                    // Foydalanuvchi ma'lumotlarini ham saqlab qo'yamiz (ixtiyoriy)
                    if(data.user) localStorage.setItem('user', JSON.stringify(data.user));
                    
                    // Asosiy sahifaga yo'naltiramiz
                    window.location.href = '/'; 
                } else {
                    loginError.textContent = data.message || "Xato login yoki parol!";
                    loginError.classList.remove('hidden');
                }
            } catch (err) {
                loginError.textContent = "Server bilan aloqa yo'q!";
                loginError.classList.remove('hidden');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // === 5. RO'YXATDAN O'TISH (REGISTER) SO'ROVI ===
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            registerError.classList.add('hidden');
            
            const btn = document.getElementById('registerBtnSubmit');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kutmoqda...';
            btn.disabled = true;

            const firstName = document.getElementById('regFirstName').value.trim();
            const lastName = document.getElementById('regLastName').value.trim();
            const region = document.getElementById('regRegion').value;
            const district = document.getElementById('regDistrict').value;
            
            // XATOLIK HAL QILINDI: +998 ni ulash!
            const rawPhone = document.getElementById('regPhone').value.trim();
            const phoneNumber = '+998' + rawPhone; 
            
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;

            // Parollar mosligini oldindan tekshirish
            if(password !== confirmPassword) {
                registerError.textContent = "Parollar bir-biriga mos kelmadi!";
                registerError.classList.remove('hidden');
                btn.innerHTML = originalText;
                btn.disabled = false;
                return;
            }

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        firstName, 
                        lastName, 
                        region, 
                        district, 
                        phoneNumber, 
                        password, 
                        confirmPassword
                    })
                });
                
                const data = await res.json();

                if (data.success) {
                    // Tokenni saqlaymiz va ichkariga kiritib yuboramiz
                    localStorage.setItem('token', data.token);
                    if(data.user) localStorage.setItem('user', JSON.stringify(data.user));
                    
                    window.location.href = '/'; 
                } else {
                    registerError.textContent = data.message || "Ro'yxatdan o'tishda xatolik yuz berdi";
                    registerError.classList.remove('hidden');
                }
            } catch (err) {
                registerError.textContent = "Server bilan aloqa yo'q!";
                registerError.classList.remove('hidden');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
});