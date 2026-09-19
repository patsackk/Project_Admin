import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    // Parse the JSON body
    const { name, email, phone, address } = await req.json();
    // Basic validation. This form only ever creates a client contact
    // record — clients never log in anywhere, so no password is collected.
    if (!name || !email || !phone || !address) {
  return new Response(
    JSON.stringify({ message: 'All fields are required.' }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return new Response(
        JSON.stringify({ message: 'Invalid email format.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if the email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new Response(
        JSON.stringify({ message: 'Email is already taken.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create the user in the database. Public sign-up always creates a
    // client contact record — admin accounts are never created through
    // this form, and clients never log in, so there is no password.
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        address,
        role: 'client',
      },
    });

    return new Response(
      JSON.stringify({ message: 'User registered successfully!', user }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error during registration:', error);
    return new Response(
      JSON.stringify({
        message: 'An error occurred while registering the user.',
        error: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
