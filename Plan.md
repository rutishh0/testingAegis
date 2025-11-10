001 | Project Aegis Execution Ledger
002 | Purpose: Persist a living roadmap documenting completed work, in-flight tasks, and future milestones for Project Aegis across backend, client, admin, crypto, and operations domains.
003 | Scope: Entire product lifecycle derived from Docs.md PRD/TRD plus emerging implementation details.
004 | Author: GPT-5 Codex acting as collaborative agent with Rutishkrishna.
005 | Last Updated: Pending automated updates per task completion.
006 | Minimum Length Requirement: 500 lines (fulfilled by this ledger).
007 | Formatting Convention: Each line begins with a numeric index for traceability.
008 | Status Legends: [x] complete, [ ] pending, [~] in progress, [>] blocked, [*] informational.
009 | Dependencies: Items note upstream/downstream relationships.
010 | Review Cadence: Update after each substantial change set to keep backlog accurate.
011 | ---
012 | SECTION A: META INFORMATION
013 | [*] A-001 Document owner remains GPT-5 Codex unless reassigned by user.
014 | [*] A-002 Review history resets when user opens new chat; this file preserves continuity.
015 | [*] A-003 All timestamps referenced are relative to system clock unless otherwise mentioned.
016 | [*] A-004 Environment tracked: Windows 11, Powershell shell, workspace at C:\Users\Rutishkrishna\Desktop\Proto\Aegis.
017 | [*] A-005 Crypto policy: No private keys stored in repo; admin secret must stay offline.
018 | [*] A-006 Backend stack: Node.js, Express, Socket.io, PostgreSQL (pg), tweetnacl, argon2, jsonwebtoken.
019 | [*] A-007 Client/Admin stack (planned): React with Vite, shared component strategies.
020 | [*] A-008 Real-time messaging spec uses Socket.io for WebSocket abstraction.
021 | [*] A-009 Database schema anchored by schema.sql committed earlier.
022 | [*] A-010 Security principle: Zero-knowledge server with hybrid admin capability.
023 | ---
024 | SECTION B: COMPLETED MILESTONES (BACKLOG ID PREFIX CM)
025 | [x] CM-001 Initial dependency manifest created in package.json with Express, Socket.io, pg, tweetnacl, argon2, jsonwebtoken.
026 |      Context: Derived from Docs.md TRD recommended stack.
027 |      Definition of Done: package.json present, dependencies declared, start script defined.
028 |      Evidence: package.json in repository root.
029 | [x] CM-002 Database schema scripted in schema.sql with users, admin_config, messages tables.
030 |      Context: Implements TRD Section 2.3.
031 |      Definition of Done: SQL file includes CREATE TABLE statements and extensions.
032 |      Evidence: schema.sql committed with necessary structures.
033 | [x] CM-003 Admin key generation utility implemented in generateAdminKeys.js.
034 |      Context: Satisfies TRD Step 3.2 requirement for one-time admin key creation.
035 |      Definition of Done: Node script outputs base64 keys and warns about secret storage.
036 |      Evidence: generateAdminKeys.js in project root.
037 | [x] CM-004 Backend server scaffolded in server.js with Express app, Socket.io integration, and PostgreSQL pool.
038 |      Context: Foundational step for backend foundation plan item.
039 |      Definition of Done: server listens on port, exports app/httpServer/io/pool.
040 |      Evidence: server.js contains stub endpoints and connection logic.
041 | [x] CM-005 POST /api/v1/auth/register endpoint implemented with Argon2 password hashing and user persistence.
042 |      Context: Implements TRD Step 3.2 server responsibilities.
043 |      Definition of Done: Endpoint validates input, hashes password, handles conflicts, returns created user.
044 |      Evidence: server.js registerUser function returning 201 on success.
045 | [x] CM-006 POST /api/v1/auth/login implemented with JWT issuance and environment-based secret validation.
046 |      Context: Fulfills BF-A-001 and BF-A-002 tasks using argon2.verify and jsonwebtoken.
047 |      Definition of Done: Endpoint validates input, verifies password, signs token, returns user info.
048 |      Evidence: server.js loginUser function invoking signAccessToken helper.
049 | [x] CM-007 JWT authentication middleware and GET /api/v1/auth/me endpoint implemented.
050 |      Context: Completes BF-A-003 and BF-A-004 delivering authenticated profile retrieval.
051 |      Definition of Done: Middleware validates Bearer token, loads user, me endpoint returns profile.
052 |      Evidence: server.js authenticate middleware + getAuthenticatedUser handler.
053 | [x] CM-008 Message history retrieval and send endpoints implemented with Socket.io broadcasting.
054 |      Context: Delivers BF-M-001 through BF-M-003 and BF-M-008 for user conversations.
055 |      Definition of Done: GET /messages/:userId and POST /messages functional, emitting real-time events.
056 |      Evidence: server.js getUserMessages/postMessage handlers and io.to(...) emissions.
057 | [x] CM-009 Admin messages endpoint with dedicated authentication token.
058 |      Context: Delivers BF-M-005 and introduces ADMIN_API_TOKEN security control.
059 |      Definition of Done: Admin-only GET /admin/messages guarded by middleware and joins Socket.io room.
060 |      Evidence: server.js authenticateAdmin, getAllMessagesForAdmin, admin:join socket handler.
061 | [x] CM-010 Environment config, database scripts, and test harness established.
062 |      Context: Fulfills BF-I-001 through BF-I-003, BF-I-006, BF-I-010, and OP-001/OP-003.
063 |      Definition of Done: dotenv integration, env.example, db init/seed scripts, Jest health test.
064 |      Evidence: server.js dotenv usage, env.example, scripts/db/*, tests/health.test.js, package.json scripts.
065 | [x] CM-011 Client SPA MVP delivering registration, login, user directory, and chat flows.
066 |      Context: Completes CL-001 through CL-010 with Vite React app, Argon2 key handling, and Socket.io client.
067 |      Definition of Done: Frontend project scaffolding, AuthContext, pages for login/register/chat, live messaging.
068 |      Evidence: client/ directory with React app, crypto services, AuthContext, ChatPage implementing encryption.
069 | [x] CM-012 Admin SPA moderation portal with secure token auth and on-device decryption.
070 |      Context: Completes AD-001 through AD-006 and AD-011 via Vite-powered admin app and Socket.io channel.
071 |      Definition of Done: Admin login, secret key import, conversation selector, live decrypted viewer.
072 |      Evidence: admin/ directory with AdminContext, SecretKeyManager, ConversationTable, DashboardPage.
[x] CM-013 Dockerized backend and local stack bootstrap.
     Context: Kicks off Ops & DX backlog with containerization per OP-002.
     Definition of Done: Dockerfile, compose stack, wait-for-db script, developer instructions.
     Evidence: Dockerfile, docker-compose.yml, scripts/db/waitForDb.js, README.md Docker section.
069 | ---
066 | SECTION C: BACKEND FOUNDATION - AUTHENTICATION (BACKLOG ID PREFIX BF-A)
067 | Summary: Implement secure authentication pipeline including login, JWT issuance, protected route middleware, and me endpoint.
068 | [x] BF-A-001 Implement POST /api/v1/auth/login verifying credentials and issuing JWT.
069 |      Context: Uses argon2 verify on stored hash and returns JWT token plus user essentials.
070 |      Definition of Done: Successful response includes token, userId, username, publicKey, encryptedPrivateKey.
071 |      Status Note: Completed via loginUser in server.js with signAccessToken helper.
072 | [x] BF-A-002 Create JWT signing utility referencing process.env.JWT_SECRET.
073 |      Context: Centralizes token generation and expiration policy.
074 |      Definition of Done: Utility handles missing secret gracefully and logs safe errors.
075 |      Status Note: Completed via getJwtSecret + signAccessToken helpers.
076 | [x] BF-A-003 Implement JWT verification middleware for protected routes.
077 |      Context: Required for /auth/me, /users, /messages endpoints.
078 |      Definition of Done: Middleware decodes token, loads user context, handles errors.
079 |      Status Note: Completed via authenticate middleware in server.js.
080 | [x] BF-A-004 Implement GET /api/v1/auth/me returning authenticated user profile with encryptedPrivateKey.
081 |      Context: Follows TRD Step 3.4 server response.
082 |      Definition of Done: Endpoint requires JWT, returns sanitized user object.
083 |      Status Note: Implemented getAuthenticatedUser returning profile fields.
084 | [x] BF-A-005 Decide on JWT expiration policy and refresh approach.
085 |      Context: Determine default expiration (e.g., 24h) and documentation.
086 |      Definition of Done: Configurable via env var with sensible default.
087 |      Status Note: Completed via signAccessToken using JWT_EXPIRES_IN env (default 24h).
088 | [x] BF-A-006 Implement error normalization for auth routes.
089 |      Context: Provide consistent responses to invalid credentials/missing fields.
090 |      Definition of Done: Shared helper ensures no sensitive info leaked.
091 |      Status Note: Completed via createHttpError wrapping in register/login catch blocks to sanitize 500 responses.
092 | [x] BF-A-007 Add logging hooks for auth success/failure without storing raw passwords.
093 |      Context: Observability requirement.
094 |      Definition of Done: Use console/info wrappers or integrate future logger.
095 |      Status Note: Completed with logger.info/warn instrumentation in register/login handlers.
096 | [x] BF-A-008 Document auth flow in README or inline comments referencing Docs.md.
097 |      Context: Maintains developer understanding.
098 |      Definition of Done: Comments or doc section summarizing steps.
099 |      Status Note: Completed with inline documentation in server.js and auth flow section in README.
100 | [x] BF-A-009 Add basic integration test for register/login cycle (future).
101 |      Context: Ensures hashed password + JWT handshake works end-to-end.
102 |      Definition of Done: Test suite using supertest or similar.
103 |      Status Note: Completed with tests/auth.test.js covering register/login success, invalid password, and duplicate registration.
104 | [ ] BF-A-010 Prepare fallback for account lockouts or suspicious activity (documentation placeholder).
105 |      Context: Security best practice.
106 |      Definition of Done: Document guidelines even if not implemented yet.
107 |      Status Note: Pending documentation.
108 | [x] BF-A-011 Evaluate rate limiting for auth endpoints (future improvement).
109 |      Context: Prevent brute-force attempts.
110 |      Definition of Done: Add plan note with candidate libraries.
111 |      Status Note: Completed with express-rate-limit (15m/20 requests) applied to register/login endpoints.
112 | [x] BF-A-012 Ensure password length and complexity validation at server side.
113 |      Context: Security baseline complementing client checks.
114 |      Definition of Done: Implement in register/login validators.
115 |      Status Note: Completed with regex-based complexity enforcement in register handler.
116 | ---
117 | SECTION C.1: BACKEND FOUNDATION - CONFIG & DIRECTORY (BACKLOG ID PREFIX BF-C)
118 | Summary: Provide endpoints that expose admin public key and user directory while respecting access controls.
119 | [x] BF-C-001 Implement GET /api/v1/config returning admin public key.
120 |      Context: Supports client key exchange per TRD Step 3.4.
121 |      Definition of Done: Endpoint queries admin_config, handles missing row gracefully.
122 |      Status Note: Completed via getPublicConfig handler in server.js.
123 | [x] BF-C-002 Implement GET /api/v1/users returning list of users with public keys (auth required).
124 |      Context: Enables user discovery per PRD Section 1.3.
125 |      Definition of Done: Endpoint requires JWT, returns array of { userId, username, publicKey }.
126 |      Status Note: Completed via listUsers handler guarded by authenticate middleware.
127 | [ ] BF-C-003 Document API contract for config and users endpoints.
128 |      Context: Provide reference for frontend integration.
129 |      Definition of Done: Add section to docs or inline JSDoc.
130 |      Status Note: Pending documentation update.
131 | [ ] BF-C-004 Add caching strategy note for config endpoint (future optimization).
132 |      Context: Admin public key rarely changes.
133 |      Definition of Done: Document approach (e.g., in-memory cache, CDN).
134 |      Status Note: Pending planning.
135 | ---
117 | SECTION D: BACKEND FOUNDATION - MESSAGING CRUD (BACKLOG ID PREFIX BF-M)
118 | Summary: Implement message retrieval and persistence endpoints aligning with TRD Step 3.5 and 3.6.
119 | [x] BF-M-001 Implement GET /api/v1/messages/:userId to return ordered message history.
120 |      Context: Authenticated user-only, returns payloads and metadata.
121 |      Definition of Done: Query filtered by (sender, recipient) pair, sorted by sent_at.
122 |      Status Note: Completed via getUserMessages handler.
123 | [x] BF-M-002 Validate that requester is part of conversation for /messages/:userId.
124 |      Context: Security to prevent unauthorized data access.
125 |      Definition of Done: Server ensures userId matches sender or recipient.
126 |      Status Note: Achieved with SQL filter referencing authenticated user id.
127 | [x] BF-M-003 Implement POST /api/v1/messages to insert encrypted payloads and nonce.
128 |      Context: Persists both recipient and admin payloads per TRD.
129 |      Definition of Done: Endpoint validates body, stores record, triggers Socket.io emit.
130 |      Status Note: Implemented in postMessage handler with validation and broadcasting.
131 | [ ] BF-M-004 Ensure POST /messages validates nonce uniqueness per message (no duplicates).
132 |      Context: Security requirement to prevent nonce reuse detection.
133 |      Definition of Done: Document assumption; optionally enforce via unique constraint or check.
134 |      Status Note: Evaluate approach.
135 | [x] BF-M-005 Implement admin-only GET /api/v1/admin/messages returning all messages.
136 |      Context: Supports admin panel moderation view.
137 |      Definition of Done: Endpoint requires admin auth scheme; returns data sorted by sent_at.
138 |      Status Note: Completed with authenticateAdmin middleware and admin query.
139 | [ ] BF-M-006 Add pagination support for message endpoints (document even if not implemented).
140 |      Context: Future scaling consideration.
141 |      Definition of Done: Document plan for limit/offset parameters.
142 |      Status Note: Pending documentation.
143 | [ ] BF-M-007 Introduce message service module to encapsulate DB operations.
144 |      Context: Maintainable code structure.
145 |      Definition of Done: Module exports functions for create/find operations.
146 |      Status Note: Pending.
147 | [x] BF-M-008 Handle Socket.io event emission for message creation.
148 |      Context: Real-time updates to recipient and optionally admin.
149 |      Definition of Done: `io.emit` or namespace-specific emission triggered after insert.
150 |      Status Note: Completed using io.to(...) in postMessage.
151 | [ ] BF-M-009 Document API response schemas for messaging routes.
152 |      Context: Provide contract for frontend teams.
153 |      Definition of Done: Inline JSDoc or dedicated markdown.
154 |      Status Note: Pending.
155 | [ ] BF-M-010 Develop integration tests for message send/receive logic.
156 |      Context: Ensures DB + websocket flow functions.
157 |      Definition of Done: Integration suite verifying persistence and emission.
158 |      Status Note: Pending.
159 | [ ] BF-M-011 Add auditing hooks (future) for admin oversight when messages fetched.
160 |      Context: Compliance requirement.
161 |      Definition of Done: Document plan for logging.
162 |      Status Note: Pending documentation.
163 | [ ] BF-M-012 Review DB indices for messages table (sender_id, recipient_id, sent_at).
164 |      Context: Performance optimization.
165 |      Definition of Done: Index added or plan documented.
166 |      Status Note: Pending.
167 | ---
168 | SECTION E: BACKEND FOUNDATION - REAL-TIME & SERVICES (BACKLOG ID PREFIX BF-R)
169 | Summary: Configure Socket.io flows, service abstractions, and event contracts.
170 | [x] BF-R-001 Define Socket.io namespaces/rooms for user sessions.
171 |      Context: Decide on per-user rooms keyed by userId.
172 |      Definition of Done: Code registers user to room upon connection after auth.
173 |      Status Note: Completed via auth:join handler joining decoded.sub room.
174 | [x] BF-R-002 Implement Socket.io authentication handshake leveraging JWT.
175 |      Context: Validate token on connection for secure messaging.
176 |      Definition of Done: Middleware attaches user info to socket.
177 |      Status Note: Implemented through auth:join event verifying JWT and acknowledging join.
178 | [x] BF-R-003 Broadcast new message events to recipient room and optional admin channel.
179 |      Context: Align with TRD requirement for admin access.
180 |      Definition of Done: Emission triggered post DB insert.
181 |      Status Note: Completed via io.to(recipientId|senderId|'admin') in postMessage.
182 | [x] BF-R-004 Handle disconnection cleanup and logging.
183 |      Context: Observability and resource management.
184 |      Definition of Done: Log reason, update metrics (if any).
185 |      Status Note: Implemented with disconnect console log.
186 | [ ] BF-R-005 Document Socket.io event schema (message:new, message:history, etc.).
187 |      Context: Provide contract for client teams.
188 |      Definition of Done: Markdown section or inline docs.
189 |      Status Note: Pending.
190 | [x] BF-R-006 Implement server-to-admin event bridging when admin online.
191 |      Context: Admin panel real-time updates.
192 |      Definition of Done: When admin socket connected, receives all new messages.
193 |      Status Note: Completed with admin:join event joining 'admin' room and message broadcasts.
194 | [ ] BF-R-007 Plan for message acknowledgement (if necessary) to ensure reliable delivery.
195 |      Context: Determine need for ack/resend strategy.
196 |      Definition of Done: Document approach.
197 |      Status Note: Pending documentation.
198 | [ ] BF-R-008 Evaluate rate limiting or throttling at Socket level.
199 |      Context: Prevent abuse.
200 |      Definition of Done: Document or implement guard.
201 |      Status Note: Pending.
202 | [ ] BF-R-009 Establish unit tests/mocks for Socket.io handlers.
203 |      Context: Ensure event logic testable.
204 |      Definition of Done: Test coverage established or plan documented.
205 |      Status Note: Pending.
206 | [ ] BF-R-010 Integrate heartbeat/ping to detect stale connections (if needed).
207 |      Context: Performance/troubleshooting.
208 |      Definition of Done: Document or implement.
209 |      Status Note: Pending.
210 | [ ] BF-R-011 Align Socket event naming with REST endpoints for clarity.
211 |      Context: Developer experience improvement.
212 |      Definition of Done: Document mapping table.
213 |      Status Note: Pending.
214 | [ ] BF-R-012 Document instructions for local testing of Socket.io (using dev tools or sample client).
215 |      Context: Assist developers.
216 |      Definition of Done: Step-by-step instructions recorded.
217 |      Status Note: Pending.
218 | ---
219 | SECTION F: BACKEND FOUNDATION - INFRASTRUCTURE & UTILITIES (BACKLOG ID PREFIX BF-I)
220 | Summary: Configuration management, logging, migrations, and testing scaffolds.
221 | [x] BF-I-001 Introduce dotenv configuration loader and document environment variables.
222 |      Context: Manage DATABASE_URL, JWT_SECRET, DB_SSL, PORT, CORS_ORIGIN.
223 |      Definition of Done: dotenv integrated, sample .env.example created.
224 |      Status Note: Completed via require('dotenv').config() and env.example file.
225 | [x] BF-I-002 Create migration bootstrap (possibly using node-postgres or simple scripts).
226 |      Context: Provide path to initialize schema.sql automatically.
227 |      Definition of Done: Script or instructions to apply schema.
228 |      Status Note: Completed using scripts/db/init.js with npm run db:init.
229 | [x] BF-I-003 Add seed script for admin_config row using admin public key.
230 |      Context: Support initial setup.
231 |      Definition of Done: Script takes env var or argument to insert key.
232 |      Status Note: Completed via scripts/db/seedAdminConfig.js using ADMIN_PUBLIC_KEY env.
233 | [x] BF-I-004 Implement structured logging utility (console wrapper).
234 |      Context: Standardize log format.
235 |      Definition of Done: Utility exported and used in server.
236 |      Status Note: Completed with utils/logger.js and server.js migration to logger calls.
237 | [x] BF-I-005 Introduce centralized error handler middleware.
238 |      Context: Clean error responses and logging.
239 |      Definition of Done: Express error handler capturing thrown errors.
240 |      Status Note: Completed with utils/errorHandler.js and global app.use(errorHandler) wiring.
241 | [x] BF-I-006 Add health check enhancements (DB connectivity verification).
242 |      Context: Provide more robust /health endpoint.
243 |      Definition of Done: Endpoint checks pool.query('SELECT 1').
244 |      Status Note: Completed with async SELECT 1 as result check and standardized success response.
245 | [x] BF-I-007 Document environment setup in README (Node version, Postgres, etc.).
246 |      Context: Developer onboarding.
247 |      Definition of Done: README updates with clear steps.
248 |      Status Note: Completed with backend environment setup section covering .env creation, DB provisioning, and admin key guidance.
249 | [x] BF-I-008 Evaluate use of pg connection pooling parameters (max, idleTimeout).
250 |      Context: Production readiness.
251 |      Definition of Done: Document or configure defaults.
252 |      Status Note: Completed with configurable pool settings and production recommendations in server.js.
253 | [x] BF-I-009 Establish linting/formatting config (ESLint, Prettier).
254 |      Context: Code quality.
255 |      Definition of Done: Config files added, npm scripts updated.
256 |      Status Note: Completed with .eslintrc.json, .prettierrc.json, and lint/format npm scripts.
257 | [x] BF-I-010 Set up test harness (Jest or Vitest) for backend.
258 |      Context: Automated testing baseline.
259 |      Definition of Done: Tests run via npm script, sample test created.
260 |      Status Note: Completed via Jest + supertest harness and tests/health.test.js.
261 | [ ] BF-I-011 Document deployment considerations (env variables, migrations, scaling).
262 |      Context: Future operations.
263 |      Definition of Done: Section in docs.
264 |      Status Note: Pending.
265 | [ ] BF-I-012 Research clustering/worker strategy for Node server (if needed).
266 |      Context: Scalability.
267 |      Definition of Done: Document recommendation (e.g., PM2, Node cluster).
268 |      Status Note: Pending.
269 | ---
270 | SECTION G: CLIENT SPA (BACKLOG ID PREFIX CL)
271 | Summary: User-facing web app performing client-side cryptography and messaging.
272 | [x] CL-001 Scaffold Vite + React project for user client.
273 |      Context: Align with TRD recommendation.
274 |      Definition of Done: Vite project created, start script works.
275 |      Status Note: Completed via client/ directory with Vite config.
276 | [x] CL-002 Establish routing structure (login, register, chat list, chat view).
277 |      Context: Basic navigation.
278 |      Definition of Done: React Router configured.
279 |      Status Note: Completed with router.tsx and App shell.
280 | [x] CL-003 Implement registration form generating NaCl keypair and performing Argon2 key wrap.
281 |      Context: TRD Step 3.2 client responsibilities.
282 |      Definition of Done: Form submits to /auth/register with correct payload.
283 |      Status Note: Completed through AuthContext.register + RegisterPage.
284 | [x] CL-004 Implement login screen performing Argon2 derivation and decrypting encryptedPrivateKey.
285 |      Context: TRD Step 3.4.
286 |      Definition of Done: On success, store secret key in memory, navigate to chat.
287 |      Status Note: Completed via AuthContext.login and LoginPage.
288 | [x] CL-005 Build user directory UI fetching /api/v1/users.
289 |      Context: TRD Section 1.3 user discovery.
290 |      Definition of Done: List of users, ability to start chat.
291 |      Status Note: Completed in ChatPage sidebar.
292 | [x] CL-006 Implement chat UI with real-time message handling via Socket.io.
293 |      Context: TRD Step 3.5 and 3.6.
294 |      Definition of Done: Send/receive messages with encryption/decryption.
295 |      Status Note: Completed with ChatPage messaging logic.
296 | [x] CL-007 Manage local state for decrypted messages, caching minimal plaintext.
297 |      Context: Client security.
298 |      Definition of Done: Use state management (Context or Zustand).
299 |      Status Note: Completed using React state and in-memory sent cache.
300 | [x] CL-008 Implement secure storage for JWT (memory or secure storage).
301 |      Context: Avoid XSS vulnerabilities.
302 |      Definition of Done: Document approach and implement.
303 |      Status Note: Completed using memory-only AuthContext state (no persistent storage).
304 | [x] CL-009 Add logout flow clearing memory-held secret keys.
305 |      Context: Security hygiene.
306 |      Definition of Done: Logout resets state, disconnects socket.
307 |      Status Note: Completed via AuthContext.logout.
308 | [ ] CL-010 Implement error boundaries and toast notifications.
309 |      Context: UX feedback.
310 |      Definition of Done: Global error handling component added.
311 |      Status Note: Pending (currently using inline error banners).
312 | [ ] CL-011 Document manual testing checklist for client features.
313 |      Context: QA support.
314 |      Definition of Done: Markdown list created.
315 |      Status Note: Pending.
316 | [ ] CL-012 Add unit tests for crypto helpers using tweetnacl.
317 |      Context: Ensure encryption/decryption works as expected.
318 |      Definition of Done: Jest/Vitest tests verifying conversions.
319 |      Status Note: Pending.
320 | ---
321 | SECTION H: ADMIN SPA (BACKLOG ID PREFIX AD)
322 | Summary: Dedicated interface for master administrator with offline secret key usage.
323 | [x] AD-001 Scaffold React admin application (could share monorepo structure).
324 |      Context: TRD requirement for separate interface.
325 |      Definition of Done: Admin app builds and serves independently.
326 |      Status Note: Completed with Vite-powered admin/ project structure.
327 | [x] AD-002 Implement secure login for admin (credentials separate from user auth).
328 |      Context: Need distinct auth scheme (could be environment-provided).
329 |      Definition of Done: Admin obtains session token to access APIs.
330 |      Status Note: Completed via AdminProvider token flow and login page.
331 | [x] AD-003 Create admin secret key import UI (paste or file load).
332 |      Context: Admin holds secret key offline until needed.
333 |      Definition of Done: UI stores secret key in memory only.
334 |      Status Note: Completed through SecretKeyManager with paste/file support.
335 | [x] AD-004 Implement conversation selector listing user pairs.
336 |      Context: Allows admin to review any conversation.
337 |      Definition of Done: UI fetches /admin/messages or metadata.
338 |      Status Note: Completed using ConversationTable grouping.
339 | [x] AD-005 Decrypt payload_admin using nacl.box.open with admin secret key.
340 |      Context: TRD Step 3.7.
341 |      Definition of Done: Plaintext displayed after decryption.
342 |      Status Note: Completed via useAdminDecryption helper.
343 | [x] AD-006 Provide search/filter capabilities for admin conversation view.
344 |      Context: Scalability of moderation efforts.
345 |      Definition of Done: UI can filter by user or keyword (plaintext search).
346 |      Status Note: Completed with ConversationTable filter input.
347 | [ ] AD-007 Implement audit log viewer (future).
348 |      Context: Track admin activity.
349 |      Definition of Done: Display logs or plan for them.
350 |      Status Note: Pending documentation.
351 | [ ] AD-008 Document admin security guidelines (secret key handling, session management).
352 |      Context: Operational best practices.
353 |      Definition of Done: README section or admin docs.
354 |      Status Note: Pending.
355 | [ ] AD-009 Add integration tests for admin decryption flow (future).
356 |      Context: Validate handshake.
357 |      Definition of Done: Tests verifying payload_admin decryption.
358 |      Status Note: Pending.
359 | [ ] AD-010 Evaluate multi-admin support (future backlog).
360 |      Context: Potential feature expansion.
361 |      Definition of Done: Document design considerations.
362 |      Status Note: Pending documentation.
363 | [x] AD-011 Add real-time updates for admin panel when new messages arrive.
364 |      Context: Align with monitoring functionality.
365 |      Definition of Done: Socket connection for admin.
366 |      Status Note: Completed via Socket.io admin:join channel in AdminProvider.
367 | [ ] AD-012 Provide export/report capability (future enhancement).
368 |      Context: Compliance.
369 |      Definition of Done: Document or implement CSV export.
370 |      Status Note: Pending documentation.
371 | ---
372 | SECTION I: CRYPTO UTILITIES (BACKLOG ID PREFIX CU)
373 | Summary: Shared utilities for key handling, encoding, nonce management, and security hygiene.
374 | [x] CU-001 Create shared module for base64 <-> Uint8Array conversions.
375 |      Context: Reduce duplication across client/admin.
376 |      Definition of Done: Module exported with tests.
377 |      Status Note: Completed via shared/crypto encodeBase64/decodeBase64 utilities.
378 | [x] CU-002 Implement helper to generate nacl nonce and validate size.
379 |      Context: Ensure consistent nonce generation.
380 |      Definition of Done: Utility ensures unique nonce per message.
381 |      Status Note: Completed with generateNonce() in shared/crypto.
382 | [x] CU-003 Provide wrapper for nacl.box encryption/decryption with error handling.
383 |      Context: Simplify usage.
384 |      Definition of Done: Functions throw descriptive errors without leaking plaintext.
385 |      Status Note: Completed using boxEncryptToBase64 and boxDecryptFromBase64 helpers.
386 | [ ] CU-004 Document recommended entropy sources and safeguards.
387 |      Context: Security best practice.
388 |      Definition of Done: Doc lines referencing libsodium guidance.
389 |      Status Note: Pending.
390 | [ ] CU-005 Evaluate secure storage for admin secret key (client-side).
391 |      Context: Provide guidelines for admin UI.
392 |      Definition of Done: Document options like session file or hardware key.
393 |      Status Note: Pending documentation.
394 | [ ] CU-006 Add tests verifying encryption/decryption compatibility across client/admin.
395 |      Context: Regression prevention.
396 |      Definition of Done: Cross-app compatibility test plan.
397 |      Status Note: Pending.
398 | [ ] CU-007 Create fallback for password-based key derivation parameters (argon2 options).
399 |      Context: Ensure consistent derivation across platforms.
400 |      Definition of Done: Document recommended argon2 configuration.
401 |      Status Note: Pending.
402 | [ ] CU-008 Provide sanitization utilities for zeroing sensitive buffers after use (if feasible).
403 |      Context: Memory hygiene.
404 |      Definition of Done: Utilities zero out Uint8Arrays when done.
405 |      Status Note: Pending.
406 | [ ] CU-009 Document approach for handling message attachments (out of scope but plan).
407 |      Context: Future extension.
408 |      Definition of Done: Outline encryption approach even if not built now.
409 |      Status Note: Pending documentation.
410 | [ ] CU-010 Evaluate using WebCrypto vs tweetnacl for potential future compatibility.
411 |      Context: Considerations for browser support.
412 |      Definition of Done: Document tradeoffs.
413 |      Status Note: Pending documentation.
414 | [ ] CU-011 Determine secure random source for Node admin scripts.
415 |      Context: Node environment uses nacl randomBytes; confirm sufficiency.
416 |      Definition of Done: Document or test randomness.
417 |      Status Note: Pending.
418 | [ ] CU-012 Maintain glossary of crypto terms specific to Aegis.
419 |      Context: Onboarding tool.
420 |      Definition of Done: Glossary appended to docs.
421 |      Status Note: Pending documentation.
422 | ---
423 | SECTION J: OPS & DEVELOPER EXPERIENCE (BACKLOG ID PREFIX OP)
424 | Summary: Tooling, deployment, CI/CD, and developer workflow improvements.
425 | [x] OP-001 Create env.example capturing required configuration variables.
426 |      Context: Align with BF-I-001 but tracked separately for documentation.
427 |      Definition of Done: File present with comments.
428 |      Status Note: Completed with env.example enumerating DATABASE_URL, JWT_SECRET, ADMIN_API_TOKEN, etc.
429 | [x] OP-002 Draft Dockerfile and docker-compose for backend + Postgres.
430 |      Context: Simplifies local setup.
431 |      Definition of Done: Compose spins up API and DB, instructions provided.
432 |      Status Note: Completed with Dockerfile, .dockerignore, README instructions, wait-for-db script.
433 | [x] OP-003 Configure npm scripts for lint, test, dev, prod.
434 |      Context: Developer workflow.
435 |      Definition of Done: Scripts documented and functional.
436 |      Status Note: Completed with package.json scripts for start, dev, test, db:init, db:seed:admin.
437 | [ ] OP-004 Integrate Husky or similar for pre-commit lint/test hooks.
438 |      Context: Code quality enforcement.
439 |      Definition of Done: Hooks configured and documented.
440 |      Status Note: Pending.
441 | [ ] OP-005 Set up CI pipeline (GitHub Actions or alternative) for backend tests.
442 |      Context: Continuous integration.
443 |      Definition of Done: Workflow file committed, builds succeed.
444 |      Status Note: Pending.
445 | [ ] OP-006 Document deployment procedure (production vs staging).
446 |      Context: Ops readiness.
447 |      Definition of Done: Markdown doc describing steps.
448 |      Status Note: Pending.
449 | [ ] OP-007 Evaluate logging/monitoring stack (e.g., Winston + ELK).
450 |      Context: Observability.
451 |      Definition of Done: Document recommended stack.
452 |      Status Note: Pending.
453 | [ ] OP-008 Plan backup/restore procedures for Postgres database.
454 |      Context: Disaster recovery.
455 |      Definition of Done: Document schedule and tools.
456 |      Status Note: Pending.
457 | [ ] OP-009 Establish coding guidelines (style, commit conventions).
458 |      Context: Collaboration hygiene.
459 |      Definition of Done: Document guidelines in CONTRIBUTING.md.
460 |      Status Note: Pending.
461 | [ ] OP-010 Provide manual testing checklist for backend endpoints.
462 |      Context: QA reference.
463 |      Definition of Done: Document scenario list.
464 |      Status Note: Pending.
465 | [ ] OP-011 Evaluate feature flag system for future toggles.
466 |      Context: Controlled rollouts.
467 |      Definition of Done: Document approach or integrate library.
468 |      Status Note: Pending.
469 | [ ] OP-012 Maintain changelog capturing significant updates per release.
470 |      Context: Release management.
471 |      Definition of Done: CHANGELOG.md created and updated.
472 |      Status Note: Pending.
473 | ---
474 | SECTION K: CROSS-CUTTING CONCERNS (BACKLOG ID PREFIX CC)
475 | Summary: Requirements spanning multiple components, such as compliance, accessibility, and documentation.
476 | [ ] CC-001 Document data retention policy aligning with hybrid admin model.
477 |      Context: Clarify retention of encrypted payloads.
478 |      Definition of Done: Policy text added to docs.
479 |      Status Note: Pending.
480 | [ ] CC-002 Assess accessibility requirements for user/admin UIs.
481 |      Context: Inclusive design.
482 |      Definition of Done: Document target WCAG level.
483 |      Status Note: Pending.
484 | [ ] CC-003 Outline privacy policy statements for end users.
485 |      Context: Transparency about admin access.
486 |      Definition of Done: Draft policy snippet.
487 |      Status Note: Pending.
488 | [ ] CC-004 Summarize threat model and mitigation strategies.
489 |      Context: Security planning.
490 |      Definition of Done: Document high-level threat matrix.
491 |      Status Note: Pending.
492 | [ ] CC-005 Plan incident response procedure.
493 |      Context: Operational readiness.
494 |      Definition of Done: Document steps for security incidents.
495 |      Status Note: Pending.
496 | [ ] CC-006 Record encryption algorithm decisions and rationale.
497 |      Context: Crypto governance.
498 |      Definition of Done: Document referencing tweetnacl choice.
499 |      Status Note: Pending.
500 | [ ] CC-007 Create glossary of domain terms (users, admin, payload_recipient).
501 |      Context: Shared understanding.
502 |      Definition of Done: Glossary appended to docs (maps to CU-012).
503 |      Status Note: Pending.
504 | [ ] CC-008 Define performance SLAs for message send/receive.
505 |      Context: Reliability goals.
506 |      Definition of Done: Document metrics and monitoring plan.
507 |      Status Note: Pending.
508 | [ ] CC-009 Evaluate legal considerations for admin-readable messages.
509 |      Context: Compliance.
510 |      Definition of Done: Document consult requirements.
511 |      Status Note: Pending.
512 | [ ] CC-010 Plan localization/internationalization support.
513 |      Context: Future expansion.
514 |      Definition of Done: Document approach for translations.
515 |      Status Note: Pending.
516 | [ ] CC-011 Note data export request handling (user rights).
517 |      Context: Privacy regulation compliance.
518 |      Definition of Done: Document process.
519 |      Status Note: Pending.
520 | [ ] CC-012 List open questions requiring product owner input.
521 |      Context: Clarify ambiguous requirements.
522 |      Definition of Done: Maintain list, update as resolved.
523 |      Status Note: Pending.
524 | ---
525 | SECTION L: TIMELINE & CHECKPOINTS (BACKLOG ID PREFIX TL)
526 | Summary: Proposed sequencing and checkpoints to track momentum.
527 | [x] TL-001 Milestone 1 - Complete backend authentication endpoints (register/login/me) and JWT middleware.
528 |      Context: Align with BF-A tasks.
529 |      Definition of Done: All auth endpoints working, tests drafted.
530 |      Status Note: Completed with loginUser, authenticate middleware, auth/me endpoint.
531 | [x] TL-002 Milestone 2 - Implement messaging CRUD endpoints and Socket.io broadcast.
532 |      Context: Align with BF-M and BF-R tasks.
533 |      Definition of Done: Real-time chat functioning.
534 |      Status Note: Completed via message endpoints and Socket.io broadcasts.
535 | [x] TL-003 Milestone 3 - Add backend infrastructure utilities (config, logging, tests).
536 |      Context: Align with BF-I.
537 |      Definition of Done: Dotenv, migrations, test harness in place.
538 |      Status Note: Completed with dotenv bootstrap, db scripts, Jest health test.
539 | [x] TL-004 Milestone 4 - Deliver user client MVP (registration, login, messaging).
540 |      Context: Align with CL tasks.
541 |      Definition of Done: Client SPA communicates with backend successfully.
542 |      Status Note: Completed with Vite React app, AuthContext, ChatPage integration.
543 | [x] TL-005 Milestone 5 - Deliver admin SPA MVP with conversation decryption.
544 |      Context: Align with AD tasks.
545 |      Definition of Done: Admin can read conversations with secret key.
546 |      Status Note: Completed with admin Dashboard, SecretKeyManager, ConversationTable.
547 | [ ] TL-006 Milestone 6 - Harden crypto utilities and cross-app shared modules.
548 |      Context: Align with CU tasks.
549 |      Definition of Done: Shared libs tested and documented.
550 |      Status Note: Pending.
551 | [ ] TL-007 Milestone 7 - Complete ops & DX enhancements (Docker, CI/CD).
552 |      Context: Align with OP tasks.
553 |      Definition of Done: Automated workflows running.
554 |      Status Note: Pending.
555 | [ ] TL-008 Milestone 8 - Draft compliance and policy documents.
556 |      Context: Align with CC tasks.
557 |      Definition of Done: Policies captured in docs.
558 |      Status Note: Pending.
559 | [ ] TL-009 Milestone 9 - Prepare final MVP demo script and testing summary.
560 |      Context: Showcase readiness.
561 |      Definition of Done: Demo steps written, tests executed.
562 |      Status Note: Pending.
563 | [ ] TL-010 Milestone 10 - Retrospective and iteration planning.
564 |      Context: Evaluate outcomes, plan improvements.
565 |      Definition of Done: Retro document created.
566 |      Status Note: Pending.
567 | [ ] TL-011 Milestone 11 - Security review and penetration testing planning.
568 |      Context: Pre-launch requirement.
569 |      Definition of Done: Plan documented with timelines.
570 |      Status Note: Pending.
571 | [ ] TL-012 Milestone 12 - Production launch readiness checklist.
572 |      Context: Final gating.
573 |      Definition of Done: Checklist signed off.
574 |      Status Note: Pending.
575 | ---
576 | SECTION M: DAILY LOG TEMPLATE (BACKLOG ID PREFIX DL)
577 | Summary: Space to append daily progress notes (use as needed).
578 | [x] DL-001 2025-11-10 Repository review and planning updates.
579 |      Context: Reviewed file structure, Docs.md, and Plan.md; populated resource links and glossary entries.
580 |      Definition of Done: Logged summary of coordination work executed today.
581 |      Status Note: Completed.
582 | [ ] DL-002 Placeholder for daily log entry 2.
583 |      Context: Add date and summary when available.
584 |      Definition of Done: Replace line with actual log.
585 |      Status Note: Pending.
586 | [ ] DL-003 Placeholder for daily log entry 3.
587 |      Context: Add date and summary when available.
588 |      Definition of Done: Replace line with actual log.
589 |      Status Note: Pending.
590 | [ ] DL-004 Placeholder for daily log entry 4.
591 |      Context: Add date and summary when available.
592 |      Definition of Done: Replace line with actual log.
593 |      Status Note: Pending.
594 | [ ] DL-005 Placeholder for daily log entry 5.
595 |      Context: Add date and summary when available.
596 |      Definition of Done: Replace line with actual log.
597 |      Status Note: Pending.
598 | [ ] DL-006 Placeholder for daily log entry 6.
599 |      Context: Add date and summary when available.
600 |      Definition of Done: Replace line with actual log.
601 |      Status Note: Pending.
602 | [ ] DL-007 Placeholder for daily log entry 7.
603 |      Context: Add date and summary when available.
604 |      Definition of Done: Replace line with actual log.
605 |      Status Note: Pending.
606 | [ ] DL-008 Placeholder for daily log entry 8.
607 |      Context: Add date and summary when available.
608 |      Definition of Done: Replace line with actual log.
609 |      Status Note: Pending.
610 | [ ] DL-009 Placeholder for daily log entry 9.
611 |      Context: Add date and summary when available.
612 |      Definition of Done: Replace line with actual log.
613 |      Status Note: Pending.
614 | [ ] DL-010 Placeholder for daily log entry 10.
615 |      Context: Add date and summary when available.
616 |      Definition of Done: Replace line with actual log.
617 |      Status Note: Pending.
618 | [ ] DL-011 Placeholder for daily log entry 11.
619 |      Context: Add date and summary when available.
620 |      Definition of Done: Replace line with actual log.
621 |      Status Note: Pending.
622 | [ ] DL-012 Placeholder for daily log entry 12.
623 |      Context: Add date and summary when available.
624 |      Definition of Done: Replace line with actual log.
625 |      Status Note: Pending.
626 | ---
627 | SECTION N: RESOURCE LINKS & REFERENCES (BACKLOG ID PREFIX RL)
628 | Summary: Curate references for quick access (fill as we gather resources).
629 | [x] RL-001 Link to Docs.md (primary PRD/TRD).
630 |      Context: Already in repo root; reference path `Docs.md`.
631 |      Definition of Done: Hyperlink recorded as `./Docs.md`.
632 |      Status Note: Completed 2025-11-10 after repository review.
633 | [x] RL-002 Link to tweetnacl documentation.
634 |      Context: Crypto functions reference for nacl.box usage.
635 |      Definition of Done: https://github.com/dchest/tweetnacl-js#readme
636 |      Status Note: Completed 2025-11-10.
637 | [x] RL-003 Link to argon2 npm documentation.
638 |      Context: Password hashing reference for backend auth.
639 |      Definition of Done: https://github.com/ranisalt/node-argon2#readme
640 |      Status Note: Completed 2025-11-10.
641 | [x] RL-004 Link to jsonwebtoken usage guide.
642 |      Context: JWT best practices for token issuance.
643 |      Definition of Done: https://github.com/auth0/node-jsonwebtoken#readme
644 |      Status Note: Completed 2025-11-10.
645 | [x] RL-005 Link to pg module documentation.
646 |      Context: Database operations and connection pooling.
647 |      Definition of Done: https://node-postgres.com/
648 |      Status Note: Completed 2025-11-10.
649 | [x] RL-006 Link to Socket.io docs.
650 |      Context: Real-time messaging reference for client/admin.
651 |      Definition of Done: https://socket.io/docs/v4/
652 |      Status Note: Completed 2025-11-10.
653 | [x] RL-007 Link to security best practices (OWASP).
654 |      Context: General security posture guidance.
655 |      Definition of Done: https://owasp.org/www-project-top-ten/
656 |      Status Note: Completed 2025-11-10.
657 | [x] RL-008 Link to PostgreSQL documentation for gen_random_uuid.
658 |      Context: DB function reference for UUID generation.
659 |      Definition of Done: https://www.postgresql.org/docs/current/functions-uuid.html
660 |      Status Note: Completed 2025-11-10.
661 | [x] RL-009 Link to password policy guidelines.
662 |      Context: Auth requirements baseline reference.
663 |      Definition of Done: https://pages.nist.gov/800-63-3/sp800-63b.html
664 |      Status Note: Completed 2025-11-10.
665 | [x] RL-010 Link to WebCrypto API docs (compare with tweetnacl).
666 |      Context: Future evaluation for alternative crypto primitives.
667 |      Definition of Done: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
668 |      Status Note: Completed 2025-11-10.
669 | [x] RL-011 Link to Docker documentation.
670 |      Context: Ops tasks and container management reference.
671 |      Definition of Done: https://docs.docker.com/
672 |      Status Note: Completed 2025-11-10.
673 | [x] RL-012 Link to GitHub Actions documentation.
674 |      Context: CI pipeline planning.
675 |      Definition of Done: https://docs.github.com/en/actions
676 |      Status Note: Completed 2025-11-10.
677 | ---
678 | SECTION O: RISK REGISTER (BACKLOG ID PREFIX RK)
679 | Summary: Track potential risks and mitigation strategies.
680 | [ ] RK-001 Risk: JWT secret misconfiguration.
681 |      Context: Missing secret leads to auth failure.
682 |      Definition of Done: Mitigation plan documented (env validation).
683 |      Status Note: Pending.
684 | [ ] RK-002 Risk: Database connection leaks.
685 |      Context: Improper pool usage could exhaust connections.
686 |      Definition of Done: Mitigation plan (pool usage guidelines).
687 |      Status Note: Pending.
688 | [ ] RK-003 Risk: Non-unique nonce usage.
689 |      Context: Could compromise message security.
690 |      Definition of Done: Mitigation (client enforcement, server checks).
691 |      Status Note: Pending.
692 | [ ] RK-004 Risk: Admin secret key exposure.
693 |      Context: Catastrophic privacy breach.
694 |      Definition of Done: Document handling protocol.
695 |      Status Note: Pending.
696 | [ ] RK-005 Risk: JWT storage vulnerabilities on client.
697 |      Context: XSS risk.
698 |      Definition of Done: Mitigation (memory storage, httpOnly alt).
699 |      Status Note: Pending.
700 | [ ] RK-006 Risk: Real-time message duplication or loss.
701 |      Context: Socket disconnect scenarios.
702 |      Definition of Done: Mitigation plan (retry or ack).
703 |      Status Note: Pending.
704 | [ ] RK-007 Risk: Password brute-force attempts.
705 |      Context: No rate limiting yet.
706 |      Definition of Done: Mitigation (rate limit, captcha).
707 |      Status Note: Pending.
708 | [ ] RK-008 Risk: Database schema changes without migration control.
709 |      Context: Could break production.
710 |      Definition of Done: Mitigation (versioned migrations).
711 |      Status Note: Pending.
712 | [ ] RK-009 Risk: Logging sensitive information.
713 |      Context: Need to scrub logs.
714 |      Definition of Done: Mitigation (logging review).
715 |      Status Note: Pending.
716 | [ ] RK-010 Risk: Time drift affecting token expiry.
717 |      Context: Server/client clocks differ.
718 |      Definition of Done: Mitigation (document expectations).
719 |      Status Note: Pending.
720 | [ ] RK-011 Risk: Missing indices causing performance issues.
721 |      Context: Large message tables.
722 |      Definition of Done: Mitigation (add indices).
723 |      Status Note: Pending.
724 | [ ] RK-012 Risk: Socket authentication bypass.
725 |      Context: Without proper middleware.
726 |      Definition of Done: Mitigation (verify tokens on handshake).
727 |      Status Note: Pending.
728 | ---
729 | SECTION P: GLOSSARY (BACKLOG ID PREFIX GL)
730 | Summary: Define recurring terms for clarity (populate over time).
731 | [x] GL-001 Term Entry: User - standard end user who sends/receives messages.
732 |      Context: Derived from Docs.md Section 1.2 persona summary.
733 |      Definition of Done: Authenticated participant whose device generates and stores their private key while consenting to admin oversight.
734 |      Status Note: Completed 2025-11-10.
735 | [x] GL-002 Term Entry: Admin - master administrator with decryption ability.
736 |      Context: Docs.md Section 1.2 administrator persona.
737 |      Definition of Done: Designated moderator holding an offline master secret key to decrypt any conversation via the admin panel.
738 |      Status Note: Completed 2025-11-10.
739 | [x] GL-003 Term Entry: payload_recipient - encrypted message for recipient.
740 |      Context: TRD Section 2.3 database schema.
741 |      Definition of Done: Base64-encoded nacl.box ciphertext targeted to the recipient’s public key for chat decryption.
742 |      Status Note: Completed 2025-11-10.
743 | [x] GL-004 Term Entry: payload_admin - encrypted message for admin.
744 |      Context: TRD Section 2.3 and crypto flow Step 3.5.
745 |      Definition of Done: Base64-encoded nacl.box ciphertext generated with the admin public key enabling moderation review.
746 |      Status Note: Completed 2025-11-10.
747 | [x] GL-005 Term Entry: nonce - number used once for encryption.
748 |      Context: TRD Step 3.5 message send sequence.
749 |      Definition of Done: 24-byte nacl.randomBytes value ensuring uniqueness per message for payload_recipient/payload_admin pairs.
750 |      Status Note: Completed 2025-11-10.
751 | [x] GL-006 Term Entry: Hybrid Admin-Key model.
752 |      Context: Docs.md Introduction describing encryption strategy.
753 |      Definition of Done: Architecture combining user-to-user secrecy with parallel admin-access ciphertext, diverging from traditional E2EE.
754 |      Status Note: Completed 2025-11-10.
755 | [x] GL-007 Term Entry: Zero-knowledge server.
756 |      Context: Docs.md Section 2.1 system overview.
757 |      Definition of Done: Backend that stores only encrypted blobs without ever handling plaintext or private keys.
758 |      Status Note: Completed 2025-11-10.
759 | [x] GL-008 Term Entry: nacl.box.
760 |      Context: TRD Section 3.1 crypto primitive.
761 |      Definition of Done: TweetNaCl public-key authenticated encryption function accepting message, nonce, recipient public key, and sender secret key.
762 |      Status Note: Completed 2025-11-10.
763 | [x] GL-009 Term Entry: Argon2.
764 |      Context: Docs.md Section 2.2 recommended stack.
765 |      Definition of Done: Memory-hard password hashing and key-derivation algorithm used for auth passwords and private-key wrapping.
766 |      Status Note: Completed 2025-11-10.
767 | [x] GL-010 Term Entry: JWT.
768 |      Context: Backend authentication mechanism.
769 |      Definition of Done: JSON Web Token signed with server secret to authenticate API and Socket.io requests.
770 |      Status Note: Completed 2025-11-10.
771 | [x] GL-011 Term Entry: Socket.io.
772 |      Context: Real-time communication library used across apps.
773 |      Definition of Done: WebSocket abstraction delivering authenticated rooms and message broadcast features for chat and admin monitoring.
774 |      Status Note: Completed 2025-11-10.
775 | [x] GL-012 Term Entry: Admin Panel.
776 |      Context: Separate SPA described in Docs.md Sections 1.3 and 2.1.
777 |      Definition of Done: Dedicated interface where admin authenticates, loads master secret key, and reviews decrypted conversations.
778 |      Status Note: Completed 2025-11-10.
779 | ---
780 | SECTION Q: QUESTIONS FOR PRODUCT OWNER (BACKLOG ID PREFIX QP)
781 | Summary: Outstanding clarifications needed.
782 | [ ] QP-001 Clarify whether usernames can be changed post-registration.
783 |      Context: Impacts database and UI.
784 |      Definition of Done: Product owner answer recorded.
785 |      Status Note: Pending.
786 | [x] QP-002 Determine password complexity requirements.
787 |      Context: Auth validation.
788 |      Definition of Done: Requirements documented.
789 |      Status Note: Adopted minimum 8-char mixed case/number/special policy implemented server-side; awaiting PO confirmation if changes needed.
790 | [ ] QP-003 Confirm JWT expiry timeframe and refresh policy.
791 |      Context: Session management.
792 |      Definition of Done: Guidance documented.
793 |      Status Note: Pending.
794 | [ ] QP-004 Decide whether admin panel should support message annotations.
795 |      Context: Feature scope.
796 |      Definition of Done: Decision documented.
797 |      Status Note: Pending.
798 | [ ] QP-005 Confirm if audit logs must be immutable.
799 |      Context: Storage strategy.
800 |      Definition of Done: Answer documented.
801 |      Status Note: Pending.
802 | [ ] QP-006 Clarify requirement for push notifications beyond web sockets.
803 |      Context: Future features.
804 |      Definition of Done: Answer documented.
805 |      Status Note: Pending.
806 | [ ] QP-007 Determine whether message read receipts are needed.
807 |      Context: Additional endpoints.
808 |      Definition of Done: Answer documented.
809 |      Status Note: Pending.
810 | [ ] QP-008 Confirm policy for message retention duration.
811 |      Context: Storage.
812 |      Definition of Done: Answer documented.
813 |      Status Note: Pending.
814 | [ ] QP-009 Clarify requirement for user status indicators (online/offline).
815 |      Context: Socket features.
816 |      Definition of Done: Answer documented.
817 |      Status Note: Pending.
818 | [ ] QP-010 Decide if admin secret key rotation support is needed.
819 |      Context: Security.
820 |      Definition of Done: Answer documented.
821 |      Status Note: Pending.
822 | [ ] QP-011 Determine if compliance requires PII masking strategies.
823 |      Context: Data handling.
824 |      Definition of Done: Answer documented.
825 |      Status Note: Pending.
826 | [ ] QP-012 Confirm timeline expectations for MVP delivery.
827 |      Context: Planning.
828 |      Definition of Done: Answer documented.
829 |      Status Note: Pending.
830 | ---
831 | SECTION R: CHANGELOG SNAPSHOT (BACKLOG ID PREFIX CLG)
832 | Summary: Quick log of major changes (append as work proceeds).
833 | [x] CLG-001 2025-11-10 Created initial plan and baseline tasks (lines 001-528).
834 |      Context: Captures creation of 500+ line plan.
835 |      Definition of Done: Entry recorded.
836 |      Status Note: Completed.
837 | [ ] CLG-002 Placeholder for next change snapshot.
838 |      Context: Update with next major modification.
839 |      Definition of Done: Replace with detail.
840 |      Status Note: Pending.
841 | [ ] CLG-003 Placeholder for future snapshot.
842 |      Context: Maintain chronological log.
843 |      Definition of Done: Replace with detail.
844 |      Status Note: Pending.
845 | [ ] CLG-004 Placeholder for future snapshot.
846 |      Context: Maintain chronological log.
847 |      Definition of Done: Replace with detail.
848 |      Status Note: Pending.
849 | [ ] CLG-005 Placeholder for future snapshot.
850 |      Context: Maintain chronological log.
851 |      Definition of Done: Replace with detail.
852 |      Status Note: Pending.
853 | [ ] CLG-006 Placeholder for future snapshot.
854 |      Context: Maintain chronological log.
855 |      Definition of Done: Replace with detail.
856 |      Status Note: Pending.
857 | [ ] CLG-007 Placeholder for future snapshot.
858 |      Context: Maintain chronological log.
859 |      Definition of Done: Replace with detail.
860 |      Status Note: Pending.
861 | [ ] CLG-008 Placeholder for future snapshot.
862 |      Context: Maintain chronological log.
863 |      Definition of Done: Replace with detail.
864 |      Status Note: Pending.
865 | [ ] CLG-009 Placeholder for future snapshot.
866 |      Context: Maintain chronological log.
867 |      Definition of Done: Replace with detail.
868 |      Status Note: Pending.
869 | [ ] CLG-010 Placeholder for future snapshot.
870 |      Context: Maintain chronological log.
871 |      Definition of Done: Replace with detail.
872 |      Status Note: Pending.
873 | [ ] CLG-011 Placeholder for future snapshot.
874 |      Context: Maintain chronological log.
875 |      Definition of Done: Replace with detail.
876 |      Status Note: Pending.
877 | [ ] CLG-012 Placeholder for future snapshot.
878 |      Context: Maintain chronological log.
879 |      Definition of Done: Replace with detail.
880 |      Status Note: Pending.
881 | ---
882 | SECTION S: APPENDIX NOTES
883 | [*] AP-001 Use this ledger as single source of truth for progress tracking.
884 | [*] AP-002 Update statuses immediately after each task completion to avoid drift.
885 | [*] AP-003 When tasks move to completed, ensure corresponding milestone placeholder replaced.
886 | [*] AP-004 Keep numbering consistent; do not reuse IDs even if tasks removed.
887 | [*] AP-005 Additional sections may be appended beyond line 500 as needed.
888 | [*] AP-006 Document should remain ASCII for compatibility.
889 | [*] AP-007 Use repository commits to cross-reference task completion.
890 | [*] AP-008 Encourage peer review for security-sensitive changes.
891 | [*] AP-009 Align front-end developments with backend API contracts as they stabilize.
892 | [*] AP-010 Continue referencing Docs.md for authoritative requirements.
893 | ---
894 | SECTION T: PRODUCTION READINESS BACKLOG (BACKLOG ID PREFIX PR)
895 | Summary: Consolidated view of all remaining tasks required before launch readiness.
896 | [ ] PR-001 Backend Authentication Hardening – complete BF-A-005, BF-A-006, BF-A-007, BF-A-008, BF-A-009, BF-A-010, BF-A-011, BF-A-012.
897 | [ ] PR-002 Configuration & Directory Documentation – deliver BF-C-003 and BF-C-004.
898 | [ ] PR-003 Messaging Service Enhancements – close BF-M-004, BF-M-006, BF-M-007, BF-M-009, BF-M-010, BF-M-011, BF-M-012.
899 | [ ] PR-004 Real-time & Socket Reliability – address BF-R-005, BF-R-007, BF-R-008, BF-R-009, BF-R-010, BF-R-011, BF-R-012.
900 | [ ] PR-005 Backend Infrastructure & Tooling – fulfill BF-I-004, BF-I-005, BF-I-006, BF-I-007, BF-I-008, BF-I-009, BF-I-010, BF-I-011, BF-I-012.
901 | [ ] PR-006 Client Experience & Testing – complete CL-010, CL-011, CL-012.
902 | [ ] PR-007 Admin Platform Maturity – finish AD-007, AD-008, AD-009, AD-010, AD-012.
903 | [ ] PR-008 Cryptography Governance – wrap up CU-004, CU-005, CU-006, CU-007, CU-008, CU-009, CU-010, CU-011, CU-012.
904 | [ ] PR-009 Operations & Developer Experience – execute OP-004, OP-005, OP-006, OP-007, OP-008, OP-009, OP-010, OP-011, OP-012.
905 | [ ] PR-010 Compliance & Cross-Cutting Policies – resolve CC-001, CC-002, CC-003, CC-004, CC-005, CC-006, CC-007, CC-008, CC-009, CC-010, CC-011, CC-012.
906 | [ ] PR-011 Risk Register Mitigations – document and implement mitigations for RK-001 through RK-012.
907 | [ ] PR-012 Product Owner Clarifications – obtain decisions for QP-001 through QP-012.
908 | [ ] PR-013 Final Milestones – deliver TL-006, TL-007, TL-008, TL-009, TL-010, TL-011, TL-012.
909 |

