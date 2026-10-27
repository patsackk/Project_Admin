import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { hasAccess } from "@/lib/permissions"
import { getT } from "@/lib/i18n-server"
import ContentList from "@/components/content/ContentList"
import HeroSlides from "@/components/content/HeroSlides"

type Tab = "projects" | "services" | "slides"

export default async function WebsiteContentPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const activeTab: Tab = tab === "services" || tab === "slides" ? tab : "projects"
  const t = await getT()
  const canEdit = await hasAccess("manageContent")

  const order = [{ sortOrder: "asc" as const }, { id: "asc" as const }]
  const [projects, services, slides] = await Promise.all([
    prisma.portfolioProject.findMany({ orderBy: order }),
    prisma.service.findMany({ orderBy: order }),
    prisma.heroSlide.findMany({ orderBy: order }),
  ])

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "projects", label: t("Projects", "ผลงาน"), count: projects.length },
    { key: "services", label: t("Services", "บริการ"), count: services.length },
    { key: "slides", label: t("Home Slider", "สไลด์หน้าแรก"), count: slides.length },
  ]

  return (
    <div className="page">
      <div>
        <h1 className="page-title">{t("Website Content", "เนื้อหาเว็บไซต์")}</h1>
        <p className="page-subtitle">
          {t(
            "Add, edit and remove what visitors see on the client website.",
            "เพิ่ม แก้ไข และลบเนื้อหาที่ผู้เข้าชมเห็นบนเว็บไซต์ลูกค้า"
          )}
        </p>
      </div>

      {!canEdit && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {t(
            "You can view this content, but editing it needs the “Edit client website content” permission.",
            "คุณดูเนื้อหานี้ได้ แต่ต้องมีสิทธิ์ “แก้ไขเนื้อหาเว็บไซต์ลูกค้า” จึงจะแก้ไขได้"
          )}
        </p>
      )}

      <div className="flex w-fit flex-wrap gap-1 rounded-full bg-gray-100 p-1">
        {tabs.map((item) => (
          <Link
            key={item.key}
            href={`/content?tab=${item.key}`}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              activeTab === item.key ? "bg-white font-medium text-sky-700 shadow-sm" : "text-gray-500"
            }`}
          >
            {item.label} <span className="text-gray-400">({item.count})</span>
          </Link>
        ))}
      </div>

      {activeTab === "projects" && <ContentList kind="project" items={projects} canEdit={canEdit} />}
      {activeTab === "services" && <ContentList kind="service" items={services} canEdit={canEdit} />}
      {activeTab === "slides" && <HeroSlides slides={slides} canEdit={canEdit} />}
    </div>
  )
}
