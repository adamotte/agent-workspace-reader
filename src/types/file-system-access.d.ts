// The parts of the File System Access API the edit mode uses; TypeScript 4.8's
// DOM library has the handles but not the pickers or permissions.

type FileSystemPermissionMode = 'read' | 'readwrite'

interface FileSystemHandlePermissionDescriptor {
  mode?: FileSystemPermissionMode
}

interface FileSystemHandle {
  queryPermission(
    descriptor?: FileSystemHandlePermissionDescriptor,
  ): Promise<PermissionState>
  requestPermission(
    descriptor?: FileSystemHandlePermissionDescriptor,
  ): Promise<PermissionState>
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | BufferSource | Blob): Promise<void>
  truncate(size: number): Promise<void>
}

interface FileSystemFileHandle {
  createWritable(options?: {
    keepExistingData?: boolean
  }): Promise<FileSystemWritableFileStream>
}

interface DirectoryPickerOptions {
  id?: string
  mode?: FileSystemPermissionMode
  startIn?: FileSystemHandle | string
}

interface Window {
  showDirectoryPicker(
    options?: DirectoryPickerOptions,
  ): Promise<FileSystemDirectoryHandle>
}
