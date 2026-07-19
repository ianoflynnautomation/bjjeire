package com.bjjeire.api.gym;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record CreateGymCommand(@NotNull @Valid GymDto data) {}
