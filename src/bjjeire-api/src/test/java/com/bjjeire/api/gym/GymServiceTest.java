package com.bjjeire.api.gym;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;

import com.bjjeire.api.audit.AuditAction;
import com.bjjeire.api.audit.AuditInfoProvider;
import com.bjjeire.api.audit.AuditRecorder;
import com.bjjeire.api.common.ApiCache;
import com.bjjeire.api.common.County;
import com.bjjeire.api.common.UriService;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;

@ExtendWith(MockitoExtension.class)
class GymServiceTest {
    private static final String GYM_ID = "665624c1ad01ce465c6cf456";
    private static final Instant NOW = Instant.parse("2026-06-03T06:00:00Z");
    private static final String AUDIT_USER = "audit-user";

    @Mock
    private MongoTemplate mongoTemplate;

    @Mock
    private AuditInfoProvider auditInfoProvider;

    @Mock
    private AuditRecorder auditRecorder;

    @Mock
    private UriService uriService;

    private ApiCache cache;
    private GymService service;

    @BeforeEach
    void setUp() {
        cache = new ApiCache();
        service = new GymService(mongoTemplate, auditInfoProvider, auditRecorder, cache, uriService);
    }

    @Test
    void shouldStampAuditFieldsWhenCreatingGym() {
        givenAuditContext();
        given(mongoTemplate.save(any(Gym.class))).willAnswer(invocation -> invocation.getArgument(0));

        CreateGymResponse response = service.create(new CreateGymCommand(dto(GYM_ID)));

        ArgumentCaptor<Gym> gym = ArgumentCaptor.forClass(Gym.class);
        then(mongoTemplate).should().save(gym.capture());
        assertThat(gym.getValue().getCreatedOnUtc()).isEqualTo(NOW);
        assertThat(gym.getValue().getCreatedBy()).isEqualTo(AUDIT_USER);
        assertThat(response.data().id()).isEqualTo(GYM_ID);
    }

    @Test
    void shouldClearBlankIdSoMongoCanAssignOneWhenCreatingGym() {
        givenAuditContext();
        given(mongoTemplate.save(any(Gym.class))).willAnswer(invocation -> {
            Gym gym = invocation.getArgument(0);
            if (gym.getId() == null) {
                gym.setId(GYM_ID);
            }
            return gym;
        });

        CreateGymResponse response = service.create(new CreateGymCommand(dto("   ")));

        ArgumentCaptor<Gym> gym = ArgumentCaptor.forClass(Gym.class);
        then(mongoTemplate).should().save(gym.capture());
        assertThat(gym.getValue().getId()).isEqualTo(GYM_ID);
        assertThat(response.data().id()).isEqualTo(GYM_ID);
    }

    @Test
    void shouldApplyChangesAndAuditFieldsWhenUpdatingExistingGym() {
        givenAuditContext();
        Gym existing = activeGym(GYM_ID, "Old Name");
        given(mongoTemplate.findById(GYM_ID, Gym.class)).willReturn(existing);
        given(mongoTemplate.save(any(Gym.class))).willAnswer(invocation -> invocation.getArgument(0));

        Optional<UpdateGymResponse> response = service.update(GYM_ID, new UpdateGymCommand(dto("ignored")));

        assertThat(response).isPresent();
        assertThat(response.orElseThrow().data().id()).isEqualTo(GYM_ID);
        assertThat(response.orElseThrow().data().name()).isEqualTo("BJJ Dublin");
        assertThat(existing.getUpdatedOnUtc()).isEqualTo(NOW);
        assertThat(existing.getUpdatedBy()).isEqualTo(AUDIT_USER);
    }

    @Test
    void shouldReturnEmptyWithoutSavingWhenUpdatingMissingGym() {
        given(mongoTemplate.findById("missing", Gym.class)).willReturn(null);

        Optional<UpdateGymResponse> response = service.update("missing", new UpdateGymCommand(dto("missing")));

        assertThat(response).isEmpty();
        then(mongoTemplate).should(never()).save(any(Gym.class));
    }

    @Test
    void shouldHideNonActiveGymWhenGettingById() {
        Gym pending = activeGym(GYM_ID, "Pending Gym");
        pending.setStatus(GymStatus.PendingApproval);
        given(mongoTemplate.findById(GYM_ID, Gym.class)).willReturn(pending);

        assertThat(service.getById(GYM_ID)).isEmpty();
    }

    @Test
    void shouldServeRepeatGetByIdFromCache() {
        given(mongoTemplate.findById(GYM_ID, Gym.class)).willReturn(activeGym(GYM_ID, "Cached Gym"));

        assertThat(service.getById(GYM_ID)).isPresent();
        assertThat(service.getById(GYM_ID)).isPresent();

        then(mongoTemplate).should(times(1)).findById(GYM_ID, Gym.class);
    }

    @Test
    void shouldPrimeByIdCacheOnCreateSoFollowUpReadSkipsMongo() {
        givenAuditContext();
        given(mongoTemplate.save(any(Gym.class))).willAnswer(invocation -> invocation.getArgument(0));

        service.create(new CreateGymCommand(dto(GYM_ID)));
        Optional<GymDto> cachedRead = service.getById(GYM_ID);

        assertThat(cachedRead).isPresent();
        then(mongoTemplate).should(never()).findById(eq(GYM_ID), eq(Gym.class));
    }

    @Test
    void shouldRecordAuditAndEvictCacheWhenDeletingGym() {
        Gym existing = activeGym(GYM_ID, "Doomed Gym");
        given(mongoTemplate.findById(GYM_ID, Gym.class)).willReturn(existing);
        assertThat(service.getById(GYM_ID)).isPresent();

        boolean deleted = service.delete(GYM_ID);
        given(mongoTemplate.findById(GYM_ID, Gym.class)).willReturn(null);

        assertThat(deleted).isTrue();
        then(mongoTemplate).should().remove(existing);
        then(auditRecorder).should().record(AuditAction.Delete, Gym.ENTITY_NAME, GYM_ID, 1);
        assertThat(service.getById(GYM_ID)).isEmpty();
    }

    @Test
    void shouldReturnFalseWithoutAuditingWhenDeletingMissingGym() {
        given(mongoTemplate.findById("missing", Gym.class)).willReturn(null);

        boolean deleted = service.delete("missing");

        assertThat(deleted).isFalse();
        then(auditRecorder).shouldHaveNoInteractions();
    }

    private void givenAuditContext() {
        given(auditInfoProvider.currentInstant()).willReturn(NOW);
        given(auditInfoProvider.currentUser()).willReturn(AUDIT_USER);
    }

    private static Gym activeGym(String id, String name) {
        Gym gym = new Gym();
        gym.setId(id);
        gym.setName(name);
        gym.setStatus(GymStatus.Active);
        gym.setCounty(County.Dublin);
        return gym;
    }

    private static GymDto dto(String id) {
        return new GymDto(
                id,
                "BJJ Dublin",
                "",
                GymStatus.Active,
                County.Dublin,
                null,
                null,
                null,
                null,
                List.of(),
                "https://example.com",
                null,
                null,
                null);
    }
}
