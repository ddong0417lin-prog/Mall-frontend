import http from './http'

export const createPayment = (data) => http.post('/pay/create', data)

export const queryAlipayStatus = (params) => http.get('/alipay/query', { params })
export const queryWechatStatus = (params) => http.get('/wechat/pay/query', { params })

export const buildAlipayWebPayUrl = ({ orderSn, subject, amount }) => {
  const query = new URLSearchParams({
    outTradeNo: orderSn || '',
    subject: subject || '',
    totalAmount: String(amount ?? '')
  })
  return `/api/alipay/webPay?${query.toString()}`
}

export const notifyOrderPaySuccess = (data) => {
  const payload = new URLSearchParams(data)
  return http.post('/order/paySuccess', payload, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' }
  })
}
