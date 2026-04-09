import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { assertWriteAllowed } from '../services/license'

type InvokeHandler<TArgs extends unknown[], TResult> = (
  event: IpcMainInvokeEvent,
  ...args: TArgs
) => TResult | Promise<TResult>

export function handleRead<TArgs extends unknown[], TResult>(
  channel: string,
  handler: InvokeHandler<TArgs, TResult>
): void {
  ipcMain.handle(channel, handler)
}

export function handleWrite<TArgs extends unknown[], TResult>(
  channel: string,
  handler: InvokeHandler<TArgs, TResult>
): void {
  ipcMain.handle(channel, async (event, ...args) => {
    await assertWriteAllowed()
    return handler(event, ...(args as TArgs))
  })
}
