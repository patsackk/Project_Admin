// Copies the client website's original (previously hard-coded) projects,
// services and home slider into the database. Safe to re-run: each table is
// only filled if it's empty, so nothing an admin has edited is overwritten.
//
// Usage:
//   node scripts/seed-content.mjs

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const services = [
  {
    nameEn: "Electrical System",
    nameTh: "ระบบไฟฟ้า",
    descriptionEn: "Our Electrical System services provide reliable and safe installations.",
    descriptionTh: "บริการระบบไฟฟ้าของเรามอบงานติดตั้งที่ปลอดภัยและเชื่อถือได้",
    coverImage: "/images/elec.jpg",
    gallery: ["/images/elec2.jpg", "/images/elec3.jpg"],
  },
  {
    nameEn: "Water Supply System",
    nameTh: "ระบบประปา",
    descriptionEn: "We ensure clean and efficient water supply systems...",
    descriptionTh: "เราดูแลให้ระบบประปาสะอาดและมีประสิทธิภาพ...",
    coverImage: "/images/water.jpg",
    gallery: ["/images/water2.jpg", "/images/water8.JPG"],
  },
  {
    nameEn: "Air Conditioning System",
    nameTh: "ระบบปรับอากาศ",
    descriptionEn:
      "Our Home System Design service provides safe, efficient, and well-planned system installations for residential buildings.",
    descriptionTh:
      "บริการออกแบบระบบภายในบ้านของเรามอบงานติดตั้งระบบที่ปลอดภัย มีประสิทธิภาพ และวางแผนอย่างดีสำหรับอาคารที่พักอาศัย",
    coverImage: "/images/airr.jpg",
    gallery: ["/images/air2.JPG", "/images/air3.jpg", "/images/air4.jpg", "/images/air5.JPG"],
  },
  {
    nameEn: "Design and Drafting",
    nameTh: "งานออกแบบและเขียนแบบ",
    descriptionEn:
      "Our Design and Drafting services create detailed plans and blueprints tailored to your project's requirements.",
    descriptionTh:
      "บริการออกแบบและเขียนแบบของเราจัดทำแบบแปลนและพิมพ์เขียวโดยละเอียด ตามความต้องการของโครงการคุณ",
    coverImage: "/images/design.jpg",
    gallery: ["/images/design2.jpg", "/images/design3.jpg", "/images/design4.jpg", "/images/design5.jpg"],
  },
  {
    nameEn: "Home System Design",
    nameTh: "ออกแบบระบบภายในบ้าน",
    descriptionEn:
      "Our Solar Energy System services provide sustainable and energy-efficient solutions for residential and commercial projects.",
    descriptionTh:
      "บริการระบบพลังงานแสงอาทิตย์ของเรามอบโซลูชันที่ยั่งยืนและประหยัดพลังงาน สำหรับโครงการที่พักอาศัยและเชิงพาณิชย์",
    coverImage: "/images/plan1.jpg",
    gallery: ["/images/plan2.jpg", "/images/plan3.jpg", "/images/plan4.jpg"],
  },
]

const projects = [
  {
    nameEn: "Pool Villa",
    nameTh: "พูลวิลล่า",
    locationEn: "Manik - Phuket",
    locationTh: "Manik - ภูเก็ต",
    type: "Residential",
    descriptionEn: "Modern pool villa with tropical design.",
    descriptionTh: "พูลวิลล่าสไตล์โมเดิร์นในบรรยากาศทรอปิคอล",
    coverImage: "/images/pool.JPG",
    gallery: ["/images/pool.JPG", "/images/pool2.jpg", "/images/pool3.jpg", "/images/pool4.jpg"],
  },
  {
    nameEn: "Cafe",
    nameTh: "คาเฟ่",
    locationEn: "Mueang - Phuket",
    locationTh: "เมือง - ภูเก็ต",
    type: "Commercial",
    descriptionEn: "Minimal cafe interior design.",
    descriptionTh: "งานออกแบบภายในคาเฟ่สไตล์มินิมอล",
    coverImage: "/images/pro1.jpg",
    gallery: ["/images/pro1.jpg", "/images/inte.jpg", "/images/cafe3.jpg", "/images/cafe4.jpg"],
  },
  {
    nameEn: "Luxury Villa",
    nameTh: "วิลล่าหรู",
    locationEn: "Thalang - Phuket",
    locationTh: "ถลาง - ภูเก็ต",
    type: "Residential",
    descriptionEn:
      "An exclusive luxury villa combining modern architecture with high-end finishes and private outdoor living spaces.",
    descriptionTh:
      "วิลล่าหรูระดับพรีเมียมที่ผสานสถาปัตยกรรมสมัยใหม่เข้ากับงานตกแต่งระดับสูง พร้อมพื้นที่พักผ่อนกลางแจ้งส่วนตัว",
    coverImage: "/images/project3.jpg",
    gallery: ["/images/project3.jpg", "/images/project2.jpg", "/images/project4.jpg", "/images/project5.jpg"],
  },
  {
    nameEn: "Dental Clinic",
    nameTh: "คลินิกทันตกรรม",
    locationEn: "Thalang - Phuket",
    locationTh: "ถลาง - ภูเก็ต",
    type: "Commercial",
    descriptionEn:
      "A fully equipped dental clinic designed with patient comfort, hygiene standards, and efficient workflow in mind.",
    descriptionTh:
      "คลินิกทันตกรรมที่มีอุปกรณ์ครบครัน ออกแบบโดยคำนึงถึงความสบายของผู้ป่วย มาตรฐานด้านสุขอนามัย และการทำงานที่มีประสิทธิภาพ",
    coverImage: "/images/dental3.jpg",
    gallery: ["/images/dental1.jpg", "/images/dental2.jpg", "/images/dental3.jpg", "/images/dental4.jpg"],
  },
  {
    nameEn: "Dermatology Clinic",
    nameTh: "คลินิกผิวหนัง",
    locationEn: "Thalang - Phuket",
    locationTh: "ถลาง - ภูเก็ต",
    type: "Commercial",
    descriptionEn:
      "A modern dermatology clinic with professional treatment rooms and a clean, calming interior concept.",
    descriptionTh:
      "คลินิกผิวหนังสมัยใหม่ พร้อมห้องทำทรีตเมนต์ระดับมืออาชีพ และการตกแต่งภายในที่สะอาดตาและผ่อนคลาย",
    coverImage: "/images/Drpat3.jpg",
    gallery: ["/images/Drpat1.jpg", "/images/Drpat2.jpg", "/images/Drpat3.jpg", "/images/Drpat4.jpg"],
  },
  {
    nameEn: "Boutique Villa",
    nameTh: "บูทีควิลล่า",
    locationEn: "Thalang - Phuket",
    locationTh: "ถลาง - ภูเก็ต",
    type: "Residential",
    descriptionEn:
      "A boutique-style villa featuring warm wood elements, elegant finishes, and a peaceful tropical ambiance.",
    descriptionTh:
      "วิลล่าสไตล์บูทีคที่โดดเด่นด้วยองค์ประกอบไม้อันอบอุ่น งานตกแต่งที่หรูหรา และบรรยากาศทรอปิคอลที่เงียบสงบ",
    coverImage: "/images/wood1.jpg",
    gallery: ["/images/wood1.jpg", "/images/wood2.jpg", "/images/wood3.jpg", "/images/wood4.jpg", "/images/wood5.jpg"],
  },
]

const heroSlides = [
  "/images/project1.jpg",
  "/images/project2.jpg",
  "/images/project3.jpg",
  "/images/project4.jpg",
]

const withOrder = (rows) => rows.map((row, i) => ({ ...row, sortOrder: i }))

async function seed(label, model, rows) {
  if ((await model.count()) > 0) {
    console.log(`${label}: already has data, skipped`)
    return
  }
  // One at a time, so ids follow the original order (old /services/1..5
  // links keep pointing at the same service).
  for (const data of withOrder(rows)) await model.create({ data })
  console.log(`${label}: added ${rows.length}`)
}

try {
  await seed("Services", prisma.service, services)
  await seed("Portfolio projects", prisma.portfolioProject, projects)
  await seed("Hero slides", prisma.heroSlide, heroSlides.map((image) => ({ image })))
} finally {
  await prisma.$disconnect()
}
