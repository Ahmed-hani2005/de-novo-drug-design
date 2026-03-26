bioforge_ai/
│
├── agents/                         # Layer 1: Cognitive Engine
│   ├── __init__.py
│   ├── cognitive_engine.py         # Main LangGraph agent orchestrator
│   ├── reasoning_loop.py           # ReAct framework implementation
│   ├── planner.py                  # Chain-of-Thought workflow planner
│   └── memory.py                   # Agent short/long-term memory (Redis-backed)
│
├── tools/                          # Layer 2 & 3: Tools & Executors
│   ├── __init__.py
│   │
│   ├── api_clients/                # Layer 2: Universal API Router
│   │   ├── __init__.py
│   │   ├── base_client.py          # Abstract base class for all API clients
│   │   ├── cbioportal_client.py    # cBioPortal/TCGA data fetcher
│   │   ├── uniprot_client.py       # UniProt protein data
│   │   ├── pdb_client.py           # PDB/AlphaFold DB structures
│   │   ├── chembl_client.py        # ChEMBL compound data
│   │   ├── pubchem_client.py       # PubChem assays & compounds
│   │   ├── drugbank_client.py      # DrugBank interactions
│   │   ├── kegg_client.py          # KEGG pathways
│   │   ├── string_client.py        # STRING protein interactions
│   │   ├── ncbi_client.py          # PubMed, Gene, GEO
│   │   └── gepia_client.py         # GEPIA expression analysis
│   │
│   ├── ml_pipelines/               # Layer 3: ML & Analysis
│   │   ├── __init__.py
│   │   ├── pipeline_orchestrator.py # Nextflow/Snakemake wrapper
│   │   ├── feature_selection.py     # XGBoost/Scikit-learn pipelines
│   │   ├── survival_analysis.py     # Kaplan-Meier, Cox regression
│   │   ├── biomarker_discovery.py   # Multi-omics integration
│   │   └── patient_stratification.py # Clustering & classification
│   │
│   └── docking/                    # Layer 3: Cheminformatics & Docking
│       ├── __init__.py
│       ├── rdkit_utils.py          # RDKit ADMET prediction
│       ├── vina_wrapper.py         # AutoDock Vina subprocess runner
│       ├── structure_prep.py       # PDBQT preparation
│       └── pose_analyzer.py        # Docking score analysis
│
├── models/                         # Trained ML Models
│   ├── __init__.py
│   │
│   ├── survival/                   # Survival Prediction Models
│   │   ├── __init__.py
│   │   ├── cox_model.py
│   │   └── deepsurv.py
│   │
│   ├── biomarker/                  # Biomarker Discovery Models
│   │   ├── __init__.py
│   │   ├── xgboost_classifier.py
│   │   └── multi_omics_autoencoder.py
│   │
│   └── admet/                      # ADMET Prediction Models
│       ├── __init__.py
│       ├── adsorption_model.py
│       └── toxicity_predictor.py
│
├── ui/                             # Layer 4: Interactive Dashboard
│   ├── __init__.py
│   ├── app.py                      # Main Streamlit application
│   │
│   ├── pages/                      # Multi-page UI
│   │   ├── 01_🔬_Target_Discovery.py
│   │   ├── 02_💊_Drug_Repurposing.py
│   │   ├── 03_🧬_Multi-Omics_Analysis.py
│   │   ├── 04_🔬_Molecular_Docking.py
│   │   └── 05_⚙️_Pipeline_Builder.py
│   │
│   ├── components/                 # Reusable UI Components
│   │   ├── __init__.py
│   │   ├── gene_expression_heatmap.py
│   │   ├── volcano_plot.py
│   │   ├── kaplan_meier_curve.py
│   │   ├── survival_plot.py
│   │   ├── pathway_viewer.py
│   │   ├── molecular_viewer_3d.py   # py3Dmol wrapper
│   │   ├── docking_results_table.py
│   │   └── agent_reasoning_stream.py # Real-time ReAct display
│   │
│   └── utils/                      # UI Helpers
│       ├── __init__.py
│       ├── session_state.py
│       ├── plot_themes.py
│       └── export_utils.py
│
├── config/                         # Configuration Files
│   ├── __init__.py
│   ├── settings.py                 # Pydantic settings manager
│   ├── api_keys.yaml.example       # External API credentials template
│   ├── database_config.yaml        # PostgreSQL/Redis connection
│   ├── pipeline_configs/           # Nextflow pipeline parameters
│   │   ├── differential_expression.yaml
│   │   ├── survival_analysis.yaml
│   │   └── docking_workflow.yaml
│   └── logging_config.yaml         # Structured logging setup
│
├── data/                           # Data Storage (gitignored in production)
│   ├── raw/                        # Raw downloaded data
│   ├── processed/                  # Processed datasets
│   ├── cache/                      # API response cache
│   └── models/                     # Saved model checkpoints
│
├── tests/                          # Test Suite
│   ├── __init__.py
│   ├── conftest.py                 # Pytest fixtures
│   │
│   ├── unit/                       # Unit Tests
│   │   ├── test_api_clients.py
│   │   ├── test_ml_pipelines.py
│   │   ├── test_docking.py
│   │   └── test_agent.py
│   │
│   └── integration/                # Integration Tests
│       ├── test_workflow_end_to_end.py
│       ├── test_api_rate_limits.py
│       └── test_pipeline_execution.py
│
├── scripts/                        # Utility Scripts
│   ├── setup_database.py           # Initialize PostgreSQL schema
│   ├── seed_reference_data.py      # Preload reference genomes
│   ├── deploy_k8s.sh               # Kubernetes deployment
│   └── backup_redis.py             # Redis backup utility
│
├── docs/                           # Documentation
│   ├── api_reference.md
│   ├── agent_prompt_templates.md
│   ├── pipeline_user_guide.md
│   └── deployment_guide.md
│
├── .env.example                    # Environment variables template
├── .gitignore
├── requirements.txt                # Python dependencies
├── requirements-dev.txt            # Development dependencies
├── Dockerfile                      # Container definition
├── docker-compose.yml              # Local development stack
├── nextflow.config                 # Nextflow configuration
├── pyproject.toml                  # Project metadata & tooling
└── README.md
