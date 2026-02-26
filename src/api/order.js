import http from './http'

export const generateConfirmOrder = (cartIds) =>
  http.post('/order/generateConfirmOrder', JSON.stringify(cartIds), {
    headers: { 'Content-Type': 'application/json;charset=utf-8' }
  })

export const generateOrder = (data) => http.post('/order/generateOrder', data)
export const generateDirectConfirmOrder = (data) => http.post('/order/generateDirectConfirmOrder', data)
export const generateDirectOrder = (data) => http.post('/order/generateDirectOrder', data)
export const fetchOrderList = (params) => http.get('/order/list', { params })
export const fetchOrderDetail = (orderId) => http.get(`/order/detail/${orderId}`)

const formPost = (url, data) => {
  const payload = new URLSearchParams(data)
  return http.post(url, payload, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' }
  })
}

export const cancelUserOrder = (orderId) => formPost('/order/cancelUserOrder', { orderId })
export const confirmReceiveOrder = (orderId) => formPost('/order/confirmReceiveOrder', { orderId })
export const deleteUserOrder = (orderId) => formPost('/order/deleteOrder', { orderId })
