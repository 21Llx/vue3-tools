import service from "./index";

export function request({
  url="",
  params={},
  method = "POST",
  headers = {},
  loading = true,
}) {
  /**
   * 处理option配置参数
   * TODO
   * 。。。。。。
   */

  return service({
    url,
    params, //接口参数
    method,
    headers,
    loading,
  });
}
