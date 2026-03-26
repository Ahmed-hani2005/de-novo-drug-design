# BioForge AI - Key API Interfaces

This document defines the main function signatures that the LLM agent will call via tool invocation. All functions are designed to be LangChain/LangGraph compatible tools with proper type hints and docstrings.

---

## Layer 2: Universal API Router Interfaces

### Genomics & Cancer Data

```python
from typing import Optional, List, Dict, Any
import pandas as pd

def fetch_cbioportal_data(
    gene: str,
    cancer_type: str,
    data_type: str = "mrna",
    profile_type: str = "Z-Score",
) -> Dict[str, Any]:
    """
    Fetch genomic alteration data from cBioPortal for TCGA studies.
    
    Args:
        gene: Gene symbol (e.g., "TP53", "GPX4")
        cancer_type: Cancer study ID (e.g., "luad_tcga", "brca_tcga")
        data_type: Type of data ("mrna", "cnaf", "mutation", "protein")
        profile_type: Expression profile ("Z-Score", "log2norm")
    
    Returns:
        Dictionary containing:
            - sample_ids: List of sample identifiers
            - values: Expression/alteration values
            - metadata: Study information
            - statistics: Mean, median, std dev
    
    Example:
        >>> result = fetch_cbioportal_data("GPX4", "luad_tcga", "mrna")
        >>> df = pd.DataFrame(result['values'])
    """
    pass


def fetch_tcga_survival_data(
    cancer_type: str,
    gene_list: Optional[List[str]] = None,
    clinical_filters: Optional[Dict[str, Any]] = None,
) -> pd.DataFrame:
    """
    Retrieve clinical survival data from TCGA via cBioPortal.
    
    Args:
        cancer_type: Cancer study ID
        gene_list: Optional genes for stratification
        clinical_filters: Filter by stage, grade, age, etc.
    
    Returns:
        DataFrame with columns:
            - patient_id, days_to_death, days_to_last_followup
            - vital_status, tumor_stage, tumor_grade
            - gene_expression (if gene_list provided)
    """
    pass


def query_gepia_expression(
    gene: str,
    cancer_types: List[str],
    match_control: bool = True,
) -> Dict[str, Any]:
    """
    Get differential expression between tumor and normal from GEPIA.
    
    Args:
        gene: Gene symbol
        cancer_types: List of cancer types (e.g., ["LUAD", "LUSC"])
        match_control: Match TCGA normal samples
    
    Returns:
        Dictionary with:
            - tumor_expression: Array of tumor values
            - normal_expression: Array of normal values
            - p_value: Statistical significance
            - log2fc: Log2 fold change
    """
    pass


def search_ncbi_gene(gene: str, organism: str = "human") -> Dict[str, Any]:
    """
    Search NCBI Gene database for gene information.
    
    Args:
        gene: Gene symbol or ID
        organism: Organism name ("human", "mouse", "rat")
    
    Returns:
        Dictionary with:
            - gene_id: NCBI Gene ID
            - description: Gene description
            - synonyms: Alternative names
            - chromosomal_location: Chromosome band
            - summary: Functional summary
    """
    pass


def fetch_geo_datasets(
    keyword: str,
    organism: str = "Homo sapiens",
    gse_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Search GEO datasets by keyword or GSE accession.
    
    Args:
        keyword: Search term (disease, tissue, treatment)
        organism: Organism filter
        gse_id: Specific GSE accession number
    
    Returns:
        List of datasets with:
            - gse_id, title, summary
            - sample_count, platform, publication_date
            - download_url
    """
    pass


def search_pubmed(
    query: str,
    max_results: int = 10,
    date_range: Optional[tuple] = None,
) -> List[Dict[str, Any]]:
    """
    Search PubMed literature.
    
    Args:
        query: Search query (gene + disease + context)
        max_results: Maximum number of papers to return
        date_range: (start_year, end_year) tuple
    
    Returns:
        List of publications with:
            - pmid, title, authors, journal
            - abstract, publication_date
            - doi, pmc_id
    """
    pass
```

### Proteomics & Structures

```python
def fetch_uniprot_protein(
    gene: str,
    organism: str = "9606",  # Human taxonomy ID
    include_sequences: bool = True,
) -> Dict[str, Any]:
    """
    Retrieve protein information from UniProt.
    
    Args:
        gene: Gene name
        organism: Taxonomy ID (9606=human)
        include_sequences: Include FASTA sequence
    
    Returns:
        Dictionary with:
            - uniprot_id, entry_name, protein_name
            - gene_names, organism, length
            - function, subcellular_location
            - domains, ptm_annotations
            - sequence (FASTA format)
    """
    pass


def fetch_pdb_structure(
    pdb_id: str,
    chain_id: Optional[str] = None,
    resolution_threshold: float = 3.0,
) -> Dict[str, Any]:
    """
    Get protein structure from PDB.
    
    Args:
        pdb_id: 4-character PDB code (e.g., "1ABC")
        chain_id: Specific chain identifier
        resolution_threshold: Max resolution in Angstroms
    
    Returns:
        Dictionary with:
            - pdb_id, title, authors
            - resolution, method (X-ray, NMR, CryoEM)
            - chains: List of chain info
            - ligands: Bound small molecules
            - download_url_pdb, download_url_cif
    """
    pass


def fetch_alphafold_prediction(
    uniprot_id: str,
    confidence_threshold: float = 70.0,
) -> Dict[str, Any]:
    """
    Retrieve AlphaFold predicted structure.
    
    Args:
        uniprot_id: UniProt accession
        confidence_threshold: Min pLDDT score
    
    Returns:
        Dictionary with:
            - uniprot_id, predicted_structure_url
            - confidence_scores: Per-residue pLDDT
            - domain_boundaries
            - download_url_pdb
    """
    pass


def query_string_interactions(
    protein: str,
    organism: str = "9606",
    interaction_score: float = 0.7,
    max_interactors: int = 50,
) -> Dict[str, Any]:
    """
    Get protein-protein interactions from STRING DB.
    
    Args:
        protein: Protein name or UniProt ID
        organism: Taxonomy ID
        interaction_score: Minimum confidence score (0-1)
        max_interactors: Maximum number of interactors
    
    Returns:
        Dictionary with:
            - query_protein: Input protein info
            - interactors: List of interacting proteins
                - protein_id, symbol, score
                - evidence_types (experimental, database, textmining)
            - network_url: STRING network visualization URL
    """
    pass
```

### Drugs & Pathways

```python
def fetch_chembl_compounds(
    target: str,
    activity_type: str = "IC50",
    max_ic50: float = 10000,  # nM
    max_results: int = 100,
) -> List[Dict[str, Any]]:
    """
    Search ChEMBL for compounds targeting a protein.
    
    Args:
        target: Target protein name or UniProt ID
        activity_type: Activity type ("IC50", "EC50", "Ki")
        max_ic50: Maximum potency threshold (nM)
        max_results: Maximum compounds to return
    
    Returns:
        List of compounds with:
            - chembl_id, molecule_name, smiles
            - molecular_weight, logp, hba, hbd
            - activity_values: List of activity measurements
            - target_chembl_id, assay_references
    """
    pass


def fetch_pubchem_assay(
    compound_cid: int,
    assay_type: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Get PubChem bioassay data for a compound.
    
    Args:
        compound_cid: PubChem Compound ID
        assay_type: Filter by assay type ("confirmatory", "screening")
    
    Returns:
        Dictionary with:
            - cid, compound_name, synonyms
            - assays: List of bioassay results
                - aid, assay_name, assay_type
                - activity_outcome (active, inactive, inconclusive)
            - targets: Tested protein targets
    """
    pass


def fetch_drugbank_drug(
    drug_name: str,
    include_interactions: bool = True,
) -> Dict[str, Any]:
    """
    Retrieve detailed drug information from DrugBank.
    
    Args:
        drug_name: Drug name or DrugBank ID
        include_interactions: Include drug-drug interactions
    
    Returns:
        Dictionary with:
            - drugbank_id, name, brand_names
            - indication, pharmacodynamics
            - mechanism_of_action
            - absorption, metabolism, toxicity
            - interactions: List of DDI (if enabled)
            - targets: Protein targets with actions
    """
    pass


def fetch_kegg_pathway(
    pathway_id: str,
    genes_only: bool = False,
) -> Dict[str, Any]:
    """
    Get pathway information from KEGG.
    
    Args:
        pathway_id: KEGG pathway ID (e.g., "hsa04214" for apoptosis)
        genes_only: Return only gene list
    
    Returns:
        Dictionary with:
            - pathway_id, name, description
            - genes: List of genes in pathway
                - kegg_gene_id, symbol, name
            - compounds: Small molecules in pathway
            - reactions: Biochemical reactions
            - pathway_map_url: KEGG map image URL
    """
    pass


def get_kegg_disease_genes(
    disease_keyword: str,
    organism: str = "hsa",
) -> List[Dict[str, Any]]:
    """
    Find genes associated with a disease in KEGG.
    
    Args:
        disease_keyword: Disease name or keyword
        organism: Organism code ("hsa"=human)
    
    Returns:
        List of genes with:
            - gene_id, symbol, name
            - associated_diseases
            - pathways_involved
    """
    pass
```

---

## Layer 3: ML Pipeline Interfaces

### Multi-Omics Analysis

```python
def run_differential_expression(
    expression_matrix: pd.DataFrame,
    sample_groups: Dict[str, List[str]],
    method: str = "limma",
    fdr_threshold: float = 0.05,
    logfc_threshold: float = 1.0,
) -> pd.DataFrame:
    """
    Perform differential expression analysis.
    
    Args:
        expression_matrix: Genes x Samples matrix
        sample_groups: {"tumor": [samples], "normal": [samples]}
        method: Statistical method ("limma", "deseq2", "edger")
        fdr_threshold: False discovery rate cutoff
        logfc_threshold: Minimum log2 fold change
    
    Returns:
        DataFrame with:
            - gene_symbol, log2fc, p_value, adj_p_value
            - base_mean, t_statistic
            - significant: Boolean flag
    """
    pass


def run_feature_selection_xgboost(
    omics_data: pd.DataFrame,
    labels: pd.Series,
    n_features: int = 50,
    cv_folds: int = 5,
) -> Dict[str, Any]:
    """
    Select predictive features using XGBoost.
    
    Args:
        omics_data: Samples x Features matrix
        labels: Sample labels (response/non-response)
        n_features: Number of top features to select
        cv_folds: Cross-validation folds
    
    Returns:
        Dictionary with:
            - selected_features: Top N feature names
            - feature_importance: Importance scores
            - model_metrics: AUC, accuracy, F1
            - cv_results: Cross-validation scores
    """
    pass


def run_survival_analysis(
    expression_data: pd.DataFrame,
    clinical_data: pd.DataFrame,
    gene_of_interest: str,
    stratification_method: str = "median",
) -> Dict[str, Any]:
    """
    Perform Kaplan-Meier survival analysis.
    
    Args:
        expression_data: Gene expression matrix
        clinical_data: Clinical data with survival info
        gene_of_interest: Gene to stratify by
        stratification_method: "median", "mean", "optimal_cutpoint"
    
    Returns:
        Dictionary with:
            - km_curve_data: Time, survival probability arrays
            - high_group_n, low_group_n: Sample counts
            - median_survival_high, median_survival_low
            - hazard_ratio, ci_95, p_value (log-rank test)
            - cox_model_summary: Multivariate Cox results
    """
    pass


def integrate_multi_omics(
    mrna_data: pd.DataFrame,
    protein_data: Optional[pd.DataFrame] = None,
    methylation_data: Optional[pd.DataFrame] = None,
    method: str = "moae",
    n_components: int = 50,
) -> Dict[str, Any]:
    """
    Integrate multiple omics layers.
    
    Args:
        mrna_data: mRNA expression matrix
        protein_data: Proteomics matrix (optional)
        methylation_data: Methylation beta values (optional)
        method: Integration method ("moae", "icluster", "snf")
        n_components: Latent dimensions
    
    Returns:
        Dictionary with:
            - integrated_features: Reduced dimension matrix
            - feature_weights: Contribution of each omics layer
            - clustering_results: Sample clusters (if applicable)
            - visualization_data: t-SNE/UMAP coordinates
    """
    pass


def stratify_patients(
    multi_omics_data: pd.DataFrame,
    clinical_outcome: pd.Series,
    algorithm: str = "consensus_clustering",
    k_clusters: int = 3,
) -> Dict[str, Any]:
    """
    Stratify patients into molecular subtypes.
    
    Args:
        multi_omics_data: Integrated omics matrix
        clinical_outcome: Outcome variable for validation
        algorithm: Clustering algorithm
        k_clusters: Number of clusters
    
    Returns:
        Dictionary with:
            - cluster_assignments: Patient -> cluster mapping
            - silhouette_score: Clustering quality
            - cluster_characteristics: Enriched pathways per cluster
            - survival_difference: Log-rank p-value between clusters
            - biomarker_candidates: Cluster-specific markers
    """
    pass
```

### Cheminformatics & Docking

```python
def predict_admet_properties(smiles: str) -> Dict[str, Any]:
    """
    Predict ADMET properties using RDKit and ML models.
    
    Args:
        smiles: SMILES string of compound
    
    Returns:
        Dictionary with:
            - molecular_properties:
                - mw, logp, tpsa, hba, hbd, rotatable_bonds
            - admet_predictions:
                - absorption: Caco-2 permeability, bioavailability
                - distribution: Volume of distribution, BBB penetration
                - metabolism: CYP450 substrates/inhibitors
                - excretion: Clearance, half-life
                - toxicity: Ames mutagenicity, hepatotoxicity, LD50
            - drug_likeness: Lipinski, Veber, Ghose filters
            - synthetic_accessibility: SA score (1-10)
    """
    pass


def prepare_protein_for_docking(
    pdb_file: str,
    chain_id: str,
    remove_waters: bool = True,
    add_hydrogens: bool = True,
) -> str:
    """
    Prepare protein structure for AutoDock Vina.
    
    Args:
        pdb_file: Path to PDB file
        chain_id: Chain to extract
        remove_waters: Remove water molecules
        add_hydrogens: Add polar hydrogens
    
    Returns:
        Path to prepared PDBQT file
    """
    pass


def prepare_ligand_for_docking(
    smiles: str,
    output_path: str,
    generate_3d: bool = True,
    minimize: bool = True,
) -> str:
    """
    Prepare ligand for docking from SMILES.
    
    Args:
        smiles: Ligand SMILES string
        output_path: Output PDBQT path
        generate_3d: Generate 3D conformation
        minimize: Energy minimization
    
    Returns:
        Path to prepared PDBQT file
    """
    pass


def run_molecular_docking(
    protein_pdbqt: str,
    ligand_pdbqt: str,
    center_x: float,
    center_y: float,
    center_z: float,
    size_x: float = 20.0,
    size_y: float = 20.0,
    size_z: float = 20.0,
    exhaustiveness: int = 8,
    num_poses: int = 10,
) -> Dict[str, Any]:
    """
    Run AutoDock Vina molecular docking.
    
    Args:
        protein_pdbqt: Path to protein PDBQT
        ligand_pdbqt: Path to ligand PDBQT
        center_x/y/z: Binding site center coordinates
        size_x/y/z: Box dimensions (Angstroms)
        exhaustiveness: Search exhaustiveness
        num_poses: Number of poses to generate
    
    Returns:
        Dictionary with:
            - poses: List of docking poses
                - pose_id, affinity (kcal/mol)
                - rmsd_lower, rmsd_upper
                - pdbqt_file: Path to pose coordinates
            - binding_site_residues: Residues in contact
            - interaction_analysis: H-bonds, hydrophobic contacts
            - vina_log: Full Vina output
    """
    pass


def analyze_docking_results(
    docking_output: Dict[str, Any],
    threshold_affinity: float = -7.0,
) -> Dict[str, Any]:
    """
    Analyze and rank docking results.
    
    Args:
        docking_output: Output from run_molecular_docking
        threshold_affinity: Affinity cutoff for "good" binders
    
    Returns:
        Dictionary with:
            - best_pose: Highest affinity pose details
            - pose_statistics: Mean, std of affinities
            - passing_threshold: Poses below threshold
            - interaction_summary: Common interacting residues
            - visualization_data: PyMOL session commands
    """
    pass


def virtual_screening(
    protein_pdbqt: str,
    compound_library: List[str],  # List of SMILES
    binding_site: Dict[str, float],
    top_n: int = 100,
) -> pd.DataFrame:
    """
    Perform virtual screening on compound library.
    
    Args:
        protein_pdbqt: Target protein structure
        compound_library: List of SMILES strings
        binding_site: {"center_x": ..., "size_x": ...}
        top_n: Number of top hits to return
    
    Returns:
        DataFrame with:
            - smiles, compound_name
            - docking_affinity, rank
            - admet_properties (pre-computed)
            - drug_likeness_score
            - selection_rationale
    """
    pass
```

---

## Tool Registration for LangChain/LangGraph

```python
from langchain.tools import tool
from typing import Annotated

# Example of tool decorator pattern for agent
@tool
def fetch_cbioportal_data(
    gene: Annotated[str, "Gene symbol (e.g., TP53, GPX4)"],
    cancer_type: Annotated[str, "Cancer study ID (e.g., luad_tcga)"],
) -> str:
    """Fetch genomic data from cBioPortal for a gene in a specific cancer type."""
    result = _fetch_cbioportal_data_impl(gene, cancer_type)
    return json.dumps(result)

# All tools registered in a single list
BIOFORGE_TOOLS = [
    fetch_cbioportal_data,
    fetch_tcga_survival_data,
    query_gepia_expression,
    search_ncbi_gene,
    fetch_uniprot_protein,
    fetch_pdb_structure,
    query_string_interactions,
    fetch_chembl_compounds,
    fetch_drugbank_drug,
    fetch_kegg_pathway,
    run_differential_expression,
    run_survival_analysis,
    predict_admet_properties,
    run_molecular_docking,
    # ... all other tools
]
```

---

## Error Handling & Response Format

All API functions follow this standard response pattern:

```python
class APIResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    error_code: Optional[str] = None
    metadata: Dict[str, Any] = {
        "source": "cbioportal",
        "timestamp": "2025-01-15T10:30:00Z",
        "cache_hit": False,
        "query_time_ms": 245,
    }

# Usage in agent
try:
    response = fetch_cbioportal_data("GPX4", "luad_tcga")
    if response.success:
        agent.memory.add_observation(response.data)
    else:
        agent.handle_error(response.error_code, response.error)
except RateLimitError:
    # Exponential backoff retry
    pass
except NetworkError:
    # Fallback to cached data
    pass
```
