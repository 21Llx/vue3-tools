import {request} from "./request"

export function testApi1(params={}){
  return request({
    url: "/api1",
    method: "post",
    params,
  })
}

export function testApi2(params={}){
  return request({
    url: "/api2",
    method: "get",
    params,
  })
}
export function uploadFile(params={}){
  return request({
    url: "/upload",
    method: "post",
    params,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}