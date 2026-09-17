import { AxiosError } from 'axios';

/**
 * 从后端错误响应中提取全部具体原因。
 * NestJS 校验失败时 data.message 可能是字符串或字符串数组。
 */
export function getErrorMessages(error: unknown, fallback = '操作失败'): string[] {
  const data = (error as AxiosError<any>)?.response?.data;
  if (!data) return [fallback];

  const { message } = data;
  if (Array.isArray(message) && message.length > 0) {
    return message.map((m) => String(m));
  }
  if (typeof message === 'string' && message) {
    return [message];
  }
  if (typeof data.error === 'string' && data.error) {
    return [data.error];
  }
  return [fallback];
}
