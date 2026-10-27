// /app/services/[id]/page.js

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getT } from "@/lib/i18n-server";

const servicesData = (t) => [
  {
    id: 1,
    name: t("Electrical System", "ระบบไฟฟ้า"),
    img: "/images/elec.jpg",
    description: t(
      "Our Electrical System services provide reliable and safe installations.",
      "บริการระบบไฟฟ้าของเรามอบงานติดตั้งที่ปลอดภัยและเชื่อถือได้"
    ),
    gallery: ["/images/elec2.jpg", "/images/elec3.jpg"],
  },
  {
    id: 2,
    name: t("Water Supply System", "ระบบประปา"),
    img: "/images/water.jpg",
    description: t(
      "We ensure clean and efficient water supply systems...",
      "เราดูแลให้ระบบประปาสะอาดและมีประสิทธิภาพ..."
    ),
    gallery: ["/images/water2.jpg", "/images/water8.jpg"],
  },
  {
    id: 3,
    name: t("Air Conditioning System", "ระบบปรับอากาศ"),
    img: "/images/airr.jpg",
    description: t(
      "Our Home System Design service provides safe, efficient, and well-planned system installations for residential buildings.",
      "บริการออกแบบระบบภายในบ้านของเรามอบงานติดตั้งระบบที่ปลอดภัย มีประสิทธิภาพ และวางแผนอย่างดีสำหรับอาคารที่พักอาศัย"
    ),
    gallery: [
      "/images/air2.jpg",
      "/images/air3.jpg",
      "/images/air4.jpg",
      "/images/air5.jpg",
    ],
  },
  {
    id: 4,
    name: t("Design and Drafting", "งานออกแบบและเขียนแบบ"),
    img: "/images/design.jpg",
    description: t(
      "Our Design and Drafting services create detailed plans and blueprints tailored to your project's requirements.",
      "บริการออกแบบและเขียนแบบของเราจัดทำแบบแปลนและพิมพ์เขียวโดยละเอียด ตามความต้องการของโครงการคุณ"
    ),
    gallery: [
      "/images/design2.jpg",
      "/images/design3.jpg",
      "/images/design4.jpg",
      "/images/design5.jpg",
    ],
  },
  {
    id: 5,
    name: t("Home System Design", "ออกแบบระบบภายในบ้าน"),
    img: "/images/plan1.jpg",
    description: t(
      "Our Solar Energy System services provide sustainable and energy-efficient solutions for residential and commercial projects.",
      "บริการระบบพลังงานแสงอาทิตย์ของเรามอบโซลูชันที่ยั่งยืนและประหยัดพลังงาน สำหรับโครงการที่พักอาศัยและเชิงพาณิชย์"
    ),
    gallery: [
      "/images/plan2.jpg",
      "/images/plan3.jpg",
      "/images/plan4.jpg",
    ],
  },
];

export default async function ServiceDetail({ params }) {
  const { id } = await params;
  const t = await getT();
  const service = servicesData(t).find(
    (service) => service.id.toString() === id
  );

  if (!service) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="page-title">{t("Service not found", "ไม่พบบริการนี้")}</h1>
        <p className="text-gray-500 mt-4">
          {t("The requested service does not exist.", "ไม่มีบริการที่คุณต้องการ")}
        </p>
        <Link href="/" className="btn-primary mt-6">
          {t("Back to Home", "กลับหน้าแรก")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Link href="/#services" className="back-link mb-6">
        <ArrowLeft size={16} />
        {t("Back to Services", "กลับไปหน้าบริการ")}
      </Link>

      <div className="card overflow-hidden">
        {/* Hero Image */}
        <div className="relative w-full h-80 md:h-96">
          <img
            src={service.img}
            alt={service.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white text-center px-4">
              {service.name}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 lg:p-12">
          <p className="text-gray-600 text-lg leading-relaxed mb-10">
            {service.description}
          </p>

          <h2 className="section-title mb-6">{t("Gallery", "แกลเลอรี")}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {service.gallery.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${service.name} ${index + 1}`}
                className="w-full h-64 object-cover rounded-2xl shadow-sm"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
