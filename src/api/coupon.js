import http from './http'

export const fetchMemberCouponList = (useStatus = 0) =>
  http.get('/member/coupon/list', { params: { useStatus } })
