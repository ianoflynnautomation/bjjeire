package com.bjjeire.api.config;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.verify;

import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.modulith.events.IncompleteEventPublications;

@ExtendWith(MockitoExtension.class)
class EventPublicationSweepTest {
    private static final Duration GRACE = Duration.ofMinutes(5);

    @Mock
    private IncompleteEventPublications incomplete;

    @Test
    void shouldResubmitOnlyPublicationsOlderThanTheGracePeriod() {
        new EventPublicationSweep(incomplete, GRACE).sweep();

        verify(incomplete).resubmitIncompletePublicationsOlderThan(GRACE);
    }

    @Test
    void shouldKeepTheScheduleRunningWhenAResubmissionFails() {
        willThrow(new IllegalStateException("database unavailable"))
                .given(incomplete)
                .resubmitIncompletePublicationsOlderThan(any());

        assertThatCode(() -> new EventPublicationSweep(incomplete, GRACE).sweep())
                .doesNotThrowAnyException();
    }
}
