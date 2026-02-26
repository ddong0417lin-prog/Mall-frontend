import http from './http'

export const searchProductList = (params) => http.get('/product/search', { params })
export const fetchCategoryTreeList = () => http.get('/product/categoryTreeList')
export const fetchProductDetail = (id) => http.get(`/product/detail/${id}`)
