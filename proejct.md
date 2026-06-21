\# TrustVault AI



\## What is this project?



\*\*TrustVault AI\*\* is a privacy-first AI document assistant that allows users to store sensitive documents and use AI on them without exposing everything.



Instead of uploading all your documents to random AI services, users own their data and decide exactly what information AI agents or third parties can access.



Think of it like:



> \*\*Google Drive + ChatGPT + Permission System + Digital Identity + Audit Logs\*\*



\---



\# Problem



Today people upload:



\* Aadhaar cards

\* Passports

\* Income certificates

\* Medical reports

\* Degree certificates

\* Contracts

\* Bank statements



to AI tools or websites.



\### Problems:



❌ Entire document is exposed.



❌ No control over what AI can see.



❌ No audit trail.



❌ Cannot share only some information.



❌ Third parties get unnecessary data.



\---



\# Example



Rahul wants a bank loan.



Bank asks for:



\* Income certificate

\* PAN card



But Rahul doesn't want to reveal:



\* Aadhaar number

\* Address



Normally:



Bank gets the entire document.



With TrustVault AI:



User says:



> Share my income proof with SBI but hide Aadhaar number and address.



AI automatically:



✅ Masks sensitive information.



✅ Creates a secure share link.



✅ Records who accessed it.



✅ Link expires after 24 hours.



\---



\# Main Idea



Users keep documents securely.



AI can understand documents.



AI agents work on behalf of users.



But everything happens with:



\* Permission

\* Identity verification

\* Audit logs

\* Selective disclosure



\---



\# Architecture



```

&#x20;                   User

&#x20;                     |

&#x20;               React Frontend

&#x20;                     |

&#x20;        -----------------------------

&#x20;        |            |              |

&#x20;   Auth Service  AI Service   Permission Service

&#x20;        |            |              |

&#x20;        --------------------------------

&#x20;                     |

&#x20;             Terminal3 Agent SDK

&#x20;                     |

&#x20;             Identity + TEE Security

&#x20;                     |

&#x20;               Document Storage

&#x20;              (S3/IPFS/Encrypted)

&#x20;                     |

&#x20;               PostgreSQL/MongoDB

```



\---



\# Complete Flow



\## Step 1: User Login



User signs in.



Terminal3 Agent Auth SDK gives:



\* Verifiable identity

\* Secure agent authentication



\---



\## Step 2: Upload Documents



Examples:



\* Aadhaar

\* Passport

\* Medical reports

\* Degree certificate

\* Contracts



Files are encrypted before storage.



Stored in:



\* AWS S3

\* IPFS

\* Local encrypted storage



\---



\## Step 3: AI Indexing



After upload:



\### OCR



Extracts text from PDFs/images.



Tools:



\* Tesseract

\* Unstructured.io



\---



\### Embeddings



Convert text into vectors.



Using:



\* Gemini

\* OpenAI

\* Qwen

\* Ollama



Stored in:



\* ChromaDB

\* Qdrant



\---



\### Result



User can ask:



> What is my annual income?



> Summarize this contract.



> Explain my blood test.



\---



\# Selective Disclosure



Suppose the user has:



```

Name

DOB

Address

Aadhaar Number

Income

PAN

```



Employer asks only for:



\* Income

\* PAN



AI automatically hides:



❌ Aadhaar



❌ Address



and shares only:



```

Income : ₹9 lakh

PAN : ABC123

```



This is where Terminal3 SDK becomes important.



\---



\# Audit Logs



Every action is recorded.



```

10:20 AM

SBI Agent accessed Income Certificate



10:25 AM

Dr Sharma viewed Blood Report



10:45 AM

Insurance Agent downloaded Medical Summary

```



User can revoke access anytime.



\---



\# Multi-Agent System



\### Document Agent



Understands documents.



\---



\### Privacy Agent



Masks sensitive fields.



\---



\### Sharing Agent



Creates secure links.



\---



\### Audit Agent



Records every action.



\---



\### Summarizer Agent



Explains reports.



\---



\# Tech Stack



\## Frontend



\* React

\* Next.js

\* TailwindCSS

\* Shadcn UI



\---



\## Backend



\* Node.js

\* Express



or



\* Rust (bonus points)



\---



\## Database



\* PostgreSQL



or



\* MongoDB



\---



\## Vector Database



\* Qdrant



or



\* ChromaDB



\---



\## AI Models



Gemini API



or



OpenAI



or



Ollama



\---



\## File Storage



AWS S3



or



IPFS



\---



\## OCR



Tesseract



\---



\## Authentication



Terminal3 Agent Auth SDK



(Main requirement)



\---



\## Encryption



AES-256



\---



\# Pages



\## 1. Landing Page



Shows:



\* Features

\* Security

\* Demo video



\---



\## 2. Login Page



Terminal3 authentication.



\---



\## 3. Dashboard



Shows:



\* Total documents

\* Shared documents

\* Recent activity

\* AI assistant



\---



\## 4. Upload Document Page



Upload:



\* PDFs

\* Images

\* Reports



\---



\## 5. Document Vault



Grid view of documents.



Categories:



\* Medical

\* Finance

\* Education

\* Legal



\---



\## 6. AI Chat Page



User asks:



```

Summarize my contract.



What is my annual income?



Explain my blood report.

```



RAG system answers.



\---



\## 7. Permission Dashboard



Choose:



```

Document:

Income Certificate



Share With:

SBI Bank



Allowed Fields:

Income

PAN



Hidden Fields:

Address

Aadhaar Number



Expiry:

24 Hours

```



\---



\## 8. Shared Links Page



Shows:



\* Active links

\* Expired links

\* Revoke button



\---



\## 9. Audit Logs Page



Shows:



```

User

Action

Time

Status

```



Example:



| Agent  | Action        | Time  |

| ------ | ------------- | ----- |

| SBI    | Viewed Income | 10:25 |

| Doctor | Viewed Report | 11:40 |



\---



\## 10. Settings Page



\* Change password

\* Encryption keys

\* Notifications



\---



\# Folder Structure



```

frontend/



backend/



agents/

&#x20;   document-agent/

&#x20;   privacy-agent/

&#x20;   sharing-agent/

&#x20;   audit-agent/



services/

&#x20;   auth-service/

&#x20;   rag-service/

&#x20;   permission-service/



db/



storage/



vector-db/



terminal3-sdk/

```



\---



\# Feature List



\### Secure Document Vault



Store sensitive documents.



\---



\### AI Chat



Ask questions about documents.



\---



\### Selective Disclosure



Share only required information.



\---



\### Agent Identity



Through Terminal3 SDK.



\---



\### Audit Logs



Track every access.



\---



\### Expiring Links



24h, 7 days etc.



\---



\### Role-Based Access



Doctor



Employer



Bank



Lawyer



Family



\---



\### Multi-Agent Architecture



Independent agents collaborate.



\---



\### Encryption



End-to-end security.



\---



\### Document Summarization



Simple explanations.



\---



\### OCR



Read scanned PDFs.



\---



\### RAG Search



Search across all documents.



\---



\# Why this project can win?



Judging Criteria:



\### Solution Completeness (30%)



★★★★★



Many pages and features.



\---



\### SDK Integration (40%)



★★★★★



Identity + permissions + secure agents.



\---



\### Creativity (30%)



★★★★★



AI + privacy + trusted agents + selective disclosure.



\---



\## Production Architecture



```

Frontend (Next.js)

&#x20;       |

API Gateway

&#x20;       |

\-------------------------

|           |           |

Auth      RAG       Permissions

Service   Service    Service

|            |            |

\---------------------------

&#x20;           |

&#x20;     Terminal3 SDK

&#x20;           |

&#x20;    Multi-Agent Layer

&#x20;           |

Document Privacy Share Audit

Agent    Agent  Agent Agent

&#x20;           |

Encrypted Storage + Vector DB

```



Among all ideas for this hackathon, this is one of the strongest because it solves a real problem and naturally demonstrates everything Terminal3 wants: \*\*AI agents + identity + trust + secure data sharing + verifiable actions\*\*.



