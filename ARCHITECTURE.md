# BioForge AI - High-Level Architecture Design

## 1. System Architecture Overview

### Architecture Pattern: Hybrid Microservices with Event-Driven Communication

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LOAD BALANCER / API GATEWAY                      │
│                              (FastAPI / Nginx)                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        MESSAGE BROKER (RabbitMQ/Redis)                   │
│                    Async Task Queue & Event Streaming                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│   LAYER 1     │           │   LAYER 2     │           │   LAYER 3     │
│  Cognitive    │◄─────────►│   Universal   │◄─────────►│  ML & Pipeline│
│   Engine      │  gRPC/    │   API Router  │  gRPC/    │   Executor    │
│  (LangGraph)  │  REST     │  (Data Fetch) │  REST     │ (Nextflow/    │
│               │           │               │           │   Docker)     │
└───────────────┘           └───────────────┘           └───────────────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    ▼
                        ┌───────────────────────┐
                        │    LAYER 4            │
                        │  Interactive UI       │
                        │  (Streamlit/Dash)     │
                        └───────────────────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │   External Databases  │
                        │  (cBioPortal, UniProt,│
                        │   PDB, ChEMBL, etc.)  │
                        └───────────────────────┘
```

## 2. Communication Strategy

### Primary Communication Patterns:

1. **Synchronous (Request-Response)**
   - Layer 1 ↔ Layer 2: gRPC for low-latency data fetching
   - Layer 1 ↔ Layer 4: WebSocket for real-time reasoning stream
   - Layer 4 ↔ Layer 1/2/3: REST API for user interactions

2. **Asynchronous (Event-Driven)**
   - Layer 1 → Layer 3: Message queue (RabbitMQ) for long-running ML jobs
   - Layer 3 → Layer 1: Callback via webhook when pipeline completes
   - All layers → Logging/Monitoring: Event streaming (Kafka optional)

3. **State Management**
   - Redis: Session state, agent memory, task queues
   - PostgreSQL: Persistent workflow history, user data, cached results
   - MinIO/S3: Large file storage (omics data, docking results)

## 3. Component Interactions

### Workflow Example: "Find ferroptosis targets in lung cancer"

```
1. User Query (Layer 4) 
   → WebSocket → Cognitive Engine (Layer 1)

2. Cognitive Engine (ReAct Loop):
   - Reason: "Need to fetch lung cancer gene expression data"
   - Action: Call fetch_cbioportal_data(gene="GPX4", cancer="LUAD")
   → gRPC → API Router (Layer 2)

3. API Router:
   - Fetches from cBioPortal TCGA API
   - Caches result in Redis
   → Returns JSON → Cognitive Engine

4. Cognitive Engine:
   - Reason: "Now run differential expression analysis"
   - Action: Submit ML pipeline job
   → RabbitMQ → ML Executor (Layer 3)

5. ML Executor:
   - Spawns Nextflow pipeline in Docker container
   - Runs XGBoost feature selection
   - On completion: Callback → Cognitive Engine

6. Cognitive Engine:
   - Aggregates results, generates interpretation
   - Streams reasoning + results via WebSocket
   → Layer 4 (UI renders plots)
```

## 4. Scalability Considerations

### Horizontal Scaling:
- **Layer 1**: Multiple agent instances behind load balancer (stateless + Redis session)
- **Layer 2**: Auto-scaling API workers (Kubernetes HPA based on request queue)
- **Layer 3**: Kubernetes cluster with job queues (one pod per pipeline)
- **Layer 4**: Streamlit behind Nginx with session affinity

### Data Flow Optimization:
- **Caching Strategy**: 
  - L1 Cache: Redis (hot data, agent memory)
  - L2 Cache: PostgreSQL + Redis (API responses, 24hr TTL)
  - L3 Cache: MinIO (large omics datasets, reusable)
  
- **Rate Limiting**: 
  - Per-user API quotas (Redis-based sliding window)
  - External API rate limit handling (exponential backoff)

### Fault Tolerance:
- Circuit breakers for external API calls (tenacity library)
- Dead letter queues for failed ML jobs
- Checkpointing for long-running workflows
- Graceful degradation (cached data if API unavailable)

## 5. Security & Compliance

- **Authentication**: OAuth2/JWT (Keycloak or Auth0)
- **Data Encryption**: TLS 1.3 for transit, AES-256 for storage
- **Audit Logging**: All agent actions logged to ELK stack
- **GDPR/HIPAA**: Data anonymization pipelines, consent management
- **Container Security**: Trivy scanning, minimal base images

## 6. Deployment Topology

```
Production (Kubernetes):
├── Namespace: bioforge-prod
│   ├── Deployment: cognitive-engine (3 replicas)
│   ├── Deployment: api-router (5 replicas, auto-scale)
│   ├── Deployment: ml-executor (10 replicas, job-based)
│   ├── Deployment: ui-dashboard (2 replicas)
│   ├── StatefulSet: postgresql (3 nodes, Patroni HA)
│   ├── StatefulSet: redis (3 nodes, Sentinel)
│   ├── Job: nextflow-runner (ephemeral, per-workflow)
│   └── Ingress: nginx-controller + cert-manager

Development:
└── Docker Compose (single-node, all services)
```

## 7. Technology Decisions Rationale

| Component | Choice | Alternative Considered | Rationale |
|-----------|--------|----------------------|-----------|
| Agent Framework | LangGraph | AutoGen, CrewAI | Better state management, cyclic graphs for ReAct |
| Message Broker | RabbitMQ | Kafka, Celery | Simpler routing, priority queues for job scheduling |
| ML Orchestration | Nextflow | Snakemake, Airflow | Native container support, better for bioinformatics |
| UI Framework | Streamlit | Dash, React+FastAPI | Faster prototyping, built-in caching for data apps |
| Database | PostgreSQL | MongoDB, TimescaleDB | ACID compliance, JSONB for flexible schemas |
| Cache | Redis | Memcached | Rich data structures, pub/sub for events |
