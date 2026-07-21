import { base44 } from '@/api/base44Client';

export const Document = base44.entities.Document;
export const Task = base44.entities.Task;
export const Folder = base44.entities.Folder;
export const Tag = base44.entities.Tag;
export const TaskSuggestion = base44.entities.TaskSuggestion;
export const TagSuggestion = base44.entities.TagSuggestion;

// The old app-embedded SDK exposed User.me() / User.updateMyUserData() directly.
// The standalone SDK moves those onto base44.auth instead (entities.User has no
// .me()/.updateMyUserData() of its own) — forward them here so call sites
// elsewhere in the app don't all need to change.
export const User = {
  list: (...args) => base44.entities.User.list(...args),
  filter: (...args) => base44.entities.User.filter(...args),
  get: (...args) => base44.entities.User.get(...args),
  update: (...args) => base44.entities.User.update(...args),
  delete: (...args) => base44.entities.User.delete(...args),
  me: () => base44.auth.me(),
  updateMyUserData: (data) => base44.auth.updateMe(data),
};
