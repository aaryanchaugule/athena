import { request } from './client'

export const prelogin = (email) => request('POST', '/auth/prelogin', { email })
export const register = (payload) => request('POST', '/auth/register', payload)
export const login = (email, authKey) => request('POST', '/auth/login', { email, authKey })
export const logout = () => request('POST', '/auth/logout')
export const me = () => request('GET', '/auth/me')
