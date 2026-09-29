# สวีทไอติม

ระบบสั่งอาหารร้านสวีทไอติม — Next.js (App Router, JavaScript) + Supabase, deploy บน Vercel

## เริ่มต้นใช้งาน

```bash
npm install
cp .env.example .env.local   # แล้วใส่ค่า Supabase จริง
npm run dev
```

เปิด http://localhost:3000

## Deploy บน Vercel

1. Push โค้ดขึ้น GitHub แล้ว Import โปรเจกต์ใน Vercel
2. ตั้งค่า Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

## หมายเหตุสำคัญ

โปรเจกต์ใช้ Next.js เวอร์ชันล่าสุด — `params` ของ Dynamic Route เป็น **Promise**
ต้อง unwrap ด้วย `use()` จาก `react` (Client Component) หรือ `await` (Server Component)

รายละเอียดตารางฐานข้อมูลและกฎของโปรเจกต์ดูใน [CLAUDE.md](./CLAUDE.md)
