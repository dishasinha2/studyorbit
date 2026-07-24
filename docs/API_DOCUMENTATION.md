# API Documentation

All protected endpoints require either:

- `Authorization: Bearer <Supabase access token>`
- `x-user-id: <demo id>` for local demo/testing mode

## Profile

### `GET /api/profile`

Returns the authenticated user profile, career fields, preferences, stats, recent activity, and focus trend.

### `PATCH /api/profile`

Updates profile and career fields.

Body:

```json
{
  "name": "Ada Lovelace",
  "age": 21,
  "education": "Undergraduate",
  "college": "Example College",
  "degree": "B.Tech Computer Science",
  "skills": ["TypeScript", "SQL"],
  "interests": ["AI", "Product"],
  "careerGoals": ["Become an AI Engineer"],
  "linkedinUrl": "https://www.linkedin.com/in/example",
  "githubUrl": "https://github.com/example"
}
```

## Career Profile Management

### `GET /api/career/education`

Lists education history.

### `POST /api/career/education`

Creates an education entry.

### `GET /api/career/skills`

Lists skills.

### `POST /api/career/skills`

Creates or updates a skill.

### `GET /api/career/goals`

Lists user career goals.

### `POST /api/career/goals`

Creates a user goal.

## Document Management

### `GET /api/documents`

Query parameters:

- `q`
- `type`
- `folderId`
- `favorite=true`
- `category`
- `sort=new|old|az`

### `POST /api/documents`

Multipart upload. Supported files:

- PDF
- DOCX
- TXT
- MD

Fields:

- `file`
- `name`
- `type`
- `folderId`
- `category`
- `tags`
- `summary`

### `PATCH /api/documents?id=<documentId>`

Updates document metadata.

### `GET /api/documents/:id`

Returns document metadata, chunks, and ingestion jobs.

### `DELETE /api/documents/:id`

Deletes a document and related chunks/embeddings/jobs.

### `GET /api/documents/:id/download`

Downloads stored document bytes.

### `GET /api/documents/folders`

Lists document folders.

### `POST /api/documents/folders`

Creates a folder.

## AI/RAG Infrastructure

### `POST /api/ai/ingestion`

Runs provider-agnostic placeholder ingestion for a document.

Body:

```json
{ "documentId": "doc_id" }
```

Current behavior:

- Extracts plain text for TXT/MD files.
- Creates document chunks.
- Creates an ingestion job.
- Does not call an LLM or embedding provider.

### `GET /api/ai/conversations`

Lists chat memory sessions.

### `POST /api/ai/conversations`

Creates a chat memory session.

### `GET /api/ai/conversations/:id/messages`

Lists messages.

### `POST /api/ai/conversations/:id/messages`

Stores a message. No LLM generation is performed.

