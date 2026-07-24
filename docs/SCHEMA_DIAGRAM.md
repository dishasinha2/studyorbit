# Schema Diagram

```mermaid
erDiagram
  UserProfile ||--o{ EducationHistory : has
  UserProfile ||--o{ UserSkill : has
  UserProfile ||--o{ UserGoal : tracks
  UserProfile ||--o{ CareerRoadmap : owns
  CareerRoadmap ||--o{ UserGoal : contains

  UserProfile ||--o{ DocumentFolder : owns
  DocumentFolder ||--o{ DocumentFolder : nests
  DocumentFolder ||--o{ Document : groups
  UserProfile ||--o{ Document : uploads
  Document ||--o{ DocumentChunk : chunks
  Document ||--o{ DocumentIngestionJob : processes
  DocumentChunk ||--o{ Embedding : embeds
  UserProfile ||--o{ Embedding : owns

  UserProfile ||--o{ Conversation : starts
  Conversation ||--o{ Message : stores

  UserProfile ||--o{ Project : owns
  Project ||--o{ Artifact : groups
  UserProfile ||--o{ Artifact : owns
  UserProfile ||--o{ PlannerEvent : owns
  UserProfile ||--o{ StickyNote : owns
  UserProfile ||--o{ Whiteboard : owns
  UserProfile ||--o{ VideoBookmark : owns
  UserProfile ||--o{ FileItem : owns
  UserProfile ||--o{ FocusSession : owns

  Achievement ||--o{ UserAchievement : grants
  UserProfile ||--o{ UserAchievement : earns
  UserProfile ||--|| NotificationPreference : configures
```

## Major Domains

- Profile: `UserProfile`, `EducationHistory`, `UserSkill`, `UserGoal`.
- Documents: `DocumentFolder`, `Document`, `DocumentChunk`, `DocumentIngestionJob`.
- AI/RAG foundation: `Embedding`, `Conversation`, `Message`.
- Planning: `CareerRoadmap`, `UserGoal`.
- Gamification: `Achievement`, `UserAchievement`.
- Notifications: `NotificationPreference`.
- Legacy-compatible workspace: `Project`, `Artifact`, `PlannerEvent`, `StickyNote`, `Whiteboard`, `VideoBookmark`, `FileItem`, `FocusSession`.

