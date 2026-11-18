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
| Restricted | Item-level responses, regency or city, wave-linked longitudinal data and referral edges. | Konsulin, controlled download under a Data Use Agreement |
| Original | The complete raw data. | Backend only, never released |

## 6. Processing of public-use data

- Wave files are released at the beginning of the following wave, at an interval of approximately three months.
- Public wave files are cross-sectional. No identifier links a participant across waves.
- Each wave file contains an independent random subsample of approximately 70 per cent of that wave's participants, accompanied by post-stratification weights (age by sex, based on Statistics Indonesia population figures).
- The random per-wave identifier is generated within the release pipeline and is not derived from the Patient ID. The mapping is destroyed after release, and identifiers are regenerated for every version so that successive versions cannot be differenced.
- Public demographics are limited to age in three bands, sex and island group. Remaining demographic variables appear only in publication-specific extracts or in restricted data.
- Instrument total scores are released unbanded, protected by targeted record swapping among similar classes. Swapping is performed independently for each wave.
- Item-level responses are released as a separate file carrying neither an identifier nor a total score, with an independent row shuffle. Because a total score can be reconstructed from its items, publishing both in the same file would permit a deterministic join.
- Quasi-identifiers in public files satisfy k ≥ 11, with an internal target cell size of 20 so that attrition and class transitions do not push a released class below the threshold. Banded sensitive scores satisfy l ≥ 2.
- The representativeness adjustment is applied through weights. No resampling is used.
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

- Restricted data comprise item-level responses, regency or city of residence, wave-linked longitudinal data and referral edges.
- Requests are submitted to hello@konsulin.care and assessed case by case by the steward and the second reviewer. Grounds for refusal are recorded.
- The Data Use Agreement prohibits re-identification and linkage attempts, onward sharing, and any use beyond the approved purpose. It further specifies security requirements, retention and destruction, incident reporting, publication rules and audit rights.
- Access is granted by controlled download.
- Recipients are recorded in the public register at /disclosure/data-access-register.md The Data Use Agreement template is available on request.
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
