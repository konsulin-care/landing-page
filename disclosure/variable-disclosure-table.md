---
title: "Variable-Level Disclosure Table #JadiTangguh"
version: "1.0.0"
---

# Variable-Level Disclosure Table #JadiTangguh

This table classifies every variable class collected by the study by the way it is released. It is the operational form of the non-composition rule in the data disclosure and handling protocol. No release carries a derived score together with the items from which it is computed, and no release carries a cross-instrument row.

Four classifications are used. Public at full resolution means the variable is published as collected, because it is not a quasi-identifier at that granularity. Public coarsened means the variable is published only after generalisation, so that the public key maps many-to-one. Sufficient statistics or synthetic means no participant record is published, only aggregates of the measurement model or generated data. Restricted means the variable is available only under a Data Use Agreement.

| Variable class | Classification | Release | Treatment |
| --- | --- | --- | --- |
| Instrument scores | Public coarsened | Baseline microdata | Bands defined by the instrument manual, never a continuous score, with l-diversity computed on the banded value. |
| Age | Public coarsened | Baseline microdata | Three bands. |
| Sex | Public at full resolution | Baseline microdata | As collected. |
| Island group | Public at full resolution | Baseline microdata | Regency and city collapsed to island group. |
| Household expenditure | Public coarsened | Baseline microdata | Banded to quintiles within the cohort. |
| Education | Public coarsened | Baseline microdata | At most three ordered levels. |
| Employment status | Public coarsened | Baseline microdata | Dichotomised, employed or not employed. |
| Relationship status | Public coarsened | Baseline microdata | Dichotomised, partnered or not partnered. |
| Wave number | Public at full resolution | Baseline microdata | Timestamps reduced to the wave number. |
| Item-level responses | Restricted | Data Use Agreement only | Complete item-level response files, never released with a score or a total. |
| Regency or city of residence | Restricted | Data Use Agreement only | Full geographic detail. |
| Wave-linked longitudinal records | Restricted | Data Use Agreement only | The linked panel across waves. |
| Referral edges | Restricted | Aggregate counts only | Edge-level records are never published. |
| Email address and consent records | Restricted | Backend only | Never released in any tier. |
| Item marginals | Sufficient statistics or synthetic | Public, per instrument | Published as non-record artifacts. |
| Inter-item correlation matrix | Sufficient statistics or synthetic | Public, per instrument | Published as non-record artifacts. |
| Synthetic item file | Sufficient statistics or synthetic | Public, labelled synthetic | Generated, carries no real participant records. |
| Publication replication extracts | Public coarsened | Harvard Dataverse, per publication | Minimum variable set at k ≥ 11 with analysis code. |

Marginal counts and aggregate tables for waves after the baseline are published at k ≥ 11, rounded to a base of 5, under the marginal budget declared in the protocol.

Conditions of access are set out in the [Data Use Agreement](/disclosure/data-use-agreement.md) and in the [Data Disclosure and Handling Protocol](/disclosure/protocol.md).
