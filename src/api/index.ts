import axios from "axios";
const instance = axios.create({
  baseURL: 'http://192.168.93.50:3000',
  timeout: 5000,
});

// 请求拦截
instance.interceptors.request.use(
  (config) => {
    /**
     * 处理传参逻辑
     * TODO
     * 。。。。。。
     */
    return config;
  },
  (error) => {
    // do something with request error
    console.log(error); // for debug
    return Promise.reject(error);
  }
);

// 接口相应拦截
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.log(error)
    let res = error.response;
    /**
     * 处理各种接口code情况
     * TODO
     * 。。。。。。
     */
    if (res.data.code == 401) {
      // 未登录
      return Promise.reject(res);
    }
    // 。。。。
    return Promise.reject(res);
  }
);
/**
 *
 * @param {*} option 需要对请求做特殊处理的参数
 *
 * @returns
 */
function service(options:any) {
  let { url, params, method, headers, } = options;
  let defaultHeaders = {}; //默认请求头
  headers = {
    ...defaultHeaders,
    ...headers,
  };
  let paramsType = "data";
  if (method == "get" || method == "delete") {
    paramsType = "params";
  }
  return new Promise((res,rej)=>{
    instance({
      url,
      method,
      headers,
      [paramsType]: params,
    })
      .then((response) => {
        /**
         * 处理接口返回值逻辑
         * TODO
         * 。。。。。。
         */
  
        // 请求loading
        const { data = {} } = response;
        if (data.code != 200 && data.code != 0) {
          /**
           * 处理各种code的场景
           * TODO
           * 。。。。。
           */
  
          // 默认配置 请求失败消息提示

          // return rej(data);
        } else {
          //请求成功
          // 默认配置 请求成功消息提示

          res(data);
        }
      })
      .catch((err) => {
        console.log(err)
        rej(err)
      });
  })
}
export default service;
