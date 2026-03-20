import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from '@/db/schema';
import { config } from "@/config";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: schema,
    }),
    socialProviders: { 
        google: {
            clientId: config.auth.google.clientId,
            clientSecret: config.auth.google.clientSecret,
            redirectURI: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/callback/google`,
        },
    },
    trustedOrigins: [process.env.FRONTEND_URL || 'http://localhost:3000'],
})