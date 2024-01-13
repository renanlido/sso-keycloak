import Keycloak from "keycloak-js";

export type KeycloakInstanceType = {
  init: () => Promise<boolean> | false;
  doLogin: () => void;
  doLogout: () => void;
  getToken: () => string | undefined;
  isLoggedIn: () => boolean;
  refreshToken: (successCallback: (value: boolean) => void) => Promise<void>;
  getUserProfile: () => Promise<{
    id: string | undefined;
    firstName: string | undefined;
    lastName: string | undefined;
    email: string | undefined;
    userName: string | undefined;
}>;
  hasRole: (roles: string[]) => boolean;
  hasResourceRole: (roles: string[], resource: string) => boolean;
}

let _kcInstance: Keycloak;

const init = () => {
  try {
    if(typeof window === 'undefined'){
      return false
    }

    const kcInstance =  new Keycloak({
      url: 'http://localhost:8080',
      realm: 'my-realm',
      clientId: 'my-client'
     })

     _kcInstance = kcInstance
  
    return kcInstance.init({
      onLoad: 'check-sso', 
      redirectUri: "http://localhost:3001/api/auth",
      responseMode: 'query',
      checkLoginIframe: false
    })
  } catch (error) {
    console.log(error)

    return false
  }
}

const doLogin = () => {
  _kcInstance.login({
    redirectUri: "http://localhost:3001/",
  })

};
const doLogout = () => {
  _kcInstance.logout({
    redirectUri: "http://localhost:3001/login",
  })
};
const getToken = () => _kcInstance.token;
const isLoggedIn = () => !!_kcInstance.token;
const refreshToken = async (successCallback: (value: boolean) => void) => {
  const tokenWasUpdated = await _kcInstance.updateToken(5)

  if(tokenWasUpdated){
    successCallback(tokenWasUpdated)
    return;
  }

  await doLogin()
};
const getUserProfile = async () => {
  const profile = await _kcInstance.loadUserProfile()

  return {
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    userName: profile.username,
  }
};
const hasRole = (roles: string[]) => roles.some((role) => _kcInstance.hasRealmRole(role));
const hasResourceRole = (roles: string[], resource: string) => roles.some((role) => _kcInstance.hasResourceRole(role, resource));

export const keycloak: KeycloakInstanceType = {
  init,
  doLogin,
  doLogout,
  getToken,
  isLoggedIn,
  refreshToken,
  getUserProfile,
  hasRole,
  hasResourceRole,
};