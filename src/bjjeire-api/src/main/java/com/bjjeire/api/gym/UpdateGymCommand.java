package com.bjjeire.api.gym;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record UpdateGymCommand(@NotNull @Valid GymDto data) {}
