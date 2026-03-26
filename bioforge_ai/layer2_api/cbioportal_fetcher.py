"""
BioForge AI - Layer 2: cBioPortal API Connector

This module provides a robust interface to the cBioPortal API for fetching cancer genomics data,
including gene expression profiles, mutation data, copy number alterations, and clinical information.

cBioPortal Documentation: https://www.cbioportal.org/api/

Author: BioForge AI Development Team
License: MIT
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Literal
from enum import Enum

from pydantic import BaseModel, Field, validator

from .base_client import AsyncHTTPClient, BaseAPIResponse, APIError

# Configure structured logging
logger = logging.getLogger(__name__)


class CbioportalStudy(BaseModel):
    """Model for cBioPortal study metadata."""

    study_id: str = Field(..., description="Unique study identifier")
    name: str = Field(..., description="Study name")
    description: str = Field(..., description="Study description")
    cancer_type: str = Field(..., description="Cancer type")
    pub_med_id: Optional[str] = Field(None, description="PubMed ID of associated publication")


class CbioportalGene(BaseModel):
    """Model for gene information from cBioPortal."""

    entrez_gene_id: int = Field(..., description="Entrez Gene ID")
    hugo_gene_symbol: str = Field(..., description="HGNC gene symbol")
    gene_name: Optional[str] = Field(None, description="Full gene name")
    chromosome: Optional[str] = Field(None, description="Chromosome location")


class CbioportalMutation(BaseModel):
    """Model for mutation data from cBioPortal."""

    sample_id: str = Field(..., description="Sample identifier")
    patient_id: str = Field(..., description="Patient identifier")
    gene_symbol: str = Field(..., description="Gene symbol")
    entrez_gene_id: int = Field(..., description="Entrez Gene ID")
    mutation_type: str = Field(..., description="Type of mutation")
    variant_classification: str = Field(..., description="Variant classification")
    amino_acid_change: Optional[str] = Field(None, description="Amino acid change notation")
    protein_position: Optional[int] = Field(None, description="Protein position of mutation")


class CbioportalExpression(BaseModel):
    """Model for gene expression data from cBioPortal."""

    sample_id: str = Field(..., description="Sample identifier")
    patient_id: str = Field(..., description="Patient identifier")
    gene_symbol: str = Field(..., description="Gene symbol")
    entrez_gene_id: int = Field(..., description="Entrez Gene ID")
    z_score: Optional[float] = Field(None, description="Z-score normalized expression")
    mrna_expression: Optional[float] = Field(None, description="Raw mRNA expression value")


class MolecularProfileType(str, Enum):
    """Enumeration of molecular profile types available in cBioPortal."""

    MRNA_EXPRESSION = "mRNA_EXPRESSION"
    MRNA_ZSCORE = "mRNA_ZSCORE"
    MUTATION_EXTENDED = "MUTATION_EXTENDED"
    COPY_NUMBER_ALTERATION = "COPY_NUMBER_ALTERATION"
    PROTEIN_LEVEL = "PROTEIN_LEVEL"
    METHYLATION = "METHYLATION"


class CbioportalFetcher:
    """
    Production-grade client for the cBioPortal API.

    This class provides methods to fetch cancer genomics data including:
    - Available cancer studies
    - Gene expression profiles (mRNA, Z-scores)
    - Somatic mutation data
    - Copy number alterations
    - Clinical patient data

    The cBioPortal API is public and does not require authentication for basic usage.
    Rate limiting is automatically handled by the base HTTP client.

    Attributes:
        base_url: cBioPortal API base URL
        timeout: Request timeout in seconds
        max_retries: Maximum retry attempts for failed requests

    Example:
        >>> async with CbioportalFetcher() as fetcher:
        ...     # Get available studies
        ...     studies = await fetcher.get_studies(cancer_type="lung")
        ...
        ...     # Fetch mutation data for TP53 in lung cancer
        ...     mutations = await fetcher.fetch_mutations(
        ...         gene="TP53",
        ...         study_id="tcga_luad"
        ...     )
        ...
        ...     # Fetch expression data
        ...     expression = await fetcher.fetch_expression(
        ...         gene="EGFR",
        ...         study_id="tcga_luad",
        ...         profile_type=MolecularProfileType.MRNA_ZSCORE
        ...     )
    """

    # Public cBioPortal API endpoint
    DEFAULT_BASE_URL = "https://www.cbioportal.org/api"

    def __init__(
        self,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = 30.0,
        max_retries: int = 3,
    ):
        """
        Initialize the cBioPortal fetcher.

        Args:
            base_url: cBioPortal API base URL (default: public instance)
            timeout: Request timeout in seconds
            max_retries: Maximum number of retry attempts
        """
        self._client = AsyncHTTPClient(
            base_url=base_url,
            timeout=timeout,
            max_retries=max_retries,
            rate_limit_delay=0.5,  # cBioPortal recommends polite usage
        )
        logger.info(
            "cBioPortalFetcher initialized",
            extra={"base_url": base_url, "timeout": timeout, "max_retries": max_retries},
        )

    async def close(self) -> None:
        """Close the underlying HTTP client."""
        await self._client.close()

    async def __aenter__(self) -> "CbioportalFetcher":
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Async context manager exit."""
        await self.close()

    async def get_studies(
        self,
        cancer_type: Optional[str] = None,
        page_number: int = 0,
        page_size: int = 100,
    ) -> BaseAPIResponse:
        """
        Fetch list of cancer studies from cBioPortal.

        Args:
            cancer_type: Filter by cancer type (e.g., "lung", "breast", "prostate")
            page_number: Page number for pagination (0-indexed)
            page_size: Number of results per page (max 100)

        Returns:
            BaseAPIResponse containing list of studies or error details

        Raises:
            APIError: If the API request fails after retries
        """
        params = {
            "pageNumber": page_number,
            "pageSize": min(page_size, 100),
        }

        if cancer_type:
            params["cancerTypeId"] = cancer_type.lower()

        try:
            response = await self._client.get(
                endpoint="/studies",
                params=params,
                source_name="cBioPortal",
            )

            if response.success and response.data:
                logger.info(
                    f"Successfully fetched {len(response.data)} studies from cBioPortal",
                    extra={"cancer_type": cancer_type, "source": "cBioPortal"},
                )

            return response

        except Exception as e:
            logger.error(
                f"Failed to fetch studies from cBioPortal: {str(e)}",
                extra={"cancer_type": cancer_type},
                exc_info=True,
            )
            raise

    async def get_study_details(self, study_id: str) -> BaseAPIResponse:
        """
        Fetch detailed information about a specific study.

        Args:
            study_id: Unique study identifier (e.g., "tcga_luad")

        Returns:
            BaseAPIResponse containing study details or error details

        Raises:
            APIError: If the API request fails after retries
        """
        try:
            response = await self._client.get(
                endpoint=f"/studies/{study_id}",
                source_name="cBioPortal",
            )

            if response.success:
                logger.info(
                    f"Successfully fetched study details for {study_id}",
                    extra={"study_id": study_id, "source": "cBioPortal"},
                )

            return response

        except Exception as e:
            logger.error(
                f"Failed to fetch study details for {study_id}: {str(e)}",
                extra={"study_id": study_id},
                exc_info=True,
            )
            raise

    async def get_molecular_profiles(self, study_id: str) -> BaseAPIResponse:
        """
        Fetch available molecular profiles for a study.

        Molecular profiles define what types of data are available (e.g., mRNA expression,
        mutations, copy number alterations).

        Args:
            study_id: Unique study identifier

        Returns:
            BaseAPIResponse containing list of molecular profiles or error details

        Raises:
            APIError: If the API request fails after retries
        """
        try:
            response = await self._client.get(
                endpoint=f"/studies/{study_id}/molecular-profiles",
                source_name="cBioPortal",
            )

            if response.success:
                profile_types = [p.get("molecularProfileId") for p in response.data] if response.data else []
                logger.info(
                    f"Found {len(profile_types)} molecular profiles for study {study_id}",
                    extra={"study_id": study_id, "profiles": profile_types, "source": "cBioPortal"},
                )

            return response

        except Exception as e:
            logger.error(
                f"Failed to fetch molecular profiles for {study_id}: {str(e)}",
                extra={"study_id": study_id},
                exc_info=True,
            )
            raise

    async def fetch_mutations(
        self,
        gene: str,
        study_id: str,
        projection: Literal["SUMMARY", "DETAILED"] = "SUMMARY",
    ) -> BaseAPIResponse:
        """
        Fetch somatic mutation data for a specific gene in a study.

        Args:
            gene: Gene symbol (e.g., "TP53", "EGFR", "KRAS")
            study_id: Unique study identifier
            projection: Level of detail ("SUMMARY" or "DETAILED")

        Returns:
            BaseAPIResponse containing mutation data or error details

        Raises:
            APIError: If the API request fails after retries

        Example:
            >>> async with CbioportalFetcher() as fetcher:
            ...     result = await fetcher.fetch_mutations(
            ...         gene="TP53",
            ...         study_id="tcga_luad",
            ...         projection="DETAILED"
            ...     )
            ...     if result.success:
            ...         mutations = result.data
        """
        # First, get the molecular profile for mutations
        profiles_response = await self.get_molecular_profiles(study_id)

        if not profiles_response.success or not profiles_response.data:
            return BaseAPIResponse(
                success=False,
                error=f"No molecular profiles found for study {study_id}",
                status_code=404,
                response_time_ms=0,
                source="cBioPortal",
            )

        # Find mutation profile
        mutation_profile_id = None
        for profile in profiles_response.data:
            if profile.get("datatype") == "MUTATION_EXTENDED":
                mutation_profile_id = profile.get("molecularProfileId")
                break

        if not mutation_profile_id:
            return BaseAPIResponse(
                success=False,
                error=f"No mutation profile found for study {study_id}",
                status_code=404,
                response_time_ms=profiles_response.response_time_ms,
                source="cBioPortal",
            )

        # Fetch mutations using the alteration endpoint
        params = {
            "geneId": gene.upper(),
            "projection": projection,
        }

        try:
            response = await self._client.get(
                endpoint=f"/molecular-profiles/{mutation_profile_id}/alterations",
                params=params,
                source_name="cBioPortal",
            )

            if response.success:
                logger.info(
                    f"Successfully fetched mutations for gene {gene} in study {study_id}",
                    extra={
                        "gene": gene,
                        "study_id": study_id,
                        "mutation_count": len(response.data) if response.data else 0,
                        "source": "cBioPortal",
                    },
                )

            return response

        except Exception as e:
            logger.error(
                f"Failed to fetch mutations for {gene} in {study_id}: {str(e)}",
                extra={"gene": gene, "study_id": study_id},
                exc_info=True,
            )
            raise

    async def fetch_expression(
        self,
        gene: str,
        study_id: str,
        profile_type: Optional[MolecularProfileType] = None,
    ) -> BaseAPIResponse:
        """
        Fetch gene expression data for a specific gene in a study.

        Args:
            gene: Gene symbol (e.g., "EGFR", "BRCA1", "MYC")
            study_id: Unique study identifier
            profile_type: Type of expression data (default: auto-detect mRNA Z-score)

        Returns:
            BaseAPIResponse containing expression data or error details

        Raises:
            APIError: If the API request fails after retries

        Example:
            >>> async with CbioportalFetcher() as fetcher:
            ...     result = await fetcher.fetch_expression(
            ...         gene="EGFR",
            ...         study_id="tcga_luad",
            ...         profile_type=MolecularProfileType.MRNA_ZSCORE
            ...     )
            ...     if result.success:
            ...         expression_data = result.data
        """
        # Get molecular profiles
        profiles_response = await self.get_molecular_profiles(study_id)

        if not profiles_response.success or not profiles_response.data:
            return BaseAPIResponse(
                success=False,
                error=f"No molecular profiles found for study {study_id}",
                status_code=404,
                response_time_ms=0,
                source="cBioPortal",
            )

        # Find appropriate expression profile
        expression_profile_id = None

        # Priority order for expression profiles
        preferred_profiles = [
            MolecularProfileType.MRNA_ZSCORE,
            MolecularProfileType.MRNA_EXPRESSION,
        ]

        target_profile = profile_type or MolecularProfileType.MRNA_ZSCORE

        for profile in profiles_response.data:
            profile_id = profile.get("molecularProfileId")
            datatype = profile.get("datatype")

            # Check if this matches our target profile type
            if target_profile.value in profile_id or datatype == target_profile.value:
                expression_profile_id = profile_id
                break

        # Fallback to any mRNA expression profile
        if not expression_profile_id:
            for profile in profiles_response.data:
                datatype = profile.get("datatype")
                if datatype in ["mRNA_EXPRESSION", "mRNA_ZSCORE"]:
                    expression_profile_id = profile.get("molecularProfileId")
                    break

        if not expression_profile_id:
            return BaseAPIResponse(
                success=False,
                error=f"No expression profile found for study {study_id}",
                status_code=404,
                response_time_ms=profiles_response.response_time_ms,
                source="cBioPortal",
            )

        # Fetch expression data
        params = {
            "geneId": gene.upper(),
        }

        try:
            response = await self._client.get(
                endpoint=f"/molecular-profiles/{expression_profile_id}/alterations",
                params=params,
                source_name="cBioPortal",
            )

            if response.success:
                logger.info(
                    f"Successfully fetched expression data for gene {gene} in study {study_id}",
                    extra={
                        "gene": gene,
                        "study_id": study_id,
                        "profile_id": expression_profile_id,
                        "sample_count": len(response.data) if response.data else 0,
                        "source": "cBioPortal",
                    },
                )

            return response

        except Exception as e:
            logger.error(
                f"Failed to fetch expression for {gene} in {study_id}: {str(e)}",
                extra={"gene": gene, "study_id": study_id},
                exc_info=True,
            )
            raise

    async def fetch_clinical_data(
        self,
        study_id: str,
        attribute_ids: Optional[List[str]] = None,
    ) -> BaseAPIResponse:
        """
        Fetch clinical data for patients in a study.

        Args:
            study_id: Unique study identifier
            attribute_ids: Optional list of specific clinical attributes to fetch
                          (e.g., ["OS_STATUS", "OS_MONTHS", "AGE"])

        Returns:
            BaseAPIResponse containing clinical data or error details

        Raises:
            APIError: If the API request fails after retries
        """
        try:
            # Get all clinical attributes if not specified
            if attribute_ids:
                # Fetch specific attributes
                all_data = []
                for attr_id in attribute_ids:
                    response = await self._client.get(
                        endpoint=f"/studies/{study_id}/clinical-data",
                        params={"attributeId": attr_id},
                        source_name="cBioPortal",
                    )
                    if response.success and response.data:
                        all_data.extend(response.data)

                return BaseAPIResponse(
                    success=True,
                    data=all_data,
                    status_code=200,
                    response_time_ms=sum(r.response_time_ms for r in [response]) / len(attribute_ids),
                    source="cBioPortal",
                )
            else:
                # Fetch all clinical data
                response = await self._client.get(
                    endpoint=f"/studies/{study_id}/clinical-data",
                    source_name="cBioPortal",
                )

                if response.success:
                    logger.info(
                        f"Successfully fetched clinical data for study {study_id}",
                        extra={
                            "study_id": study_id,
                            "patient_count": len(response.data) if response.data else 0,
                            "source": "cBioPortal",
                        },
                    )

                return response

        except Exception as e:
            logger.error(
                f"Failed to fetch clinical data for {study_id}: {str(e)}",
                extra={"study_id": study_id},
                exc_info=True,
            )
            raise

    async def search_gene(self, gene_symbol: str) -> BaseAPIResponse:
        """
        Search for a gene and retrieve its Entrez ID and metadata.

        Args:
            gene_symbol: HGNC gene symbol (e.g., "TP53", "EGFR")

        Returns:
            BaseAPIResponse containing gene information or error details

        Raises:
            APIError: If the API request fails after retries
        """
        try:
            response = await self._client.get(
                endpoint="/genes/fetch",
                params={"geneId": gene_symbol.upper()},
                source_name="cBioPortal",
            )

            if response.success:
                logger.info(
                    f"Successfully found gene {gene_symbol}",
                    extra={
                        "gene_symbol": gene_symbol,
                        "entrez_id": response.data[0].get("entrezGeneId") if response.data else None,
                        "source": "cBioPortal",
                    },
                )

            return response

        except Exception as e:
            logger.error(
                f"Failed to search gene {gene_symbol}: {str(e)}",
                extra={"gene_symbol": gene_symbol},
                exc_info=True,
            )
            raise

    async def fetch_cna(
        self,
        gene: str,
        study_id: str,
        projection: Literal["SUMMARY", "DETAILED"] = "SUMMARY",
    ) -> BaseAPIResponse:
        """
        Fetch copy number alteration (CNA) data for a gene in a study.

        Args:
            gene: Gene symbol (e.g., "HER2", "MYC", "PTEN")
            study_id: Unique study identifier
            projection: Level of detail ("SUMMARY" or "DETAILED")

        Returns:
            BaseAPIResponse containing CNA data or error details

        Raises:
            APIError: If the API request fails after retries
        """
        # Get molecular profiles
        profiles_response = await self.get_molecular_profiles(study_id)

        if not profiles_response.success or not profiles_response.data:
            return BaseAPIResponse(
                success=False,
                error=f"No molecular profiles found for study {study_id}",
                status_code=404,
                response_time_ms=0,
                source="cBioPortal",
            )

        # Find CNA profile
        cna_profile_id = None
        for profile in profiles_response.data:
            if profile.get("datatype") == "COPY_NUMBER_ALTERATION":
                cna_profile_id = profile.get("molecularProfileId")
                break

        if not cna_profile_id:
            return BaseAPIResponse(
                success=False,
                error=f"No CNA profile found for study {study_id}",
                status_code=404,
                response_time_ms=profiles_response.response_time_ms,
                source="cBioPortal",
            )

        # Fetch CNA data
        params = {
            "geneId": gene.upper(),
            "projection": projection,
        }

        try:
            response = await self._client.get(
                endpoint=f"/molecular-profiles/{cna_profile_id}/alterations",
                params=params,
                source_name="cBioPortal",
            )

            if response.success:
                logger.info(
                    f"Successfully fetched CNA data for gene {gene} in study {study_id}",
                    extra={
                        "gene": gene,
                        "study_id": study_id,
                        "sample_count": len(response.data) if response.data else 0,
                        "source": "cBioPortal",
                    },
                )

            return response

        except Exception as e:
            logger.error(
                f"Failed to fetch CNA data for {gene} in {study_id}: {str(e)}",
                extra={"gene": gene, "study_id": study_id},
                exc_info=True,
            )
            raise


async def fetch_cbioportal_data(
    gene: str,
    cancer_type: str,
    data_types: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Convenience function to fetch comprehensive data for a gene in a cancer type.

    This function orchestrates multiple API calls to gather mutations, expression,
    and CNA data for a given gene across all relevant studies for a cancer type.

    Args:
        gene: Gene symbol (e.g., "TP53", "EGFR")
        cancer_type: Cancer type identifier or name (e.g., "lung", "breast")
        data_types: List of data types to fetch (default: ["mutations", "expression", "cna"])

    Returns:
        Dictionary containing:
        - success: bool indicating overall success
        - studies: List of matching studies
        - mutations: Mutation data per study
        - expression: Expression data per study
        - cna: Copy number alteration data per study
        - errors: List of any errors encountered

    Example:
        >>> import asyncio
        >>> async def main():
        ...     result = await fetch_cbioportal_data(
        ...         gene="TP53",
        ...         cancer_type="lung",
        ...         data_types=["mutations", "expression"]
        ...     )
        ...     print(f"Found {len(result['studies'])} studies")
        >>> asyncio.run(main())
    """
    if data_types is None:
        data_types = ["mutations", "expression", "cna"]

    results = {
        "success": True,
        "gene": gene,
        "cancer_type": cancer_type,
        "studies": [],
        "mutations": {},
        "expression": {},
        "cna": {},
        "errors": [],
    }

    async with CbioportalFetcher() as fetcher:
        try:
            # Step 1: Find relevant studies
            logger.info(f"Searching for {cancer_type} studies in cBioPortal")
            studies_response = await fetcher.get_studies(cancer_type=cancer_type.lower())

            if not studies_response.success:
                results["success"] = False
                results["errors"].append(f"Failed to fetch studies: {studies_response.error}")
                return results

            studies = studies_response.data or []
            results["studies"] = studies

            if not studies:
                logger.warning(f"No studies found for cancer type: {cancer_type}")
                results["errors"].append(f"No studies found for cancer type: {cancer_type}")
                return results

            logger.info(f"Found {len(studies)} studies for {cancer_type}")

            # Step 2: Fetch requested data types for each study
            for study in studies[:5]:  # Limit to top 5 studies to avoid overwhelming API
                study_id = study.get("studyId", study.get("id"))

                if not study_id:
                    continue

                logger.info(f"Fetching data for study: {study_id}")

                # Fetch mutations
                if "mutations" in data_types:
                    try:
                        mut_response = await fetcher.fetch_mutations(gene=gene, study_id=study_id)
                        if mut_response.success:
                            results["mutations"][study_id] = mut_response.data
                        else:
                            results["errors"].append(f"Mutation fetch failed for {study_id}: {mut_response.error}")
                    except Exception as e:
                        results["errors"].append(f"Mutation fetch exception for {study_id}: {str(e)}")

                # Fetch expression
                if "expression" in data_types:
                    try:
                        expr_response = await fetcher.fetch_expression(gene=gene, study_id=study_id)
                        if expr_response.success:
                            results["expression"][study_id] = expr_response.data
                        else:
                            results["errors"].append(f"Expression fetch failed for {study_id}: {expr_response.error}")
                    except Exception as e:
                        results["errors"].append(f"Expression fetch exception for {study_id}: {str(e)}")

                # Fetch CNA
                if "cna" in data_types:
                    try:
                        cna_response = await fetcher.fetch_cna(gene=gene, study_id=study_id)
                        if cna_response.success:
                            results["cna"][study_id] = cna_response.data
                        else:
                            results["errors"].append(f"CNA fetch failed for {study_id}: {cna_response.error}")
                    except Exception as e:
                        results["errors"].append(f"CNA fetch exception for {study_id}: {str(e)}")

        except Exception as e:
            logger.error(f"Critical error in fetch_cbioportal_data: {str(e)}", exc_info=True)
            results["success"] = False
            results["errors"].append(f"Critical error: {str(e)}")

    return results
