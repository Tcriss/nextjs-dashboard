import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { User } from './app/lib/definitions';
import { QueryResult, QueryResultRow, sql } from '@vercel/postgres';
import bcrypt from 'bcrypt';
 
async function getUser(email: string): Promise<User | undefined> {
    try {
        const res: QueryResult<User> = await sql`SELECT * FROM users WHERE email=${email}`;
        return res.rows[0];
    } catch (err) {
        throw new Error('Error fetching user')
    }
};

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [ credentials({
    async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.data) {
            const { email, password } = parsedCredentials.data;
            const user: User | undefined = await getUser(email);

            if (!user) return null;

            const isMatch: boolean = await bcrypt.compare(password, user.password);
 
            if (isMatch) return user;
        }

        return null;
    },
  }) ]
});