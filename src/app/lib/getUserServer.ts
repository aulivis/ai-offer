import { cookies } from 'next/headers';
import { supabaseServer } from './supabaseServer';

export async function getUserServer() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser(); // service role-lal csak akkor működik, ha Bearer-t küldesz. Ezt API route-okban megoldjuk fejléccel.
  return user;
}
