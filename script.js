// Sayfa Yükleme İşlemleri
document.addEventListener('DOMContentLoaded', function() {
  // Geliştirilmiş şehir seçici işlevselliği
  setupImprovedCitySelects();
  
  // Admin panel yükleme
  if (window.location.href.includes('admin-panel.html')) {
    console.log("Admin grafikleri yükleniyor...");
    console.log("Sayfa yüklendi");
  }

  // Ürün yönetimi sayfası
  if (window.location.href.includes('admin-products.html')) {
    console.log("Ürünler sayfası yüklendi");
    setupProductManagement();
  }

  // API yönetimi sayfası
  if (window.location.href.includes('admin-api.html')) {
    console.log("API yönetimi sayfası yüklendi");
    setupAPIManagement();
  }

  // Yedekleme sayfası
  if (window.location.href.includes('admin-backup.html')) {
    console.log("Yedekleme sayfası yüklendi");
    setupBackupManagement();
  }

  // Ürün detay sayfası
  if (window.location.href.includes('product-detail.html')) {
    setupProductDetailPage();
  }

  // Ürünler sayfası
  if (window.location.href.includes('products.html')) {
    setupProductFilters();
  }

  // Bayi toplu ürün güncelleme sayfası
  if (window.location.href.includes('my-products-bulk.html')) {
    setupBulkUpdatePage();
  }
});

// Ürün detay sayfası işlevleri
function setupProductDetailPage() {
  // Kaydırmalı galeri işlevselliği
  initProductGallery();

  // Renk seçenekleri tıklama işlevi
  const colorOptions = document.querySelectorAll('.product-color-option');
  if (colorOptions.length > 0) {
    colorOptions.forEach(option => {
      option.addEventListener('click', function() {
        // Hemen UI güncellemesini yap
        colorOptions.forEach(opt => opt.classList.remove('active', 'border-primary'));
        this.classList.add('active', 'border-primary');

        // Seçilen rengi göster (isteğe bağlı)
        const colorName = this.getAttribute('data-color-name');
        console.log(`Seçilen renk: ${colorName}`);
      });
    });
  }

  // Daha fazla satıcı göster butonu
  setupSellerPrices();

  // Sepete ekle butonu işlevselliği
  const addToCartBtn = document.getElementById('addToCartBtn');
  const goToCartBtn = document.getElementById('goToCartBtn');

  if (addToCartBtn && goToCartBtn) {
    addToCartBtn.addEventListener('click', function() {
      // Seçilen renk kontrolü
      let selectedColor = "Seçilmedi";
      const activeColorOption = document.querySelector('.product-color-option.active');
      if (activeColorOption) {
        selectedColor = activeColorOption.getAttribute('data-color-name') || "Seçilmedi";
      }

      // Adet bilgisi
      const quantityInput = document.querySelector('.quantity-input');
      const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

      // Sepete ekleme işlemi - localStorage kullanarak basit bir örnek
      const productId = new URLSearchParams(window.location.search).get('id') || '1';
      const productName = document.querySelector('h2.product-title').textContent;
      const productPrice = document.querySelector('.product-price').textContent.replace('₺', '').trim();
      const productImage = document.querySelector('.swipe-slide.active img').src;

      // Sepeti localStorage'dan al veya yeni oluştur
      let cart = JSON.parse(localStorage.getItem('cart')) || [];

      // Ürünün sepette olup olmadığını kontrol et
      const existingItemIndex = cart.findIndex(item => item.id === productId && item.color === selectedColor);

      if (existingItemIndex > -1) {
        // Ürün zaten sepette, sadece miktarı güncelle
        cart[existingItemIndex].quantity += quantity;
      } else {
        // Yeni ürün ekle
        cart.push({
          id: productId,
          name: productName,
          price: productPrice,
          image: productImage,
          color: selectedColor,
          quantity: quantity
        });
      }

      // Sepeti güncelle
      localStorage.setItem('cart', JSON.stringify(cart));

      // UI'ı güncelle
      addToCartBtn.classList.add('d-none');
      goToCartBtn.classList.remove('d-none');

      // Bildirim göster
      showToast('Ürün sepete eklendi!');

      // Sepet sayısını güncelle
      updateCartCount();
    });
  }
}

// Toast bildirim gösterme
function showToast(message) {
  // Mevcut toast varsa kaldır
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) {
    existingToast.remove();
  }

  // Yeni toast oluştur
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.background = '#28a745';
  toast.style.color = 'white';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '5px';
  toast.style.zIndex = '9999';
  toast.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';

  document.body.appendChild(toast);

  // 3 saniye sonra toast'u kaldır
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s';
    setTimeout(() => {
      toast.remove();
    }, 500);
  }, 3000);
}

// Sepet sayısını güncelleme
function updateCartCount() {
  const cartBadges = document.querySelectorAll('.badge');

  if (cartBadges.length > 0) {
    // Sepeti al
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Toplam ürün sayısını hesapla
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

    // Badgeleri güncelle
    cartBadges.forEach(badge => {
      badge.textContent = totalItems;
      badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
    });
  }
}

// Kaydırmalı galeri fonksiyonu
function initProductGallery() {
  const container = document.querySelector('.swipe-container');
  const wrapper = document.querySelector('.swipe-wrapper');
  const slides = document.querySelectorAll('.swipe-slide');
  const thumbnails = document.querySelectorAll('.product-thumbnail');
  const pagination = document.querySelector('.swipe-pagination');

  if (!container || !wrapper || slides.length === 0) return;

  // Kaydırmalı galeri için değişkenler
  let currentIndex = 0;
  let startX = 0;
  let currentX = 0;
  let isDragging = false;
  let autoHeight = container.offsetWidth * 0.75; // Otomatik yükseklik ayarı

  // Yükseklik ayarı (4:3 oranı)
  container.style.height = `${autoHeight}px`;

  // Sayfalama noktaları oluştur
  slides.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.className = 'swipe-pagination-dot' + (index === 0 ? ' active' : '');
    dot.addEventListener('click', () => goToSlide(index));
    pagination.appendChild(dot);
  });

  // Görüntü önceden yükleme
  slides.forEach(slide => {
    const img = slide.querySelector('img');
    if (img) {
      const preloadImg = new Image();
      preloadImg.src = img.src;
    }
  });

  // Küçük resimlere tıklama işlevi
  thumbnails.forEach(thumbnail => {
    thumbnail.addEventListener('click', function() {
      const index = parseInt(this.getAttribute('data-index') || '0');
      goToSlide(index);
    });
  });

  // Kaydırma işlevi
  function goToSlide(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;

    // Aktif slaytı güncelle
    slides.forEach(slide => slide.classList.remove('active'));
    slides[index].classList.add('active');

    // Küçük resimleri güncelle
    thumbnails.forEach(thumb => thumb.classList.remove('border-primary'));
    thumbnails[index].classList.add('border-primary');

    // Sayfalama noktalarını güncelle
    const dots = pagination.querySelectorAll('.swipe-pagination-dot');
    dots.forEach(dot => dot.classList.remove('active'));
    dots[index].classList.add('active');

    currentIndex = index;
  }

  // Dokunma olaylarını ekle
  container.addEventListener('touchstart', handleTouchStart, { passive: true });
  container.addEventListener('touchmove', handleTouchMove, { passive: true });
  container.addEventListener('touchend', handleTouchEnd);

  // Fare olaylarını ekle (masaüstü için)
  container.addEventListener('mousedown', handleMouseDown);
  container.addEventListener('mousemove', handleMouseMove);
  container.addEventListener('mouseup', handleMouseUp);
  container.addEventListener('mouseleave', handleMouseUp);

  function handleTouchStart(e) {
    startX = e.touches[0].clientX;
    isDragging = true;
  }

  function handleTouchMove(e) {
    if (!isDragging) return;
    currentX = e.touches[0].clientX;
  }

  function handleTouchEnd() {
    if (!isDragging) return;

    const diffX = startX - currentX;
    if (Math.abs(diffX) > 50) { // 50px eşiği ile sürükleme hareketi belirleme
      if (diffX > 0) {
        // Sola kaydırma
        goToSlide(currentIndex + 1);
      } else {
        // Sağa kaydırma
        goToSlide(currentIndex - 1);
      }
    }

    isDragging = false;
  }

  function handleMouseDown(e) {
    startX = e.clientX;
    isDragging = true;
    container.style.cursor = 'grabbing';
  }

  function handleMouseMove(e) {
    if (!isDragging) return;
    currentX = e.clientX;
  }

  function handleMouseUp() {
    if (!isDragging) return;

    const diffX = startX - currentX;
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        goToSlide(currentIndex + 1);
      } else {
        goToSlide(currentIndex - 1);
      }
    }

    isDragging = false;
    container.style.cursor = 'grab';
  }
}

// Satıcı listesi daha fazla gösterme işlevi
function setupSellerPrices() {
  const loadMoreBtn = document.getElementById('loadMoreSellers');
  const sellerCards = document.querySelectorAll('#sellerPricesList .seller-card');

  if (loadMoreBtn && sellerCards.length > 5) {
    // İlk 5 satıcı dışındaki satıcıları gizle
    for (let i = 5; i < sellerCards.length; i++) {
      sellerCards[i].style.display = 'none';
    }

    // Daha fazla göster butonuna tıklama olayı ekle
    loadMoreBtn.addEventListener('click', function() {
      for (let i = 5; i < sellerCards.length; i++) {
        sellerCards[i].style.display = 'block';
      }
      // Butonu gizle
      loadMoreBtn.style.display = 'none';
    });
  }
}

// API Yönetimi İşlevleri
function setupAPIManagement() {
  // API anahtarı oluşturma formu
  const createApiKeyForm = document.querySelector('#createApiKeyModal form');
  if (createApiKeyForm) {
    createApiKeyForm.addEventListener('submit', function(event) {
      event.preventDefault();
      alert('API anahtarı başarıyla oluşturuldu!');
      const modal = bootstrap.Modal.getInstance(document.getElementById('createApiKeyModal'));
      modal.hide();
    });
  }

  // Webhook formu
  const webhookForm = document.querySelector('.card-body form');
  if (webhookForm) {
    webhookForm.addEventListener('submit', function(event) {
      event.preventDefault();
      alert('Webhook ayarları başarıyla kaydedildi!');
    });
  }
}

// Yedekleme Yönetimi İşlevleri
function setupBackupManagement() {
  // Manuel yedekleme formu
  const manualBackupForm = document.querySelector('.card:nth-child(2) form');
  if (manualBackupForm) {
    manualBackupForm.addEventListener('submit', function(event) {
      event.preventDefault();
      alert('Manuel yedekleme işlemi başlatıldı!');
    });
  }

  // Yedekleme ayarları formu
  const backupSettingsForm = document.querySelector('.card:nth-child(3) form');
  if (backupSettingsForm) {
    backupSettingsForm.addEventListener('submit', function(event) {
      event.preventDefault();
      alert('Yedekleme ayarları başarıyla kaydedildi!');
    });
  }

  // Yedekleme işlem butonları
  const backupButtons = document.querySelectorAll('.table .btn-group .btn');
  backupButtons.forEach(button => {
    button.addEventListener('click', function(event) {
      if (this.querySelector('.fa-download')) {
        alert('Yedek indirme işlemi başlatılıyor...');
      } else if (this.querySelector('.fa-sync-alt')) {
        // Geri yükleme modalını göster
        const restoreModal = new bootstrap.Modal(document.getElementById('restoreModal'));
        restoreModal.show();
      } else if (this.querySelector('.fa-trash')) {
        if (confirm('Bu yedeği silmek istediğinizden emin misiniz?')) {
          alert('Yedek başarıyla silindi!');
        }
      }
    });
  });
}

// Ürün verilerini tutacak array
let products = [
  {
    id: "IP13P-001",
    brand: "Apple",
    model: "iPhone 13 Pro",
    specs: "128GB, A15 Bionic",
    stock: 156,
    price: 25000,
    status: "active"
  },
  {
    id: "SS22U-001",
    brand: "Samsung",
    model: "Galaxy S22 Ultra",
    specs: "256GB, Snapdragon 8",
    stock: 89,
    price: 23500,
    status: "active"
  }
  // Diğer ürünler buraya eklenecek
];

// Ürün Filtreleme İşlevleri
function setupProductFilters() {
  const productsList = document.getElementById('productsList');
  const filterForm = document.getElementById('filterForm');
  const sortOrder = document.getElementById('sortOrder');
  const refreshList = document.getElementById('refreshList');

  // Ürünleri tabloya render et
  function renderProducts(filteredProducts) {
    productsList.innerHTML = '';
    filteredProducts.forEach(product => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${product.id}</td>
        <td>${product.brand} ${product.model}</td>
        <td>${product.specs}</td>
        <td>${product.stock}</td>
        <td>₺${product.price.toLocaleString()}</td>
        <td><span class="badge bg-${product.status === 'active' ? 'success' : 'secondary'}">${product.status === 'active' ? 'Aktif' : 'Pasif'}</span></td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" onclick="viewProduct('${product.id}')">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-outline-success" onclick="addToCart('${product.id}')">
              <i class="fas fa-cart-plus"></i>
            </button>
          </div>
        </td>
      `;
      productsList.appendChild(row);
    });
  }

  // Filtreleme fonksiyonu
  function filterProducts() {
    let filtered = [...products];
    
    // Marka filtresi
    const selectedBrands = Array.from(document.querySelectorAll('[data-brand]:checked'))
      .map(cb => cb.dataset.brand);
    if (selectedBrands.length > 0) {
      filtered = filtered.filter(p => selectedBrands.includes(p.brand));
    }

    // Model filtresi
    const modelFilter = document.getElementById('modelFilter').value;
    if (modelFilter) {
      filtered = filtered.filter(p => p.model.toLowerCase().includes(modelFilter.toLowerCase()));
    }

    // Fiyat aralığı filtresi
    const minPrice = document.getElementById('minPrice').value;
    const maxPrice = document.getElementById('maxPrice').value;
    if (minPrice) filtered = filtered.filter(p => p.price >= Number(minPrice));
    if (maxPrice) filtered = filtered.filter(p => p.price <= Number(maxPrice));

    // Stok filtresi
    const minStock = document.getElementById('minStock').value;
    if (minStock) filtered = filtered.filter(p => p.stock >= Number(minStock));

    return filtered;
  }

  // Sıralama fonksiyonu
  function sortProducts(products, sortBy) {
    switch(sortBy) {
      case 'price_asc':
        return products.sort((a, b) => a.price - b.price);
      case 'price_desc':
        return products.sort((a, b) => b.price - a.price);
      case 'stock_asc':
        return products.sort((a, b) => a.stock - b.stock);
      case 'stock_desc':
        return products.sort((a, b) => b.stock - a.stock);
      default:
        return products;
    }
  }

  // Event listeners
  filterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const filtered = filterProducts();
    const sorted = sortProducts(filtered, sortOrder.value);
    renderProducts(sorted);
  });

  sortOrder.addEventListener('change', () => {
    const filtered = filterProducts();
    const sorted = sortProducts(filtered, sortOrder.value);
    renderProducts(sorted);
  });

  refreshList.addEventListener('click', () => {
    // Burada API'den yeni veri çekilebilir
    renderProducts(products);
  });

  // Sayfa yüklendiğinde ürünleri göster
  renderProducts(products);
}

// Ürün detay görüntüleme
function viewProduct(productId) {
  const product = products.find(p => p.id === productId);
  if (product) {
    window.location.href = `product-detail.html?id=${productId}`;
  }
}

// Sepete ekleme
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (product) {
    // Sepet işlemleri burada yapılacak
    alert(`${product.brand} ${product.model} sepete eklendi`);
  }
}
  console.log("Ürün filtreleri ayarlanıyor...");

  // Ürün listesi için basit filtreleme sistemi
  const products = document.querySelectorAll('.product-card');
  const productContainers = document.querySelectorAll('.product-card').map(card => card.closest('.col-md-4'));
  
  let activeFilters = {
    category: [],
    brand: [],
    price: { min: null, max: null },
    city: [],
    storage: []
  };

  // Masaüstü filtre formu
  const filterForm = document.getElementById('filterForm');
  if (filterForm) {
    filterForm.addEventListener('submit', function(event) {
      event.preventDefault();
      applyFilters(filterForm);
    });
  }

  // Mobil filtre formu
  const filterFormMobile = document.getElementById('filterFormMobile');
  if (filterFormMobile) {
    filterFormMobile.addEventListener('submit', function(event) {
      event.preventDefault();
      applyFilters(filterFormMobile);

      // Mobil filtreleme panelini kapat
      const offcanvas = document.getElementById('filterOffcanvas');
      if (offcanvas) {
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvas);
        if (bsOffcanvas) bsOffcanvas.hide();
      }
    });
  }

  // Filtreleri uygula
  function applyFilters(form) {
    console.log("Filtreler uygulanıyor...");
    
    // Kategori filtrelerini güncelle
    activeFilters.category = [];
    form.querySelectorAll('input[id^="cat"]:checked').forEach(checkbox => {
      activeFilters.category.push(checkbox.id.replace(/cat|Mobile/g, '').toLowerCase());
    });

    // Marka filtrelerini güncelle
    activeFilters.brand = [];
    form.querySelectorAll('input[id^="brand"]:checked').forEach(checkbox => {
      activeFilters.brand.push(checkbox.id.replace(/brand|Mobile/g, '').toLowerCase());
    });

    // Fiyat aralığı filtrelerini güncelle
    const minPriceInput = form.querySelector('input[placeholder="Min"]');
    const maxPriceInput = form.querySelector('input[placeholder="Max"]');
    activeFilters.price.min = minPriceInput && minPriceInput.value ? parseInt(minPriceInput.value) : null;
    activeFilters.price.max = maxPriceInput && maxPriceInput.value ? parseInt(maxPriceInput.value) : null;

    // Şehir filtrelerini güncelle (artık select kullanıyoruz)
    activeFilters.city = [];
    const citySelect = form.querySelector('select[id^="citySelect"]');
    if (citySelect) {
      Array.from(citySelect.selectedOptions).forEach(option => {
        if (option.value) activeFilters.city.push(option.value.toLowerCase());
      });
    }

    // Hafıza filtrelerini güncelle
    activeFilters.storage = [];
    form.querySelectorAll('input[id^="storage"]:checked').forEach(checkbox => {
      activeFilters.storage.push(checkbox.id.replace(/storage|Mobile/g, '').toLowerCase());
    });

    console.log("Aktif filtreler:", activeFilters);
    
    // Filtreleme işlemi
    filterProducts();

    // Diğer formu da güncelle (senkronize et)
    syncFilterForms();

    // Bildirim göster
    const activeFilterCount = countActiveFilters();
    if (activeFilterCount > 0) {
      showToast(`${activeFilterCount} filtre uygulandı`);
    } else {
      showToast('Tüm ürünler gösteriliyor');
    }
  }

  // Formlar arasında senkronizasyon
  function syncFilterForms() {
    const desktopForm = document.getElementById('filterForm');
    const mobileForm = document.getElementById('filterFormMobile');

    if (!desktopForm || !mobileForm) return;

    try {
      // Kategori senkronizasyonu
      document.querySelectorAll('#filterForm input[id^="cat"]').forEach(checkbox => {
        const mobileCheckbox = document.getElementById(checkbox.id + 'Mobile');
        if (mobileCheckbox) mobileCheckbox.checked = checkbox.checked;
      });

      document.querySelectorAll('#filterFormMobile input[id^="cat"]').forEach(checkbox => {
        const desktopCheckbox = document.getElementById(checkbox.id.replace('Mobile', ''));
        if (desktopCheckbox) desktopCheckbox.checked = checkbox.checked;
      });

      // Marka senkronizasyonu
      document.querySelectorAll('#filterForm input[id^="brand"]').forEach(checkbox => {
        const mobileCheckbox = document.getElementById(checkbox.id + 'Mobile');
        if (mobileCheckbox) mobileCheckbox.checked = checkbox.checked;
      });

      document.querySelectorAll('#filterFormMobile input[id^="brand"]').forEach(checkbox => {
        const desktopCheckbox = document.getElementById(checkbox.id.replace('Mobile', ''));
        if (desktopCheckbox) desktopCheckbox.checked = checkbox.checked;
      });

      // Hafıza senkronizasyonu
      document.querySelectorAll('#filterForm input[id^="storage"]').forEach(checkbox => {
        const mobileCheckbox = document.getElementById(checkbox.id + 'Mobile');
        if (mobileCheckbox) mobileCheckbox.checked = checkbox.checked;
      });

      document.querySelectorAll('#filterFormMobile input[id^="storage"]').forEach(checkbox => {
        const desktopCheckbox = document.getElementById(checkbox.id.replace('Mobile', ''));
        if (desktopCheckbox) desktopCheckbox.checked = checkbox.checked;
      });

      // Fiyat senkronizasyonu
      const desktopMinPrice = desktopForm.querySelector('input[placeholder="Min"]');
      const desktopMaxPrice = desktopForm.querySelector('input[placeholder="Max"]');
      const mobileMinPrice = mobileForm.querySelector('input[placeholder="Min"]');
      const mobileMaxPrice = mobileForm.querySelector('input[placeholder="Max"]');

      if (desktopMinPrice && mobileMinPrice) {
        mobileMinPrice.value = desktopMinPrice.value;
      }

      if (desktopMaxPrice && mobileMaxPrice) {
        mobileMaxPrice.value = desktopMaxPrice.value;
      }

      // Şehir seçeneklerini senkronize et
      const desktopCitySelect = document.getElementById('citySelect');
      const mobileCitySelect = document.getElementById('citySelectMobile');

      if (desktopCitySelect && mobileCitySelect) {
        // Masaüstünden mobile
        Array.from(desktopCitySelect.options).forEach((option, index) => {
          if (index < mobileCitySelect.options.length) {
            mobileCitySelect.options[index].selected = option.selected;
          }
        });

        // Mobilden masaüstüne
        Array.from(mobileCitySelect.options).forEach((option, index) => {
          if (index < desktopCitySelect.options.length) {
            desktopCitySelect.options[index].selected = option.selected;
          }
        });
      }
    } catch (error) {
      console.error("Formları senkronize ederken hata oluştu:", error);
    }
  }

  // Filtre temizleme butonları için
  const clearFiltersBtn = document.getElementById('clearFilters');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', function() {
      clearAllFilters();
    });
  }

  const clearFiltersMobileBtn = document.getElementById('clearFiltersMobile');
  if (clearFiltersMobileBtn) {
    clearFiltersMobileBtn.addEventListener('click', function() {
      clearAllFilters();
    });
  }

  // Tüm filtreleri temizle
  function clearAllFilters() {
    try {
      // Tüm checkbox'ları temizle
      document.querySelectorAll('#filterForm input[type="checkbox"], #filterFormMobile input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
      });

      // Tüm sayısal giriş alanlarını temizle
      document.querySelectorAll('#filterForm input[type="number"], #filterFormMobile input[type="number"]').forEach(input => {
        input.value = '';
      });

      // Şehir seçimlerini temizle
      const citySelects = document.querySelectorAll('#citySelect, #citySelectMobile');
      citySelects.forEach(select => {
        if (select) {
          Array.from(select.options).forEach(option => {
            option.selected = false;
          });
        }
      });

      // Aktif filtreleri sıfırla
      activeFilters = {
        category: [],
        brand: [],
        price: { min: null, max: null },
        city: [],
        storage: []
      };

      // Tüm ürünleri göster
      document.querySelectorAll('.product-card').forEach(product => {
        const container = product.closest('.col-md-4');
        if (container) container.style.display = 'block';
      });

      showToast('Filtreler temizlendi');
    } catch (error) {
      console.error("Filtreleri temizlerken hata oluştu:", error);
    }
  }

  // Filtre sayısını hesaplama
  function countActiveFilters() {
    let count = 0;
    count += activeFilters.category.length;
    count += activeFilters.brand.length;
    count += activeFilters.city.length;
    count += activeFilters.storage.length;
    if (activeFilters.price.min !== null) count++;
    if (activeFilters.price.max !== null) count++;
    return count;
  }

  // Toast bildirimi gösterme
  function showToast(message) {
    // Mevcut toast varsa kaldır
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
      existingToast.remove();
    }

    // Yeni toast oluştur
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.background = '#333';
    toast.style.color = 'white';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '5px';
    toast.style.zIndex = '9999';
    toast.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';

    document.body.appendChild(toast);

    // 3 saniye sonra toast'u kaldır
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s';
      setTimeout(() => {
        toast.remove();
      }, 500);
    }, 3000);
  }

  // Ürünleri filtreleme
  function filterProducts() {
    try {
      console.log("Ürünler filtreleniyor...");
      const productCards = document.querySelectorAll('.product-card');
      let visibleCount = 0;

      productCards.forEach(product => {
        let shouldShow = true;
        
        // Marka kontrolü
        if (activeFilters.brand.length > 0) {
          const brandElement = product.querySelector('.text-muted.small');
          if (brandElement) {
            const productBrand = brandElement.textContent.split('/')[0].trim().toLowerCase();
            
            if (!activeFilters.brand.some(brand => productBrand.includes(brand.toLowerCase()))) {
              shouldShow = false;
            }
          } else {
            shouldShow = false;
          }
        }

        // Kategori kontrolü
        if (shouldShow && activeFilters.category.length > 0) {
          const badgeElement = product.querySelector('.badge.bg-info');
          const isRefurbished = badgeElement && badgeElement.textContent.includes('YENİLENMİŞ');

          if (activeFilters.category.includes('refurbished') && !isRefurbished) {
            shouldShow = false;
          }

          if (activeFilters.category.includes('smartphones') && !activeFilters.category.includes('refurbished') && isRefurbished) {
            shouldShow = false;
          }
        }

        // Fiyat kontrolü
        if (shouldShow) {
          const priceElement = product.querySelector('.text-success.fw-bold');
          
          if (priceElement) {
            const priceText = priceElement.textContent;
            const price = parseInt(priceText.replace(/[^\d]/g, ''));

            if (activeFilters.price.min !== null && price < activeFilters.price.min) {
              shouldShow = false;
            }

            if (activeFilters.price.max !== null && price > activeFilters.price.max) {
              shouldShow = false;
            }
          }
        }

        // Hafıza kontrolü
        // Not: Bu örnekte ürün kartlarında doğrudan hafıza bilgisi olmadığı için
        // bu filtreleme sadece referans olarak yer alır

        // DOM'u güncelle
        const container = product.closest('.col-md-4');
        if (container) {
          container.style.display = shouldShow ? 'block' : 'none';
          if (shouldShow) visibleCount++;
        }
      });

      // Sonuç sayısını göster
      showToast(`${visibleCount} ürün listeleniyor`);
    } catch (error) {
      console.error("Ürünleri filtrelerken hata oluştu:", error);
    }
  }

  // Sıralama işlevselliği
  const sortSelect = document.getElementById('sortOrder');
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      try {
        const sortValue = this.value;
        const productsList = document.querySelector('.row.g-4');
        
        if (!productsList) {
          console.error("Ürün listesi bulunamadı");
          return;
        }
        
        const productItems = Array.from(productsList.querySelectorAll('.col-md-4'));
        
        if (productItems.length === 0) {
          console.error("Sıralanacak ürün bulunamadı");
          return;
        }

        productItems.sort((a, b) => {
          // Gizli ürünleri sıralamadan dışla
          if (a.style.display === 'none' && b.style.display === 'none') return 0;
          if (a.style.display === 'none') return 1;
          if (b.style.display === 'none') return -1;

          const aPriceElement = a.querySelector('.text-success.fw-bold');
          const bPriceElement = b.querySelector('.text-success.fw-bold');
          
          if (!aPriceElement || !bPriceElement) return 0;
          
          const aPrice = parseInt(aPriceElement.textContent.replace(/[^\d]/g, ''));
          const bPrice = parseInt(bPriceElement.textContent.replace(/[^\d]/g, ''));

          if (sortValue === 'price_low') {
            return aPrice - bPrice;
          } else if (sortValue === 'price_high') {
            return bPrice - aPrice;
          } else if (sortValue === 'newest') {
            // Burada örnek olarak yeni ürünlerin badge'ine göre sıralama
            const aIsNew = a.querySelector('.badge.bg-danger') !== null;
            const bIsNew = b.querySelector('.badge.bg-danger') !== null;
            return bIsNew - aIsNew;
          } else if (sortValue === 'rating') {
            // Puanlara göre sıralama
            const aRating = a.querySelectorAll('.fas.fa-star').length;
            const bRating = b.querySelectorAll('.fas.fa-star').length;
            return bRating - aRating;
          }
          
          // Varsayılan olarak mevcut sırayı koru
          return 0;
        });

        // DOM'da ürün sırasını güncelle
        productItems.forEach(item => {
          productsList.appendChild(item);
        });

        showToast(`Ürünler ${this.options[this.selectedIndex].text} göre sıralandı`);
      } catch (error) {
        console.error("Ürünleri sıralarken hata oluştu:", error);
      }
    });
  }

  // Arama işlevselliği
  const searchButton = document.querySelector('.input-group button');
  if (searchButton) {
    searchButton.addEventListener('click', function() {
      try {
        const searchInput = this.previousElementSibling;
        if (searchInput && searchInput.value.trim() !== '') {
          const searchTerm = searchInput.value.trim().toLowerCase();

          // Basit arama filtresi uygula
          const productCards = document.querySelectorAll('.product-card');
          let matchCount = 0;

          productCards.forEach(product => {
            const productName = product.querySelector('.card-title')?.textContent.toLowerCase() || '';
            const productBrand = product.querySelector('.text-muted.small')?.textContent.toLowerCase() || '';
            const container = product.closest('.col-md-4');

            if ((productName.includes(searchTerm) || productBrand.includes(searchTerm)) && container) {
              container.style.display = 'block';
              matchCount++;
            } else if (container) {
              container.style.display = 'none';
            }
          });

          showToast(`"${searchInput.value}" için ${matchCount} sonuç bulundu`);
        } else {
          // Arama terimi boşsa, tüm ürünleri göster
          document.querySelectorAll('.product-card').forEach(product => {
            const container = product.closest('.col-md-4');
            if (container) container.style.display = 'block';
          });
          
          showToast('Tüm ürünler gösteriliyor');
        }
      } catch (error) {
        console.error("Arama yaparken hata oluştu:", error);
      }
    });

    // Enter tuşu ile arama yapabilme
    const searchInput = searchButton.previousElementSibling;
    if (searchInput) {
      searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          searchButton.click();
        }
      });
    }
  }

  // Ürün renk seçeneklerine tıklama işlevi
  document.querySelectorAll('.color-options .color-circle').forEach(circle => {
    circle.addEventListener('click', function() {
      try {
        const colorStyle = window.getComputedStyle(this);
        const colorName = getColorName(colorStyle.backgroundColor);
        const productCard = this.closest('.product-card');
        
        if (productCard) {
          const productName = productCard.querySelector('.card-title')?.textContent || 'Ürün';
          showToast(`${productName} - ${colorName} rengi seçildi`);
          
          // Seçimi görsel olarak göster
          const siblings = this.parentElement.querySelectorAll('.color-circle');
          siblings.forEach(sib => sib.classList.remove('selected-color'));
          this.classList.add('selected-color');
        }
      } catch (error) {
        console.error("Renk seçiminde hata oluştu:", error);
      }
    });
  });

  // Renk adını CSS renk kodundan alma
  function getColorName(colorCode) {
    // Basit renk eşleme
    const colors = {
      'rgb(0, 0, 0)': 'Siyah',
      'rgb(255, 255, 255)': 'Beyaz',
      'rgb(0, 123, 255)': 'Mavi',
      'rgb(40, 167, 69)': 'Yeşil',
      'rgb(220, 53, 69)': 'Kırmızı',
      'rgb(255, 193, 7)': 'Sarı',
      'rgb(23, 162, 184)': 'Turkuaz'
    };

    return colors[colorCode] || 'Seçilen renk';
  }

  // Sayfalama butonları
  document.querySelectorAll('.pagination .page-link').forEach(link => {
    if (!link.parentElement.classList.contains('disabled') && 
        !link.parentElement.classList.contains('active')) {
      link.addEventListener('click', function(event) {
        event.preventDefault();

        // Sayfa butonlarını güncelle
        document.querySelectorAll('.pagination .page-item').forEach(item => {
          item.classList.remove('active');
        });
        this.parentElement.classList.add('active');

        // Önceki/Sonraki butonlarını güncelle
        const pageItems = document.querySelectorAll('.pagination .page-item');
        const firstPageItem = pageItems[0];
        const lastPageItem = pageItems[pageItems.length - 1];

        if (this.textContent === '1') {
          firstPageItem.classList.add('disabled');
        } else {
          firstPageItem.classList.remove('disabled');
        }

        if (this.textContent === '3') {
          lastPageItem.classList.add('disabled');
        } else {
          lastPageItem.classList.remove('disabled');
        }

        showToast(`Sayfa ${this.textContent} gösteriliyor`);

        // Sayfanın başına kaydır
        window.scrollTo({top: 0, behavior: 'smooth'});
      });
    }
  });

  // Sayfa yüklendiğinde filtreleme işlevini tetikle
  console.log("Filtreler hazır");
}

// Ürün Yönetimi İşlevleri
function setupProductManagement() {
  try {
    // Yeni özellik ekleme butonları için event listener
    const addSpecRowBtn = document.getElementById('addSpecRow');
    if (addSpecRowBtn) {
      addSpecRowBtn.addEventListener('click', function() {
        const specsTable = document.getElementById('specsTable').getElementsByTagName('tbody')[0];
        addNewSpecRow(specsTable);
      });
    }

    const editAddSpecRowBtn = document.getElementById('editAddSpecRow');
    if (editAddSpecRowBtn) {
      editAddSpecRowBtn.addEventListener('click', function() {
        const editSpecsTable = document.getElementById('editSpecsTable').getElementsByTagName('tbody')[0];
        addNewSpecRow(editSpecsTable);
      });
    }

    // Özellik silme butonları için event listener
    setupSpecRowDeleteButtons();

    // Ürün ekleme formu için validation
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
      addProductForm.addEventListener('submit', function(event) {
        event.preventDefault();
        if (!addProductForm.checkValidity()) {
          event.stopPropagation();
          addProductForm.classList.add('was-validated');
        } else {
          alert('Ürün başarıyla eklendi!');
          const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
          modal.hide();
          addProductForm.reset();
          addProductForm.classList.remove('was-validated');
        }
      });
    }

    // Ürün düzenleme formu için validation
    const editProductForm = document.getElementById('editProductForm');
    if (editProductForm) {
      editProductForm.addEventListener('submit', function(event) {
        event.preventDefault();
        if (!editProductForm.checkValidity()) {
          event.stopPropagation();
          editProductForm.classList.add('was-validated');
        } else {
          alert('Ürün başarıyla güncellendi!');
          const modal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
          modal.hide();
        }
      });
    }
  } catch (error) {
    console.log("setupProductFilters fonksiyonu bulunamadı");
  }
}

// Yeni özellik satırı ekleme
function addNewSpecRow(tableBody) {
  const newRow = document.createElement('tr');
  newRow.innerHTML = `
    <td width="30%"><input type="text" class="form-control form-control-sm" placeholder="Özellik"></td>
    <td><input type="text" class="form-control form-control-sm" placeholder="Değer"></td>
    <td width="40px"><button type="button" class="btn btn-sm btn-outline-danger delete-spec-btn"><i class="fas fa-times"></i></button></td>
  `;
  tableBody.appendChild(newRow);

  // Yeni eklenen satırın silme butonuna event listener ekleme
  const deleteBtn = newRow.querySelector('.delete-spec-btn');
  deleteBtn.addEventListener('click', function() {
    newRow.remove();
  });
}

// Tüm özellik silme butonları için event listener ekleme
function setupSpecRowDeleteButtons() {
  document.querySelectorAll('.btn-outline-danger').forEach(button => {
    if (button.closest('table')) {
      button.addEventListener('click', function() {
        const row = this.closest('tr');
        row.remove();
      });
    }
  });
}

// Panoya kopyalama fonksiyonu
function copyToClipboard(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.select();
    document.execCommand('copy');

    // Kopyalama sonrası bildirim
    const button = element.nextElementSibling;
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i>';
    button.classList.remove('btn-outline-primary');
    button.classList.add('btn-success');

    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.classList.remove('btn-success');
      button.classList.add('btn-outline-primary');
    }, 1500);
  }
}

// Sayfa geçişlerini yumuşatlaştırma
document.addEventListener('DOMContentLoaded', function() {
  // Tüm linklere yumuşak geçiş ekle
  document.querySelectorAll('a[href^="http"], a[href^="/"], a[href^="./"], a[href^="../"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      // Dış linkleri ve # içeren linkleri hariç tut
      if (this.getAttribute('href').startsWith('#') || 
          this.getAttribute('target') === '_blank' ||
          this.hasAttribute('download')) {
        return;
      }

      e.preventDefault();
      document.body.classList.add('page-transition');

      setTimeout(() => {
        window.location.href = this.getAttribute('href');
      }, 200);
    });
  });
});

// Bayi toplu ürün güncelleme sayfası
function setupBulkUpdatePage() {
  console.log("Toplu ürün güncelleme sayfası yüklendi");

  // DataTable başlat
  const bulkProductsTable = $('#bulkProductsTable').DataTable({
    paging: true,
    searching: true,
    ordering: true,
    info: true,
    pageLength: 25,
    language: {
      url: '//cdn.datatables.net/plug-ins/1.11.5/i18n/tr.json'
    },
    columnDefs: [
      { orderable: false, targets: [5, 7, 8] } // Yeni fiyat, yeni stok ve durum sütunları sıralanabilir olmasın
    ]
  });

  // Tüm değişiklikleri kaydet
  $('#saveAllChanges').click(function() {
    const updates = [];

    // Tüm satırları dolaş ve değişiklikleri topla
    $('#bulkProductsTable tbody tr').each(function() {
      const row = $(this);
      const productId = row.find('td:first-child').text();
      const newPrice = row.find('.price-input').val();
      const newStock = row.find('.stock-input').val();
      const newStatus = row.find('select').val();

      // Sadece değer girilmiş alanları güncellemeye dahil et
      if (newPrice || newStock || newStatus) {
        updates.push({
          id: productId,
          price: newPrice,
          stock: newStock,
          status: newStatus
        });
      }
    });

    if (updates.length > 0) {
      // Normalde burada bir AJAX isteği olurdu
      console.log("Güncellenecek ürünler:", updates);

      // Başarılı bir güncelleme bildirim
      alert(`${updates.length} ürün başarıyla güncellendi.`);

      // Formu sıfırla
      $('#bulkProductsTable tbody tr').each(function() {
        $(this).find('.price-input').val('');
        $(this).find('.stock-input').val('');
      });
    } else {
      alert("Lütfen en az bir ürün için değişiklik yapın.");
    }
  });

  // Excel'e Aktar butonu
  $('#exportExcel').click(function() {
    alert("Excel dosyası indiriliyor...");
    // Gerçek uygulamada burada Excel dosyası oluşturma ve indirme işlemi olurdu
  });

  // Excel'den İçe Aktar butonu
  $('#importButton').click(function() {
    const fileInput = document.getElementById('excelFile');

    if (fileInput.files.length > 0) {
      alert("Excel dosyası yükleniyor ve işleniyor...");
      // Gerçek uygulamada burada Excel dosyası okuma ve işleme olurdu

      // Modal'ı kapat
      const modal = bootstrap.Modal.getInstance(document.getElementById('importExcelModal'));
      modal.hide();
    } else {
      alert("Lütfen bir dosya seçin.");
    }
  });

  // Filtre formunu işle
  $('#bulkFilterForm').on('submit', function(e) {
    e.preventDefault();
    alert("Filtreler uygulandı!");
    // Gerçek uygulamada burada filtreleme işlemi olurdu
  });

  // Filtreleri temizle
  $('#bulkFilterForm button[type="reset"]').click(function() {
    $('#bulkFilterForm')[0].reset();
    alert("Filtreler temizlendi!");
  });
}

// Geliştirilmiş şehir seçici işlevi
function setupImprovedCitySelects() {
  const citySelects = document.querySelectorAll('#citySelect, #citySelectMobile');
  
  citySelects.forEach(select => {
    if (!select) return;
    
    const selectWrapper = select.closest('.select-wrapper');
    const selectedTagsContainer = select.closest('.mb-3').querySelector('.selected-cities-tags');
    
    if (!selectedTagsContainer) return;
    
    // Seçim değiştiğinde etiketleri güncelle
    select.addEventListener('change', function() {
      updateCityTags(select, selectedTagsContainer);
    });
    
    // Başlangıçta seçili değerler varsa etiketleri göster
    updateCityTags(select, selectedTagsContainer);
  });
}

// Şehir etiketlerini güncelleme
function updateCityTags(select, container) {
  container.innerHTML = '';
  
  Array.from(select.selectedOptions).forEach(option => {
    const tag = document.createElement('span');
    tag.className = 'city-tag';
    tag.innerHTML = `${option.text} <span class="remove-tag" data-value="${option.value}"><i class="fas fa-times"></i></span>`;
    
    // Etiket silme işlevi
    tag.querySelector('.remove-tag').addEventListener('click', function() {
      const value = this.getAttribute('data-value');
      option.selected = false;
      
      // Değişiklik olayını tetikle
      const event = new Event('change');
      select.dispatchEvent(event);
    });
    
    container.appendChild(tag);
  });
}

// Mobil scroll iyileştirmeleri
document.addEventListener('DOMContentLoaded', function() {
  // Mobil cihazlarda smooth scroll
  document.documentElement.style.scrollBehavior = 'smooth';

  // Kaydırılabilir bölgelerin yumuşak hareketini etkinleştir
  const scrollableElements = document.querySelectorAll('.swipe-container, .table-responsive, .filter-sidebar, .navbar-collapse');
  scrollableElements.forEach(element => {
    element.style.scrollBehavior = 'smooth';

    // Kaydırılabilir yatay alanlar için dokunma desteği iyileştirmeleri
    if (element.classList.contains('table-responsive')) {
      let isDown = false;
      let startX;
      let scrollLeft;

      element.addEventListener('touchstart', (e) => {
        isDown = true;
        startX = e.touches[0].pageX - element.offsetLeft;
        scrollLeft = element.scrollLeft;
      }, { passive: true });

      element.addEventListener('touchend', () => {
        isDown = false;
      });

      element.addEventListener('touchcancel', () => {
        isDown = false;
      });

      element.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.touches[0].pageX - element.offsetLeft;
        const walk = (x - startX) * 2; // Kaydırma hızını ayarla
        element.scrollLeft = scrollLeft - walk;
      });
    }
  });
});