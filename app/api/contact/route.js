import { prisma } from '@/lib/prisma';

// Admin Messages page. Clients send messages through the client site's own
// /api/contact; this app only lists them (replies: ./[id]/reply).
export async function GET() {
  const messages = await prisma.contactForm.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return Response.json(messages);
}
