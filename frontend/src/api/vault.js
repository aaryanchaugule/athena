import { request } from './client'

export const getVault = () => request('GET', '/vault')
export const putVault = ({ ciphertext, iv }, baseVersion) =>
  request('PUT', '/vault', { ciphertext, iv, baseVersion })
