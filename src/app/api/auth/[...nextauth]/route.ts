import NextAuth, { AuthOptions } from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';
import type { JWT } from 'next-auth/jwt';
import { RedirectType, redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

// on logout, close session on keycloak
// this action kill all sessions on all logged app
// finded on https://www.reddit.com/r/nextjs/comments/redv1r/nextauth_signout_does_not_end_keycloak_session/


if(!process.env.KEYCLOAK_CLIENT_SECRET) {
  throw new Error('KEYCLOAK_CLIENT_SECRET must be defined')
}

if(!process.env.KEYCLOAK_CLIENT_ID) {
  throw new Error('KEYCLOAK_CLIENT_ID must be defined')
}

const doFinalSignOutHandshake = async(token:JWT) => {
  if(token.provider === 'keycloak'){
  try {
      const params = new URLSearchParams()
      params.set('client_id', process.env.KEYCLOAK_CLIENT_ID!)
      params.set('post_logout_redirect_uri', `${process.env.NEXT_PUBLIC_URL}/login`)
      params.set('id_token_hint', token.id_token)

      const response = await fetch(`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout?${params.toString()}`, {
        method: 'GET',
      });

    } catch (error) {
      console.log(error)

      console.log({
        error: (error as any).error ?? 'LogoutError',
        errorDescription: (error as any).error_description ?? 'Failed to logout',
      })
    }
  }
}

//solution finded on https://gist.github.com/degitgitagitya/db5c4385fc549f317eac64d8e5702f74
// on refresh token, next-auth validate session on keycloak and if is closed, the user is redirected to login
// and forced to re-login

const refreshAccessToken = async(token:JWT) => {
  try {
    if(Date.now() > Number(token.refreshTokenExpires)) throw Error;
    
    const details = {
      client_id: process.env.KEYCLOAK_CLIENT_ID,
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
      grant_type: ['refresh_token'],
      refresh_token: token.refreshToken,
    }

    const formBody: string[] = [];
    
    Object.entries(details).forEach(([key, value]: [string, any]) => {
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(value);
      formBody.push(`${encodedKey}=${encodedValue}`);
    })

    const formData = formBody.join('&');
    
    const url = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: formData,
    });

    const refreshedTokens = await response.json();

    if(!response.ok) throw refreshedTokens;

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      accessTokenExpires: Date.now() + refreshedTokens.expires_at * 1000,
      refreshTokenExpires: refreshedTokens.refresh_token ?? token.refreshToken,
    }

  } catch (error) {
    console.log(error)

    return {
      ...token,
      error: (error as any).error ?? 'RefreshAccessTokenError',
      errorDescription: (error as any).error_description ?? 'Failed to refresh access token',
    }
  }
}



export const authOptions: AuthOptions = {
  providers: [
    Keycloak({
     clientId: process.env.KEYCLOAK_CLIENT_ID,
     clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
     issuer: process.env.KEYCLOAK_ISSUER,
     authorization:{
      params:{
        scope: "openid profile email",
        response_type: "code",
      }
     },
     httpOptions: {
      timeout: 30000
     }
   })
  ],
  pages: {
    signIn: '/login',  
    signOut: '/login',
  },
  callbacks: {
    async jwt({token, user, account}) {
      if(account && user) {
        token.provider = account.provider;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.id_token = account.id_token;
        token.accessTokenExpires = account.expires_at * 1000;
        token.refreshTokenExpires = Date.now() + account.refresh_expires_in * 1000
        token.user = user;

        return token
      }

      if (Date.now() < token.accessTokenExpires) return token;

      const refreshedToken = await refreshAccessToken(token);

      // if token is not refreshed, do logout handshake
      // an problem on redirect here
      // TODO: solve problem

      if(refreshedToken.error){
        await doFinalSignOutHandshake(token);

        redirect(`${process.env.NEXT_PUBLIC_URL}/api/auth/signin/keycloak`, RedirectType.push )
      }

      return refreshedToken
   },
    async signIn({user, account}) {
      if(account && user){
        return true
      } else {
        return '/login'
      }
    },
    async redirect({baseUrl, url}) {
      return url.startsWith(baseUrl)
      ? url
      : baseUrl
    },
    async session({session, token}) {
      if(token){
        session.user = token.user;
        session.error = token.error;
        session.accessToken = token.accessToken;
      } 
      
      return session
    },   
  },
  events:{
    // signIn({account,user,isNewUser,profile}) {
    //     console.log({account, user, isNewUser, profile})
    // },
    signOut: ({token}) => doFinalSignOutHandshake(token),
  }
};

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST };
