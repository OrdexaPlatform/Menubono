// ---------- البيانات والمفاتيح ----------
const STORAGE_KEYS = {
  MENU_ITEMS: 'bono_menu_items',
  CATEGORIES: 'bono_categories',
  CART: 'bono_cart',
  BACKGROUNDS: 'bono_backgrounds',
  NEXT_ORDER: 'bono_next_order'
};

// الفئات الافتراضية (يمكن تعديلها لاحقاً من الكود)
const DEFAULT_CATEGORIES = [
  { id: "beef", nameAr: "🍔 برجر لحم بقري" },
  { id: "chicken", nameAr: "🍗 برجر دجاج" },
  { id: "fries", nameAr: "🍟 مقليات" },
  { id: "sauces", nameAr: "🥣 صوصات" },
  { id: "combos", nameAr: "🍔🍟 وجبات كاملة" }
];

// الأصناف الافتراضية (إن لم تكن موجودة)
const DEFAULT_ITEMS = [
  { id: "b1", categoryId: "beef", nameAr: "بافلو كلاسيك", descAr: "لحم بقري مشوي، صوص بافلو", price: 35, imageSrc: null },
  { id: "b2", categoryId: "beef", nameAr: "برجر تكساس الحار", descAr: "هلابينو، جبنة ببر جاك", price: 45, imageSrc: null },
  { id: "c1", categoryId: "chicken", nameAr: "تشيكن مشروم", descAr: "دجاج متبل ومشروم", price: 40, imageSrc: null },
  { id: "c2", categoryId: "chicken", nameAr: "دجاج حار جداً", descAr: "دجاج مقرمش حار", price: 50, imageSrc: null },
  { id: "f1", categoryId: "fries", nameAr: "بطاطس عادية", descAr: "بطاطس ذهبية", price: 20, imageSrc: null },
  { id: "sau1", categoryId: "sauces", nameAr: "صوص بافلو", descAr: "صوص بافلو الأصلي", price: 15, imageSrc: null },
  { id: "combo1", categoryId: "combos", nameAr: "وجبة كلاسيك", descAr: "ساندوتش + بطاطس + مشروب", price: 85, imageSrc: null }
];

// ---------- دوال التهيئة ----------
function initData() {
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MENU_ITEMS)) {
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(DEFAULT_ITEMS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CART)) {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BACKGROUNDS)) {
    localStorage.setItem(STORAGE_KEYS.BACKGROUNDS, JSON.stringify({
      heroImage: null,
      defaultItemImage: null,
      siteTitle: 'بافلو بونو',
      siteSubtitle: 'أشهى المأكولات'
    }));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NEXT_ORDER)) {
    localStorage.setItem(STORAGE_KEYS.NEXT_ORDER, '1000');
  }
}

function getAllCategories() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES)) || [];
}

function getAllMenuItems() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.MENU_ITEMS)) || [];
}

function saveMenuItems(items) {
  localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(items));
}

// إضافة / تعديل / حذف صنف
function addNewMenuItem(itemData) {
  const items = getAllMenuItems();
  const newId = Date.now().toString() + Math.random().toString(36);
  const newItem = { id: newId, ...itemData };
  items.push(newItem);
  saveMenuItems(items);
}

function updateMenuItem(id, updatedData) {
  let items = getAllMenuItems();
  const index = items.findIndex(i => i.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updatedData };
    saveMenuItems(items);
  }
}

function deleteMenuItem(id) {
  let items = getAllMenuItems();
  items = items.filter(i => i.id !== id);
  saveMenuItems(items);
}

// ------ السلة ------
function getCart() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CART)) || [];
}
function saveCart(cart) {
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
}
function addToCart(productId) {
  let cart = getCart();
  const existing = cart.find(i => i.id === productId);
  if (existing) existing.quantity++;
  else cart.push({ id: productId, quantity: 1 });
  saveCart(cart);
}
function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(i => i.id !== productId);
  saveCart(cart);
}
function updateCartItemQuantity(productId, newQty) {
  let cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) item.quantity = newQty;
  saveCart(cart);
}
function clearCart() {
  saveCart([]);
}
// دالة لجلب تفاصيل السلة (الاسم والسعر من الأصناف)
function getCartWithDetails() {
  const cart = getCart();
  const items = getAllMenuItems();
  return cart.map(c => {
    const product = items.find(p => p.id === c.id);
    return {
      id: c.id,
      quantity: c.quantity,
      name: product ? product.nameAr : 'غير معروف',
      price: product ? product.price : 0
    };
  }).filter(i => i.price > 0);
}

// ------ إعدادات الخلفيات ------
function getBackgroundSettings() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.BACKGROUNDS)) || {};
}
function saveBackgroundSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.BACKGROUNDS, JSON.stringify(settings));
}
function getDefaultItemImage() {
  const bg = getBackgroundSettings();
  return bg.defaultItemImage || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23333"/%3E%3Ctext x="50" y="55" text-anchor="middle" fill="%23aaa"%3E🍔%3C/text%3E%3C/svg%3E';
}

// ------ رقم الطلب المتزايد ------
function getNextOrderNumber() {
  let next = parseInt(localStorage.getItem(STORAGE_KEYS.NEXT_ORDER)) || 1000;
  localStorage.setItem(STORAGE_KEYS.NEXT_ORDER, (next + 1).toString());
  return next;
}

// Toast بسيط (اختياري)
function showToast(msg) {
  let toast = document.getElementById('dynamicToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'dynamicToast';
    toast.style.position = 'fixed';
    toast.style.bottom = '80px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = '#f9b23f';
    toast.style.color = '#111';
    toast.style.padding = '8px 20px';
    toast.style.borderRadius = '50px';
    toast.style.zIndex = '999';
    toast.style.fontWeight = 'bold';
    document.body.appendChild(toast);
  }
  toast.innerText = msg;
  toast.style.opacity = '1';
  setTimeout(() => toast.style.opacity = '0', 2000);
}
// كل التوابع السابقة موجودة، سأضع فقط ما قد يكون مختلفاً أو ناقصاً
// ... (نفس الكود السابق لكن أضف دالة getCartWithDetails كما في المثال التالي)

function getCartWithDetails() {
  const cart = getCart();
  const items = getAllMenuItems();
  return cart.map(c => {
    const product = items.find(p => p.id === c.id);
    return {
      id: c.id,
      quantity: c.quantity,
      name: product ? product.nameAr : 'غير معروف',
      price: product ? product.price : 0
    };
  }).filter(i => i.price > 0);
}

// تأكد من وجود showToast محسنة
window.showToast = function(msg) {
  let toast = document.getElementById('dynamicToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'dynamicToast';
    document.body.appendChild(toast);
  }
  toast.innerText = msg;
  toast.style.opacity = '1';
  setTimeout(() => toast.style.opacity = '0', 2000);
};
