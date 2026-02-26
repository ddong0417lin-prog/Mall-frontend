import http from './http'

export const fetchStoreDetail = (storeId) => http.get(`/store/${storeId}`)
export const fetchStoreProductList = (storeId, params) =>
  http.get(`/store/${storeId}/productList`, { params })
