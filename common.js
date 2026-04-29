// common.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, updateDoc, query, where, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// -------------------- إعدادات Firebase --------------------
const firebaseConfig = {
  apiKey: "AIzaSyAP24RMusfZxGsrKh3k3a_hilJspzskU8c",
  authDomain: "bono-menu.firebaseapp.com",
  projectId: "bono-menu",
  storageBucket: "bono-menu.firebasestorage.app",
  messagingSenderId: "997456171569",
  appId: "1:997456171569:web:32360fef6e68ed346cfb10",
  measurementId: "G-D680567XYM"
};

// -------------------- إعدادات Cloudinary --------------------
const CLOUDINARY_CLOUD_NAME = "dpaiz3gv5";
const CLOUDINARY_UPLOAD_PRESET = "bono_uploads";

// -------------------- تهيئة Firebase --------------------
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// أسماء المجموعات
const CATEGORIES_COLL = "categories";
const ITEMS_COLL = "menu_items";
const SETTINGS_COLL = "settings";

// UID الخاص بالمدير (للتحقق من الكتابة)
const ADMIN_UID = "N5eoY38WByPKKBFeXBiEjW54TZg1";

// -------------------- دوال المصادقة --------------------
export function signInAdmin(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}
export function signOutAdmin() {
  return signOut(auth);
}
export function onAdminStateChanged(callback) {
  return onAuthStateChanged(auth, callback);
}
export function isAdminMode() {
  return auth.currentUser && auth.currentUser.uid === ADMIN_UID;
}
export function getCurrentUser() {
  return auth.currentUser;
}

// -------------------- دوال الفئات --------------------
export async function getAllCategories() {
  const snapshot = await getDocs(collection(db, CATEGORIES_COLL));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
export async function addCategory(category) {
  const newId = `cat_${Date.now()}`;
  await setDoc(doc(db, CATEGORIES_COLL, newId), { nameAr: category.nameAr });
  return newId;
}
export async function updateCategory(categoryId, newName) {
  await updateDoc(doc(db, CATEGORIES_COLL, categoryId), { nameAr: newName });
}
export async function deleteCategory(categoryId) {
  // حذف الأصناف المرتبطة بهذه الفئة
  const q = query(collection(db, ITEMS_COLL), where("categoryId", "==", categoryId));
  const snapshot = await getDocs(q);
  for (const itemDoc of snapshot.docs) {
    await deleteDoc(doc(db, ITEMS_COLL, itemDoc.id));
  }
  await deleteDoc(doc(db, CATEGORIES_COLL, categoryId));
}

// -------------------- دوال الأصناف --------------------
export async function getAllMenuItems() {
  const snapshot = await getDocs(collection(db, ITEMS_COLL));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
export async function addMenuItem(item) {
  const newId = `item_${Date.now()}`;
  await setDoc(doc(db, ITEMS_COLL, newId), {
    nameAr: item.nameAr,
    descAr: item.descAr || '',
    price: item.price,
    categoryId: item.categoryId,
    imageUrl: item.imageUrl || null
  });
  return newId;
}
export async function updateMenuItem(itemId, updatedData) {
  await updateDoc(doc(db, ITEMS_COLL, itemId), updatedData);
}
export async function deleteMenuItem(itemId) {
  await deleteDoc(doc(db, ITEMS_COLL, itemId));
}

// -------------------- رفع الصور إلى Cloudinary --------------------
export async function uploadImageToCloudinary(file) {
  if (!file) return null;
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  const response = await fetch(url, { method: 'POST', body: formData });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`فشل رفع الصورة: ${err}`);
  }
  const data = await response.json();
  return data.secure_url;
}

// -------------------- إعدادات الموقع والخلفيات --------------------
export async function getBackgroundSettings() {
  const docRef = doc(db, SETTINGS_COLL, "appearance");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    const defaultSettings = { heroImage: null, defaultItemImage: null, siteTitle: "بافلو بونو", siteSubtitle: "طعم يستحق التجربة 🔥" };
    await setDoc(docRef, defaultSettings);
    return defaultSettings;
  }
}
export async function saveBackgroundSettings(settings) {
  const docRef = doc(db, SETTINGS_COLL, "appearance");
  await setDoc(docRef, settings, { merge: true });
}
export async function getDefaultItemImage() {
  const settings = await getBackgroundSettings();
  return settings.defaultItemImage || "https://placehold.co/110x110?text=Food";
}

// -------------------- السلة (محلياً) --------------------
export function getCart() {
  return JSON.parse(localStorage.getItem('bono_cart') || '[]');
}
export function saveCart(cart) {
  localStorage.setItem('bono_cart', JSON.stringify(cart));
}
export function addToCart(productId) {
  const cart = getCart();
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
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) item.quantity = newQty;
  saveCart(cart);
}
export function clearCart() {
  saveCart([]);
}
export async function getCartWithDetails() {
  const cart = getCart();
  const items = await getAllMenuItems();
  return cart.map(c => {
    const product = items.find(p => p.id === c.id);
    return { id: c.id, quantity: c.quantity, name: product?.nameAr || 'غير معروف', price: product?.price || 0 };
  }).filter(i => i.price > 0);
}

// -------------------- رقم الطلب المتزايد --------------------
export async function getNextOrderNumber() {
  const counterRef = doc(db, SETTINGS_COLL, "orderCounter");
  const counterSnap = await getDoc(counterRef);
  let current = 1000;
  if (counterSnap.exists()) current = counterSnap.data().value;
  const newValue = current + 1;
  await setDoc(counterRef, { value: newValue });
  return newValue;
}

// -------------------- تهيئة أولية (إنشاء فئات وأصناف افتراضية إذا كانت فارغة) --------------------
export async function initData() {
  const categoriesSnapshot = await getDocs(collection(db, CATEGORIES_COLL));
  if (categoriesSnapshot.empty) {
    const defaultCats = [
      { id: "beef", nameAr: "🍔 برجر لحم" },
      { id: "chicken", nameAr: "🍗 برجر دجاج" },
      { id: "fries", nameAr: "🍟 مقليات" },
      { id: "sauces", nameAr: "🥣 صوصات" },
      { id: "combos", nameAr: "🍔🍟 وجبات كاملة" }
    ];
    for (const cat of defaultCats) {
      await setDoc(doc(db, CATEGORIES_COLL, cat.id), { nameAr: cat.nameAr });
    }
  }
  const itemsSnapshot = await getDocs(collection(db, ITEMS_COLL));
  if (itemsSnapshot.empty) {
    const defaultItems = [
      { id: "b1", categoryId: "beef", nameAr: "بافلو كلاسيك", descAr: "لحم بقري مشوي مع صوص بافلو", price: 45, imageUrl: null },
      { id: "b2", categoryId: "beef", nameAr: "برجر تكساس", descAr: "جبنة ببر جاك، هلابينو حار", price: 55, imageUrl: null },
      { id: "c1", categoryId: "chicken", nameAr: "تشيكن كرسبي", descAr: "دجاج مقرمش بصوص الثوم", price: 40, imageUrl: null },
      { id: "f1", categoryId: "fries", nameAr: "بطاطس بالجبنة", descAr: "بطاطس مقلية مع صوص جبنة", price: 25, imageUrl: null }
    ];
    for (const item of defaultItems) {
      await setDoc(doc(db, ITEMS_COLL, item.id), item);
    }
  }
}
