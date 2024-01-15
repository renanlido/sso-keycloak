'use client'

import { signIn, signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';

import logo from '../../assets/logo-white.png'	
import Image from 'next/image';

export default function SessionChecker(){
  const { status } = useSession()

  useEffect(() => {
    if(status === 'unauthenticated'){
      signIn('keycloak', { callbackUrl:process.env.NEXT_PUBLIC_URL })
    }
  }, [status])

  return (
    <div className='flex flex-col justify-center items-center w-full h-svh bg-[#023b7e] gap-4'>
      <h1 className='text-5xl text-white font-bold'>SSO DOCUMENTALL</h1>

      <Image src={logo} alt="logo" height={120} width={369}/>
    </div>
  )
};
