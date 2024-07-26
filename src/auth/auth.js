// src/auth/auth.js
import { Auth0Client } from '@auth0/auth0-spa-js';

let auth0Client = null;

export async function initAuth0() {
  auth0Client = new Auth0Client({
    domain: 'dev-mnmvvmn2nhf204ji.us.auth0.com',
    client_id: 'lDkYUyMoOYqRth4ZgfNVXPtUYKCDQwOq',
    redirect_uri: window.location.origin
  });
};

export async function login() {
  await auth0Client.loginWithRedirect();
}

export async function logout() {
  auth0Client.logout({
    returnTo: window.location.origin
  });
}

export async function getUser() {
  return await auth0Client.getUser();
}

export async function isAuthenticated() {
  return await auth0Client.isAuthenticated();
}

export async function signup() {
  await auth0Client.loginWithRedirect({
    screen_hint: 'signup'
  });
}