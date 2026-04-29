import { db, collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from './firebase-init.js';

// ------------------- Cloudinary -------------------
const CLOUDINARY_CLOUD_NAME = 'dpaiz3gv5';
const CLOUDINARY_UPLOAD_PRESET = 'bono_uploads';

export async function uploadImageToCloudinary(file) {
  if (!file) return null;
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  const response = await fetch(url, { method: 'POST', body: formData });
  if (!response.ok) throw new Error('فشل رفع الصورة');
  const data = await response.json();
  return data.secure_url;
}

// ------------------- الفئات -------------------
export async function getAllCategories() {
  const snapshot = await getDocs(collection(db, 'categories'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
export async function addCategory(category) {
  const id = `cat_${Date.now()}`;
  await setDoc(doc(db, 'categories', id), { nameAr: category.nameAr, createdAt: new Date() });
  return id;
}
export async function updateCategory(id, newName) {
  await updateDoc(doc(db, 'categories', id), { nameAr: newName });
}
export async function deleteCategory(id) {
  const items = await getAllMenuItems();
  const toDelete = items.filter(i => i.categoryId === id);
  for (const item of toDelete) await deleteMenuItem(item.id);
  await deleteDoc(doc(db, 'categories', id));
}

// ------------------- الأصناف -------------------
export async function getAllMenuItems() {
  const snapshot = await getDocs(collection(db, 'menu_items'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
export async function addMenuItem(item) {
  const id = `item_${Date.now()}`;
  await setDoc(doc(db, 'menu_items', id), { ...item, createdAt: new Date() });
  return id;
}
export async function updateMenuItem(id, data) {
  await updateDoc(doc(db, 'menu_items', id), data);
}
export async function deleteMenuItem(id) {
  await deleteDoc(doc(db, 'menu_items', id));
}

// ------------------- إعدادات الموقع (خلفيات) -------------------
export async function getBackgroundSettings() {
  const snapshot = await getDocs(collection(db, 'settings'));
  const docSnap = snapshot.docs.find(d => d.id === 'appearance');
  if (docSnap) return docSnap.data();
  const defaults = { heroImage: '', defaultItemImage: '', siteTitle: 'بافلو بونو', siteSubtitle: 'طعم يستحق التجربة' };
  await setDoc(doc(db, 'settings', 'appearance'), defaults);
  return defaults;
}
export async function saveBackgroundSettings(settings) {
  await setDoc(doc(db, 'settings', 'appearance'), settings, { merge: true });
}

// ------------------- السلة (LocalStorage) -------------------
export function getCart() {
  return JSON.parse(localStorage.getItem('bono_cart') || '[]');
}
export function saveCart(cart) {
  localStorage.setItem('bono_cart', JSON.stringify(cart));
}
export function addToCart(productId) {
  let cart = getCart();
  const existing = cart.find(i => i.id === productId);
  if (existing) existing.quantity++;
  else cart.push({ id: productId, quantity: 1 });
  saveCart(cart);
}
export function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(i => i.id !== productId);
  saveCart(cart);
}
export function updateCartItemQuantity(productId, newQty) {
  let cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) item.quantity = newQty;
  saveCart(cart);
}
export function clearCart() { saveCart([]); }
export async function getCartWithDetails() {
  const cart = getCart();
  const items = await getAllMenuItems();
  return cart.map(c => {
    const prod = items.find(p => p.id === c.id);
    return { id: c.id, quantity: c.quantity, name: prod?.nameAr || 'غير معروف', price: prod?.price || 0 };
  }).filter(i => i.price > 0);
}

// ------------------- رقم الطلب -------------------
export async function getNextOrderNumber() {
  const snapshot = await getDocs(collection(db, 'settings'));
  const counterDoc = snapshot.docs.find(d => d.id === 'orderCounter');
  let current = 1000;
  if (counterDoc) current = counterDoc.data().value;
  const newVal = current + 1;
  await setDoc(doc(db, 'settings', 'orderCounter'), { value: newVal });
  return newVal;
}

// ------------------- مساعدات -------------------
export function showToast(msg) {
  let toast = document.getElementById('dynamicToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'dynamicToast';
    toast.style.cssText = 'position:fixed; bottom:80px; left:50%; transform:translateX(-50%); background:#f5b642; color:#000; padding:8px 20px; border-radius:50px; z-index:999; opacity:0; transition:0.2s; font-weight:bold';
    document.body.appendChild(toast);
  }
  toast.innerText = msg;
  toast.style.opacity = '1';
  setTimeout(() => toast.style.opacity = '0', 2000);
}
