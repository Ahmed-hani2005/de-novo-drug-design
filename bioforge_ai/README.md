# BioForge AI

## The Autonomous Multi-Agent Bioinformatics Operating System

**BioForge AI** is a comprehensive, AI-driven computational biology platform that acts as an autonomous "Virtual Principal Investigator," capable of executing complex bioinformatics workflows, integrating multiple global databases, analyzing multi-omics data via machine learning, and performing in-silico drug design—all driven by a reasoning LLM core.

---

## 🎯 Core Capabilities

| Capability | Description |
|------------|-------------|
| **AI-Driven Drug Repurposing** | Identify approved drugs for novel disease targets using molecular docking and ADMET prediction |
| **Multi-Omics Biomarker Discovery** | Predict therapy responses using ML on integrated genomics, proteomics, and epigenomics data |
| **Automated Pipeline Generation** | Write and execute bioinformatics scripts automatically based on natural language queries |
| **Survival Analysis** | Generate Kaplan-Meier curves, Cox regression models, and patient stratification |
| **Molecular Docking** | Run AutoDock Vina workflows for protein-ligand binding prediction |

---

## 🏗️ System Architecture

BioForge AI consists of **4 main layers**:

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 4: Interactive Visualization UI (The Dashboard)       │
│  Streamlit • Plotly • py3Dmol                               │
└─────────────────────────────────────────────────────────────┘
                              ↕ WebSocket/REST
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: Cognitive & Reasoning Engine (The Brain)          │
│  LangGraph • OpenAI/Claude • ReAct Framework                │
└─────────────────────────────────────────────────────────────┘
            ↕ gRPC/REST                    ↕ RabbitMQ
┌──────────────────────┐      ┌──────────────────────────────┐
│  LAYER 2: Universal  │      │   LAYER 3: ML & Pipeline     │
│  API Router          │      │   Executor (The Lab)         │
│  (The Fetcher)       │      │   Nextflow • XGBoost • RDKit │
│  cBioPortal, UniProt,│      │   AutoDock Vina              │
│  ChEMBL, KEGG        │      │                              │
└──────────────────────┘      └──────────────────────────────┘
            ↕                            ↕
┌─────────────────────────────────────────────────────────────┐
│              External Databases & APIs                       │
│  TCGA • GEO • PDB • AlphaFold DB • DrugBank • PubMed        │
└─────────────────────────────────────────────────────────────┘
```

### Layer Details

#### **Layer 1: Cognitive Engine** 🧠
- Parses user queries using Chain-of-Thought reasoning
- Creates step-by-step execution plans via ReAct framework
- Orchestrates tool calling across all other layers
- Maintains short-term and long-term memory (Redis-backed)

#### **Layer 2: Universal API Router** 📡
- Executes real-time API calls to 10+ bioinformatics databases
- Implements intelligent caching (Redis + PostgreSQL)
- Handles rate limiting and exponential backoff
- Supports GraphQL, REST, and web scraping fallbacks

#### **Layer 3: ML & Pipeline Executor** 🔬
- Runs Nextflow/Snakemake pipelines in Docker containers
- Performs feature selection with XGBoost
- Executes molecular docking with AutoDock Vina
- Predicts ADMET properties using RDKit

#### **Layer 4: Interactive UI** 📊
- Displays agent reasoning process in real-time
- Generates publication-quality visualizations:
  - Kaplan-Meier survival curves
  - Volcano plots and heatmaps
  - Interactive 3D molecular viewers
- Multi-page dashboard with workflow history

---

## 📁 Project Structure

```
bioforge_ai/
├── agents/                 # Layer 1: Cognitive Engine
│   ├── cognitive_engine.py
│   ├── reasoning_loop.py
│   ├── planner.py
│   └── memory.py
│
├── tools/                  # Layer 2 & 3: Tools & Executors
│   ├── api_clients/        # Database connectors
│   │   ├── cbioportal_client.py
│   │   ├── uniprot_client.py
│   │   ├── chembl_client.py
│   │   └── ...
│   ├── ml_pipelines/       # ML analysis
│   │   ├── feature_selection.py
│   │   ├── survival_analysis.py
│   │   └── biomarker_discovery.py
│   └── docking/            # Cheminformatics
│       ├── rdkit_utils.py
│       ├── vina_wrapper.py
│       └── pose_analyzer.py
│
├── models/                 # Trained ML models
│   ├── survival/
│   ├── biomarker/
│   └── admet/
│
├── ui/                     # Layer 4: Dashboard
│   ├── app.py
│   ├── pages/
│   ├── components/
│   └── utils/
│
├── config/                 # Configuration
│   ├── settings.py
│   └── pipeline_configs/
│
├── data/                   # Data storage
│   ├── raw/
│   ├── processed/
│   └── cache/
│
├── tests/                  # Test suite
│   ├── unit/
│   └── integration/
│
└── docs/                   # Documentation
```

📖 **See [FOLDER_STRUCTURE.md](bioforge_ai/FOLDER_STRUCTURE.md) for complete directory layout.**

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- Redis 7+
- PostgreSQL 16+
- Nextflow 23+
- AutoDock Vina (for docking workflows)

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/bioforge-ai.git
cd bioforge-ai

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
# - OPENAI_API_KEY or ANTHROPIC_API_KEY
# - NCBI_API_KEY (optional)
# - DRUGBANK_API_KEY (optional)

# Start infrastructure (Redis, PostgreSQL, RabbitMQ)
docker-compose up -d redis postgres rabbitmq

# Initialize database
python scripts/setup_database.py

# Run the UI
streamlit run ui/app.py
```

### Development Mode

```bash
# Install dev dependencies
pip install -r requirements-dev.txt

# Run tests
pytest --cov=bioforge_ai

# Start all services (including monitoring)
docker-compose up
```

---

## 💡 Example Workflows

### 1. Find Ferroptosis Targets in Lung Cancer

**User Query:** *"Find ferroptosis-related genes dysregulated in lung adenocarcinoma and identify potential drug inhibitors."*

**Agent Execution Plan:**
```
1. REASON: Need to identify ferroptosis genes
   ACTION: fetch_kegg_pathway("hsa04216")  # Ferroptosis pathway
   
2. REASON: Get expression data for these genes in LUAD
   ACTION: fetch_cbioportal_data(gene="GPX4", cancer_type="luad_tcga")
   
3. REASON: Compare tumor vs normal expression
   ACTION: query_gepia_expression(gene="GPX4", cancer_types=["LUAD"])
   
4. REASON: Find compounds targeting GPX4
   ACTION: fetch_chembl_compounds(target="GPX4", max_ic50=1000)
   
5. REASON: Predict ADMET properties for top compounds
   ACTION: predict_admet_properties(smiles="...")
   
6. REASON: Synthesize findings
   ACTION: Generate report with visualization
```

### 2. Multi-Omics Biomarker Discovery

**User Query:** *"Identify predictive biomarkers for immunotherapy response in melanoma patients."*

**Agent Execution Plan:**
```
1. REASON: Fetch melanoma cohort with immunotherapy metadata
   ACTION: fetch_geo_datasets(keyword="melanoma anti-PD1")
   
2. REASON: Download and preprocess expression matrix
   ACTION: Run Nextflow pipeline for normalization
   
3. REASON: Select features predictive of response
   ACTION: run_feature_selection_xgboost(omics_data, labels)
   
4. REASON: Validate biomarkers with survival analysis
   ACTION: run_survival_analysis(expression_data, clinical_data)
   
5. REASON: Generate Kaplan-Meier curves
   ACTION: Render plotly figure in UI
```

### 3. Molecular Docking Workflow

**User Query:** *"Dock imatinib to BCR-ABL kinase domain and analyze binding interactions."*

**Agent Execution Plan:**
```
1. REASON: Get BCR-ABL structure from PDB
   ACTION: fetch_pdb_structure(pdb_id="1IEP")
   
2. REASON: Prepare protein for docking
   ACTION: prepare_protein_for_docking("1iep.pdb", chain="A")
   
3. REASON: Prepare imatinib ligand
   ACTION: prepare_ligand_for_docking(smiles="...")
   
4. REASON: Run AutoDock Vina
   ACTION: run_molecular_docking(protein, ligand, binding_site)
   
5. REASON: Analyze and visualize results
   ACTION: Display 3D structure with py3Dmol
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Cognitive Engine** | LangGraph, OpenAI GPT-4o, Claude 3.5 | Agent reasoning & orchestration |
| **API Router** | FastAPI, httpx, Redis | Database connectivity & caching |
| **ML Pipelines** | Nextflow, XGBoost, PyTorch, RDKit | Analysis & prediction |
| **UI** | Streamlit, Plotly, py3Dmol | Interactive dashboard |
| **Infrastructure** | Docker, Kubernetes, RabbitMQ, PostgreSQL | Deployment & scaling |

📖 **See [TECH_STACK.md](bioforge_ai/TECH_STACK.md) for detailed recommendations.**  
📖 **See [API_INTERFACES.md](bioforge_ai/API_INTERFACES.md) for function signatures.**  
📖 **See [ARCHITECTURE.md](ARCHITECTURE.md) for system design.**

---

## 📊 Supported Databases

| Category | Databases |
|----------|-----------|
| **Genomics** | cBioPortal, TCGA, GEO, NCBI Gene |
| **Proteomics** | UniProt, PDB, AlphaFold DB |
| **Drugs** | ChEMBL, PubChem, DrugBank |
| **Pathways** | KEGG, Reactome, STRING |
| **Literature** | PubMed, PMC |

---

## 🔒 Security & Compliance

- **Authentication**: OAuth2/JWT via Keycloak or Auth0
- **Encryption**: TLS 1.3 in transit, AES-256 at rest
- **Audit Logging**: All agent actions logged to ELK stack
- **Data Privacy**: GDPR/HIPAA-compliant data handling
- **Container Security**: Trivy scanning, minimal base images

---

## 🧪 Testing

```bash
# Unit tests
pytest tests/unit/

# Integration tests (requires running services)
pytest tests/integration/

# Coverage report
pytest --cov=bioforge_ai --cov-report=html

# Load testing
locust -f tests/load/workflow_locustfile.py
```

---

## 📈 Monitoring

BioForge AI includes comprehensive observability:

- **Metrics**: Prometheus + Grafana dashboards
- **Logging**: ELK stack (Elasticsearch, Logstash, Kibana)
- **Tracing**: Jaeger distributed tracing
- **Alerts**: Prometheus Alertmanager → Slack/PagerDuty

Key metrics tracked:
- Tool call success rates
- API latency percentiles
- Agent reasoning steps per workflow
- ML pipeline execution times

---

## 🚀 Deployment

### Kubernetes (Production)

```bash
# Deploy to Kubernetes
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/

# Check status
kubectl get pods -n bioforge-prod
kubectl get svc -n bioforge-prod
```

### Docker Compose (Development)

```bash
# Start all services
docker-compose up

# Start specific services
docker-compose up redis postgres cognitive-engine
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md).

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Quality

```bash
# Format code
black bioforge_ai/

# Lint
ruff check bioforge_ai/

# Type checking
mypy bioforge_ai/

# Run pre-commit hooks
pre-commit run --all-files
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **cBioPortal** for cancer genomics data
- **TCGA** for multi-omics cancer datasets
- **UniProt** for protein sequence and functional information
- **ChEMBL** for bioactive drug-like small molecules
- **RCSB PDB** for 3D structural data
- **KEGG** for pathway maps

---

## 📬 Contact

- **Documentation**: https://bioforge-ai.readthedocs.io
- **Issues**: https://github.com/your-org/bioforge-ai/issues
- **Discussions**: https://github.com/your-org/bioforge-ai/discussions

---

## 🗺️ Roadmap

### Q1 2025
- [ ] MVP release with core workflows
- [ ] cBioPortal, UniProt, ChEMBL integrations
- [ ] Basic Streamlit UI

### Q2 2025
- [ ] Multi-LLM provider support
- [ ] Advanced ML pipelines (multi-omics integration)
- [ ] Authentication & authorization

### Q3 2025
- [ ] Kubernetes production deployment
- [ ] HPC integration for large-scale docking
- [ ] Collaborative workspaces

### Q4 2025
- [ ] Automated pipeline generation from natural language
- [ ] Real-time collaboration features
- [ ] Mobile-responsive UI

---

<div align="center">

**Built with ❤️ for the bioinformatics community**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

</div>
