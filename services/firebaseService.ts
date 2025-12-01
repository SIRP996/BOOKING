import { db } from "../firebaseConfig";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  where
} from "firebase/firestore";
import { Booking, KOLProfile, Campaign } from "../types";

// Collections References
const bookingsRef = collection(db, "bookings");
const kolsRef = collection(db, "kols");
const campaignsRef = collection(db, "campaigns");

// --- BOOKINGS ---
export const getBookings = async (userId: string): Promise<Booking[]> => {
  const q = query(bookingsRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Booking));
};

export const addBooking = async (booking: Booking): Promise<Booking> => {
  const { id, ...data } = booking; 
  const docRef = await addDoc(bookingsRef, data);
  return { ...booking, id: docRef.id };
};

export const updateBooking = async (booking: Booking): Promise<void> => {
  const docRef = doc(db, "bookings", booking.id);
  const { id, ...data } = booking;
  await updateDoc(docRef, data);
};

export const deleteBooking = async (id: string): Promise<void> => {
  const docRef = doc(db, "bookings", id);
  await deleteDoc(docRef);
};

// --- KOLS ---
export const getKOLs = async (userId: string): Promise<KOLProfile[]> => {
  const q = query(kolsRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as KOLProfile));
};

export const addKOL = async (kol: KOLProfile): Promise<KOLProfile> => {
  const { id, ...data } = kol;
  const docRef = await addDoc(kolsRef, data);
  return { ...kol, id: docRef.id };
};

export const updateKOL = async (kol: KOLProfile): Promise<void> => {
  const docRef = doc(db, "kols", kol.id);
  const { id, ...data } = kol;
  await updateDoc(docRef, data);
};

export const deleteKOL = async (id: string): Promise<void> => {
  const docRef = doc(db, "kols", id);
  await deleteDoc(docRef);
};

// --- CAMPAIGNS ---
export const getCampaigns = async (userId: string): Promise<Campaign[]> => {
  const q = query(campaignsRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Campaign));
};

export const addCampaign = async (campaign: Campaign): Promise<Campaign> => {
  const { id, ...data } = campaign;
  const docRef = await addDoc(campaignsRef, data);
  return { ...campaign, id: docRef.id };
};

export const updateCampaign = async (campaign: Campaign): Promise<void> => {
  const docRef = doc(db, "campaigns", campaign.id);
  const { id, ...data } = campaign;
  await updateDoc(docRef, data);
};

export const deleteCampaign = async (id: string): Promise<void> => {
  const docRef = doc(db, "campaigns", id);
  await deleteDoc(docRef);
};