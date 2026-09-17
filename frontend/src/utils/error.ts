import type { AxiosError } from 'axios';

/**
 * 从后端错误响应中提取具体原因。
 * 课程保存被原子拒绝时，后端返回形如：
 *   { message: '付费课程价格必须大于 0；上架课程至少需要一个课时',
 *     reasons: ['付费课程价格必须大于 0', '上架课程至少需要一个课时'] }
 * 这里优先返回 reasons，方便逐条展示。
 */
export function getErrorReasons(error: unknown): string[] {
  const axiosError = error as AxiosError<any>;
  const data = axiosError?.response?.data;
  if (data) {
    if (Array.isArray(data.reasons) && data.reasons.length > 0) {
      return data.reasons.map(String);
    }
    if (Array.isArray(data.message) && data.message.length > 0) {
      return data.message.map(String);
    }
    if (typeof data.message === 'string' && data.message) {
      return [data.message];
    }
  }
  if (axiosError?.message) {
    return [axiosError.message];
  }
  return ['操作失败，请稍后重试'];
}

export function getErrorMessage(error: unknown): string {
  return getErrorReasons(error).join('；');
}
