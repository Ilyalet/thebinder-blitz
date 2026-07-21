import { base44 } from '@/api/base44Client';

export const InvokeLLM = (...args) => base44.integrations.Core.InvokeLLM(...args);
export const UploadFile = (...args) => base44.integrations.Core.UploadFile(...args);
export const GenerateImage = (...args) => base44.integrations.Core.GenerateImage(...args);
export const ExtractDataFromUploadedFile = (...args) => base44.integrations.Core.ExtractDataFromUploadedFile(...args);
export const UploadPrivateFile = (...args) => base44.integrations.Core.UploadPrivateFile(...args);
export const CreateFileSignedUrl = (...args) => base44.integrations.Core.CreateFileSignedUrl(...args);
export const SendEmail = (...args) => base44.integrations.Core.SendEmail(...args);
