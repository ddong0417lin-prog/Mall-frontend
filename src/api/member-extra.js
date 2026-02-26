import http from './http'

export const createProductCollection = (data) => http.post('/member/productCollection/add', data)
export const deleteProductCollection = (ids) =>
  http.post('/member/productCollection/delete', null, { params: { ids } })
export const fetchProductCollectionList = (params) =>
  http.get('/member/productCollection/list', { params })

export const createReadHistory = (data) => http.post('/member/readHistory/create', data)
export const fetchReadHistoryList = (params) => http.get('/member/readHistory/list', { params })
export const clearReadHistory = () => http.post('/member/readHistory/clear')

export const createBrandAttention = (data) => http.post('/member/attention/add', data)
export const deleteBrandAttention = (ids) =>
  http.post('/member/attention/delete', null, { params: { ids } })
export const fetchBrandAttentionList = (params) => http.get('/member/attention/list', { params })
