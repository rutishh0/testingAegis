Here is my latest project.   
Here is the "hyperdetailed" documentation structured into a PRD and a TRD, with the TRD containing the explicit, step-by-step implementation guide for the cryptographic model.

\-----

\#\#\# \*\*DOCUMENT START\*\*

\#\# 1.0 📘 Product Requirements Document (PRD): Project "Aegis"

\#\#\# 1.1 Introduction & Objective

\*\*Project "Aegis"\*\* is a secure messaging platform (web-first) designed to provide provable privacy from third-party infrastructure providers (e.g., AWS, GCP) while simultaneously granting full moderation access to a designated "Master Admin."

The core objective is to create a chat system where message data is "zero-knowledge" on the server, yet can be decrypted by two parties: the intended \*\*recipient\*\* and the \*\*platform admin\*\*. This is \*not\* a standard E2EE model; it is a "Hybrid Admin-Key" model.

\#\#\# 1.2 User Personas

1\.  \*\*Standard User ("User")\*\*

      \* \*\*Goal:\*\* To communicate with other users on the platform.  
      \* \*\*Key Need:\*\* Confidence that their messages are secure from hackers and the cloud provider.  
      \* \*\*Key Agreement:\*\* They have explicitly agreed that the Admin \*can\* and \*will\* read their messages for safety and moderation. Privacy is from the \*outside\*, not from the Admin.

2\.  \*\*Master Administrator ("Admin")\*\*

      \* \*\*Goal:\*\* To ensure platform safety, moderate content, and resolve disputes.  
      \* \*\*Key Need:\*\* The ability to review any and all conversations, in plain text, from a secure, dedicated portal.  
      \* \*\*Key Requirement:\*\* The Admin's master private key \*must not\* be stored on the main server.

\#\#\# 1.3 Key Features (MVP)

| Feature | Description | User Stories |  
| :--- | :--- | :--- |  
| \*\*User Account & Keygen\*\* | Users can register, log in, and log out. Registration generates their cryptographic key pair. | \*As a User, I can create an account with a username and password.\* \<br\> \*As a User, my private key is generated on my device and stored securely, encrypted by my password.\* |  
| \*\*User Discovery\*\* | Users can see a list of other registered users to start a conversation. | \*As a User, I can see a list of all users on the platform so I can select one to chat with.\* |  
| \*\*1-to-1 Chat\*\* | A real-time chat interface. | \*As a User, I can send a message to another user.\* \<br\> \*As a User, I can receive messages in real-time.\* \<br\> \*As a User, my messages are encrypted on my device before being sent.\* |  
| \*\*Admin Moderation Panel\*\* | A \*\*separate\*\* web interface for the Admin. | \*As an Admin, I can log in to a secure panel.\* \<br\> \*As an Admin, I can select any two users and view their entire conversation history in plain text.\* |

\#\#\# 1.4 Out of Scope (for MVP)

  \* Group Chats  
  \* File Attachments / Photo Sharing  
  \* Message Deletion / Editing  
  \* Password Reset (This is complex with crypto keys and can be added later)

\-----

\-----

\#\# 2.0 🛠️ Technical Requirements Document (TRD): Project "Aegis"

\#\#\# 2.1 System Architecture Overview

The system consists of three main components:

1\.  \*\*The Client (Web App):\*\* A React/Vue/Svelte single-page application (SPA). \*\*All cryptography happens here.\*\*  
2\.  \*\*The API Server (Backend):\*\* A "zero-knowledge" Node.js backend. It is a "dumb" server that only stores and routes encrypted blobs. It \*\*never\*\* sees a private key or a plain-text message.  
3\.  \*\*The Admin Panel:\*\* A \*\*separate\*\* SPA (can be built from the same codebase, but must be a distinct application). This is the \*only\* other place where cryptography (decryption) occurs.

\#\#\# 2.2 Recommended Tech Stack

  \* \*\*Client / Admin Panel:\*\* React (with Create React App or Vite)  
  \* \*\*Backend:\*\* Node.js with \*\*Express.js\*\* or \*\*Fastify\*\*  
  \* \*\*Database:\*\* \*\*PostgreSQL\*\* (for relational data and storing \`text\` blobs)  
  \* \*\*Real-time:\*\* \*\*Socket.io\*\* (for WebSockets)  
  \* \*\*Cryptography:\*\* \*\*\`tweetnacl\` (or \`libsodium.js-sumo\`)\*\*. This is critical. \*\*Do not\*\* use any other crypto library. \`tweetnacl\` is simple, modern, and audited. We will use \`nacl.box\` (public-key authenticated encryption).  
  \* \*\*Password Hashing:\*\* \*\*\`argon2\`\*\* (for hashing auth passwords and for deriving a key from the password to encrypt the user's private key).

\#\#\# 2.3 Database Schema (PostgreSQL)

\`\`\`sql  
\-- Stores user accounts, their auth info, and their crypto keys  
CREATE TABLE users (  
    user\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    username TEXT NOT NULL UNIQUE,  
    password\_hash TEXT NOT NULL, \-- For server-side authentication (e.g., Argon2 hash)  
      
    \-- The user's public key, for others to encrypt messages TO them  
    public\_key TEXT NOT NULL,   
      
    \-- The user's private key, encrypted with a key derived from their password  
    \-- The server CANNOT decrypt this. It just stores it for the user.  
    encrypted\_private\_key TEXT NOT NULL   
);

\-- Stores the Admin's public key (there will only be one row)  
CREATE TABLE admin\_config (  
    config\_id INT PRIMARY KEY DEFAULT 1,  
    admin\_public\_key TEXT NOT NULL  
);

\-- Stores all messages. This data is UNREADABLE by the database.  
CREATE TABLE messages (  
    message\_id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    sender\_id UUID NOT NULL REFERENCES users(user\_id),  
    recipient\_id UUID NOT NULL REFERENCES users(user\_id),  
      
    \-- The encrypted payload FOR THE RECIPIENT  
    payload\_recipient TEXT NOT NULL,   
      
    \-- The encrypted payload FOR THE ADMIN  
    payload\_admin TEXT NOT NULL,   
      
    \-- The unique "number-used-once" for this message's encryption  
    nonce TEXT NOT NULL,   
      
    sent\_at TIMESTAMPTZ NOT NULL DEFAULT NOW()  
);  
\`\`\`

\#\#\# 2.4 API Endpoints (REST)

| Method | Path | Description |  
| :--- | :--- | :--- |  
| \`POST\` | \`/api/v1/auth/register\` | Creates a new user. \`body: { username, password, publicKey, encryptedPrivateKey }\` |  
| \`POST\` | \`/api/v1/auth/login\` | Logs in a user, returns a JWT. \`body: { username, password }\` |  
| \`GET\` | \`/api/v1/auth/me\` | (Auth-required) Returns the logged-in user's data, including their \`encryptedPrivateKey\`. |  
| \`GET\` | \`/api/v1/config\` | Returns public config, including the \`adminPublicKey\`. |  
| \`GET\` | \`/api/v1/users\` | (Auth-required) Returns a list of all users \`\[{ userId, username, publicKey }\]\`. |  
| \`GET\` | \`/api/v1/messages/:userId\` | (Auth-required) Gets message history with a specific user. |  
| \`POST\` | \`/api/v1/messages\` | (Auth-required) Sends a new message. See crypto flow. |  
| \`GET\` | \`/api/v1/admin/messages\` | (Admin-Auth-required) Gets \*all\* messages. |

\-----

\-----

\#\# 3.0 🤖 AI Implementation Guide & Cryptography Flow

\*\*(This is the "full information doc" for the AI model. Follow this \*exactly\*.)\*\*

\#\#\# 3.1 Core Principle: The \`nacl.box\`

We will use \`nacl.box\` (public-key authenticated encryption) from \`tweetnacl\`.  
A \`nacl.box\` requires:

  \* A plain-text \`message\`  
  \* A \`nonce\` (a unique number for every message)  
  \* The recipient's \`publicKey\`  
  \* The sender's \`secretKey\` (private key)

\#\#\# 3.2 Step 1: Admin Key Generation (One-Time Setup)

You, the Admin, must do this \*once\* locally. \*\*Never\*\* run this on the server.

1\.  Create a simple Node.js script: \`npm install tweetnacl\`  
2\.  Run:  
    \`\`\`javascript  
    const nacl \= require('tweetnacl');  
    const adminKeys \= nacl.box.keyPair();

    const adminPublicKey\_base64 \= Buffer.from(adminKeys.publicKey).toString('base64');  
    const adminSecretKey\_base64 \= Buffer.from(adminKeys.secretKey).toString('base64');

    console.log('ADMIN\_PUBLIC\_KEY:', adminPublicKey\_base64);  
    console.log('ADMIN\_SECRET\_KEY:', adminSecretKey\_base64); // \<-- SAVE THIS\! KEEP IT OFFLINE\!  
    \`\`\`  
3\.  Take the \`ADMIN\_PUBLIC\_KEY\` string and insert it into your \`admin\_config\` database table.  
4\.  Take the \`ADMIN\_SECRET\_KEY\` and save it somewhere secure (like a password manager or a local file). This is your master key. \*\*Do not put this in the server code.\*\*

\#\#\# 3.3 Step 2: User Registration & Key Storage

When a User registers with \`username\` and \`password\`:

1\.  \*\*Client-Side:\*\* Generate \`userKeys \= nacl.box.keyPair()\`.  
2\.  \*\*Client-Side:\*\* Derive an encryption key from their \`password\` (e.g., using \`argon2\`).  
3\.  \*\*Client-Side:\*\* Encrypt \`userKeys.secretKey\` with this derived password key (e.g., using \`nacl.secretbox\`). This is the \`encryptedPrivateKey\`.  
4\.  \*\*Client-Side:\*\* \`POST /api/v1/auth/register\` with:  
      \* \`username\`  
      \* \`password\` (Server will hash this with \`argon2\` for auth and store \`password\_hash\`)  
      \* \`publicKey\`: \`Buffer.from(userKeys.publicKey).toString('base64')\`  
      \* \`encryptedPrivateKey\`: \`Buffer.from(encrypted\_key).toString('base64')\`  
5\.  \*\*Server-Side:\*\* The server stores all these fields in the \`users\` table. \*\*The server cannot read \`encryptedPrivateKey\`.\*\*

\#\#\# 3.4 Step 3: User Login & Key Unlocking

1\.  \*\*Client-Side:\*\* User enters \`username\` and \`password\`.  
2\.  \*\*Client-Side:\*\* \`POST /api/v1/auth/login\` with \`username\` and \`password\`.  
3\.  \*\*Server-Side:\*\* Server checks \`password\` against \`password\_hash\`. If valid, it sends a JWT and returns the user's \`encryptedPrivateKey\` from the database.  
4\.  \*\*Client-Side:\*\*  
      \* The client receives the \`encryptedPrivateKey\`.  
      \* It derives the \*same\* encryption key from the \`password\` they just typed (using \`argon2\`).  
      \* It uses this key to decrypt the \`encryptedPrivateKey\` (using \`nacl.secretbox.open\`).  
      \* \*\*The client now holds the user's \`secretKey\` in memory.\*\* The app is "unlocked."  
      \* The client also fetches the \`adminPublicKey\` from \`GET /api/v1/config\`.

\#\#\# 3.5 Step 4: Sending a Message (The Core Logic)

When \*\*User A\*\* (Sender) wants to send a \`message\` to \*\*User B\*\* (Recipient):

1\.  \*\*Client-Side (User A):\*\* The app has the following in memory:  
      \* \`message\` (plain text)  
      \* \`secretKey\_A\` (User A's private key)  
      \* \`publicKey\_B\` (User B's public key, fetched from \`/api/v1/users\`)  
      \* \`adminPublicKey\` (fetched from \`/api/v1/config\`)  
2\.  \*\*Client-Side (User A):\*\* Generate a \*single\* \`nonce\`: \`const nonce \= nacl.randomBytes(nacl.box.nonceLength);\`  
3\.  \*\*Client-Side (User A):\*\* \*\*Encrypt for User B:\*\*  
    \`\`\`javascript  
    const payload\_B \= nacl.box(  
      Buffer.from(message),   
      nonce,   
      Buffer.from(publicKey\_B, 'base64'),   
      secretKey\_A   
    );  
    \`\`\`  
4\.  \*\*Client-Side (User A):\*\* \*\*Encrypt for Admin:\*\*  
    \`\`\`javascript  
    const payload\_Admin \= nacl.box(  
      Buffer.from(message),   
      nonce,   
      Buffer.from(adminPublicKey, 'base64'),   
      secretKey\_A  
    );  
    \`\`\`  
5\.  \*\*Client-Side (User A):\*\* \`POST /api/v1/messages\` with:  
    \`\`\`json  
    {  
      "recipientId": "user\_B\_uuid",  
      "payload\_recipient": Buffer.from(payload\_B).toString('base64'),  
      "payload\_admin": Buffer.from(payload\_Admin).toString('base64'),  
      "nonce": Buffer.from(nonce).toString('base64')  
    }  
    \`\`\`  
6\.  \*\*Server-Side:\*\* The server takes this data and saves it \*directly\* into the \`messages\` table. It does \*no\* decryption. It then uses WebSockets to push this same JSON object to User B.

\#\#\# 3.6 Step 5: Receiving a Message (User B)

1\.  \*\*Client-Side (User B):\*\* Receives the message object via WebSocket (or fetches from \`/api/v1/messages/:userId\`).  
2\.  \*\*Client-Side (User B):\*\* The app has in memory:  
      \* \`secretKey\_B\` (User B's private key)  
      \* \`publicKey\_A\` (User A's public key, fetched from \`/api/v1/users\`)  
3\.  \*\*Client-Side (User B):\*\* It ignores \`payload\_admin\`. It only uses \`payload\_recipient\`.  
    \`\`\`javascript  
    const decryptedMessage \= nacl.box.open(  
      Buffer.from(message.payload\_recipient, 'base64'),  
      Buffer.from(message.nonce, 'base64'),  
      Buffer.from(publicKey\_A, 'base64'),  
      secretKey\_B  
    );  
    // decryptedMessage is now a Uint8Array. Convert it to a string.  
    const plainText \= Buffer.from(decryptedMessage).toString('utf-8');  
    \`\`\`  
4\.  \*\*Client-Side (User B):\*\* Display \`plainText\` in the chat window.

\#\#\# 3.7 Step 6: Admin Moderation Panel

1\.  \*\*Client-Side (Admin Panel):\*\* The Admin logs in (using a separate auth system for the admin).  
2\.  \*\*Client-Side (Admin Panel):\*\* The Admin loads their \`adminSecretKey\` into the app (e.g., by pasting it, or loading from a file). \*\*This key is now in memory.\*\*  
3\.  \*\*Client-Side (Admin Panel):\*\* The Admin fetches a conversation (e.g., from \`/api/v1/admin/messages\`). The server returns a list of message objects.  
4\.  \*\*Client-Side (Admin Panel):\*\* For \*each\* message, the app does the following:  
      \* It ignores \`payload\_recipient\`. It only uses \`payload\_admin\`.  
      \* It gets \`publicKey\_A\` (the sender's public key) from the user list.  
    \<\!-- end list \--\>  
    \`\`\`javascript  
    const decryptedMessage \= nacl.box.open(  
      Buffer.from(message.payload\_admin, 'base64'),  
      Buffer.from(message.nonce, 'base64'),  
      Buffer.from(publicKey\_A, 'base64'),  
      adminSecretKey // \<-- The master key  
    );  
    const plainText \= Buffer.from(decryptedMessage).toString('utf-8');  
    \`\`\`  
5\.  \*\*Client-Side (Admin Panel):\*\* Display the entire, decrypted conversation.

\#\#\# \*\*DOCUMENT END\*\*