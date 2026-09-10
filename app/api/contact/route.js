import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const messages = await prisma.contactForm.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return Response.json(messages);
}

export async function POST(req) {
  try {
    // Log incoming request body to verify it's being sent correctly
    console.log('Received body:', req.body);

    // Parse the incoming JSON request body
    const { name, email, message } = await req.json();

    // Validate input
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ message: 'All fields are required.' }),
        { status: 400 }
      );
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      console.error('Invalid email format:', email);
      return new Response(
        JSON.stringify({ message: 'Invalid email format.' }),
        { status: 400 }
      );
    }

    // Create the contact form entry
    const contactForm = await prisma.contactForm.create({
      data: {
        name,
        email,
        message,
      },
    });

    return new Response(JSON.stringify(contactForm), { status: 201 });
  } catch (error) {
    // Check if error is an instance of Error and log accordingly
    if (error instanceof Error) {
      console.error('Error creating contact form:', error.message, error.stack);
    } else {
      console.error('Unknown error:', error);
    }

    return new Response(
      JSON.stringify({ message: 'An error occurred while submitting the form.' }),
      { status: 500 }
    );
  } finally {
    // Disconnect Prisma Client
    await prisma.$disconnect();
  }
}
