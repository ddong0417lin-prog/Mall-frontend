import http from './http'

export const fetchHomeContent = () => http.get('/home/content')
export const fetchRecommendProductList = (params) => http.get('/home/recommendProductList', { params })
export const fetchHotProductList = (params) => http.get('/home/hotProductList', { params })
export const fetchNewProductList = (params) => http.get('/home/newProductList', { params })
