import http from './http'

export const fetchCartList = () => http.get('/cart/list')
export const addCartItem = (data) => http.post('/cart/add', data)
export const deleteCartItem = (ids) => http.post('/cart/delete', null, { params: { ids } })
export const updateCartQuantity = (id, quantity) => http.get('/cart/update/quantity', { params: { id, quantity } })
export const clearCartList = () => http.post('/cart/clear')
