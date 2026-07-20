'use client'

import SavedPlacesPanel from '@/components/saved/SavedPlacesPanel'

// SPEC-09 Saved Tab (S-GNYOKE): "same layout as SPEC-08 Folder List view.
// Own profile: Full CRUD on folders. FL2 entry from here." — identical
// behavior to /saved's Places tab, so it reuses the same component rather
// than a parallel flat-list implementation (was `/api/profile/saved`, now
// unused — deleted alongside this).
export default function ProfileSavedPage() {
  return <SavedPlacesPanel />
}
