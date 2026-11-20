---
title: "Data Disclosure and Handling Protocol #JadiTangguh"
version: "1.1.0"
status: frozen
effective_date: "TODO(maintainer)"
steward: "Aly Lamuri"
reviewer: "Haykal Hafidzul Arifin (Scientist, Biro Psikologi Attentive)"
supersedes: "https://github.com/konsulin-care/landing-page/blob/b6cff0829f0c933347973f1c3e1124a203e99c7d/static/disclosure/protocol.md"
---

# Data Disclosure and Handling Protocol #JadiTangguh

## Abstract

This document specifies how data collected through the #JadiTangguh citizen-science study of psychological resilience (*resiliensi psikologis*) are collected, secured, processed and released. It defines four release tiers, the disclosure-control procedure applied to public-use microdata, the validation steps required before each release, the conditions governing restricted access, and the residual risks that remain after those controls. The document is written for auditors, data users and reviewers. It is not participant-facing copy. Participant notices are published separately in Indonesian.

## 1. Scope and versioning

- This protocol governs all data collected under #JadiTangguh.
- Each revision of the protocol is a separate commit in the public repository. Technical users cite a specific version through its GitHub permalink, for example https://github.com/konsulin-care/landing-page/blob/&lt;sha&gt;/static/disclosure/protocol.md
- The `supersedes` field above records the permalink of the preceding version. The revision history in Section 14 records every version.
- Amendments apply only to data collected after the effective date of the amended version. Material amendments are announced to participants, because a change to the disclosure procedure alters the conditions under which consent was given.

## 2. Roles and responsibilities

- The data steward is Aly Lamuri, principal investigator of the study.
- The second reviewer is Haykal Hafidzul Arifin, Scientist at Biro Psikologi Attentive.
- The steward and the second reviewer both sign off each public release and each request for restricted access. Neither signature alone is sufficient, so that no single person authorises the disclosure of participant data.
- Correspondence concerning this protocol is addressed to hello@konsulin.care

## 3. Data collected

- Demographic variables, namely age, sex, regency or city of residence, highest educational attainment, employment status, relationship status and household expenditure.
- Item-level questionnaire responses, consent records and response timestamps.
- Email address, recorded only where a participant elects to retain a report. The address is held by the system, is visible to the participant alone, and cannot be extracted by researchers.
- Referral patterns, that is a record of participation recruited through a friend's invitation link.
- The survey collects no device data and no other technical data. Instrument names are omitted from this document by design, since the variable classes rather than the instruments determine the treatment applied.

## 4. Storage and security

- The pseudonymous Patient ID used in the FHIR data model is held in a private network reachable only by the backend system. Access is subject to role-based access control and additional technical safeguards.
- Researchers observe a random participant identifier only; they cannot resolve it to a personal identity.
- Raw data never leave the backend environment.

## 5. Release tiers

| Tier | Contents | Access |
| --- | --- | --- |
| Aggregate | Summary tables, participant reports and aggregate-results emails. Cells smaller than 11 are suppressed. | Public |
| Public-use wave files | Protected microdata for a single wave. | Public, Harvard Dataverse, CC BY 4.0 with terms of use prohibiting re-identification |
| Restricted | Complete item-level response files, regency or city, wave-linked longitudinal data and referral edges. | Konsulin, controlled download under a Data Use Agreement |
| Original | The complete raw data. | Backend only, never released |

## 6. Processing of public-use data

- Public wave files are cross-sectional. No identifier links a participant across waves.
- The baseline public file covers every baseline participant. Complete coverage is acceptable because the cohort is itself a self-selected sample of the population rather than a sample drawn from a frame, and because the key variables are generalised enough that no record stands alone.
- Subsequent waves are published as aggregate tables only, with no microdata. The baseline is the only public-use microdata file in the series, which removes the record-level material a wave-linking attack would need.
- Aggregate counts are rounded to a base of 5, and cells below the threshold are merged or suppressed with secondary suppression so that no suppressed value can be recovered by subtraction.
- A marginal budget fixes which tables each wave releases. Each wave publishes one pass of univariate marginals and a declared, fixed set of two-way tables. Publishing a complete cross-tabulation set is forbidden, because reconstruction risk grows with the number of marginals released over an enumerated cohort.
- Longitudinal results are published as transition matrices between banded categories, for example the low, medium and high bands at wave t against the same bands at wave t+1. A transition matrix carries the longitudinal finding without linking any record across waves.
- Cell definitions are harmonised across waves and never redefined between releases, so that a reader can compare waves without a definitional break. The series is protected by the disclosure rules rather than by shifting the definitions.
- Each aggregate wave publishes a codebook listing its variables and response scales, and a retention table reporting how the cohort changes between waves. Counts in both are rounded to the same base.
- Instrument scores are published only as the bands defined by each instrument's manual. l-diversity is computed on the banded score, since a continuous score leaves l-diversity undefined.
- Non-composition rule. A release may never carry a derived score together with the items from which it is computed, because item responses regenerate the total arithmetically and turn the two files into one identified record. Cross-instrument rows are never published, since each added instrument multiplies the number of near-unique profiles.
- Open item access is served by non-record artifacts. Item marginals and the inter-item correlation matrix are published for each instrument, which supports reliability, factor and item-fit work without any record-level data. A synthetic item file, labelled synthetic in its filename and front matter, is published in addition, and it contains no real participant records.
- Each wave file carries post-stratification weights (age by sex, based on Statistics Indonesia population figures). Baseline weights equal one, because the baseline covers the whole cohort.
- The random per-wave identifier is generated within the release pipeline and is not derived from the Patient ID. The mapping is destroyed after release, and identifiers are regenerated for every version so that successive versions cannot be differenced.
- Public demographics are limited to age in three bands, sex and island group, which keeps the demographic key mapping many-to-one. Remaining demographic variables appear only in publication-specific extracts or in restricted data.
- Banded scores are protected by targeted record swapping among similar classes. Swapping is performed independently for each wave.
- Quasi-identifiers in public files satisfy k ≥ 11, with an internal target cell size of 20 so that attrition and class transitions do not push a released class below the threshold. Banded sensitive scores satisfy l ≥ 2.
- Timestamps are reduced to the wave number. Row order is shuffled and file metadata is stripped.
- Referral edges are never published; only aggregates are. Free text is never published.

## 7. Pre-release validation

- k-anonymity and l-diversity are computed with ARX or sdcMicro, and the configuration is committed to the repository.
- A sequential-release check compares class counts between consecutive waves. A class whose count changes by exactly one is merged or suppressed, since a single-unit change enables differencing by an observer who knows that a specific person changed class.
- A linkage-attack simulation is run against the most recent public waves, using the original data as ground truth. The observed linkage rate must remain close to the random baseline.
- A motivated-intruder review is conducted, followed by sign-off from the steward and the second reviewer.
- A legal assessment of the anonymity claim under Law No. 27 of 2022 on Personal Data Protection (UU PDP) is completed before the first release.

## 8. Publication replication packages

- For each publication, the minimum variable set used in the analysis is released at k ≥ 11, together with the analysis code.
- Where results are longitudinal, a synthetic linked panel is released in place of the original wave-linked data, labelled explicitly as synthetic, together with sufficient statistics that reproduce the principal estimates.
- Packages are deposited in Harvard Dataverse with a DOI and cited in the data availability statement of the publication.

## 9. Restricted access

- Restricted data comprise complete item-level response files, regency or city of residence, wave-linked longitudinal data and referral edges.
- Requests are submitted to hello@konsulin.care and assessed case by case by the steward and the second reviewer. Grounds for refusal are recorded.
- Access runs through a single Data Use Agreement with a confidentiality annex rather than a separate non-disclosure agreement, so that one instrument carries every obligation a recipient accepts. A second, narrower instrument would leave purpose limitation and audit rights uncovered.
- The agreement requires purpose limitation, a prohibition on linking public releases to restricted data, a prohibition on onward sharing, security requirements, incident reporting, retention and destruction, publication review and audit rights. This protocol likewise prohibits linking public releases to restricted data, because the public baseline covers the whole cohort and would otherwise serve as a lookup key for the restricted panel.
- The public demographic key maps many-to-one, so a join between the public baseline and the restricted panel is not deterministic. The observed join rate is measured and reported before each release.
- Access is granted by controlled download.
- Recipients are recorded in the public register at /disclosure/data-access-register.md. The Data Use Agreement template is published at /disclosure/data-use-agreement.md
- Restricted data are described by a metadata-only record carrying a DOI and containing no data files, so that the dataset remains findable while access stays conditional.

## 10. Withdrawal

Participants may withdraw before the release date. The release date is announced at least 14 days in advance, by email to registered participants and on the study website. Withdrawals submitted before the release date are honoured for all releases not yet published. Published data cannot be retracted, and unclaimed data cannot be identified and therefore cannot be withdrawn.

The Indonesian wording issued to participants is quoted verbatim below, followed by its English rendering.

> Anda bisa menarik data kapan saja sebelum tanggal rilis. Kami mengumumkan tanggal rilis sedikitnya 14 hari sebelumnya, lewat email untuk peserta yang mendaftar dan di situs ini. Penarikan sebelum tanggal rilis dihormati untuk semua rilis yang belum terbit. Data yang sudah terbit tidak dapat ditarik kembali, dan data yang belum diklaim tidak bisa dikenali sehingga tidak bisa ditarik.

> You may withdraw your data at any time before the release date. We announce the release date at least 14 days in advance, by email to registered participants and on this site. Withdrawals submitted before the release date are honoured for all releases not yet published. Published data cannot be retracted, and unclaimed data cannot be identified and therefore cannot be withdrawn.

## 11. Retention

TODO(maintainer)

## 12. Participant-facing outputs

- A summary report is available immediately after submission.
- An aggregate-results email is sent one month after data collection closes. It is computed from the original data, with cells smaller than 11 suppressed.
- A follow-up email is sent when the research is published.

## 13. Residual risk

- No data release is free of risk. Risk accumulates across waves, and published data cannot be retracted, which is why the earliest releases are the most conservative.
- k-anonymity bounds the size of the equivalence class but does not protect against homogeneity within a class, nor against an intruder who combines the release with external information. l-diversity mitigates, but does not eliminate, the first of these limitations.
- The 0.09 re-identification risk reference used by EMA Policy 0070 and Health Canada's Public Release of Clinical Information guidance is a convention rather than a legal requirement. It is adopted here as a shared benchmark alongside k ≥ 11.
- This protocol is designed to reduce re-identification risk to a documented level. It does not claim that risk is zero.

## 14. Revision history

- 1.0.0, initial version, frozen.
- 1.1.0, protection basis changed. The baseline now covers every baseline participant rather than a 70 per cent subsample, scores are published only as instrument bands, complete item-level files move to the restricted tier, and later waves are published only as aggregates. A non-composition rule forbids releasing a derived score together with its items.

## References

- European Medicines Agency. External guidance on the implementation of the European Medicines Agency policy on the publication of clinical data for medicinal products for human use, version 1.5. https://www.ema.europa.eu/en/documents/regulatory-procedural-guideline/external-guidance-implementation-european-medicines-agency-policy-publication-clinical-data-medicinal-products-human-use-version-15_en.pdf
- Health Canada. Public Release of Clinical Information: guidance document. https://www.canada.ca/en/health-canada/services/drug-health-product-review-approval/profile-public-release-clinical-information-guidance/document.html
- UK Government Analysis Function. Statistical Disclosure Control for microdata produced from social survey data. https://analysisfunction.civilservice.gov.uk/policy-store/sdc-for-microdata-produced-from-social-survey-data
- Machanavajjhala, A., Kifer, D., Gehrke, J. and Venkitasubramaniam, M. l-Diversity: privacy beyond k-anonymity. ACM Transactions on Knowledge Discovery from Data, 1(1), 2007.
- Sweeney, L. k-anonymity: a model for protecting privacy. International Journal of Uncertainty, Fuzziness and Knowledge-Based Systems, 10(5), 2002.
- Wilkinson, M. D., Dumontier, M., Aalbersberg, I. J. et al. The FAIR Guiding Principles for scientific data management and stewardship. Scientific Data, 3, 160018, 2016. https://doi.org/10.1038/sdata.2016.18
