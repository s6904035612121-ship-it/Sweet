# สวีทไอติม — ระบบสั่งอาหาร

Next.js (App Router, **JavaScript ไม่ใช่ TypeScript**) deploy บน Vercel, ฐานข้อมูลบน Supabase

## Next.js เวอร์ชันล่าสุด — สำคัญมาก

โปรเจกต์นี้ใช้ Next.js เวอร์ชันล่าสุด ซึ่ง `params` (และ `searchParams`) ของ Dynamic Route
**เป็น Promise** ต้อง unwrap ก่อนใช้งานเสมอ

Client Component — unwrap ด้วย `use()` จาก `react`:

```js
'use client';
import { use } from 'react';

export default function Page({ params }) {
  const { id } = use(params);
  return <div>{id}</div>;
}
```

Server Component — ใช้ `async/await`:

```js
export default async function Page({ params }) {
  const { id } = await params;
  return <div>{id}</div>;
}
```

ห้ามอ่าน `params.id` ตรง ๆ

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

ใช้ผ่าน `lib/supabaseClient.js` (`import { supabase } from '@/lib/supabaseClient'` หรือ path สัมพัทธ์)
ห้าม commit `.env.local`

## โครงสร้างตารางฐานข้อมูล (มีอยู่แล้วใน Supabase — ไม่ต้องสร้างใหม่)

| ตาราง | คอลัมน์ |
|---|---|
| `sessions` | `id`, `table_number`, `adult_count`, `child_count`, `status`, `created_at` |
| `menu_categories` | `id`, `name`, `sort_order` |
| `menu_items` | `id`, `category_id`, `name` |
| `orders` | `id`, `session_id`, `table_number`, `items` (jsonb), `status`, `created_at` |

ใช้ชื่อตารางและคอลัมน์ตามนี้เท่านั้น ห้ามเดาคอลัมน์เพิ่ม

## หน้าที่วางแผนไว้

- `/` หน้าแรก (มีแล้ว)
- `/generate-qr` สร้าง QR สำหรับโต๊ะ
- `/kitchen` หน้าครัวดูออเดอร์
