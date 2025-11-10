import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding initial user...');

    // 1. Define the initial admin user details
    const adminUsername = 'admin';
    const adminPassword = 'adminpassword'; // Change this in a secure way if needed

    // 2. Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // 3. Insert the user into the database
    const query = `
      INSERT INTO "User" (username, password, "isAdmin")
      VALUES ($1, $2, $3)
      ON CONFLICT (username) DO NOTHING;
    `;
    const values = [adminUsername, hashedPassword, true];

    await client.query(query, values);

    console.log('✅ Initial user seeded successfully.');
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // 4. Release the client and end the pool
    client.release();
    await pool.end();
  }
}

seed();
