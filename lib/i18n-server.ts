import { cookies } from 'next/headers';
import { LANG_COOKIE, makeT, parseLang } from './i18n';

// For Server Components and Route Handlers.
export async function getLang() {
  const cookieStore = await cookies();
  return parseLang(cookieStore.get(LANG_COOKIE)?.value);
}

export async function getT() {
  return makeT(await getLang());
}
