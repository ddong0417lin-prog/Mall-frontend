import http from './http'

export const fetchAddressList = () => http.get('/member/address/list')
export const addAddress = (data) => http.post('/member/address/add', data)
export const updateAddress = (data) => http.post(`/member/address/update/${data.id}`, data)
export const deleteAddress = (id) => http.post(`/member/address/delete/${id}`)
export const setDefaultAddress = (id) => http.post(`/member/address/default/${id}`)
