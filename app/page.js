import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="home">
      <h1>สวีทไอติม</h1>
      <p>ระบบสั่งอาหารร้านสวีทไอติม — หน้านี้ใช้ทดสอบว่า deploy สำเร็จ</p>
      <nav>
        <Link className="btn" href="/generate-qr">
          สร้าง QR โต๊ะ
        </Link>
        <Link className="btn" href="/kitchen">
          หน้าครัว
        </Link>
      </nav>
    </main>
  );
}
