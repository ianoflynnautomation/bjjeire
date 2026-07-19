package com.bjjeire.api.gym;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.County;
import org.junit.jupiter.api.Test;

class GymMapperTest {
    @Test
    void toDtoMapsThumbnailUrlFromLargeImageUrl() {
        Gym gym = new Gym();
        gym.setId("665624c1ad01ce465c6cf456");
        gym.setName("Test Gym");
        gym.setStatus(GymStatus.Active);
        gym.setCounty(County.Dublin);
        gym.setImageUrl("https://cdn.bjjeire.com/gyms/test-lg.webp");

        GymDto dto = GymMapper.toDto(gym);

        assertThat(dto.id()).isEqualTo("665624c1ad01ce465c6cf456");
        assertThat(dto.name()).isEqualTo("Test Gym");
        assertThat(dto.status()).isEqualTo(GymStatus.Active);
        assertThat(dto.county()).isEqualTo(County.Dublin);
        assertThat(dto.thumbnailUrl()).isEqualTo("https://cdn.bjjeire.com/gyms/test-thumb.webp");
    }
}
