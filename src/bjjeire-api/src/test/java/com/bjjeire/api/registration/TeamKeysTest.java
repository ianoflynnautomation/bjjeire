package com.bjjeire.api.registration;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.competitor.Academy;
import org.junit.jupiter.api.Test;

/** Grouping keys for academies and affiliations (research R8). */
class TeamKeysTest {
    @Test
    void shouldKeyADirectoryGymByItsId() {
        assertThat(TeamKeys.academyKey(new Academy("665f1c2b9b1e8a0012345678", "Team X")))
                .isEqualTo("gym:665f1c2b9b1e8a0012345678");
    }

    @Test
    void shouldKeyATypedNameTrimmedCaseFoldedAndWithSpacesCollapsed() {
        assertThat(TeamKeys.academyKey(new Academy(null, "  Team   X ")))
                .isEqualTo(TeamKeys.academyKey(new Academy(null, "team x")))
                .isEqualTo("name:team x");
        assertThat(TeamKeys.affiliationKey("  ALLIANCE  bjj")).isEqualTo("alliance bjj");
    }

    @Test
    void shouldHaveNoKeyForNoAcademyOrNoAffiliation() {
        assertThat(TeamKeys.academyKey(null)).isNull();
        assertThat(TeamKeys.affiliationKey(null)).isNull();
        assertThat(TeamKeys.affiliationKey("   ")).isNull();
    }
}
