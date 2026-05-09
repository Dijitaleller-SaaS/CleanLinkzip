import { pool, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@workspace/db/schema";
import bcrypt from "bcryptjs";

const db = drizzle(pool, { schema });

const SEED_VENDORS = [
  {
    name: "Yıldız Temizlik",
    email: "yildiz@cleanlink.demo",
    phone: "0532 111 22 33",
    joinedAt: new Date(1711670400000),
    isSponsor: true,
    isSubscribed: true,
    isPublished: true,
    paket: "elite",
    bio: "2015 yılından bu yana İstanbul'un Anadolu yakasında profesyonel ev, ofis ve inşaat sonrası temizlik hizmeti sunuyoruz. ISO 9001 sertifikalı ekibimiz, çevre dostu temizlik ürünleri ve buharlı temizleme sistemleriyle yüzlerce aileye güvenilir hizmet verdi.",
    regions: ["Kadıköy", "Ataşehir", "Üsküdar"],
    prices: {
      ev1p1: 1100, ev2p1: 1500, ev3p1: 2100, ofis: 800,
      koltukL: 600, koltuk3lu: 450, koltuk2li: 300, koltukTekli: 180,
      aracKoltuk: 400, sandalye: 80,
      haliStandart: 120, haliShaggy: 150, haliIpek: 300,
      haliBambuOrijinal: 300, haliBambuSentetik: 180,
      haliYun: 200, haliKilim: 150, haliMakine: 140,
      yatak: 750, yorgan2kisi: 750, yorgan1kisi: 450, battaniye: 450,
    },
  },
  {
    name: "Usta Yıkama",
    email: "usta@cleanlink.demo",
    phone: "0533 444 55 66",
    joinedAt: new Date(1711756800000),
    isSponsor: true,
    isSubscribed: true,
    isPublished: true,
    paket: "elite",
    bio: "Buharlı yıkama teknolojisiyle koltuk, halı ve araç içi temizliğinde İstanbul'un lider firmasıyız. Aynı gün hizmet garantisi ve hızlı kuruma teknolojisiyle konforunuzu bozmadan temizlik yapıyoruz.",
    regions: ["Beşiktaş", "Şişli", "Beyoğlu"],
    prices: {
      ev1p1: 1100, ev2p1: 1500, ev3p1: 2100, ofis: 800,
      koltukL: 600, koltuk3lu: 450, koltuk2li: 300, koltukTekli: 180,
      aracKoltuk: 400, sandalye: 80,
      haliStandart: 60, haliShaggy: 150, haliIpek: 300,
      haliBambuOrijinal: 300, haliBambuSentetik: 180,
      haliYun: 200, haliKilim: 150, haliMakine: 140,
      yatak: 750, yorgan2kisi: 750, yorgan1kisi: 450, battaniye: 450,
    },
  },
  {
    name: "Parlak Evler",
    email: "parlak@cleanlink.demo",
    phone: "0544 777 88 99",
    joinedAt: new Date(1711843200000),
    isSponsor: true,
    isSubscribed: true,
    isPublished: true,
    paket: "standart",
    bio: "Bütçe dostu fiyatlarla standart altına düşmeden temizlik yapan genç ve dinamik ekibiz. Aylık abonelik paketlerimizle düzenli müşterilerimize %20 indirim sunuyoruz.",
    regions: ["Şişli", "Bakırköy", "Bahçelievler"],
    prices: {
      ev1p1: 900, ev2p1: 1100, ev3p1: 1600, ofis: 650,
      koltukL: 550, koltuk3lu: 400, koltuk2li: 270, koltukTekli: 160,
      aracKoltuk: 360, sandalye: 70,
      haliStandart: 100, haliShaggy: 130, haliIpek: 280,
      haliBambuOrijinal: 280, haliBambuSentetik: 160,
      haliYun: 180, haliKilim: 130, haliMakine: 120,
      yatak: 680, yorgan2kisi: 680, yorgan1kisi: 400, battaniye: 400,
    },
  },
  {
    name: "Kristal Temizlik",
    email: "kristal@cleanlink.demo",
    phone: "0541 234 56 78",
    joinedAt: new Date(1711929600000),
    isSponsor: true,
    isSubscribed: true,
    isPublished: true,
    paket: "elite",
    bio: "Halı, yatak ve yorgan yıkamada Anadolu yakasının güvenilir ismi. Endüstriyel makinelerimiz ve organik ürünlerimizle evinizin tekstillerini yeniler gibi teslim ediyoruz.",
    regions: ["Ataşehir", "Kadıköy", "Maltepe"],
    prices: {
      ev1p1: 1100, ev2p1: 1500, ev3p1: 2100, ofis: 800,
      koltukL: 600, koltuk3lu: 450, koltuk2li: 300, koltukTekli: 180,
      aracKoltuk: 400, sandalye: 80,
      haliStandart: 120, haliShaggy: 150, haliIpek: 300,
      haliBambuOrijinal: 300, haliBambuSentetik: 180,
      haliYun: 200, haliKilim: 150, haliMakine: 140,
      yatak: 750, yorgan2kisi: 750, yorgan1kisi: 450, battaniye: 450,
    },
  },
  {
    name: "Anadolu Yıkama",
    email: "anadolu@cleanlink.demo",
    phone: "0542 876 54 32",
    joinedAt: new Date(1712016000000),
    isSponsor: true,
    isSubscribed: true,
    isPublished: true,
    paket: "elite",
    bio: "Koltuk, araç koltuğu ve cafe-restoran sandalye yıkamada hızlı ve güvenilir hizmet. Aynı gün servis seçeneği ve kuruma garantisi ile müşteri memnuniyetini ön planda tutuyoruz.",
    regions: ["Pendik", "Kartal", "Tuzla"],
    prices: {
      ev1p1: 1100, ev2p1: 1500, ev3p1: 2100, ofis: 800,
      koltukL: 600, koltuk3lu: 450, koltuk2li: 300, koltukTekli: 180,
      aracKoltuk: 400, sandalye: 80,
      haliStandart: 120, haliShaggy: 150, haliIpek: 300,
      haliBambuOrijinal: 300, haliBambuSentetik: 180,
      haliYun: 200, haliKilim: 150, haliMakine: 140,
      yatak: 750, yorgan2kisi: 750, yorgan1kisi: 450, battaniye: 450,
    },
  },
  {
    name: "Pırıl Temizlik",
    email: "piril@cleanlink.demo",
    phone: "0543 654 32 10",
    joinedAt: new Date(1712102400000),
    isSponsor: true,
    isSubscribed: true,
    isPublished: true,
    paket: "standart",
    bio: "Değerli halılarınız için özel bakım uzmanıyız. İpek, bambu, yün ve kilim halıları koruyucu yöntemlerle el yıkamasıyla teslim ediyoruz. Her halıya özel muamele, renk garantisi.",
    regions: ["Maltepe", "Kadıköy", "Üsküdar"],
    prices: {
      ev1p1: 1100, ev2p1: 1500, ev3p1: 2100, ofis: 800,
      koltukL: 600, koltuk3lu: 450, koltuk2li: 300, koltukTekli: 180,
      aracKoltuk: 400, sandalye: 80,
      haliStandart: 120, haliShaggy: 150, haliIpek: 300,
      haliBambuOrijinal: 300, haliBambuSentetik: 180,
      haliYun: 200, haliKilim: 150, haliMakine: 140,
      yatak: 750, yorgan2kisi: 750, yorgan1kisi: 450, battaniye: 450,
    },
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("CleanLink2024!", 10);
  let created = 0;
  let skipped = 0;

  for (const vendor of SEED_VENDORS) {
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, vendor.email))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  skipped (already exists): ${vendor.name}`);
      skipped++;
      continue;
    }

    const [newUser] = await db
      .insert(usersTable)
      .values({
        email: vendor.email,
        name: vendor.name,
        passwordHash,
        role: "firma",
      })
      .returning({ id: usersTable.id });

    await pool.query(
      `INSERT INTO vendor_profiles
        (user_id, bio, phone, regions, is_subscribed, is_sponsor, is_published,
         is_admin_hidden, prices, service_scopes, gallery_urls, subscription_pending, paket, yayina_giris_tarihi)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8, $9, $10, false, $11, $12)`,
      [
        newUser.id,
        vendor.bio,
        vendor.phone,
        JSON.stringify(vendor.regions),
        vendor.isSubscribed,
        vendor.isSponsor,
        vendor.isPublished,
        JSON.stringify(vendor.prices),
        JSON.stringify({}),
        JSON.stringify([]),
        vendor.paket,
        vendor.joinedAt,
      ]
    );

    console.log(`  created: ${vendor.name} (userId=${newUser.id})`);
    created++;
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error("Seed failed:", err);
  pool.end().then(() => process.exit(1));
});
