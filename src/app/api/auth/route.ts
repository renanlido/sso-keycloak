import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from 'jose'

export interface AuthToken {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  id_token: string;
  'not-before-policy': number;
  session_state: string;
  scope: string;
}

export const GET = async (req: NextRequest) => {

  const errorSearchParam = req.nextUrl.searchParams.get('error');
  const stateSearchParam = req.nextUrl.searchParams.get('state');
  const codeSearchParam = req.nextUrl.searchParams.get('code');

  if (errorSearchParam && stateSearchParam) {
    const redirectUrl = `http://localhost:8080/realms/my-realm/protocol/openid-connect/auth?client_id=my-client&state=${stateSearchParam}&redirect_uri=http://localhost:3001/api/auth&response_type=code&scope=openid`

    return NextResponse.redirect(redirectUrl)
  }

  if (codeSearchParam && stateSearchParam) {
    const redirectUrl = `http://localhost:8080/realms/my-realm/protocol/openid-connect/token`

    const response = await fetch(redirectUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=authorization_code&client_id=my-client&client_secret=LteiWZY5RVydDS84yi8n3vjrNAaI2Tv3&code=${codeSearchParam}&redirect_uri=http://localhost:3001/api/auth`
    })

    const data: AuthToken = await response.json()

    const jwt = await new SignJWT({ access_token: data.access_token, refresh_token: data.refresh_token })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(data.expires_in)
      .sign(new TextEncoder().encode('oi-casada-shii-e-segredo'))

    const nextResponse = NextResponse.redirect(`http://localhost:3001`)

    nextResponse.cookies.set('token', jwt)


    return nextResponse
  }
}

