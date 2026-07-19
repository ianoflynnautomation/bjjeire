package com.bjjeire.api.seeder;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class SeederArgsTest {
    @Test
    void parseReadsAllOptions() {
        SeederArgs.ParseResult result =
                SeederArgs.parse(new String[] {"--validate", "--dry-run", "--force", "--prune", "--collection", "Gym"});

        assertThat(result.error()).isNull();
        assertThat(result.args().validate()).isTrue();
        assertThat(result.args().dryRun()).isTrue();
        assertThat(result.args().force()).isTrue();
        assertThat(result.args().prune()).isTrue();
        assertThat(result.args().collection()).isEqualTo("Gym");
    }

    @Test
    void parseRejectsUnknownArguments() {
        SeederArgs.ParseResult result = SeederArgs.parse(new String[] {"--wat"});

        assertThat(result.args()).isNull();
        assertThat(result.error()).contains("--wat");
    }

    @Test
    void parseRejectsCollectionWithoutValue() {
        SeederArgs.ParseResult result = SeederArgs.parse(new String[] {"--collection"});

        assertThat(result.args()).isNull();
        assertThat(result.error()).contains("--collection");
    }

    @Test
    void parseIgnoresSpringOwnOptions() {
        SeederArgs.ParseResult result = SeederArgs.parse(new String[] {"--spring.profiles.active=seeder", "--dry-run"});

        assertThat(result.error()).isNull();
        assertThat(result.args().dryRun()).isTrue();
    }
}
