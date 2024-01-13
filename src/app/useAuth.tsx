'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { KeycloakInstanceType, keycloak } from "./keycloak";
import getCookies from './actions/get-cookies';
type AuthContextType = {
  initialized: boolean;
}

const AuthContext = createContext<AuthContextType>(null as unknown as AuthContextType);

type AuthProviderProps = {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    (async () => {
      const sessionCookie = await getCookies()

      if(sessionCookie) return;

      const isInitialized = await keycloak.init();
      setInitialized(isInitialized);
    })();
  }, [])

  
  return (
    <AuthContext.Provider value={{ initialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);